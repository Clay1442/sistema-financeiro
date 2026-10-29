import { useState, useEffect } from 'react'; 
import { View, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';

import { CadastroProvider } from './src/contexts/CadastroContext';

import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import Step1BasicoScreen from './src/screens/Step1BasicoScreen';
import Step2SegurancaScreen from './src/screens/Step2SegurancaScreen';
import Step3PerfilScreen from './src/screens/Step3PerfilScreen';
import Step4RevisaoScreen from './src/screens/Step4RevisaoScreen';
import EsqueciSenhaScreen from './src/screens/EsqueciSenhaScreen';

// Mock rápido do Dashboard para o App não quebrar ao finalizar o cadastro ou login
import { Text } from 'react-native';
function DashboardScreen({ navigation }: any) {
  const handleLogout = async () => {
    try {
      // 1. Apaga os dados de sessão salvos localmente no celular
      await SecureStore.deleteItemAsync('userToken');
      await SecureStore.deleteItemAsync('manterConectado');
      
      // 2. Redireciona o usuário para a tela Welcome e apaga o histórico de navegação
      navigation.reset({
        index: 0,
        routes: [{ name: 'Welcome' }],
      });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível fazer logout.');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 32 }}>Painel Principal</Text>
      
      {/* Botão de Logout Temporário */}
      <TouchableOpacity 
        onPress={handleLogout}
        style={{ 
          backgroundColor: '#EF4444', // Cor vermelha para indicar saída/alerta
          paddingVertical: 12, 
          paddingHorizontal: 24, 
          borderRadius: 8 
        }}
      >
        <Text style={{ color: '#FFF', fontSize: 16, fontWeight: 'bold' }}>
          Sair da Conta (Logout)
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const Stack = createNativeStackNavigator();

export default function App() {
  const [rotaInicial, setRotaInicial] = useState<'Welcome' | 'Dashboard' | null>(null);

  // 3. Verificação de "Manter Conectado"
  useEffect(() => {
    async function checarSessaoLocal() {
      try {
        const manterConectado = await SecureStore.getItemAsync('manterConectado');
        const token = await SecureStore.getItemAsync('userToken');
        
        // Se escolheu manter conectado e existe um token, pula direto pro Dashboard
        if (manterConectado === 'true' && token) {
          setRotaInicial('Dashboard');
        } else {
          setRotaInicial('Welcome');
        }
      } catch (error) {
        setRotaInicial('Welcome');
      }
    }
    checarSessaoLocal();
  }, []);

  // Exibe um loading enquanto o app verifica se o usuário já estava logado
  if (rotaInicial === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    // 4. O Provider abraça toda a navegação. Os dados sobrevivem à troca de telas!
    <CadastroProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName={rotaInicial}
          screenOptions={{ 
            headerShown: false, // Esconde o cabeçalho padrão para você criar o seu customizado
            animation: 'slide_from_right' // Animação moderna de transição (deslize)
          }} 
        >
          {/* Entradas do App */}
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="EsqueciSenha" component={EsqueciSenhaScreen} />

          {/* O Fluxo Wizard do Cadastro em Etapas */}
          <Stack.Screen name="Step1Basico" component={Step1BasicoScreen} />
          <Stack.Screen name="Step2Seguranca" component={Step2SegurancaScreen} />
          <Stack.Screen name="Step3Perfil" component={Step3PerfilScreen} />
          <Stack.Screen name="Step4Revisao" component={Step4RevisaoScreen} />

          {/* Área Logada (Onde as Tabs entrarão futuramente) */}
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </CadastroProvider>
  );
}