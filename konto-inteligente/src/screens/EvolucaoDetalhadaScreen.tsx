import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';
import { AntDesign, Feather } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function EvolucaoDetalhadaScreen({ route, navigation }: any) {
  const { perfilId, tipo } = route.params;
  const isReceita = tipo === 'RECEITA';

  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, [perfilId, tipo]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      // 1. Buscar as contas do perfil para filtrar as transações
      const { data: contas, error: errContas } = await supabase
        .from('contas_bancarias')
        .select('id')
        .eq('perfil_id', perfilId);

      if (errContas) throw errContas;
      
      const idsContas = contas?.map(c => c.id) || [];

      if (idsContas.length > 0) {
        // 2. Buscar histórico completo filtrado pelo tipo (Receita ou Despesa)
        const { data: transacoesData, error: errTrans } = await supabase
          .from('transacoes')
          .select(`
            id, descricao, valor, data_pagamento, 
            categorias (nome), contas_bancarias (nome)
          `)
          .in('conta_id', idsContas)
          .eq('tipo', tipo)
          .order('data_pagamento', { ascending: false }); // Do mais recente para o mais antigo na lista

        if (errTrans) throw errTrans;
        setTransacoes(transacoesData || []);
      }
    } catch (error: any) {
      Alert.alert('Erro ao carregar dados', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Cálculos para o Gráfico e Totais
  const total = transacoes.reduce((acc, t) => acc + Number(t.valor), 0);
  const formatarMoeda = (valor: number) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const getNomeRelacao = (relacao: any) => {
    if (!relacao) return 'Desconhecido';
    if (Array.isArray(relacao)) return relacao[0]?.nome || 'Desconhecido';
    return relacao.nome || 'Desconhecido';
  };

  // Prepara os dados para o gráfico (precisa ser cronológico: mais antigo -> mais recente)
  const prepararDadosGrafico = () => {
    const dadosCronologicos = [...transacoes].reverse(); 
    
    if (dadosCronologicos.length === 0) {
      return { labels: [''], data: [0, 0] }; // Prevenção de quebra do gráfico vazio
    }

    if (dadosCronologicos.length === 1) {
      return { labels: [''], data: [0, Number(dadosCronologicos[0].valor)] }; 
    }

    // Pega as datas formatadas (ex: 15/10) e os valores
    const labels = dadosCronologicos.map(t => {
      const [ano, mes, dia] = t.data_pagamento.split('-');
      return `${dia}/${mes}`;
    });
    const data = dadosCronologicos.map(t => Number(t.valor));

    // Se houver muitas transações, omitimos as labels do meio para não encavalar o texto
    const labelsFiltradas = labels.map((l, index) => 
      index === 0 || index === labels.length - 1 || labels.length <= 5 ? l : ''
    );

    return { labels: labelsFiltradas, data };
  };

  const dadosGrafico = prepararDadosGrafico();
  const corPrincipal = isReceita ? '#10B981' : '#EF4444';
  const corFundo = isReceita ? '#D1FAE5' : '#FEE2E2';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btnVoltar}>
          <AntDesign name="left" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Evolução de {isReceita ? 'Receitas' : 'Despesas'}</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={corPrincipal} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          
          <View style={styles.totalContainer}>
            <View style={[styles.iconLarge, { backgroundColor: corFundo }]}>
              <AntDesign name={isReceita ? "arrow-up" : "arrow-down"} size={32} color={corPrincipal} />
            </View>
            <Text style={styles.totalLabel}>Total Acumulado</Text>
            <Text style={[styles.totalValue, { color: corPrincipal }]}>{formatarMoeda(total)}</Text>
          </View>

          <View style={styles.chartContainer}>
            <LineChart
              data={{
                labels: dadosGrafico.labels,
                datasets: [{ data: dadosGrafico.data }]
              }}
              width={screenWidth - 48}
              height={220}
              yAxisLabel="R$ "
              yAxisSuffix=""
              withDots={dadosGrafico.data.length <= 10}
              withInnerLines={true}
              withOuterLines={false}
              bezier
              chartConfig={{
                backgroundColor: '#FFF',
                backgroundGradientFrom: '#FFF',
                backgroundGradientTo: '#FFF',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(${isReceita ? '16, 185, 129' : '239, 68, 68'}, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                style: { borderRadius: 16 },
                propsForDots: { r: "4", strokeWidth: "2", stroke: corPrincipal }
              }}
              style={styles.chart}
            />
          </View>

          <View style={styles.historyContainer}>
            <Text style={styles.historyTitle}>Histórico Completo</Text>
            
            {transacoes.length === 0 ? (
              <Text style={styles.emptyText}>Nenhuma transação encontrada.</Text>
            ) : (
              transacoes.map((t) => (
                <View key={t.id} style={styles.transacaoItem}>
                  <View style={styles.transacaoInfo}>
                    <View style={[styles.iconeBg, { backgroundColor: corFundo }]}>
                      <AntDesign name={isReceita ? "up" : "down"} size={16} color={corPrincipal} />
                    </View>
                    <View>
                      <Text style={styles.transacaoDescricao}>{t.descricao}</Text>
                      <Text style={styles.transacaoDetalhe}>
                        {getNomeRelacao(t.categorias)} • {getNomeRelacao(t.contas_bancarias)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.transacaoValoresBloco}>
                    <Text style={[styles.transacaoValor, { color: corPrincipal }]}>
                      {isReceita ? '+' : '-'} {formatarMoeda(Number(t.valor))}
                    </Text>
                    <Text style={styles.transacaoData}>
                      {t.data_pagamento.split('-').reverse().join('/')}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  btnVoltar: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  
  totalContainer: { alignItems: 'center', paddingVertical: 32, backgroundColor: '#FFF' },
  iconLarge: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  totalLabel: { fontSize: 14, color: '#64748B', fontWeight: '600', marginBottom: 4 },
  totalValue: { fontSize: 36, fontWeight: '900' },
  
  chartContainer: { paddingHorizontal: 24, marginTop: -20, alignItems: 'center' },
  chart: { borderRadius: 16, paddingVertical: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  
  historyContainer: { paddingHorizontal: 24, marginTop: 32 },
  historyTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A', marginBottom: 16 },
  emptyText: { color: '#64748B', fontStyle: 'italic', textAlign: 'center', marginTop: 12 },
  
  transacaoItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  transacaoInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconeBg: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  transacaoDescricao: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  transacaoDetalhe: { fontSize: 12, color: '#64748B', marginTop: 2 },
  transacaoValoresBloco: { alignItems: 'flex-end' },
  transacaoValor: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  transacaoData: { fontSize: 12, color: '#94A3B8' }
});