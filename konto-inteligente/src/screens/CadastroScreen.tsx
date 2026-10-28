import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  ActivityIndicator, Alert, StyleSheet, ScrollView 
} from 'react-native';
import { supabase } from '../services/supabase';

// Tipagem para as opções do banco
type TipoConta = 'PF' | 'PJ' | 'PF_PJ';

export default function CadastroScreen({ navigation }: any) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [pin, setPin] = useState('');
  const [tipoConta, setTipoConta] = useState<TipoConta>('PF_PJ');
  const [loading, setLoading] = useState(false);

  const handleCadastro = async () => {
    if (!nome || !email || !senha || !pin) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);

    try {
      // 1. Inserir o Usuário
      const { data: usuario, error: erroUsuario } = await supabase
        .from('usuarios')
        .insert([{ 
          nome, 
          email, 
          senha, // Nota: Em um app real, encripte a senha antes de enviar ou use o Supabase Auth
          pin_acesso: pin,
          tipo_conta: tipoConta 
        }])
        .select()
        .single(); // .single() garante que retorne o objeto exato criado (com o ID)

      if (erroUsuario) throw new Error(erroUsuario.message);

      // 2. Preparar os Perfis Financeiros com base na escolha
      const perfisParaCriar = [];

      if (tipoConta === 'PF' || tipoConta === 'PF_PJ') {
        perfisParaCriar.push({
          usuario_id: usuario.id,
          tipo: 'PESSOAL',
          nome: 'Minhas Finanças (Casa)'
        });
      }

      if (tipoConta === 'PJ' || tipoConta === 'PF_PJ') {
        perfisParaCriar.push({
          usuario_id: usuario.id,
          tipo: 'EMPRESARIAL',
          nome: 'Meu Negócio (Empresa)'
        });
      }

      // 3. Inserir os Perfis no Banco
      const { data: perfis, error: erroPerfis } = await supabase
        .from('perfis_financeiros')
        .insert(perfisParaCriar)
        .select();

      if (erroPerfis) throw new Error(erroPerfis.message);

      // 4. (Bônus) Criar uma "Carteira Principal" zerada para cada perfil criado
      const contasParaCriar = perfis.map((perfil) => ({
        perfil_id: perfil.id,
        nome: 'Carteira Principal',
        saldo_atual: 0.00
      }));

      await supabase.from('contas_bancarias').insert(contasParaCriar);

      Alert.alert('Sucesso!', 'Conta e perfis criados com sucesso.');
      // navigation.navigate('LoginScreen'); // Redireciona para o login após sucesso

    } catch (error: any) {
      Alert.alert('Erro ao cadastrar', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Criar minha conta</Text>

      <TextInput style={styles.input} placeholder="Nome Completo" value={nome} onChangeText={setNome} />
      <TextInput style={styles.input} placeholder="E-mail" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Senha" secureTextEntry value={senha} onChangeText={setSenha} />
      <TextInput style={styles.input} placeholder="PIN Rápido (4 dígitos)" keyboardType="numeric" maxLength={4} value={pin} onChangeText={setPin} />

      <Text style={styles.subtitle}>Como você vai usar o app?</Text>
      
      <View style={styles.cardsContainer}>
        {/* Card Apenas PF */}
        <TouchableOpacity 
          style={[styles.card, tipoConta === 'PF' && styles.cardAtivo]}
          onPress={() => setTipoConta('PF')}
        >
          <Text style={styles.cardIcon}>👤</Text>
          <Text style={styles.cardText}>Pessoal</Text>
        </TouchableOpacity>

        {/* Card Ambos PF/PJ */}
        <TouchableOpacity 
          style={[styles.card, tipoConta === 'PF_PJ' && styles.cardAtivo]}
          onPress={() => setTipoConta('PF_PJ')}
        >
          <Text style={styles.cardIcon}>🔄</Text>
          <Text style={styles.cardText}>Ambos</Text>
        </TouchableOpacity>

        {/* Card Apenas PJ */}
        <TouchableOpacity 
          style={[styles.card, tipoConta === 'PJ' && styles.cardAtivo]}
          onPress={() => setTipoConta('PJ')}
        >
          <Text style={styles.cardIcon}>🏢</Text>
          <Text style={styles.cardText}>Empresa</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.btnPrincipal} onPress={handleCadastro} disabled={loading}>
        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnPrincipalText}>Finalizar Cadastro</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

// ==========================================
// ESTILOS (CSS in JS)
// ==========================================
const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, backgroundColor: '#E5E7EB', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#111827', marginBottom: 24, textAlign: 'center' },
  subtitle: { fontSize: 16, fontWeight: '600', color: '#4B5563', marginTop: 16, marginBottom: 12 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 14, marginBottom: 12, fontSize: 16 },
  cardsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  card: { flex: 1, backgroundColor: '#FFF', borderWidth: 2, borderColor: '#E5E7EB', borderRadius: 12, padding: 16, alignItems: 'center', marginHorizontal: 4 },
  cardAtivo: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  cardIcon: { fontSize: 24, marginBottom: 8 },
  cardText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  btnPrincipal: { backgroundColor: '#10B981', padding: 16, borderRadius: 8, alignItems: 'center' },
  btnPrincipalText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});