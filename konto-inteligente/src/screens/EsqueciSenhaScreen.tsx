import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '../services/supabase';
import * as Crypto from 'expo-crypto';

export default function EsqueciSenhaScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmaNovaSenha, setConfirmaNovaSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRedefinirSenha = async () => {
    if (!email || !novaSenha || !confirmaNovaSenha) {
      return Alert.alert('Atenção', 'Preencha todos os campos.');
    }

    if (novaSenha !== confirmaNovaSenha) {
      return Alert.alert('Atenção', 'As senhas não coincidem.');
    }

    if (novaSenha.length < 6) {
      return Alert.alert('Segurança', 'A nova senha deve ter pelo menos 6 caracteres.');
    }

    setLoading(true);

    try {
      // 1. Verifica se o e-mail existe na nossa tabela de usuários
      const { data: usuarioExistente, error: erroBusca } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', email)
        .single();

      if (erroBusca || !usuarioExistente) {
        throw new Error('Não encontramos nenhuma conta com este e-mail.');
      }

      // 2. Criptografa a nova senha escolhida
      const hashNovaSenha = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256, 
        novaSenha
      );

      // 3. Atualiza a senha no banco de dados
      const { error: erroUpdate } = await supabase
        .from('usuarios')
        .update({ senha: hashNovaSenha })
        .eq('email', email);

      if (erroUpdate) {
        throw new Error('Falha ao atualizar a senha. Tente novamente.');
      }

      Alert.alert('Sucesso!', 'Sua senha foi redefinida com sucesso.');
      navigation.navigate('Login'); // Manda de volta para o login

    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recuperar Senha</Text>
      <Text style={styles.subtitle}>
        Informe o e-mail vinculado à sua conta para criar uma nova senha de acesso.
      </Text>

      <TextInput 
        style={styles.input} 
        placeholder="Seu E-mail" 
        keyboardType="email-address" 
        autoCapitalize="none" 
        value={email} 
        onChangeText={setEmail} 
      />
      
      <TextInput 
        style={styles.input} 
        placeholder="Nova Senha" 
        secureTextEntry 
        value={novaSenha} 
        onChangeText={setNovaSenha} 
      />
      
      <TextInput 
        style={styles.input} 
        placeholder="Confirme a Nova Senha" 
        secureTextEntry 
        value={confirmaNovaSenha} 
        onChangeText={setConfirmaNovaSenha} 
      />

      <TouchableOpacity style={styles.btnPrincipal} onPress={handleRedefinirSenha} disabled={loading}>
        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Redefinir Senha</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.btnVoltar} onPress={() => navigation.goBack()}>
        <Text style={styles.btnVoltarText}>Voltar para o Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#F9FAFB', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 12, color: '#111827' },
  subtitle: { fontSize: 16, color: '#4B5563', marginBottom: 32, lineHeight: 22 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 16, marginBottom: 16, fontSize: 16 },
  btnPrincipal: { backgroundColor: '#10B981', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  btnVoltar: { padding: 16, alignItems: 'center', marginTop: 12 },
  btnVoltarText: { color: '#6B7280', fontSize: 16, fontWeight: 'bold' }
});