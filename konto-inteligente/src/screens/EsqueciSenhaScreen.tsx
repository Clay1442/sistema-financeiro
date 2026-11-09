import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '../services/supabase';
import * as Crypto from 'expo-crypto';

export default function EsqueciSenhaScreen({ navigation }: any) {
  // Controle em qual etapa da recuperação estamos: 1 (Email), 2 (Código), 3 (Nova Senha)
  const [etapa, setEtapa] = useState<1 | 2 | 3>(1);
  
  const [email, setEmail] = useState('');
  const [codigoGerado, setCodigoGerado] = useState('');
  const [codigoDigitado, setCodigoDigitado] = useState('');
  
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmaNovaSenha, setConfirmaNovaSenha] = useState('');
  const [loading, setLoading] = useState(false);

  // --- ETAPA 1: SOLICITAR CÓDIGO ---
  const handleSolicitarCodigo = async () => {
    if (!email) return Alert.alert('Atenção', 'Digite seu e-mail.');
    setLoading(true);

    try {
      // Verifica se o e-mail existe
      const { data, error } = await supabase.from('usuarios').select('id').eq('email', email).single();
      if (error || !data) throw new Error('E-mail não encontrado.');

      // Gera um código de 6 dígitos aleatório
      const codigo = Math.floor(100000 + Math.random() * 900000).toString();
      setCodigoGerado(codigo);
      
      // SIMULAÇÃO DO ENVIO DE E-MAIL (No futuro, aqui entra a API do SendGrid/Resend)
      Alert.alert('📧 E-mail Enviado! (Simulação)', `Use o código: ${codigo}`);
      
      setEtapa(2); // Avança para pedir o código
    } catch (err: any) {
      Alert.alert('Erro', err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- ETAPA 2: VALIDAR CÓDIGO ---
  const handleValidarCodigo = () => {
    if (codigoDigitado !== codigoGerado) {
      return Alert.alert('Atenção', 'Código inválido. Tente novamente.');
    }
    setEtapa(3); // Código certo! Avança para pedir a nova senha
  };

  // --- ETAPA 3: SALVAR NOVA SENHA ---
  const handleSalvarNovaSenha = async () => {
    if (!novaSenha || novaSenha !== confirmaNovaSenha) {
      return Alert.alert('Atenção', 'As senhas não coincidem ou estão vazias.');
    }
    if (novaSenha.length < 6) {
      return Alert.alert('Segurança', 'A senha deve ter pelo menos 6 caracteres.');
    }

    setLoading(true);
    try {
      const hashNovaSenha = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, novaSenha);
      const { error } = await supabase.from('usuarios').update({ senha: hashNovaSenha }).eq('email', email);
      
      if (error) throw new Error('Falha ao atualizar a senha.');

      Alert.alert('Sucesso!', 'Senha alterada. Faça login com a nova senha.');
      navigation.navigate('Login');
    } catch (err: any) {
      Alert.alert('Erro', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recuperar Senha</Text>

      {/* RENDERIZAÇÃO CONDICIONAL BASEADA NA ETAPA */}
      
      {etapa === 1 && (
        <>
          <Text style={styles.subtitle}>Digite o e-mail cadastrado para receber o código de recuperação.</Text>
          <TextInput style={styles.input} placeholder="Seu E-mail" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
          <TouchableOpacity style={styles.btnPrincipal} onPress={handleSolicitarCodigo} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Enviar Código</Text>}
          </TouchableOpacity>
        </>
      )}

      {etapa === 2 && (
        <>
          <Text style={styles.subtitle}>Enviamos um código de 6 dígitos para o seu e-mail.</Text>
          <TextInput style={styles.input} placeholder="Digite o Código" keyboardType="numeric" maxLength={6} value={codigoDigitado} onChangeText={setCodigoDigitado} />
          <TouchableOpacity style={styles.btnPrincipal} onPress={handleValidarCodigo}>
            <Text style={styles.btnText}>Validar Código</Text>
          </TouchableOpacity>
        </>
      )}

      {etapa === 3 && (
        <>
          <Text style={styles.subtitle}>Código validado! Crie sua nova senha de acesso.</Text>
          <TextInput style={styles.input} placeholder="Nova Senha" secureTextEntry value={novaSenha} onChangeText={setNovaSenha} />
          <TextInput style={styles.input} placeholder="Confirme a Nova Senha" secureTextEntry value={confirmaNovaSenha} onChangeText={setConfirmaNovaSenha} />
          <TouchableOpacity style={styles.btnPrincipal} onPress={handleSalvarNovaSenha} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Salvar Nova Senha</Text>}
          </TouchableOpacity>
        </>
      )}

      {/* Botão voltar dinâmico */}
      <TouchableOpacity 
        style={styles.btnVoltar} 
        onPress={() => {
          if (etapa > 1) setEtapa((prev) => (prev - 1) as 1 | 2 | 3); // Volta uma etapa
          else navigation.goBack(); // Volta para o login
        }}
      >
        <Text style={styles.btnVoltarText}>{etapa > 1 ? 'Voltar' : 'Cancelar'}</Text>
      </TouchableOpacity>
    </View>
  );
}

// Estilos mantidos iguais aos anteriores
const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#F9FAFB', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 12, color: '#111827' },
  subtitle: { fontSize: 16, color: '#4B5563', marginBottom: 32, lineHeight: 22 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 16, marginBottom: 16, fontSize: 16, textAlign: 'center', letterSpacing: 2 },
  btnPrincipal: { backgroundColor: '#10B981', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  btnVoltar: { padding: 16, alignItems: 'center', marginTop: 12 },
  btnVoltarText: { color: '#6B7280', fontSize: 16, fontWeight: 'bold' }
});