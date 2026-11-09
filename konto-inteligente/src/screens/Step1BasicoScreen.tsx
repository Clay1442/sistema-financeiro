import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCadastro } from '../contexts/CadastroContext';

export default function Step1BasicoScreen({ navigation }: any) {
  // Conectando ao seu contexto de cadastro existente
  const { dados, atualizarDados } = useCadastro();
  
  const [nome, setNome] = useState(dados?.nome || '');
  const [email, setEmail] = useState(dados?.email || '');
  const [senha, setSenha] = useState(dados?.senha || '');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);

  const handleContinuar = () => {
    if (!nome.trim() || !email.trim() || !senha.trim() || !confirmarSenha.trim()) {
      return Alert.alert('Atenção', 'Por favor, preencha todos os campos.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return Alert.alert('E-mail Inválido', 'Por favor, introduza um e-mail válido com @ e domínio (ex: exemplo@gmail.com).');
    }

    if (senha !== confirmarSenha) {
      return Alert.alert('Atenção', 'As senhas não coincidem.');
    }

    // 2. Salva no contexto e avança para a próxima etapa (Segurança ou Perfil)
    // Usamos o .trim() no e-mail também aqui para garantir que não vão espaços em branco para o banco
    atualizarDados({ nome: nome.trim(), email: email.trim(), senha });
    navigation.navigate('Step2Seguranca'); 
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* LOGO E TÍTULO */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/logo.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.logoText}>Konto</Text>
          </View>
          <Text style={styles.subtitle}>
            Bem<Text style={{color: '#3B82F6'}}>-</Text>vindo!
          </Text>
        </View>

        {/* FORMULÁRIO */}
        <View style={styles.form}>
          
          <View style={styles.inputContainer}>
            <Feather name="user" size={20} color="#111827" style={styles.iconLeft} />
            <TextInput 
              style={styles.input} 
              placeholder="Nome completo" 
              placeholderTextColor="#9CA3AF"
              value={nome} 
              onChangeText={setNome} 
            />
          </View>

          <View style={styles.inputContainer}>
            <Feather name="mail" size={20} color="#111827" style={styles.iconLeft} />
            <TextInput 
              style={styles.input} 
              placeholder="E-mail" 
              placeholderTextColor="#9CA3AF"
              value={email} 
              onChangeText={setEmail} 
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Feather name="shield" size={20} color="#111827" style={styles.iconLeft} />
            <TextInput 
              style={styles.input} 
              placeholder="Senha" 
              placeholderTextColor="#9CA3AF"
              value={senha} 
              onChangeText={setSenha} 
              secureTextEntry={!showSenha} 
            />
            <TouchableOpacity onPress={() => setShowSenha(!showSenha)} style={styles.iconRight}>
              <Feather name={showSenha ? "eye" : "eye-off"} size={20} color="#111827" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Feather name="shield" size={20} color="#111827" style={styles.iconLeft} />
            <TextInput 
              style={styles.input} 
              placeholder="Confirmação de senha" 
              placeholderTextColor="#9CA3AF"
              value={confirmarSenha} 
              onChangeText={setConfirmarSenha} 
              secureTextEntry={!showConfirmarSenha} 
            />
            <TouchableOpacity onPress={() => setShowConfirmarSenha(!showConfirmarSenha)} style={styles.iconRight}>
              <Feather name={showConfirmarSenha ? "eye" : "eye-off"} size={20} color="#111827" />
            </TouchableOpacity>
          </View>

          {/* BOTÃO CONTINUAR */}
          <TouchableOpacity onPress={handleContinuar} style={{ marginTop: 8 }}>
            <LinearGradient 
              colors={['#0F172A', '#1D4ED8', '#3B82F6']} 
              start={{ x: 0, y: 0 }} 
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              <Text style={styles.btnText}>Continuar</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* LINK VOLTAR PARA LOGIN */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkTextDark}>
                Possuo cadastro <Text style={{ color: '#9CA3AF' }}>❯</Text>
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flexGrow: 1, paddingHorizontal: 32, justifyContent: 'center', paddingTop: 20, paddingBottom: 40 },
  
  header: { marginBottom: 40 },
  logoContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  logoImage: { width: 44, height: 44, marginRight: 8 },
  logoText: { fontSize: 40, fontWeight: '900', color: '#0F172A', letterSpacing: -1 },
  subtitle: { fontSize: 16, color: '#0F172A', fontWeight: '800' },
  
  form: { marginBottom: 20 },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 2, 
    borderColor: '#0F172A', 
    borderRadius: 30, 
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: '#FFF'
  },
  iconLeft: { marginRight: 12 },
  iconRight: { padding: 8 },
  input: { flex: 1, fontSize: 16, color: '#111827' },
  
  btnGradient: { 
    height: 56, 
    borderRadius: 30, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 16
  },
  btnText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  
  footer: { alignItems: 'center', marginTop: 12 },
  linkTextDark: { color: '#0F172A', fontSize: 14, fontWeight: '700' }
});