import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';


export default function WelcomeScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logoText}>Konto Inteligente</Text>
        <Text style={styles.subtitle}>Gestão financeira simples para você e sua empresa.</Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Step1Basico')}
        >
          <LinearGradient
            colors={['#0F172A', '#1D4ED8', '#3B82F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.btnGradient}
          >
          <Text style={styles.btnInscreverText}>Inscreva-se</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
        >
          <LinearGradient
            colors={['#0F172A', '#1D4ED8', '#3B82F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.btnGradient}
          >
          <Text style={styles.btnEntrarText}>Entrar</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 24, justifyContent: 'space-between' },
  header: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoText: { fontSize: 40, fontWeight: '900', color: '#0F172A', letterSpacing: -1 },
  subtitle: { fontSize: 14, color: '#1E3A8A', fontWeight: '700' },
  footer: { paddingBottom: 40 },
  btnInscrever: { backgroundColor: '#013086', padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  btnInscreverText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  btnGradient: { 
    height: 56, 
    borderRadius: 30, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 16
  },
  btnEntrarText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
});