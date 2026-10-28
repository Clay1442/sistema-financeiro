import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useCadastro } from '../contexts/CadastroContext';

type TipoConta = 'PF' | 'PJ' | 'PF_PJ';

export default function Step3PerfilScreen({ navigation }: any) {
  const { dados, atualizarDados } = useCadastro();
  const [perfilSelecionado, setPerfilSelecionado] = useState<TipoConta>(dados.tipoConta || 'PF');

  const handleContinuar = () => {
    // Salva a escolha do perfil no contexto
    atualizarDados({ tipoConta: perfilSelecionado });
    
    // Avança para a Etapa 4 (Revisão e Salvar no banco)
    navigation.navigate('Step4Revisao');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.step}>Etapa 3 de 4</Text>
      <Text style={styles.title}>Perfil Financeiro</Text>
      <Text style={styles.subtitle}>Como você pretende usar o aplicativo?</Text>

      {/* Card: Apenas Pessoal */}
      <TouchableOpacity 
        style={[styles.card, perfilSelecionado === 'PF' && styles.cardAtivo]}
        onPress={() => setPerfilSelecionado('PF')}
      >
        <Text style={styles.cardIcon}>👤</Text>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Perfil Pessoal</Text>
          <Text style={styles.cardDesc}>Apenas para organizar meus gastos de casa e vida pessoal.</Text>
        </View>
      </TouchableOpacity>

      {/* Card: Apenas Empresarial */}
      <TouchableOpacity 
        style={[styles.card, perfilSelecionado === 'PJ' && styles.cardAtivo]}
        onPress={() => setPerfilSelecionado('PJ')}
      >
        <Text style={styles.cardIcon}>🏢</Text>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Perfil Empresarial</Text>
          <Text style={styles.cardDesc}>Apenas para gerenciar o caixa, receitas e despesas da minha empresa.</Text>
        </View>
      </TouchableOpacity>

      {/* Card: Compartilhado (Ambos) */}
      <TouchableOpacity 
        style={[styles.card, perfilSelecionado === 'PF_PJ' && styles.cardAtivo]}
        onPress={() => setPerfilSelecionado('PF_PJ')}
      >
        <Text style={styles.cardIcon}>🔄</Text>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Perfil Compartilhado</Text>
          <Text style={styles.cardDesc}>Quero os dois. Gerenciar minha empresa e minha vida pessoal no mesmo app, mas sem misturar o dinheiro.</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btnPrincipal} onPress={handleContinuar}>
        <Text style={styles.btnText}>Continuar</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btnVoltar} onPress={() => navigation.goBack()}>
        <Text style={styles.btnVoltarText}>Voltar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, backgroundColor: '#F9FAFB', justifyContent: 'center' },
  step: { fontSize: 14, color: '#3B82F6', marginBottom: 8, fontWeight: 'bold', textTransform: 'uppercase' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8, color: '#111827' },
  subtitle: { fontSize: 16, color: '#4B5563', marginBottom: 32 },
  card: { flexDirection: 'row', backgroundColor: '#FFF', borderWidth: 2, borderColor: '#E5E7EB', borderRadius: 12, padding: 16, marginBottom: 16, alignItems: 'center' },
  cardAtivo: { borderColor: '#10B981', backgroundColor: '#ECFDF5' }, // Fica verdinho quando selecionado
  cardIcon: { fontSize: 32, marginRight: 16 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  cardDesc: { fontSize: 14, color: '#4B5563', lineHeight: 20 },
  btnPrincipal: { backgroundColor: '#10B981', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 16 },
  btnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  btnVoltar: { padding: 16, alignItems: 'center', marginTop: 8 },
  btnVoltarText: { color: '#6B7280', fontSize: 16, fontWeight: 'bold' }
});