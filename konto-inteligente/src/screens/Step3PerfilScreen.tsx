import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useCadastro } from '../contexts/CadastroContext';

export default function Step3PerfilScreen({ navigation }: any) {
  const { dados, atualizarDados } = useCadastro();
  const [perfilSelecionado, setPerfilSelecionado] = useState<'PF' | 'PJ' | 'PF_PJ' | null>(dados?.tipoConta || null);

  const handleContinuar = () => {
    if (!perfilSelecionado) {
      return Alert.alert('Atenção', 'Escolha o seu perfil financeiro antes de continuar.');
    }
    atualizarDados({ tipoConta: perfilSelecionado });
    navigation.navigate('Step4Revisao');
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

        <Text style={styles.title}>Escolha seu perfil financeiro</Text>

        {/* CÍRCULOS DE SELEÇÃO */}
        <View style={styles.rowPerfis}>
          
          {/* Pessoa Física */}
          <TouchableOpacity style={styles.btnPerfil} onPress={() => setPerfilSelecionado('PF')}>
            <View style={[styles.circle, perfilSelecionado === 'PF' ? styles.circleAtivo : styles.circleInativo]}>
              <FontAwesome5 name="user-alt" size={24} color={perfilSelecionado === 'PF' ? "#FFF" : "#0F172A"} />
            </View>
            <Text style={styles.perfilLabel}>Pessoa {'\n'}Física {'\n'}PF</Text>
          </TouchableOpacity>

          {/* Pessoa Jurídica */}
          <TouchableOpacity style={styles.btnPerfil} onPress={() => setPerfilSelecionado('PJ')}>
            <View style={[styles.circle, perfilSelecionado === 'PJ' ? styles.circleAtivo : styles.circleInativo]}>
              <FontAwesome5 name="user-tie" size={24} color={perfilSelecionado === 'PJ' ? "#FFF" : "#0F172A"} />
            </View>
            <Text style={styles.perfilLabel}>Pessoa {'\n'}Jurídica {'\n'}PJ</Text>
          </TouchableOpacity>

          {/* Ambos */}
          <TouchableOpacity style={styles.btnPerfil} onPress={() => setPerfilSelecionado('PF_PJ')}>
            <View style={[styles.circle, perfilSelecionado === 'PF_PJ' ? styles.circleAtivo : styles.circleInativo]}>
              <FontAwesome5 name="users" size={24} color={perfilSelecionado === 'PF_PJ' ? "#FFF" : "#0F172A"} />
            </View>
            <Text style={styles.perfilLabel}>Pessoa Física {'\n'}e Jurídica {'\n'}PF e PJ</Text>
          </TouchableOpacity>

        </View>

        {/* BOTÃO CONTINUAR */}
        <TouchableOpacity onPress={handleContinuar}>
          <LinearGradient 
            colors={['#0F172A', '#1D4ED8', '#3B82F6']} 
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.btnGradient}
          >
            <Text style={styles.btnText}>Continuar</Text>
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
  
  title: { fontSize: 20, color: '#1D4ED8', fontWeight: '800', textAlign: 'center', marginBottom: 32 },
  
  rowPerfis: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  btnPerfil: { alignItems: 'center', flex: 1 },
  
  circle: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2 },
  circleInativo: { backgroundColor: '#F8FAFC', borderColor: '#0F172A' },
  circleAtivo: { backgroundColor: '#1D4ED8', borderColor: '#1D4ED8' },
  
  perfilLabel: { fontSize: 12, fontWeight: '800', color: '#0F172A', textAlign: 'center' },
  
  btnGradient: { height: 56, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  btnText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  
  footer: { alignItems: 'center', marginTop: 12 },
  linkTextDark: { color: '#0F172A', fontSize: 14, fontWeight: '700' }
});