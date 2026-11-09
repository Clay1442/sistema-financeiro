import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { supabase } from '../services/supabase';
import { Feather, MaterialCommunityIcons, AntDesign } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLoginTradicional = async () => {
    if (!email || !senha) {
      return Alert.alert('Atenção', 'Preencha o e-mail e a senha.');
    }

    setLoading(true);
    try {
      const hashSenha = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, senha);

      const { data: usuario, error } = await supabase
        .from('usuarios')
        .select('id, nome')
        .eq('email', email.trim().toLowerCase())
        .eq('senha', hashSenha)
        .single();

      if (error || !usuario) throw new Error('E-mail ou senha incorretos.');

      await SecureStore.setItemAsync('userToken', usuario.id.toString());
      navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });

    } catch (err: any) {
      Alert.alert('Falha no Login', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBiometria = () => {
    Alert.alert('Em breve', 'A autenticação por biometria será implementada em breve!');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        {/* LOGO E SUBTÍTULO */}
        <View style={styles.header}>            
          <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <Text style={styles.logoText}>Konto</Text>
            </View>
            <Text style={styles.subtitle}>Organize hoje, conquiste amanhã</Text>
          </View>

          {/* CAMPOS DE ENTRADA */}
          <View style={styles.form}>
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

            <TouchableOpacity
              style={styles.linkEsqueci}
              onPress={() => navigation.navigate('EsqueciSenha')}
            >
              <Text style={styles.linkTextDark}>Esqueci minha senha ➔</Text>
            </TouchableOpacity>

            {/* BOTÃO ENTRAR COM GRADIENTE */}
            <TouchableOpacity onPress={handleLoginTradicional} disabled={loading}>
              <LinearGradient
                colors={['#0F172A', '#1D4ED8', '#3B82F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btnGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.btnText}>Entrar</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkCriar}
              onPress={() => navigation.navigate('Step1Basico')}
            >
              <Text style={styles.linkTextBlue}>Criar minha conta ➔</Text>
            </TouchableOpacity>
          </View>

          {/* BIOMETRIA */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.biometriaBtn} onPress={handleBiometria}>
              <MaterialCommunityIcons name="fingerprint" size={48} color="#2563EB" />
              <Text style={styles.biometriaText}>Entrar com biometria</Text>
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
  logoContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },

  logoImage: {
    width: 44,
    height: 44,
    marginRight: 8,
  },

  logoText: { fontSize: 40, fontWeight: '900', color: '#0F172A', letterSpacing: -1 },
  subtitle: { fontSize: 14, color: '#1E3A8A', fontWeight: '700' },

  form: { marginBottom: 40 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0F172A',
    borderRadius: 30,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56
  },
  iconLeft: { marginRight: 12 },
  iconRight: { padding: 8 },
  input: { flex: 1, fontSize: 16, color: '#111827' },

  linkEsqueci: { alignItems: 'flex-end', marginBottom: 24 },
  linkTextDark: { color: '#0F172A', fontSize: 14, fontWeight: '700' },

  btnGradient: {
    height: 56,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  btnText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },

  linkCriar: { alignItems: 'flex-end' },
  linkTextBlue: { color: '#2563EB', fontSize: 14, fontWeight: '700' },

  footer: { alignItems: 'center', marginTop: 20 },
  biometriaBtn: { alignItems: 'center' },
  biometriaText: { color: '#2563EB', fontSize: 14, fontWeight: '700', marginTop: 8 }
});