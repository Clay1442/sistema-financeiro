import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function WelcomeScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Konto Inteligente</Text>
        <Text style={styles.subtitle}>Gestão financeira simples para você e sua empresa.</Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.btnInscrever} 
          onPress={() => navigation.navigate('Step1Basico')}
        >
          <Text style={styles.btnInscreverText}>Inscreva-se</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.btnEntrar} 
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.btnEntrarText}>Entrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 24, justifyContent: 'space-between' },
  header: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#4B5563', textAlign: 'center', paddingHorizontal: 20 },
  footer: { paddingBottom: 40 },
  btnInscrever: { backgroundColor: '#10B981', padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  btnInscreverText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  btnEntrar: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#10B981', padding: 16, borderRadius: 8, alignItems: 'center' },
  btnEntrarText: { color: '#10B981', fontSize: 18, fontWeight: 'bold' }
});