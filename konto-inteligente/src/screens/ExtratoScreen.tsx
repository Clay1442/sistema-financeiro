import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';
import { AntDesign, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

type Filtro = 'TODAS' | 'ENTRADAS' | 'SAIDAS' | 'PENDENTES';

export default function ExtratoScreen({ route, navigation }: any) {
    const perfilId = route.params?.perfilId;

    const [transacoes, setTransacoes] = useState<any[]>([]);
    const [filtroAtivo, setFiltroAtivo] = useState<Filtro>('TODAS');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        carregarExtrato();
    }, [perfilId]);

    const carregarExtrato = async () => {
        setLoading(true);
        try {
            // 1. Busca as contas do perfil para filtrar
            const { data: contas, error: errContas } = await supabase
                .from('contas_bancarias')
                .select('id')
                .eq('perfil_id', perfilId);

            if (errContas) throw errContas;
            const idsContas = contas?.map(c => c.id) || [];

            if (idsContas.length > 0) {
                // 2. Busca todas as transações das contas
                const { data: transacoesData, error: errTrans } = await supabase
                    .from('transacoes')
                    .select(`
            id, descricao, valor, tipo, data_pagamento, status, url_comprovante,
            categorias (nome), contas_bancarias (nome)
          `)
                    .in('conta_id', idsContas)
                    .order('data_pagamento', { ascending: false });

                if (errTrans) throw errTrans;
                setTransacoes(transacoesData || []);
            }
        } catch (error: any) {
            Alert.alert('Erro ao carregar extrato', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAtualizarStatus = async (id: string | number, isReceita: boolean) => {
        const titulo = isReceita ? 'Confirmar Recebimento' : 'Confirmar Pagamento';
        const mensagem = isReceita ? 'Deseja marcar esta entrada como recebida?' : 'Deseja marcar esta conta como paga?';
        const textoBotao = isReceita ? 'Receber' : 'Pagar';

        Alert.alert(titulo, mensagem, [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: textoBotao,
                onPress: async () => {
                    try {
                        const { error } = await supabase
                            .from('transacoes')
                            .update({ status: 'PAGO' }) // 'PAGO' serve para ambos no banco, indicando que foi concluído
                            .eq('id', id);

                        if (error) throw error;
                        Alert.alert('Sucesso', 'Status atualizado com sucesso!');
                        carregarExtrato();
                    } catch (err: any) {
                        Alert.alert('Erro', err.message);
                    }
                }
            }
        ]);
    };

    const abrirComprovante = (url: string) => {
        Linking.openURL(url).catch(() => {
            Alert.alert('Erro', 'Não foi possível abrir o comprovante.');
        });
    };

    const getNomeRelacao = (relacao: any) => {
        if (!relacao) return 'Desconhecido';
        if (Array.isArray(relacao)) return relacao[0]?.nome || 'Desconhecido';
        return relacao.nome || 'Desconhecido';
    };

    const formatarMoeda = (valor: number) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formatarData = (dataStr: string) => {
        if (!dataStr) return '';
        const partes = dataStr.split('-');
        return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : dataStr;
    };

    // Aplicação do Filtro Visual
    const transacoesFiltradas = transacoes.filter(t => {
        if (filtroAtivo === 'ENTRADAS') return t.tipo === 'RECEITA';
        if (filtroAtivo === 'SAIDAS') return t.tipo === 'DESPESA';
        if (filtroAtivo === 'PENDENTES') return t.status === 'PENDENTE';
        return true; // TODAS
    });

    return (
        <SafeAreaView style={styles.container}>

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btnVoltar}>
                    <AntDesign name="left" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Extrato</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* TABS DE FILTRO */}
            <View style={styles.filtrosWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {(['TODAS', 'ENTRADAS', 'SAIDAS', 'PENDENTES'] as Filtro[]).map((filtro) => {
                        const isAtivo = filtroAtivo === filtro;
                        return (
                            <TouchableOpacity
                                key={filtro}
                                style={[styles.tab, isAtivo ? styles.tabActive : styles.tabInactive]}
                                onPress={() => setFiltroAtivo(filtro)}
                            >
                                <Text style={[styles.tabText, isAtivo ? styles.tabTextActive : styles.tabTextInactive]}>
                                    {filtro === 'ENTRADAS' ? 'Entradas' : filtro === 'SAIDAS' ? 'Saídas' : filtro === 'PENDENTES' ? 'Pendentes' : 'Todas'}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#1D4ED8" />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
                    {transacoesFiltradas.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="text-box-search-outline" size={48} color="#CBD5E1" />
                            <Text style={styles.emptyText}>Nenhuma transação encontrada.</Text>
                        </View>
                    ) : (
                        transacoesFiltradas.map((t) => {
                            const isReceita = t.tipo === 'RECEITA';
                            const isPendente = t.status === 'PENDENTE';

                            // Define as cores dinamicamente
                            const corTema = isPendente ? '#F59E0B' : (isReceita ? '#10B981' : '#EF4444');
                            const bgTema = isPendente ? '#FEF3C7' : (isReceita ? '#D1FAE5' : '#FEE2E2');
                            const icone: "clock-circle" | "up" | "down" = "clock-circle";

                            return (
                                <View key={t.id} style={[styles.card, isPendente && styles.cardPendente]}>
                                    <View style={styles.cardTop}>
                                        <View style={styles.infoLadoEsquerdo}>
                                            <View style={[styles.iconeBg, { backgroundColor: bgTema }]}>
                                                <AntDesign name={icone} size={16} color={corTema} />
                                            </View>
                                            <View style={styles.detalhesRow}>
                                                <Text style={styles.detalheTexto}>
                                                    {getNomeRelacao(t.categorias)} • {formatarData(t.data_pagamento)}
                                                </Text>
                                                {/* Alterado aqui de anexo_url para url_comprovante */}
                                                {t.url_comprovante && (
                                                    <TouchableOpacity onPress={() => abrirComprovante(t.url_comprovante)} style={styles.btnAnexo}>
                                                        <Feather name="paperclip" size={14} color="#3B82F6" />
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        </View>
                                        <View style={styles.infoLadoDireito}>
                                            <Text style={[styles.valor, { color: corTema }]}>
                                                {isReceita ? '+' : '-'} {formatarMoeda(Number(t.valor))}
                                            </Text>
                                            {isPendente && (
                                                <Text style={styles.tagPendente}>
                                                    {isReceita ? 'A Receber' : 'A Pagar'}
                                                </Text>
                                            )}
                                        </View>
                                    </View>

                                    {/* BOTÃO ATUALIZAR STATUS (Apenas se estiver pendente) */}
                                    {isPendente && (
                                        <TouchableOpacity
                                            style={styles.btnAtualizarStatus}
                                            onPress={() => handleAtualizarStatus(t.id, isReceita)}
                                        >
                                            <Text style={styles.btnAtualizarStatusText}>
                                                {isReceita ? 'Marcar como Recebido' : 'Marcar como Pago'}
                                            </Text>
                                            <AntDesign name="check-circle" size={16} color="#FFF" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            );
                        })
                    )}
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

    filtrosWrapper: { paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#FFF' },
    tab: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    tabActive: { backgroundColor: '#1D4ED8', borderColor: '#1D4ED8' },
    tabInactive: { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' },
    tabText: { fontSize: 13, fontWeight: '700' },
    tabTextActive: { color: '#FFF' },
    tabTextInactive: { color: '#64748B' },

    listContainer: { padding: 24, paddingBottom: 40 },
    emptyContainer: { alignItems: 'center', marginTop: 60 },
    emptyText: { color: '#94A3B8', fontSize: 15, marginTop: 12, fontWeight: '500' },

    card: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    cardPendente: { borderColor: '#FDE68A', borderWidth: 2 },

    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    infoLadoEsquerdo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    iconeBg: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },

    descricao: { fontSize: 16, fontWeight: 'bold', color: '#0F172A', marginBottom: 4 },
    detalhesRow: { flexDirection: 'row', alignItems: 'center' },
    detalheTexto: { fontSize: 12, color: '#64748B', fontWeight: '500' },
    btnAnexo: { marginLeft: 8, backgroundColor: '#EFF6FF', padding: 4, borderRadius: 12 },

    infoLadoDireito: { alignItems: 'flex-end', marginLeft: 12 },
    valor: { fontSize: 16, fontWeight: 'bold' },
    tagPendente: { fontSize: 10, fontWeight: 'bold', color: '#D97706', backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginTop: 4 },

    btnPagarAgora: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#1D4ED8', paddingVertical: 12, borderRadius: 12, marginTop: 16, gap: 8 },
    btnPagarAgoraText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },

    btnAtualizarStatus: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#1D4ED8', paddingVertical: 12, borderRadius: 12, marginTop: 16, gap: 8 },
    btnAtualizarStatusText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' }
});