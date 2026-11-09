import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../services/supabase';
import { useCadastro } from '../contexts/CadastroContext';

export default function Step4RevisaoScreen({ navigation }: any) {
  const { dados, limparDados } = useCadastro();
  const [loading, setLoading] = useState(false);

  const getNomePerfil = (tipo: string) => {
    if (tipo === 'PF') return 'Pessoa Física';
    if (tipo === 'PJ') return 'Pessoa Jurídica';
    return 'Física e Jurídica';
  };

  const handleFinalizar = async () => {
    setLoading(true);
    try {
      const hashSenha = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, dados.senha);

      // 1. Criar o Usuário Principal
      const { data: novoUsuario, error: erroUsuario } = await supabase
        .from('usuarios')
        .insert([{
          nome: dados.nome,
          email: dados.email.toLowerCase(),
          senha: hashSenha,
          tipo_conta: dados.tipoConta
        }])
        .select()
        .single();

      if (erroUsuario) throw erroUsuario;

      // 2. Criar os Perfis Financeiros com base na escolha
      const perfis = [];
      if (dados.tipoConta === 'PF' || dados.tipoConta === 'PF_PJ') {
        perfis.push({ usuario_id: novoUsuario.id, tipo: 'PESSOAL', nome: 'Minhas Finanças' });
      }
      if (dados.tipoConta === 'PJ' || dados.tipoConta === 'PF_PJ') {
        perfis.push({ usuario_id: novoUsuario.id, tipo: 'EMPRESARIAL', nome: 'Meu Negócio' });
      }

      const { error: erroPerfil } = await supabase.from('perfis_financeiros').insert(perfis);
      if (erroPerfil) throw erroPerfil;

      // 3. Logar o utilizador e ir para o Dashboard
      await SecureStore.setItemAsync('userToken', novoUsuario.id.toString());
      limparDados();
      Alert.alert('Sucesso!', 'A sua conta Konto foi criada.', [
        { text: 'Ir para o Painel', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] }) }
      ]);

    } catch (err: any) {
      Alert.alert('Erro ao criar conta', err.message || 'Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        {/* LOGO */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
            <Text style={styles.logoText}>Konto</Text>
          </View>
        </View>

        <Text style={styles.title}>Revisar Informações</Text>

        <View style={styles.cardRevisao}>
          <View style={styles.linhaInfo}>
            <Text style={styles.label}>Nome:</Text>
            <Text style={styles.valor} numberOfLines={1}>{dados.nome}</Text>
          </View>
          <View style={styles.linhaInfo}>
            <Text style={styles.label}>E-mail:</Text>
            <Text style={styles.valor} numberOfLines={1}>{dados.email}</Text>
          </View>
          <View style={[styles.linhaInfo, { borderBottomWidth: 0 }]}>
            <Text style={styles.label}>Perfil:</Text>
            <Text style={styles.valor}>{getNomePerfil(dados.tipoConta)}</Text>
          </View>
        </View>

        {/* BOTÃO CRIAR CONTA */}
        <TouchableOpacity onPress={handleFinalizar} disabled={loading}>
          <LinearGradient 
            colors={['#0F172A', '#1D4ED8', '#3B82F6']} 
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.btnGradient}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Criar Minha Conta</Text>}
          </LinearGradient>
        </TouchableOpacity>

        {/* LINK VOLTAR */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => navigation.goBack()} disabled={loading}>
            <Text style={styles.linkTextDark}>
              <Text style={{ color: '#9CA3AF' }}>❮</Text> Voltar e Editar
            </Text>
          </TouchableOpacity>
        </View>
        
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1, paddingHorizontal: 32, justifyContent: 'center' },
  
  header: { alignItems: 'center', marginBottom: 40 },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoImage: { width: 44, height: 44, marginRight: 8 },
  logoText: { fontSize: 40, fontWeight: '900', color: '#0F172A', letterSpacing: -1 },
  
  title: { fontSize: 20, color: '#1D4ED8', fontWeight: '800', textAlign: 'center', marginBottom: 24 },
  
  cardRevisao: { backgroundColor: '#F8FAFC', padding: 24, borderRadius: 24, borderWidth: 2, borderColor: '#0F172A', marginBottom: 32 },
  linhaInfo: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  label: { fontSize: 14, color: '#64748B', fontWeight: '700' },
  valor: { fontSize: 14, color: '#0F172A', fontWeight: '800', flex: 1, textAlign: 'right', marginLeft: 16 },
  
  btnGradient: { height: 56, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  btnText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  
  footer: { alignItems: 'center', marginTop: 12 },
  linkTextDark: { color: '#0F172A', fontSize: 14, fontWeight: '700' }
});