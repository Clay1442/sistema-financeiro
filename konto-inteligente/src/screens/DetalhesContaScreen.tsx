import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';
import { AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function DetalhesContaScreen({ route, navigation }: any) {
    const { contaId, nomeConta, saldoConta } = route.params;

    const [transacoes, setTransacoes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        carregarTransacoesBanco();
    }, [contaId]);

    const carregarTransacoesBanco = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('transacoes')
                .select(`id, descricao, valor, tipo, data_pagamento, status, categorias (nome)`)
                .eq('conta_id', contaId)
                .order('data_pagamento', { ascending: false });

            if (error) throw error;
            setTransacoes(data || []);
        } catch (error: any) {
            Alert.alert('Erro', 'Não foi possível carregar as transações desta conta.');
        } finally {
            setLoading(false);
        }
    };

    const formatarMoeda = (valor: number) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formatarData = (dataStr: string) => {
        if (!dataStr) return '';
        const partes = dataStr.split('-');
        return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : dataStr;
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* CABEÇALHO */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btnVoltar}>
                    <AntDesign name="left" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detalhes da Conta</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

                {/* CARD DO BANCO */}
                <LinearGradient colors={['#1D4ED8', '#1E3A8A']} style={styles.bancoCard}>
                    <View style={styles.bancoHeader}>
                        <View style={styles.bancoIconBg}>
                            <MaterialCommunityIcons name="bank" size={24} color="#1D4ED8" />
                        </View>
                        <Text style={styles.bancoNome}>{nomeConta}</Text>
                    </View>
                    <Text style={styles.saldoLabel}>Saldo Atual</Text>
                    <Text style={styles.bancoSaldo}>{formatarMoeda(Number(saldoConta))}</Text>
                </LinearGradient>

                {/* LISTA DE TRANSAÇÕES DO BANCO */}
                <Text style={styles.sectionTitle}>Histórico desta conta</Text>

                {loading ? (
                    <ActivityIndicator size="large" color="#1D4ED8" style={{ marginTop: 40 }} />
                ) : transacoes.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="text-box-remove-outline" size={48} color="#CBD5E1" />
                        <Text style={styles.emptyText}>Nenhuma movimentação neste banco.</Text>
                    </View>
                ) : (
                    transacoes.map((t) => {
                        const isReceita = t.tipo === 'RECEITA';
                        const isPendente = t.status === 'PENDENTE';
                        const corTema = isPendente ? '#F59E0B' : (isReceita ? '#10B981' : '#EF4444');
                        const bgTema = isPendente ? '#FEF3C7' : (isReceita ? '#D1FAE5' : '#FEE2E2');
                        const icone = isPendente ? "clock-circle" : (isReceita ? "up" : "down");

                        return (
                            <View key={t.id} style={styles.transacaoItem}>
                                <View style={styles.transacaoInfo}>
                                    <View style={[styles.iconeBg, { backgroundColor: bgTema }]}>
                                        <AntDesign name={icone} size={16} color={corTema} />
                                    </View>

                                    {/* APLICADO flex: 1 AQUI PARA IMPEDIR INVASÃO DO LADO DIREITO */}
                                    <View style={{ flex: 1, paddingRight: 12 }}>
                                        <Text style={styles.descricao} numberOfLines={1}>
                                            {t.descricao}
                                        </Text>
                                        <Text style={styles.detalheTexto} numberOfLines={1}>
                                            {t.categorias?.nome || 'Desconhecido'} • {formatarData(t.data_pagamento)}
                                        </Text>
                                    </View>

                                </View>

                                <View style={styles.infoLadoDireito}>
                                    <Text style={[styles.valor, { color: corTema }]}>
                                        {isReceita ? '+' : '-'} {formatarMoeda(Number(t.valor))}
                                    </Text>
                                    {isPendente ? <Text style={styles.tagPendente}>Pendente</Text> : null}
                                </View>
                            </View>
                        );
                    })
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    btnVoltar: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
    content: { padding: 24, paddingBottom: 40 },

    bancoCard: { padding: 24, borderRadius: 24, marginBottom: 32 },
    bancoHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
    bancoIconBg: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    bancoNome: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
    saldoLabel: { color: '#93C5FD', fontSize: 14, fontWeight: '600', marginBottom: 8 },
    bancoSaldo: { color: '#FFFFFF', fontSize: 36, fontWeight: 'bold' },

    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A', marginBottom: 16 },
    emptyState: { alignItems: 'center', marginTop: 40 },
    emptyText: { color: '#94A3B8', fontSize: 15, marginTop: 12, fontWeight: '500' },

    transacaoItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
    transacaoInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 }, /* <-- O flex: 1 aqui é essencial */
    iconeBg: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    descricao: { fontSize: 16, fontWeight: 'bold', color: '#0F172A', marginBottom: 4 },
    detalheTexto: { fontSize: 12, color: '#64748B', fontWeight: '500' },

    infoLadoDireito: { alignItems: 'flex-end', marginLeft: 8, minWidth: 80 }, /* Adicionado minWidth para proteger o valor */
    valor: { fontSize: 16, fontWeight: 'bold' },
    tagPendente: { fontSize: 10, fontWeight: 'bold', color: '#D97706', backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginTop: 4 },
});