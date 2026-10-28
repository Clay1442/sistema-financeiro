import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useCadastro } from '../contexts/CadastroContext';
import { supabase } from '../services/supabase';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

export default function Step4RevisaoScreen({ navigation }: any) {
  const { dados, limparDados } = useCadastro();
  const [loading, setLoading] = useState(false);

  const handleFinalizar = async () => {
    setLoading(true);
    try {
      // 1. Criptografar Senha e PIN localmente (SHA-256) para NUNCA salvar em texto puro
      const hashSenha = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, dados.senha);
      const hashPin = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, dados.pin);

      // 2. Criar Usuário
      const { data: usuario, error: errUser } = await supabase.from('usuarios')
        .insert([{ 
          nome: dados.nome, email: dados.email, 
          senha: hashSenha, pin_acesso: hashPin, tipo_conta: dados.tipoConta 
        }]).select().single();
      
      if (errUser) throw new Error(errUser.message);

      // 3. Criar Perfis Financeiros
      const perfisParaCriar = [];
      if (dados.tipoConta === 'PF' || dados.tipoConta === 'PF_PJ') {
        perfisParaCriar.push({ usuario_id: usuario.id, tipo: 'PESSOAL', nome: 'Minhas Finanças' });
      }
      if (dados.tipoConta === 'PJ' || dados.tipoConta === 'PF_PJ') {
        perfisParaCriar.push({ usuario_id: usuario.id, tipo: 'EMPRESARIAL', nome: 'Meu Negócio' });
      }

      const { data: perfis, error: errPerfis } = await supabase.from('perfis_financeiros')
        .insert(perfisParaCriar).select();
      if (errPerfis) throw new Error(errPerfis.message);

      // 4. Salvar sessão local criptografada (O recurso de "Manter Conectado")
      await SecureStore.setItemAsync('userToken', usuario.id.toString());
      await SecureStore.setItemAsync('manterConectado', 'true');

      // Limpa a memória do formulário e manda direto pro Dashboard (Auto-login)
      limparDados();
      navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });

    } catch (error: any) {
      Alert.alert('Erro no Cadastro', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Revisão do Cadastro</Text>
      
      <View style={styles.cardResumo}>
        <Text style={styles.label}>Nome:</Text><Text style={styles.value}>{dados.nome}</Text>
        <Text style={styles.label}>E-mail:</Text><Text style={styles.value}>{dados.email}</Text>
        <Text style={styles.label}>Perfil Escolhido:</Text>
        <Text style={styles.value}>
          {dados.tipoConta === 'PF' ? 'Pessoal' : dados.tipoConta === 'PJ' ? 'Empresarial' : 'Compartilhado'}
        </Text>
        <Text style={styles.label}>Segurança:</Text>
        <Text style={styles.value}>PIN de 4 dígitos configurado 🔒</Text>
      </View>

      <TouchableOpacity style={styles.btnPrincipal} onPress={handleFinalizar} disabled={loading}>
        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Finalizar Cadastro</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#F9FAFB' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  cardResumo: { backgroundColor: '#FFF', padding: 20, borderRadius: 12, marginBottom: 32 },
  label: { fontSize: 14, color: '#6B7280', marginTop: 12 },
  value: { fontSize: 18, fontWeight: '600', color: '#111827' },
  btnPrincipal: { backgroundColor: '#10B981', padding: 16, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});