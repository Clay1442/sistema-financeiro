import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Switch, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';
import { AntDesign } from '@expo/vector-icons';

export default function NovaTransacaoScreen({ route, navigation }: any) {
  const tipoInicial = route.params?.tipoTransacao || 'DESPESA';
  const perfilId = route.params?.perfilId;
  
  const [tipo, setTipo] = useState(tipoInicial);
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [jaFoiPago, setJaFoiPago] = useState(true);

  const [contas, setContas] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  
  const [contaSelecionada, setContaSelecionada] = useState<any>(null);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Controladores dos Modais (Dropdowns e Criação)
  const [modalContaVisivel, setModalContaVisivel] = useState(false);
  const [modalCatVisivel, setModalCatVisivel] = useState(false);
  const [modalNovaCatVisivel, setModalNovaCatVisivel] = useState(false);
  
  // Estado para a nova categoria
  const [novaCategoriaNome, setNovaCategoriaNome] = useState('');
  const [salvandoCategoria, setSalvandoCategoria] = useState(false);

  useEffect(() => {
    carregarDados();
    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, '0');
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const ano = hoje.getFullYear();
    setDataVencimento(`${dia}/${mes}/${ano}`);
  }, []);

  const carregarDados = async () => {
    try {
      if (!perfilId) throw new Error('Perfil não identificado.');

      const { data: dataContas, error: errContas } = await supabase
        .from('contas_bancarias')
        .select('id, nome, saldo_atual')
        .eq('perfil_id', perfilId);
      if (errContas) throw errContas;
      setContas(dataContas || []);
      if (dataContas && dataContas.length > 0) setContaSelecionada(dataContas[0]);

      const { data: dataCat, error: errCat } = await supabase
        .from('categorias')
        .select('id, nome, tipo')
        .eq('perfil_id', perfilId);
      if (errCat) throw errCat;
      setCategorias(dataCat || []);
      
    } catch (error: any) {
      Alert.alert('Erro', 'Não foi possível carregar os dados.');
    } finally {
      setLoading(false);
    }
  };

  const handleDataChange = (text: string) => {
    let formatado = text.replace(/\D/g, '');
    if (formatado.length > 2) formatado = formatado.replace(/^(\d{2})(\d)/, '$1/$2');
    if (formatado.length > 5) formatado = formatado.replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3');
    setDataVencimento(formatado.substring(0, 10));
  };

  // --- NOVA FUNÇÃO: CRIAR CATEGORIA DIRETAMENTE NA TELA ---
  const handleCriarCategoria = async () => {
    if (!novaCategoriaNome.trim()) return Alert.alert('Atenção', 'Digite um nome para a categoria.');
    
    setSalvandoCategoria(true);
    try {
      const { data, error } = await supabase.from('categorias').insert([{
        nome: novaCategoriaNome.trim(),
        tipo: tipo, // Vincula a categoria ao tipo que está selecionado (Receita ou Despesa)
        perfil_id: perfilId
      }]).select().single();

      if (error) throw error;

      // Atualiza a lista de categorias, seleciona a nova e fecha o modal
      setCategorias([...categorias, data]);
      setCategoriaSelecionada(data);
      setModalNovaCatVisivel(false);
      setNovaCategoriaNome('');
      
    } catch (error: any) {
      Alert.alert('Erro', 'Não foi possível criar a categoria.');
    } finally {
      setSalvandoCategoria(false);
    }
  };

  const handleSalvar = async () => {
    const valorNum = parseFloat(valor.replace(',', '.'));
    if (isNaN(valorNum) || valorNum <= 0) return Alert.alert('Atenção', 'Insira um valor válido.');
    if (!contaSelecionada) return Alert.alert('Atenção', 'Selecione uma conta.');
    if (!categoriaSelecionada) return Alert.alert('Atenção', 'Selecione uma categoria.');
    if (dataVencimento.length !== 10) return Alert.alert('Atenção', 'Insira uma data válida (dd/mm/aaaa).');

    const [dia, mes, ano] = dataVencimento.split('/');
    const dataIso = `${ano}-${mes}-${dia}`;
    const descricaoFinal = descricao.trim() === '' ? 'Sem descrição' : descricao.trim();
    const statusTransacao = jaFoiPago ? 'PAGO' : 'PENDENTE';
    const dataPagamento = jaFoiPago ? dataIso : null;

    setSalvando(true);
    try {
      const { error: errTransacao } = await supabase.from('transacoes').insert([{
        conta_id: contaSelecionada.id,
        categoria_id: categoriaSelecionada.id,
        tipo: tipo,
        descricao: descricaoFinal,
        valor: valorNum,
        data_vencimento: dataIso,
        data_pagamento: dataPagamento,
        status: statusTransacao
      }]);
      if (errTransacao) throw errTransacao;

      if (jaFoiPago) {
        const saldoAtual = Number(contaSelecionada.saldo_atual);
        const novoSaldo = tipo === 'RECEITA' ? saldoAtual + valorNum : saldoAtual - valorNum;
        
        const { error: errConta } = await supabase
          .from('contas_bancarias')
          .update({ saldo_atual: novoSaldo })
          .eq('id', contaSelecionada.id);
        if (errConta) throw errConta;
      }

      Alert.alert('Sucesso', 'Transação registada!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);

    } catch (error: any) {
      Alert.alert('Erro ao salvar', error.message);
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  const categoriasFiltradas = categorias.filter(c => c.tipo === tipo || c.tipo === 'AMBOS');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <AntDesign name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nova Transação</Text>
        <TouchableOpacity style={{ padding: 8 }}>
          <AntDesign name="plus" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.tipoContainer}>
          <TouchableOpacity 
            style={[styles.btnTipo, tipo === 'RECEITA' ? styles.btnReceitaAtivo : styles.btnInativo]}
            onPress={() => { setTipo('RECEITA'); setCategoriaSelecionada(null); }}
          >
            <Text style={[styles.txtTipo, tipo === 'RECEITA' ? { color: '#FFF' } : { color: '#8BAE92' }]}>
              + Receita (Entrada)
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.btnTipo, tipo === 'DESPESA' ? styles.btnDespesaAtivo : styles.btnInativo]}
            onPress={() => { setTipo('DESPESA'); setCategoriaSelecionada(null); }}
          >
            <Text style={[styles.txtTipo, tipo === 'DESPESA' ? { color: '#FFF' } : { color: '#E89CA3' }]}>
              - Despesa (Saída)
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Valor</Text>
        <View style={styles.inputBox}>
          <TextInput
            style={styles.inputValor}
            placeholder="R$ 0,00"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={valor}
            onChangeText={setValor}
          />
        </View>

        <Text style={styles.label}>Descrição</Text>
        <View style={styles.inputBox}>
          <TextInput
            style={styles.input}
            placeholder="Ex: Venda no balcão"
            placeholderTextColor="#9CA3AF"
            value={descricao}
            onChangeText={setDescricao}
          />
        </View>

        <Text style={styles.label}>Conta de origem / destino</Text>
        <TouchableOpacity style={styles.dropdownBox} onPress={() => setModalContaVisivel(true)}>
          <Text style={styles.dropdownText}>{contaSelecionada ? contaSelecionada.nome : 'Selecione...'}</Text>
          <AntDesign name="caret-down" size={12} color="#6B7280" />
        </TouchableOpacity>

        <Text style={styles.label}>Categoria</Text>
        <TouchableOpacity style={styles.dropdownBox} onPress={() => setModalCatVisivel(true)}>
          <Text style={styles.dropdownText}>{categoriaSelecionada ? categoriaSelecionada.nome : 'Selecione...'}</Text>
          <AntDesign name="caret-down" size={12} color="#6B7280" />
        </TouchableOpacity>

        <Text style={styles.label}>Data de vencimento</Text>
        <View style={[styles.inputBox, { flexDirection: 'row', alignItems: 'center' }]}>
          <AntDesign name="calendar" size={20} color="#6B7280" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.input}
            placeholder="dd/mm/aaaa"
            placeholderTextColor="#9CA3AF"
            keyboardType="number-pad"
            value={dataVencimento}
            onChangeText={handleDataChange}
            maxLength={10}
          />
        </View>

        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>Já foi pago / recebido hoje?</Text>
          <Switch 
            value={jaFoiPago} 
            onValueChange={setJaFoiPago} 
            trackColor={{ false: '#D1D5DB', true: '#4F46E5' }} 
          />
        </View>

        <TouchableOpacity style={styles.btnSalvar} onPress={handleSalvar} disabled={salvando}>
          {salvando ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnSalvarText}>Salvar</Text>}
        </TouchableOpacity>

      </ScrollView>

      {/* MODAL: SELECIONAR CONTA */}
      <Modal visible={modalContaVisivel} transparent={true} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setModalContaVisivel(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecione a Conta</Text>
            {contas.map(conta => (
              <TouchableOpacity key={conta.id} style={styles.modalItem} onPress={() => { setContaSelecionada(conta); setModalContaVisivel(false); }}>
                <Text style={styles.modalItemText}>{conta.nome}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL: SELECIONAR CATEGORIA */}
      <Modal visible={modalCatVisivel} transparent={true} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setModalCatVisivel(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecione a Categoria</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {categoriasFiltradas.length === 0 ? <Text style={{ padding: 16, textAlign: 'center' }}>Nenhuma categoria encontrada.</Text> : null}
              {categoriasFiltradas.map(cat => (
                <TouchableOpacity key={cat.id} style={styles.modalItem} onPress={() => { setCategoriaSelecionada(cat); setModalCatVisivel(false); }}>
                  <Text style={styles.modalItemText}>{cat.nome}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {/* BOTÃO ADICIONAR NOVA CATEGORIA */}
            <TouchableOpacity 
              style={styles.btnAddCategoriaMenu} 
              onPress={() => { setModalCatVisivel(false); setModalNovaCatVisivel(true); }}
            >
              <AntDesign name="plus" size={16} color="#10B981" style={{ marginRight: 8 }} />
              <Text style={styles.txtAddCategoriaMenu}>Adicionar Categoria</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL: CRIAR NOVA CATEGORIA */}
      <Modal visible={modalNovaCatVisivel} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nova Categoria ({tipo === 'RECEITA' ? 'Entrada' : 'Saída'})</Text>
            
            <View style={{ padding: 16 }}>
              <Text style={styles.label}>Nome da Categoria</Text>
              <TextInput
                style={[styles.inputBox, { marginBottom: 24 }]}
                placeholder="Ex: Fornecedores"
                placeholderTextColor="#9CA3AF"
                value={novaCategoriaNome}
                onChangeText={setNovaCategoriaNome}
                autoFocus={true}
              />
              
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                <TouchableOpacity 
                  style={[styles.btnAcaoModal, { backgroundColor: '#F3F4F6', marginRight: 12 }]} 
                  onPress={() => { setModalNovaCatVisivel(false); setNovaCategoriaNome(''); }}
                >
                  <Text style={{ color: '#4B5563', fontWeight: 'bold' }}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.btnAcaoModal, { backgroundColor: '#10B981' }]} 
                  onPress={handleCriarCategoria}
                  disabled={salvandoCategoria}
                >
                  {salvandoCategoria ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Salvar</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  content: { padding: 24, paddingBottom: 40 },
  
  tipoContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  btnTipo: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginHorizontal: 4 },
  btnReceitaAtivo: { backgroundColor: '#7aca8a' },
  btnDespesaAtivo: { backgroundColor: '#ad0b16' },
  btnInativo: { backgroundColor: '#F3F4F6' },
  txtTipo: { fontSize: 14, fontWeight: 'bold' },

  label: { fontSize: 13, fontWeight: '700', color: '#6B7280', marginBottom: 6, marginLeft: 2 },
  
  inputBox: { borderWidth: 1, borderColor: '#9CA3AF', borderRadius: 8, paddingHorizontal: 12, height: 50, marginBottom: 16, justifyContent: 'center' },
  inputValor: { fontSize: 24, fontWeight: 'bold', color: '#6B7280' },
  input: { fontSize: 14, color: '#374151', flex: 1 },

  dropdownBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#9CA3AF', borderRadius: 8, paddingHorizontal: 12, height: 50, marginBottom: 16 },
  dropdownText: { fontSize: 14, color: '#374151' },

  toggleContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 24 },
  toggleLabel: { fontSize: 14, fontWeight: 'bold', color: '#000' },

  btnSalvar: { backgroundColor: '#4444FF', height: 54, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  btnSalvarText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 12, overflow: 'hidden' },
  modalTitle: { fontSize: 16, fontWeight: 'bold', padding: 16, backgroundColor: '#F3F4F6', textAlign: 'center' },
  modalItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalItemText: { fontSize: 16, color: '#374151' },
  
  btnAddCategoriaMenu: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: '#ECFDF5', borderTopWidth: 1, borderTopColor: '#D1FAE5' },
  txtAddCategoriaMenu: { fontSize: 15, fontWeight: 'bold', color: '#10B981' },
  btnAcaoModal: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }
});