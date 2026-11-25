import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';
import { AntDesign, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';

export default function EditarDadosScreen({ route, navigation }: any) {
    // Recebe via parâmetro se estamos a editar a Pessoa Física (PF) ou Jurídica (PJ)
    const { tipo, perfilId } = route.params;
    const isPF = tipo === 'PF';

    const [nome, setNome] = useState('');
    const [loading, setLoading] = useState(true);
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        setLoading(true);
        try {
            if (isPF) {
                // Se for PF, buscamos o nome principal do utilizador
                const userId = await SecureStore.getItemAsync('userToken');
                const { data, error } = await supabase
                    .from('usuarios')
                    .select('nome')
                    .eq('id', userId)
                    .single();

                if (error) throw error;
                if (data) setNome(data.nome);
            } else {
                // Se for PJ, buscamos o nome do perfil empresarial
                const { data, error } = await supabase
                    .from('perfis_financeiros')
                    .select('nome')
                    .eq('id', perfilId)
                    .single();

                if (error) throw error;
                if (data) setNome(data.nome);
            }
        } catch (err: any) {
            Alert.alert('Erro', 'Não foi possível carregar os dados.');
        } finally {
            setLoading(false);
        }
    };

    const handleSalvar = async () => {
        if (!nome.trim()) return Alert.alert('Atenção', 'O nome não pode estar vazio.');

        setSalvando(true);
        try {
            if (isPF) {
                const userId = await SecureStore.getItemAsync('userToken');
                const { error } = await supabase
                    .from('usuarios')
                    .update({ nome: nome.trim() })
                    .eq('id', userId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('perfis_financeiros')
                    .update({ nome: nome.trim() })
                    .eq('id', perfilId);
                if (error) throw error;
            }

            Alert.alert('Sucesso', 'Dados atualizados com sucesso!', [
                { text: 'Voltar', onPress: () => navigation.goBack() }
            ]);
        } catch (err: any) {
            Alert.alert('Erro ao salvar', err.message);
        } finally {
            setSalvando(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btnVoltar}>
                    <AntDesign name="left" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Editar Dados {isPF ? 'Pessoais' : 'da Empresa'}</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#1D4ED8" />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content}>

                    <View style={styles.infoBox}>
                        <Feather name="info" size={20} color="#3B82F6" style={{ marginRight: 12 }} />
                        <Text style={styles.infoText}>
                            Mantenha os seus dados atualizados para garantir o bom funcionamento da sua conta.
                        </Text>
                    </View>

                    <Text style={styles.label}>{isPF ? 'Nome Completo' : 'Nome da Empresa / Fantasia'}</Text>
                    <View style={styles.inputContainer}>
                        <Feather name={isPF ? "user" : "briefcase"} size={20} color="#64748B" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            value={nome}
                            onChangeText={setNome}
                            placeholder={isPF ? "Digite seu nome" : "Digite o nome da empresa"}
                            placeholderTextColor="#94A3B8"
                        />
                    </View>

                    {/* DICA: No futuro, pode adicionar aqui campos extra como CPF, CNPJ, Telefone criando as colunas no Supabase */}

                    <TouchableOpacity onPress={handleSalvar} disabled={salvando} style={{ marginTop: 32 }}>
                        <LinearGradient colors={['#0F172A', '#1D4ED8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnSalvar}>
                            {salvando ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnSalvarText}>Salvar Alterações</Text>}
                        </LinearGradient>
                    </TouchableOpacity>

                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    btnVoltar: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
    content: { padding: 24 },

    infoBox: { flexDirection: 'row', backgroundColor: '#EFF6FF', padding: 16, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: '#BFDBFE' },
    infoText: { flex: 1, color: '#1E3A8A', fontSize: 14, lineHeight: 20 },

    label: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 16, paddingHorizontal: 16, height: 56 },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, fontSize: 16, color: '#0F172A' },

    btnSalvar: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    btnSalvarText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});