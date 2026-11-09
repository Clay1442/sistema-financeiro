import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Step2SegurancaScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        {/* LOGO E TÍTULO */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
            <Text style={styles.logoText}>Konto</Text>
          </View>
          <Text style={styles.subtitle}>Segurança em primeiro lugar</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.biometriaCard}>
            <MaterialCommunityIcons name="fingerprint" size={64} color="#1D4ED8" style={{ marginBottom: 16 }} />
            <Text style={styles.biometriaTitle}>Acesso Inteligente</Text>
            <Text style={styles.biometriaDesc}>
              O nosso aplicativo suporta FaceID e Leitura de Impressão Digital.{'\n\n'}
              Após criar a conta, poderá acessar rapidamente usando a biometria do seu dispositivo, sem precisar de digitar a senha novamente.
            </Text>
          </View>

          {/* BOTÃO CONTINUAR */}
          <TouchableOpacity onPress={() => navigation.navigate('Step3Perfil')}>
            <LinearGradient 
              colors={['#0F172A', '#1D4ED8', '#3B82F6']} 
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              <Text style={styles.btnText}>Entendi, Continuar</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* LINK VOLTAR */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.linkTextDark}>
                <Text style={{ color: '#9CA3AF' }}>❮</Text> Voltar
              </Text>
            </TouchableOpacity>
          </View>
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
  logoImage: { width: 44, height: 44, marginRight: 8 },
  logoText: { fontSize: 40, fontWeight: '900', color: '#0F172A', letterSpacing: -1 },
  subtitle: { fontSize: 16, color: '#0F172A', fontWeight: '800' },
  
  form: { marginBottom: 20 },
  biometriaCard: { alignItems: 'center', backgroundColor: '#F8FAFC', padding: 24, borderRadius: 24, borderWidth: 2, borderColor: '#E2E8F0', marginBottom: 32 },
  biometriaTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A', marginBottom: 12 },
  biometriaDesc: { fontSize: 14, color: '#475569', lineHeight: 22, textAlign: 'center', fontWeight: '500' },
  
  btnGradient: { height: 56, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  btnText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  
  footer: { alignItems: 'center', marginTop: 12 },
  linkTextDark: { color: '#0F172A', fontSize: 14, fontWeight: '700' }
});