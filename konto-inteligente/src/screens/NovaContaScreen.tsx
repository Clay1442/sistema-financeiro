import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../services/supabase';

export default function NovaContaScreen({ route, navigation }: any) {
  // Recebe o ID do perfil ativo vindo do Dashboard
  const { perfilId } = route.params;

  const [nome, setNome] = useState('');
  const [saldo, setSaldo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSalvarConta = async () => {
    if (!nome.trim()) {
      return Alert.alert('Atenção', 'Dê um nome para a conta (ex: Nubank, Caixa Empresa).');
    }

    // Substitui vírgula por ponto e converte para número
    const valorTratado = saldo.replace(',', '.');
    const saldoNumerico = parseFloat(valorTratado) || 0;

    setLoading(true);
    try {
      // Inserção exata com base nas colunas da sua tabela contas_bancarias
      const { error } = await supabase
        .from('contas_bancarias')
        .insert([{
          perfil_id: perfilId, // Nome exato da coluna no seu DB
          nome: nome.trim(),
          saldo_atual: saldoNumerico
        }]);

      if (error) throw new Error(error.message);

      Alert.alert('Sucesso', 'Conta criada com sucesso!');
      navigation.goBack(); // Regressa ao Dashboard

    } catch (err: any) {
      Alert.alert('Erro ao salvar', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nova Conta</Text>

      <Text style={styles.label}>Nome da Conta / Instituição</Text>
      <TextInput 
        style={styles.input} 
        placeholder="Ex: Conta Corrente Itaú, Cofre Físico..." 
        value={nome} 
        onChangeText={setNome} 
      />

      <Text style={styles.label}>Saldo Atual (R$)</Text>
      <TextInput 
        style={styles.input} 
        placeholder="0.00" 
        keyboardType="numeric"
        value={saldo} 
        onChangeText={setSaldo} 
      />

      <TouchableOpacity style={styles.btnPrincipal} onPress={handleSalvarConta} disabled={loading}>
        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Salvar Conta</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.btnCancelar} onPress={() => navigation.goBack()}>
        <Text style={styles.btnCancelarText}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#F9FAFB', paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24, color: '#111827' },
  label: { fontSize: 16, color: '#4B5563', marginBottom: 8, fontWeight: '600' },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 16, marginBottom: 24, fontSize: 16 },
  btnPrincipal: { backgroundColor: '#10B981', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 16 },
  btnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  btnCancelar: { padding: 16, alignItems: 'center', marginTop: 8 },
  btnCancelarText: { color: '#EF4444', fontSize: 16, fontWeight: 'bold' }
});