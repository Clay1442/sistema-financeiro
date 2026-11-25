import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign, Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useEffect } from 'react';

export default function PerfilScreen({ navigation }: any) {
    // Estados para os interruptores (toggles)
    const [usarBiometria, setUsarBiometria] = useState(false);
    const [ocultarSaldos, setOcultarSaldos] = useState(false);
    const [notificacoes, setNotificacoes] = useState(true);

    // 1. Carrega a preferência salva quando a tela abre
    useEffect(() => {
        const carregarConfiguracoes = async () => {
            const bioSalva = await SecureStore.getItemAsync('Konto_Biometria');
            if (bioSalva === 'true') setUsarBiometria(true);
        };
        carregarConfiguracoes();
    }, []);

    // 2. Função que valida e ativa/desativa a biometria
    const handleToggleBiometria = async (valorNovo: boolean) => {
        if (valorNovo) {
            // Tentar ligar
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            if (!hasHardware) return Alert.alert('Erro', 'O seu dispositivo não possui sensor biométrico.');

            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            if (!isEnrolled) return Alert.alert('Erro', 'Nenhuma biometria registada no seu telemóvel.');

            const auth = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Ative a biometria para o Konto',
                fallbackLabel: 'Usar senha do telemóvel',
            });

            if (auth.success) {
                setUsarBiometria(true);
                await SecureStore.setItemAsync('Konto_Biometria', 'true');
                Alert.alert('Sucesso', 'A biometria foi ativada. O Konto agora está protegido!');
            } else {
                setUsarBiometria(false);
            }
        } else {
            // Desligar
            setUsarBiometria(false);
            await SecureStore.deleteItemAsync('Konto_Biometria');
        }
    };

    // Componente reutilizável para cada linha do menu
    const MenuOption = ({ icone, iconeFam, cor, titulo, subtitulo, onPress, rightElement }: any) => (
        <TouchableOpacity style={styles.optionContainer} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
            <View style={[styles.iconBg, { backgroundColor: `${cor}15` }]}>
                {iconeFam === 'Feather' && <Feather name={icone} size={20} color={cor} />}
                {iconeFam === 'Material' && <MaterialCommunityIcons name={icone} size={20} color={cor} />}
                {iconeFam === 'Ionicons' && <Ionicons name={icone} size={20} color={cor} />}
            </View>
            <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>{titulo}</Text>
                {subtitulo && <Text style={styles.optionSubtitle}>{subtitulo}</Text>}
            </View>
            {rightElement || (onPress && <AntDesign name="right" size={16} color="#CBD5E1" />)}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btnVoltar}>
                    <AntDesign name="left" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Meu Perfil</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

                {/* CARD DO UTILIZADOR */}
                <View style={styles.userCard}>
                    <View style={styles.avatarLarge}>
                        <Text style={styles.avatarTextLarge}>U</Text>
                        <TouchableOpacity style={styles.btnEditAvatar}>
                            <Feather name="camera" size={12} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.userName}>Utilizador Konto</Text>
                    <Text style={styles.userEmail}>usuario@konto.com</Text>
                </View>

                {/* 1. GESTÃO DE IDENTIDADE */}
                <Text style={styles.sectionTitle}>Gestão de Identidade</Text>
                <View style={styles.cardGroup}>
                    <MenuOption
                        icone="user" iconeFam="Feather" cor="#1D4ED8"
                        titulo="Dados Pessoais (PF)" subtitulo="Nome completo"
                        onPress={() => navigation.navigate('EditarDados', { tipo: 'PF' })}
                    />
                    <MenuOption
                        icone="briefcase" iconeFam="Feather" cor="#D97706"
                        titulo="Dados da Empresa (PJ)" subtitulo="Nome da empresa"
                        // Nota: Vai precisar de passar o ID do perfil PJ real se quiser editar o nome do perfil. 
                        // Para simplificar, coloquei o ID 2 como exemplo, mas depois podemos ligar aos dados reais.
                        onPress={() => navigation.navigate('EditarDados', { tipo: 'PJ', perfilId: 2 })}
                    />
                </View>

                {/* 2. SEGURANÇA E ACESSO */}
                <Text style={styles.sectionTitle}>Segurança e Acesso</Text>
                <View style={styles.cardGroup}>
                    <MenuOption
                        icone="lock" iconeFam="Feather" cor="#059669"
                        titulo="Alterar Senha"
                        onPress={() => Alert.alert('Em breve', 'Fluxo de alteração de senha')}
                    />
                    <MenuOption
                        icone="fingerprint" iconeFam="Material" cor="#7C3AED"
                        titulo="Autenticação Biométrica" subtitulo="Exigir FaceID / Digital ao abrir"
                        rightElement={
                            <Switch
                                value={usarBiometria}
                                onValueChange={handleToggleBiometria}
                                trackColor={{ false: '#E2E8F0', true: '#7C3AED' }}
                            />
                        }
                    />
                    <MenuOption
                        icone="eye-off" iconeFam="Feather" cor="#475569"
                        titulo="Ocultar Valores por Padrão" subtitulo="Esconder saldos ao abrir o app"
                        rightElement={
                            <Switch
                                value={ocultarSaldos}
                                onValueChange={setOcultarSaldos}
                                trackColor={{ false: '#E2E8F0', true: '#1D4ED8' }}
                            />
                        }
                    />
                </View>

                {/* 3. GESTÃO FINANCEIRA AVANÇADA */}
                <Text style={styles.sectionTitle}>Gestão Financeira</Text>
                <View style={styles.cardGroup}>
                    <MenuOption
                        icone="tag" iconeFam="Feather" cor="#0284C7"
                        titulo="Gerenciar Categorias" subtitulo="Criar e editar categorias"
                        onPress={() => Alert.alert('Em breve', 'Tela de categorias')}
                    />
                    <MenuOption
                        icone="percent" iconeFam="Feather" cor="#EA580C"
                        titulo="Configurações de Pró-labore" subtitulo="Ajustar a % sugerida pelo app"
                        onPress={() => Alert.alert('Em breve', 'Ajuste de limite')}
                    />
                    <MenuOption
                        icone="file-document-outline" iconeFam="Material" cor="#2563EB"
                        titulo="Exportar Relatórios" subtitulo="Baixar extratos em PDF / CSV"
                        onPress={() => Alert.alert('Em breve', 'Módulo de exportação')}
                    />
                </View>

                {/* 4. SISTEMA */}
                <MenuOption
                    icone="trash-2" iconeFam="Feather" cor="#EF4444"
                    titulo="Encerrar Conta" subtitulo="Apagar todos os dados permanentemente"
                    onPress={() => Alert.alert(
                        'Atenção',
                        'Deseja mesmo encerrar sua conta? Esta ação é irreversível e apagará todos os seus dados.',
                        [
                            { text: 'Cancelar', style: 'cancel' },
                            {
                                text: 'Sim, encerrar',
                                style: 'destructive',
                                onPress: () => Alert.alert('Em breve', 'Lógica de exclusão no banco de dados será implementada aqui.')
                            }
                        ]
                    )}
                />

                <Text style={styles.versionText}>Konto App v1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    btnVoltar: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
    content: { padding: 24, paddingBottom: 60 },

    userCard: { alignItems: 'center', marginBottom: 32 },
    avatarLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    avatarTextLarge: { fontSize: 32, fontWeight: 'bold', color: '#1D4ED8' },
    btnEditAvatar: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#1D4ED8', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
    userName: { fontSize: 20, fontWeight: 'bold', color: '#0F172A' },
    userEmail: { fontSize: 14, color: '#64748B', marginTop: 4 },

    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase', marginBottom: 12, marginLeft: 8, marginTop: 8 },
    cardGroup: { backgroundColor: '#FFF', borderRadius: 20, paddingHorizontal: 16, marginBottom: 24, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },

    optionContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    iconBg: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    optionTextContainer: { flex: 1, paddingRight: 16 },
    optionTitle: { fontSize: 16, fontWeight: '600', color: '#0F172A' },
    optionSubtitle: { fontSize: 13, color: '#64748B', marginTop: 2 },

    versionText: { textAlign: 'center', color: '#94A3B8', fontSize: 12, marginTop: 16 }
});