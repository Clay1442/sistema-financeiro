import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../services/supabase';
import { Feather, AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import * as LocalAuthentication from 'expo-local-authentication';

interface PerfilFinanceiro {
  id: string | number;
  tipo: 'PESSOAL' | 'EMPRESARIAL';
  nome: string;
}

interface ContaBancaria {
  id: string | number;
  nome: string;
  saldo_atual: number;
}

export default function DashboardScreen({ navigation }: any) {
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [menuVisivel, setMenuVisivel] = useState(false);
  const [iniciais, setIniciais] = useState('U');
  const [perfis, setPerfis] = useState<PerfilFinanceiro[]>([]);
  const [perfilAtivo, setPerfilAtivo] = useState<PerfilFinanceiro | null>(null);

  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [transacoes, setTransacoes] = useState<any[]>([]);

  const [loadingApp, setLoadingApp] = useState(true);
  const [loadingPainel, setLoadingPainel] = useState(false);

  useEffect(() => {
    carregarDadosIniciais();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (perfilAtivo) carregarPainelAtivo();
    });
    if (perfilAtivo) carregarPainelAtivo();
    return unsubscribe;
  }, [navigation, perfilAtivo]);

  const carregarDadosIniciais = async () => {
    try {
      const userId = await SecureStore.getItemAsync('userToken');
      if (!userId) throw new Error('Sessão expirada.');

      // LÓGICA DE BLOQUEIO BIOMÉTRICO ---
      const exigeBiometria = await SecureStore.getItemAsync('Konto_Biometria');
      if (exigeBiometria === 'true') {
        const auth = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Desbloquear Konto',
          fallbackLabel: 'Usar senha',
          cancelLabel: 'Cancelar',
        });

        if (!auth.success) {
          // Se falhar ou cancelar, desloga o usuário por segurança
          return handleLogout();
        }
      }
      // -----------------------------------------

      const { data: usuario, error: errUser } = await supabase
        .from('usuarios')
        .select('nome')
        .eq('id', userId)
        .single();

      if (errUser) throw errUser;

      const primeiroNome = usuario.nome.split(' ')[0];
      setNomeUsuario(primeiroNome);
      setIniciais(primeiroNome.charAt(0).toUpperCase());

      const { data: perfisData, error: errPerfis } = await supabase
        .from('perfis_financeiros')
        .select('id, tipo, nome')
        .eq('usuario_id', userId);

      if (errPerfis) throw errPerfis;
      setPerfis(perfisData || []);
      if (perfisData && perfisData.length > 0) setPerfilAtivo(perfisData[0]);

    } catch (error: any) {
      Alert.alert('Erro', error.message);
      handleLogout();
    } finally {
      setLoadingApp(false);
    }
  };

  const carregarPainelAtivo = async () => {
    if (!perfilAtivo) return;
    setLoadingPainel(true);
    try {
      // 1. Busca as Contas
      const { data: dataContas, error: errContas } = await supabase
        .from('contas_bancarias')
        .select('id, nome, saldo_atual')
        .eq('perfil_id', perfilAtivo.id)
        .order('id', { ascending: true });

      if (errContas) throw errContas;
      setContas(dataContas || []);

      // 2. Busca as Transações para os gráficos
      const idsContas = dataContas?.map(c => c.id) || [];
      if (idsContas.length > 0) {
        const { data: dataTransacoes, error: errTrans } = await supabase
          .from('transacoes')
          .select('id, valor, tipo, data_pagamento, descricao')
          .in('conta_id', idsContas);

        if (errTrans) throw errTrans;
        setTransacoes(dataTransacoes || []);
      } else {
        setTransacoes([]);
      }

    } catch (error: any) {
      Alert.alert('Erro ao buscar dados do painel', error.message);
    } finally {
      setLoadingPainel(false);
    }
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('userToken');
    navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
  };

  const handleMenuPerfil = () => {
    setMenuVisivel(true);
  };

  const saldoTotal = contas.reduce((acc, conta) => acc + Number(conta.saldo_atual), 0);
  const formatarMoeda = (valor: number) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // --- LÓGICA DOS GRÁFICOS E PRÓ-LABORE (MÊS ATUAL) ---
  const dataAtual = new Date();
  const mesAtual = dataAtual.getMonth() + 1;
  const anoAtual = dataAtual.getFullYear();

  // 1. Filtra para deixar apenas transações deste mês e ano
  const transacoesDoMes = transacoes.filter(t => {
    if (!t.data_pagamento) return false;
    const [ano, mes] = t.data_pagamento.split('-');
    return Number(ano) === anoAtual && Number(mes) === mesAtual;
  });

  // 2. Separa as transações filtradas por tipo e ordena
  const transacoesReceitas = transacoesDoMes
    .filter(t => t.tipo === 'RECEITA')
    .sort((a, b) => new Date(a.data_pagamento).getTime() - new Date(b.data_pagamento).getTime());

  const transacoesDespesas = transacoesDoMes
    .filter(t => t.tipo === 'DESPESA')
    .sort((a, b) => new Date(a.data_pagamento).getTime() - new Date(b.data_pagamento).getTime());

  // 3. Soma os valores APENAS do mês atual para o cálculo do Pró-labore e gráficos
  const totalReceitas = transacoesReceitas.reduce((acc, t) => acc + Number(t.valor), 0);
  const totalDespesas = transacoesDespesas.reduce((acc, t) => acc + Number(t.valor), 0);

  // Lucro do Mês
  const lucroMensal = totalReceitas - totalDespesas;

  // Verifica se já existe uma despesa de Pró-labore NESTE MÊS
  const retiradaRealizada = transacoesDespesas.some(t => t.descricao?.includes('Pró-labore'));

  const formatarDadosGrafico = (lista: any[]) => {
    if (lista.length === 0) return [0, 0, 0, 0];
    if (lista.length === 1) return [0, Number(lista[0].valor)];
    return lista.map(t => Number(t.valor));
  };

  const dadosGraficoReceitas = formatarDadosGrafico(transacoesReceitas);
  const dadosGraficoDespesas = formatarDadosGrafico(transacoesDespesas);

  if (loadingApp) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1D4ED8" />
      </View>
    );
  }


  // Isto garante que os dois cartões cabem lado a lado em qualquer ecrã
  const screenWidth = Dimensions.get('window').width;
  const cardWidth = (screenWidth - 48 - 16) / 2; // 48 de margem total, 16 de espaço entre eles

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* CABEÇALHO */}
        <View style={styles.header}>

          {/* SECÇÃO CLICÁVEL DO UTILIZADOR */}
          <TouchableOpacity style={styles.headerLeft} onPress={handleMenuPerfil} activeOpacity={0.7}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{iniciais}</Text>
            </View>
            <View>
              <Text style={styles.saudacao}>Bem-vindo(a) de volta!</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.nomeUsuario}>{nomeUsuario}</Text>
                <Feather name="chevron-down" size={16} color="#0F172A" style={{ marginLeft: 4, marginTop: 2 }} />
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLogout} style={styles.btnLogout}>
            <Feather name="log-out" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* SELETOR DE PERFIS */}
        {perfis.length > 1 && (
          <View style={styles.tabsWrapper}>
            {perfis.map((perfil) => {
              const isAtivo = perfilAtivo?.id === perfil.id;
              // Ajuste visual para mostrar "Pessoal" em vez de "Minhas Finanças" se quiser ficar igual à imagem
              const nomePerfil = perfil.nome === 'Minhas Finanças' ? 'Pessoal' : perfil.nome;

              return (
                <TouchableOpacity
                  key={perfil.id}
                  style={[styles.tab, isAtivo ? styles.tabActive : styles.tabInactive]}
                  onPress={() => setPerfilAtivo(perfil)}
                >
                  <Text style={[styles.tabText, isAtivo ? styles.tabTextActive : styles.tabTextInactive]}>
                    {nomePerfil}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* CARTÃO DE SALDO TOTAL */}
        <LinearGradient
          colors={['#0F172A', '#1D4ED8']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.cardSaldo}
        >
          <Text style={styles.saldoLabel}>Saldo total</Text>
          <Text style={styles.saldoValor}>{formatarMoeda(saldoTotal)}</Text>
          <Text style={styles.saldoComparacao}>Em relação ao mês passado</Text>
        </LinearGradient>

        {/* RESUMO EM GRÁFICOS DINÂMICOS */}
        <View style={styles.graficosContainer}>

          {/* Card Receitas Clicável */}
          <TouchableOpacity
            style={styles.cardGrafico}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('EvolucaoDetalhada', { perfilId: perfilAtivo?.id, tipo: 'RECEITA' })}
          >
            <View style={styles.cardGraficoHeader}>
              <View style={[styles.graficoIconBg, { backgroundColor: '#D1FAE5' }]}>
                <AntDesign name="arrow-up" size={16} color="#10B981" />
              </View>
              <View>
                <Text style={styles.graficoTitulo}>Receitas</Text>
                {/* VALOR DINÂMICO */}
                <Text style={styles.graficoValor}>{formatarMoeda(totalReceitas)}</Text>
              </View>
            </View>

            <View style={styles.chartWrapper}>
              <LineChart
                data={{ labels: [], datasets: [{ data: dadosGraficoReceitas }] }} // DADOS REAIS AQUI
                width={cardWidth + 10}
                height={60}
                withDots={false}
                withInnerLines={false}
                withOuterLines={false}
                withVerticalLabels={false}
                withHorizontalLabels={false}
                bezier
                chartConfig={{
                  backgroundColor: '#FFF',
                  backgroundGradientFrom: '#FFF',
                  backgroundGradientTo: '#FFF',
                  color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                  fillShadowGradient: '#10B981',
                  fillShadowGradientOpacity: 0.3,
                  strokeWidth: 2,
                  paddingRight: 0,
                }}
                style={styles.chartStyle}
              />
            </View>
          </TouchableOpacity>

          {/* Card Despesas Clicável */}
          <TouchableOpacity
            style={styles.cardGrafico}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('EvolucaoDetalhada', { perfilId: perfilAtivo?.id, tipo: 'DESPESA' })}
          >
            <View style={styles.cardGraficoHeader}>
              <View style={[styles.graficoIconBg, { backgroundColor: '#FEE2E2' }]}>
                <AntDesign name="arrow-down" size={16} color="#EF4444" />
              </View>
              <View>
                <Text style={styles.graficoTitulo}>Despesas</Text>
                {/* VALOR DINÂMICO */}
                <Text style={styles.graficoValor}>{formatarMoeda(totalDespesas)}</Text>
              </View>
            </View>

            <View style={styles.chartWrapper}>
              <LineChart
                data={{ labels: [], datasets: [{ data: dadosGraficoDespesas }] }} // DADOS REAIS AQUI
                width={cardWidth + 10}
                height={60}
                withDots={false}
                withInnerLines={false}
                withOuterLines={false}
                withVerticalLabels={false}
                withHorizontalLabels={false}
                bezier
                chartConfig={{
                  backgroundColor: '#FFF',
                  backgroundGradientFrom: '#FFF',
                  backgroundGradientTo: '#FFF',
                  color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
                  fillShadowGradient: '#EF4444',
                  fillShadowGradientOpacity: 0.3,
                  strokeWidth: 2,
                  paddingRight: 0,
                }}
                style={styles.chartStyle}
              />
            </View>
          </TouchableOpacity>

        </View>

        {/* AÇÕES RÁPIDAS */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('NovaTransacao', { perfilId: perfilAtivo?.id, tipoTransacao: 'DESPESA' })}
          >
            <View style={styles.actionIconBg}><AntDesign name="arrow-up" size={24} color="#0F172A" /></View>
            <Text style={styles.actionText}>Despesa</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('NovaTransacao', { perfilId: perfilAtivo?.id, tipoTransacao: 'RECEITA' })}
          >
            <View style={styles.actionIconBg}><AntDesign name="arrow-down" size={24} color="#0F172A" /></View>
            <Text style={styles.actionText}>Receber</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Extrato', { perfilId: perfilAtivo?.id })}
          >
            <View style={styles.actionIconBg}><Feather name="file-text" size={24} color="#0F172A" /></View>
            <Text style={styles.actionText}>Extrato</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn}>
            <View style={styles.actionIconBg}><Feather name="grid" size={24} color="#0F172A" /></View>
            <Text style={styles.actionText}>Mais</Text>
          </TouchableOpacity>
        </View>

        {/* CARD INTELIGENTE DE PRÓ-LABORE */}
        {perfilAtivo?.tipo === 'EMPRESARIAL' && perfis.find(p => p.tipo === 'PESSOAL') && (
          <>
            {retiradaRealizada ? (
              /* ESTADO 1: JÁ RETIROU NESTE MÊS (MAS PODE RETIRAR MAIS SE HOUVER LUCRO) */
              <TouchableOpacity
                style={[styles.cardProLabore, { backgroundColor: '#D1FAE5', borderColor: '#10B981' }]}
                activeOpacity={lucroMensal > 0 ? 0.7 : 1}
                onPress={() => {
                  if (lucroMensal > 0) {
                    navigation.navigate('Retirada', {
                      perfilPjId: perfilAtivo.id,
                      perfilPfId: perfis.find(p => p.tipo === 'PESSOAL')?.id,
                      lucroAtual: lucroMensal // Passa apenas o lucro que sobrou
                    });
                  } else {
                    Alert.alert('Lucro Zerado', 'A sua empresa não possui mais lucro disponível para retirar este mês.');
                  }
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={[styles.iconeProLabore, { backgroundColor: '#A7F3D0' }]}>
                    <AntDesign name="check-circle" size={20} color="#059669" />
                  </View>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={[styles.tituloProLabore, { color: '#065F46' }]}>Retirada Concluída</Text>
                    <Text style={[styles.subtituloProLabore, { color: '#047857' }]}>
                      {lucroMensal > 0
                        ? `Ainda restam ${formatarMoeda(lucroMensal)} de lucro. Toque para retirar mais.`
                        : 'O pró-labore deste mês já foi transferido.'}
                    </Text>
                  </View>
                </View>
                {lucroMensal > 0 && <AntDesign name="right" size={20} color="#059669" />}
              </TouchableOpacity>
            ) : lucroMensal > 0 ? (
              /* ESTADO 2: PRIMEIRA RETIRADA DO MÊS */
              <TouchableOpacity
                style={styles.cardProLabore}
                onPress={() => navigation.navigate('Retirada', {
                  perfilPjId: perfilAtivo.id,
                  perfilPfId: perfis.find(p => p.tipo === 'PESSOAL')?.id,
                  lucroAtual: lucroMensal
                })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={styles.iconeProLabore}>
                    <AntDesign name="star" size={20} color="#D97706" />
                  </View>
                  <View>
                    <Text style={styles.tituloProLabore}>Fazer Minha Retirada</Text>
                    <Text style={styles.subtituloProLabore}>Lucro do mês: {formatarMoeda(lucroMensal)}</Text>
                  </View>
                </View>
                <AntDesign name="right" size={20} color="#D97706" />
              </TouchableOpacity>
            ) : null}
          </>
        )}

        {/* MENSAGEM NO PERFIL PESSOAL */}
        {perfilAtivo?.tipo === 'PESSOAL' && perfis.find(p => p.tipo === 'EMPRESARIAL') && (
          <View style={[styles.cardProLabore, { borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons name="office-building" size={24} color="#64748B" style={{ marginRight: 12 }} />
              <View>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#0F172A' }}>Rendimento Empresarial</Text>
                <Text style={{ fontSize: 12, color: '#64748B' }}>Acesse seu Perfil PJ para realizar retiradas.</Text>
              </View>
            </View>
          </View>
        )}

        {loadingPainel ? (
          <ActivityIndicator color="#1D4ED8" style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.section}>
            {/* MINHAS CONTAS */}
            {contas.length === 0 ? (
              <Text style={styles.emptyText}>Não tem contas cadastradas.</Text>
            ) : (
              contas.map((conta) => (
                <TouchableOpacity
                  key={conta.id}
                  style={styles.contaItem}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('DetalhesConta', {
                    contaId: conta.id,
                    nomeConta: conta.nome,
                    saldoConta: conta.saldo_atual
                  })}
                >
                  <View style={styles.contaInfo}>
                    <View style={styles.contaIconBg}>
                      <MaterialCommunityIcons name="bank" size={20} color="#1D4ED8" />
                    </View>
                    <Text style={styles.contaNome}>{conta.nome}</Text>
                  </View>
                  <Text style={styles.contaSaldo}>{formatarMoeda(Number(conta.saldo_atual))}</Text>
                </TouchableOpacity>
              ))
            )}

            <TouchableOpacity
              style={styles.btnAddConta}
              onPress={() => navigation.navigate('NovaConta', { perfilId: perfilAtivo?.id })}
            >
              <Text style={styles.btnAddContaText}>+ Nova Conta/Carteira</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* NOVO MENU MODAL (BOTTOM SHEET) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={menuVisivel}
        onRequestClose={() => setMenuVisivel(false)}
      >
        {/* Fundo escuro clicável para fechar */}
        <Pressable style={styles.modalOverlay} onPress={() => setMenuVisivel(false)}>

          {/* Conteúdo branco do menu */}
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Opções da Conta</Text>
              <TouchableOpacity onPress={() => setMenuVisivel(false)} style={{ padding: 8, marginRight: -8 }}>
                <AntDesign name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalUserCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{iniciais}</Text>
              </View>
              <View>
                <Text style={styles.modalUserName}>{nomeUsuario}</Text>
                <Text style={styles.modalUserEmail}>Gerencie suas informações</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalOption}
              activeOpacity={0.7}
              onPress={() => {
                setMenuVisivel(false);
                navigation.navigate('Perfil');
              }}
            >
              <View style={styles.modalOptionIconBg}>
                <Feather name="user" size={20} color="#1D4ED8" />
              </View>
              <Text style={styles.modalOptionText}>Meu Perfil</Text>
              <AntDesign name="right" size={16} color="#CBD5E1" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalOption, { borderBottomWidth: 0 }]}
              activeOpacity={0.7}
              onPress={() => {
                setMenuVisivel(false);
                handleLogout();
              }}
            >
              <View style={[styles.modalOptionIconBg, { backgroundColor: '#FEE2E2' }]}>
                <Feather name="log-out" size={20} color="#EF4444" />
              </View>
              <Text style={[styles.modalOptionText, { color: '#EF4444' }]}>Sair da Conta</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { flexGrow: 1, padding: 24, paddingBottom: 40 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#1D4ED8' },
  saudacao: { fontSize: 14, color: '#64748B', fontWeight: '600' },
  nomeUsuario: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  btnLogout: { padding: 8, backgroundColor: '#FEE2E2', borderRadius: 12 },

  tabsContainer: { flexDirection: 'row', marginBottom: 24 },

  cardSaldo: { padding: 24, borderRadius: 24, marginBottom: 32 },
  saldoLabel: { color: '#93C5FD', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  saldoValor: { color: '#FFFFFF', fontSize: 36, fontWeight: 'bold', marginBottom: 8 },
  saldoComparacao: { color: '#E0E7FF', fontSize: 12, fontWeight: '500' },

  quickActionsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  actionBtn: { alignItems: 'center', flex: 1 },
  actionIconBg: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  actionText: { fontSize: 13, color: '#0F172A', fontWeight: '600' },

  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  linkVerTodas: { fontSize: 14, color: '#1D4ED8', fontWeight: '700' },
  emptyText: { color: '#64748B', fontStyle: 'italic', textAlign: 'center', marginTop: 12 },

  contaItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 2, elevation: 1 },
  contaInfo: { flexDirection: 'row', alignItems: 'center' },
  contaIconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  contaNome: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  contaSaldo: { fontSize: 16, fontWeight: '800', color: '#0F172A' },

  btnAddConta: { padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: '#CBD5E1', borderStyle: 'dashed' },
  btnAddContaText: { color: '#475569', fontWeight: '700', fontSize: 14 },

  tabsWrapper: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#0F172A',
    marginBottom: 24,
    height: 48
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30
  },
  tabActive: {
    backgroundColor: '#0F172A'
  },
  tabInactive: {
    backgroundColor: 'transparent'
  },
  tabText: {
    fontSize: 14,
    fontWeight: '800'
  },
  tabTextActive: {
    color: '#FFFFFF'
  },
  tabTextInactive: {
    color: '#0F172A'
  },


  /* GRÁFICOS */
  graficosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32
  },
  cardGrafico: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginHorizontal: 4 // Espaço entre os cards
  },
  cardGraficoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingBottom: 0
  },
  graficoIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8
  },
  graficoTitulo: {
    fontSize: 12,
    color: '#1E3A8A', // Azul escuro do seu layout
    fontWeight: '700'
  },
  graficoValor: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '900'
  },
  chartWrapper: {
    marginTop: 8,
    marginLeft: -15, // Puxa o gráfico para a esquerda para esconder as margens padrão da biblioteca
    marginBottom: -10
  },
  chartStyle: {
    paddingRight: 0
  },

  cardProLabore: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FEF3C7', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#FDE68A', marginBottom: 32 },
  iconeProLabore: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FDE68A', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  tituloProLabore: { fontSize: 16, fontWeight: 'bold', color: '#92400E' },
  subtituloProLabore: { fontSize: 12, color: '#B45309', marginTop: 2 },

  /* ESTILOS DO MODAL (BOTTOM SHEET) */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 48, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
  modalUserCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 20, marginBottom: 24, borderWidth: 1, borderColor: '#F1F5F9' },
  modalUserName: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  modalUserEmail: { fontSize: 13, color: '#64748B', marginTop: 2, fontWeight: '500' },
  modalOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalOptionIconBg: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  modalOptionText: { flex: 1, fontSize: 16, fontWeight: '700', color: '#0F172A' },
  badgeBreve: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 12 },
  badgeBreveText: { fontSize: 10, fontWeight: 'bold', color: '#64748B' },
});