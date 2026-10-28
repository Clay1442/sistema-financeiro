import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useCadastro } from '../contexts/CadastroContext';

export default function Step2SegurancaScreen({ navigation }: any) {
  const { dados, atualizarDados } = useCadastro();
  
  const [pin, setPin] = useState(dados.pin);
  const [confirmaPin, setConfirmaPin] = useState(dados.pin);

  const handleContinuar = () => {
    if (!pin || pin.length < 4) {
      return Alert.alert('Atenção', 'O PIN deve ter 4 dígitos numéricos.');
    }
    if (pin !== confirmaPin) {
      return Alert.alert('Atenção', 'Os PINs digitados não são iguais.');
    }
    
    // Salva o PIN no contexto global
    atualizarDados({ pin });
    
    // Avança para a Etapa 3
    navigation.navigate('Step3Perfil');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.step}>Etapa 2 de 4</Text>
      <Text style={styles.title}>Segurança de Acesso</Text>

      <Text style={styles.infoText}>
        Crie um PIN de 4 dígitos. Ele será usado para acessar o aplicativo rapidamente no dia a dia.
      </Text>

      <View style={styles.biometriaCard}>
        <Text style={styles.biometriaTitle}>👆 Biometria (Opcional)</Text>
        <Text style={styles.biometriaDesc}>
          Se o seu dispositivo for compatível com impressão digital ou reconhecimento facial, você poderá ativá-lo no seu primeiro login para substituir a digitação do PIN.
        </Text>
      </View>

      <TextInput 
        style={styles.input} 
        placeholder="Digite seu PIN (4 dígitos)" 
        keyboardType="numeric" 
        maxLength={4}
        secureTextEntry
        value={pin} 
        onChangeText={setPin} 
      />
      
      <TextInput 
        style={styles.input} 
        placeholder="Confirme o seu PIN" 
        keyboardType="numeric" 
        maxLength={4}
        secureTextEntry
        value={confirmaPin} 
        onChangeText={setConfirmaPin} 
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
  container: { flex: 1, padding: 24, backgroundColor: '#F9FAFB', justifyContent: 'center' },
  step: { fontSize: 14, color: '#3B82F6', marginBottom: 8, fontWeight: 'bold', textTransform: 'uppercase' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 16, color: '#111827' },
  infoText: { fontSize: 16, color: '#4B5563', marginBottom: 24, lineHeight: 22 },
  biometriaCard: { backgroundColor: '#EFF6FF', padding: 16, borderRadius: 8, marginBottom: 24, borderWidth: 1, borderColor: '#BFDBFE' },
  biometriaTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E40AF', marginBottom: 8 },
  biometriaDesc: { fontSize: 14, color: '#1E3A8A', lineHeight: 20 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 16, marginBottom: 16, fontSize: 16, textAlign: 'center', letterSpacing: 10 },
  btnPrincipal: { backgroundColor: '#10B981', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 16 },
  btnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  btnVoltar: { padding: 16, alignItems: 'center', marginTop: 8 },
  btnVoltarText: { color: '#6B7280', fontSize: 16, fontWeight: 'bold' }
});