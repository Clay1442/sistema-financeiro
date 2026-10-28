import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch, Alert, StyleSheet } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { supabase } from '../services/supabase';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [manterConectado, setManterConectado] = useState(true);
  const [suportaBiometria, setSuportaBiometria] = useState(false);

  useEffect(() => {
    // Verifica se o celular do usuário tem FaceID/TouchID habilitado
    (async () => {
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setSuportaBiometria(isEnrolled);
    })();
  }, []);

  const handleLoginBiometria = async () => {
    // Aciona a telinha nativa de Digital/FaceID do celular
    const auth = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Use sua biometria para entrar no Konto',
      fallbackLabel: 'Usar PIN'
    });

    if (auth.success) {
      // Se a biometria validou, verificamos se há um token local salvo
      const token = await SecureStore.getItemAsync('userToken');
      if (token) {
        navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
      } else {
        Alert.alert('Erro', 'Nenhuma conta ativa encontrada. Faça login com senha primeiro.');
      }
    }
  };

  const handleLoginTradicional = async () => {
    try {
      const hashSenha = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, senha);
      
      const { data, error } = await supabase.from('usuarios')
        .select('id, nome').eq('email', email).eq('senha', hashSenha).single();

      if (error || !data) throw new Error('E-mail ou senha incorretos.');

      if (manterConectado) {
        await SecureStore.setItemAsync('userToken', data.id.toString());
        await SecureStore.setItemAsync('manterConectado', 'true');
      }

      navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
    } catch (err: any) {
      Alert.alert('Acesso Negado', err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bem-vindo de volta!</Text>

      <TextInput style={styles.input} placeholder="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Senha" value={senha} onChangeText={setSenha} secureTextEntry />

      <View style={styles.row}>
        <Text style={styles.label}>Manter conectado</Text>
        <Switch value={manterConectado} onValueChange={setManterConectado} />
      </View>

      <TouchableOpacity style={styles.btnPrincipal} onPress={handleLoginTradicional}>
        <Text style={styles.btnText}>Entrar</Text>
      </TouchableOpacity>

      {suportaBiometria && (
        <TouchableOpacity style={styles.btnBiometria} onPress={handleLoginBiometria}>
          <Text style={styles.btnBiometriaText}>👆 Entrar com Biometria / Digital</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Estilos básicos (semelhantes aos anteriores)
const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 16, borderRadius: 8, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  label: { fontSize: 16 },
  btnPrincipal: { backgroundColor: '#10B981', padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  btnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  btnBiometria: { padding: 16, alignItems: 'center' },
  btnBiometriaText: { color: '#3B82F6', fontSize: 16, fontWeight: '600' }
});