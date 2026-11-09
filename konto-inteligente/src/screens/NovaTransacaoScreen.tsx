import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { supabase } from '../services/supabase';

type TipoTransacao = 'RECEITA' | 'DESPESA';

export default function NovaTransacaoScreen({ route, navigation }: any) {
  // 1. Extraia o tipoTransacao do route.params (além do perfilId)
  const { perfilId, tipoTransacao } = route.params;
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');

  // 2. Defina o estado inicial do tipo usando o valor que veio da navegação.
  // Se não vier nada (por segurança), assume 'DESPESA' como padrão.
  const [tipo, setTipo] = useState<'RECEITA' | 'DESPESA'>(tipoTransacao || 'DESPESA');
  
  const [contas, setContas] = useState<any[]>([]);
  const [contaSelecionada, setContaSelecionada] = useState<any>(null);
  
  const [categorias, setCategorias] = useState<any[]>([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<any>(null);
  
  const [loadingDados, setLoadingDados] = useState(true);
  const [loadingSalvar, setLoadingSalvar] = useState(false);

  // Substitua o useEffect atual por este:
  useEffect(() => {
    const carregarDados = async () => {
      try {
        const { data: contasData } = await supabase.from('contas_bancarias').select('id, nome, saldo_atual').eq('perfil_id', perfilId);
        setContas(contasData || []);
        if (contasData && contasData.length > 0 && !contaSelecionada) setContaSelecionada(contasData[0]);

        const { data: categoriasData } = await supabase.from('categorias').select('id, nome, tipo').eq('perfil_id', perfilId).eq('tipo', tipo);
        setCategorias(categoriasData || []);
      } catch (error: any) {
        console.error(error);
      } finally {
        setLoadingDados(false);
      }
    };
    
    // Carrega quando o tipo muda ou quando a tela ganha foco
    const unsubscribe = navigation.addListener('focus', carregarDados);
    carregarDados();
    
    return unsubscribe;
  }, [perfilId, tipo]); // Recarrega as categorias se o usuário mudar de Receita para Despesa

  const handleSalvar = async () => {
    if (!descricao.trim() || !valor.trim() || !contaSelecionada || !categoriaSelecionada) {
      return Alert.alert('Atenção', 'Preencha todos os campos e selecione uma conta e categoria.');
    }

    const valorNumerico = parseFloat(valor.replace(',', '.'));
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      return Alert.alert('Atenção', 'Digite um valor válido.');
    }

    setLoadingSalvar(true);
    try {
      // Pega a data de hoje no formato YYYY-MM-DD para o banco de dados
      const dataHoje = new Date().toISOString().split('T')[0];

      // 1. Insere a transação respeitando exatamente a sua tabela
      const { error: erroTransacao } = await supabase
        .from('transacoes')
        .insert([{
          conta_id: contaSelecionada.id,
          categoria_id: categoriaSelecionada.id,
          tipo: tipo,
          descricao: descricao.trim(),
          valor: valorNumerico,
          data_vencimento: dataHoje, // Campo obrigatório na sua tabela
          data_pagamento: dataHoje
        }]);

      if (erroTransacao) throw erroTransacao;

      // 2. Calcula e atualiza o novo saldo da conta
      const novoSaldo = tipo === 'RECEITA' 
        ? Number(contaSelecionada.saldo_atual) + valorNumerico
        : Number(contaSelecionada.saldo_atual) - valorNumerico;

      const { error: erroConta } = await supabase
        .from('contas_bancarias')
        .update({ saldo_atual: novoSaldo })
        .eq('id', contaSelecionada.id);

      if (erroConta) throw erroConta;

      Alert.alert('Sucesso', 'Transação registrada!');
      navigation.goBack(); // Volta para o Dashboard

    } catch (err: any) {
      Alert.alert('Erro ao salvar', err.message);
    } finally {
      setLoadingSalvar(false);
    }
  };

  if (loadingDados) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Nova Transação</Text>

      {/* Alternador Receita / Despesa */}
      <View style={styles.rowTipos}>
        <TouchableOpacity 
          style={[styles.btnTipo, tipo === 'RECEITA' && styles.btnReceita]}
          onPress={() => setTipo('RECEITA')}
        >
          <Text style={[styles.txtTipo, tipo === 'RECEITA' && { color: '#FFF' }]}>Receita 📈</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.btnTipo, tipo === 'DESPESA' && styles.btnDespesa]}
          onPress={() => setTipo('DESPESA')}
        >
          <Text style={[styles.txtTipo, tipo === 'DESPESA' && { color: '#FFF' }]}>Despesa 📉</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Valor (R$)</Text>
      <TextInput 
        style={[styles.input, { fontSize: 24, fontWeight: 'bold', color: tipo === 'RECEITA' ? '#10B981' : '#EF4444' }]} 
        placeholder="0.00" 
        keyboardType="numeric"
        value={valor} 
        onChangeText={setValor} 
      />

      <Text style={styles.label}>Descrição</Text>
      <TextInput 
        style={styles.input} 
        placeholder="Ex: Conta de Luz, Venda de Produto..." 
        value={descricao} 
        onChangeText={setDescricao} 
      />

      <Text style={styles.label}>Categoria</Text>
      {categorias.length === 0 ? (
        <Text style={styles.alertaVazio}>Nenhuma categoria de {tipo.toLowerCase()} encontrada.</Text>
      ) : (
        <View style={styles.rowChips}>
          {categorias.map(cat => (
            <TouchableOpacity 
              key={cat.id} 
              style={[styles.chip, categoriaSelecionada?.id === cat.id && styles.chipAtivo]}
              onPress={() => setCategoriaSelecionada(cat)}
            >
              <Text style={[styles.txtChip, categoriaSelecionada?.id === cat.id && { color: '#10B981' }]}>
                {cat.nome}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={styles.label}>Categoria</Text>
        <TouchableOpacity onPress={() => navigation.navigate('GerenciarCategorias', { perfilId })}>
          <Text style={{ color: '#10B981', fontWeight: 'bold', fontSize: 14 }}>Adicionar Categoria</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Conta Bancária</Text>
      {contas.length === 0 ? (
        <Text style={styles.alertaVazio}>Nenhuma conta encontrada.</Text>
      ) : (
        <View style={styles.rowChips}>
          {contas.map(c => (
            <TouchableOpacity 
              key={c.id} 
              style={[styles.chip, contaSelecionada?.id === c.id && styles.chipAtivo]}
              onPress={() => setContaSelecionada(c)}
            >
              <Text style={[styles.txtChip, contaSelecionada?.id === c.id && { color: '#10B981' }]}>
                {c.nome}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity 
        style={[styles.btnPrincipal, (contas.length === 0 || categorias.length === 0) && { backgroundColor: '#9CA3AF' }]} 
        onPress={handleSalvar} 
        disabled={loadingSalvar || contas.length === 0 || categorias.length === 0}
      >
        {loadingSalvar ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Salvar Transação</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.btnCancelar} onPress={() => navigation.goBack()}>
        <Text style={styles.btnCancelarText}>Cancelar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, backgroundColor: '#F9FAFB', paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24, color: '#111827' },
  
  rowTipos: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  btnTipo: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#D1D5DB', alignItems: 'center' },
  btnReceita: { backgroundColor: '#10B981', borderColor: '#10B981' },
  btnDespesa: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
  txtTipo: { fontSize: 16, fontWeight: 'bold', color: '#6B7280' },
  
  label: { fontSize: 16, color: '#4B5563', marginBottom: 8, fontWeight: '600' },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 16, marginBottom: 24, fontSize: 16 },
  
  rowChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  chip: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#FFF' },
  chipAtivo: { borderColor: '#10B981', backgroundColor: '#ECFDF5' },
  txtChip: { fontWeight: '600', color: '#6B7280' },
  
  alertaVazio: { color: '#EF4444', marginBottom: 24, fontStyle: 'italic' },

  btnPrincipal: { backgroundColor: '#111827', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  btnCancelar: { padding: 16, alignItems: 'center', marginTop: 8 },
  btnCancelarText: { color: '#EF4444', fontSize: 16, fontWeight: 'bold' }
});