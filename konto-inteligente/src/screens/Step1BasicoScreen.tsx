import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useCadastro } from '../contexts/CadastroContext';

export default function Step1BasicoScreen({ navigation }: any) {
  const { dados, atualizarDados } = useCadastro();
  
  const [nome, setNome] = useState(dados.nome);
  const [email, setEmail] = useState(dados.email);
  const [senha, setSenha] = useState(dados.senha);
  const [confirmaSenha, setConfirmaSenha] = useState('');

  const handleContinuar = () => {
    if (!nome || !email || !senha || !confirmaSenha) {
      return Alert.alert('Atenção', 'Preencha todos os campos para continuar.');
    }
    
    if (senha !== confirmaSenha) {
      return Alert.alert('Atenção', 'As senhas não coincidem. Digite novamente.');
    }

    if (senha.length < 6) {
      return Alert.alert('Segurança', 'Sua senha deve ter pelo menos 6 caracteres.');
    }
    
    atualizarDados({ nome, email, senha });
    navigation.navigate('Step2Seguranca');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.step}>Etapa 1 de 4</Text>
      <Text style={styles.title}>Dados Básicos</Text>

      <TextInput 
        style={styles.input} 
        placeholder="Nome Completo" 
        value={nome} 
        onChangeText={setNome} 
      />
      
      <TextInput 
        style={styles.input} 
        placeholder="E-mail" 
        keyboardType="email-address" 
        autoCapitalize="none" 
        value={email} 
        onChangeText={setEmail} 
      />

      <TextInput 
        style={styles.input} 
        placeholder="Senha (mínimo 6 caracteres)" 
        secureTextEntry 
        value={senha} 
        onChangeText={setSenha} 
      />
      
      <TextInput 
        style={styles.input} 
        placeholder="Confirme sua Senha" 
        secureTextEntry 
        value={confirmaSenha} 
        onChangeText={setConfirmaSenha} 
      />

      <TouchableOpacity style={styles.btnPrincipal} onPress={handleContinuar}>
        <Text style={styles.btnText}>Continuar</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btnVoltar} onPress={() => navigation.goBack()}>
        <Text style={styles.btnVoltarText}>Voltar</Text>
      </TouchableOpacity>
    </View>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 24, 
    backgroundColor: '#F9FAFB', 
    justifyContent: 'center' 
  },
  step: { 
    fontSize: 14, 
    color: '#3B82F6', 
    marginBottom: 8, 
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginBottom: 32, 
    color: '#111827' 
  },
  input: { 
    backgroundColor: '#FFF', 
    borderWidth: 1, 
    borderColor: '#D1D5DB', 
    borderRadius: 8, 
    padding: 16, 
    marginBottom: 16, 
    fontSize: 16 
  },
  btnPrincipal: { 
    backgroundColor: '#10B981', 
    padding: 16, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginTop: 16 
  },
  btnText: { 
    color: '#FFF', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  btnVoltar: { 
    padding: 16, 
    alignItems: 'center', 
    marginTop: 8 
  },
  btnVoltarText: { 
    color: '#6B7280', 
    fontSize: 16, 
    fontWeight: 'bold' 
  }
});