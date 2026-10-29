import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function Step2SegurancaScreen({ navigation }: any) {
  
  return (
    <View style={styles.container}>
      <Text style={styles.step}>Etapa 2 de 4</Text>
      <Text style={styles.title}>Segurança e Acesso</Text>

      <View style={styles.biometriaCard}>
        <Text style={styles.biometriaTitle}>👆 Acesso Inteligente</Text>
        <Text style={styles.biometriaDesc}>
          Nosso aplicativo possui suporte integrado para FaceID e Leitor de Impressão Digital. 
          {'\n\n'}
          Após concluir o cadastro, você não precisará digitar sua senha toda vez que abrir o app. Basta usar a biometria do seu próprio celular de forma rápida e segura!
        </Text>
      </View>

      <TouchableOpacity style={styles.btnPrincipal} onPress={() => navigation.navigate('Step3Perfil')}>
        <Text style={styles.btnText}>Entendi, Continuar</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btnVoltar} onPress={() => navigation.goBack()}>
        <Text style={styles.btnVoltarText}>Voltar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#F9FAFB', justifyContent: 'center' },
  step: { fontSize: 14, color: '#3B82F6', marginBottom: 8, fontWeight: 'bold', textTransform: 'uppercase' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24, color: '#111827' },
  biometriaCard: { backgroundColor: '#EFF6FF', padding: 20, borderRadius: 12, marginBottom: 32, borderWidth: 1, borderColor: '#BFDBFE' },
  biometriaTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E40AF', marginBottom: 12 },
  biometriaDesc: { fontSize: 16, color: '#1E3A8A', lineHeight: 24 },
  btnPrincipal: { backgroundColor: '#10B981', padding: 16, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  btnVoltar: { padding: 16, alignItems: 'center', marginTop: 8 },
  btnVoltarText: { color: '#6B7280', fontSize: 16, fontWeight: 'bold' }
});