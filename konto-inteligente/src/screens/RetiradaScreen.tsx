import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';
import { AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function RetiradaScreen({ route, navigation }: any) {
    const { perfilPjId, perfilPfId, lucroAtual } = route.params;

    const sugestaoRetirada = lucroAtual > 0 ? lucroAtual * 0.5 : 0;

    const [valor, setValor] = useState(sugestaoRetirada > 0 ? sugestaoRetirada.toFixed(2) : '');
    const [contasPj, setContasPj] = useState<any[]>([]);
    const [contasPf, setContasPf] = useState<any[]>([]);
    const [contaOrigemId, setContaOrigemId] = useState<number | null>(null);
    const [contaDestinoId, setContaDestinoId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [processando, setProcessando] = useState(false);

    useEffect(() => {
        carregarContas();
    }, []);

    const carregarContas = async () => {
        try {
            // Busca Contas PJ (Origem)
            const { data: dataPj, error: errPj } = await supabase
                .from('contas_bancarias')
                .select('id, nome, saldo_atual')
                .eq('perfil_id', perfilPjId);
            if (errPj) throw errPj;
            setContasPj(dataPj || []);
            if (dataPj && dataPj.length > 0) setContaOrigemId(dataPj[0].id);

            // Busca Contas PF (Destino)
            const { data: dataPf, error: errPf } = await supabase
                .from('contas_bancarias')
                .select('id, nome, saldo_atual')
                .eq('perfil_id', perfilPfId);
            if (errPf) throw errPf;
            setContasPf(dataPf || []);
            if (dataPf && dataPf.length > 0) setContaDestinoId(dataPf[0].id);

        } catch (error: any) {
            Alert.alert('Erro ao carregar contas', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmar = async () => {
        const valorNum = parseFloat(valor.replace(',', '.'));

        if (isNaN(valorNum) || valorNum <= 0) {
            return Alert.alert('Atenção', 'Insira um valor válido para a retirada.');
        }
        if (!contaOrigemId) {
            return Alert.alert('Atenção', 'Selecione a conta da Empresa.');
        }
        if (!contaDestinoId) {
            return Alert.alert('Atenção', 'Selecione a sua Conta Pessoal. Se não tem nenhuma, volte e crie uma primeiro!');
        }

        setProcessando(true);
        try {
            const dataAtual = new Date().toISOString().split('T')[0];

            // --- 1. BUSCAR OU CRIAR A CATEGORIA PARA A DESPESA (PJ) ---
            let categoriaDespesaId = null;
            const { data: catDespesaExiste } = await supabase
                .from('categorias')
                .select('id')
                .eq('nome', 'Pró-labore')
                .eq('tipo', 'DESPESA')
                .eq('perfil_id', perfilPjId) // Filtra pelo perfil da Empresa
                .single();

            if (catDespesaExiste) {
                categoriaDespesaId = catDespesaExiste.id;
            } else {
                const { data: novaCatDespesa, error: errCatD } = await supabase
                    .from('categorias').insert([{
                        nome: 'Pró-labore',
                        tipo: 'DESPESA',
                        perfil_id: perfilPjId // Envia o ID do Perfil PJ
                    }]).select().single();
                if (errCatD) throw errCatD;
                categoriaDespesaId = novaCatDespesa.id;
            }

            // --- 2. BUSCAR OU CRIAR A CATEGORIA PARA A RECEITA (PF) ---
            let categoriaReceitaId = null;
            const { data: catReceitaExiste } = await supabase
                .from('categorias')
                .select('id')
                .eq('nome', 'Rendimento Empresarial')
                .eq('tipo', 'RECEITA')
                .eq('perfil_id', perfilPfId) // Filtra pelo perfil Pessoal
                .single();

            if (catReceitaExiste) {
                categoriaReceitaId = catReceitaExiste.id;
            } else {
                const { data: novaCatReceita, error: errCatR } = await supabase
                    .from('categorias').insert([{
                        nome: 'Rendimento Empresarial',
                        tipo: 'RECEITA',
                        perfil_id: perfilPfId // Envia o ID do Perfil PF
                    }]).select().single();
                if (errCatR) throw errCatR;
                categoriaReceitaId = novaCatReceita.id;
            }

            // --- 3. REGISTAR A SAÍDA NA EMPRESA (PJ) COM A CATEGORIA ---
            const { error: errDespesa } = await supabase.from('transacoes').insert([{
                conta_id: contaOrigemId,
                categoria_id: categoriaDespesaId, // Agora enviamos o ID
                tipo: 'DESPESA',
                descricao: 'Retirada de Pró-labore',
                valor: valorNum,
                data_vencimento: dataAtual,
                data_pagamento: dataAtual,
                status: 'PAGO'
            }]);
            if (errDespesa) throw errDespesa;

            // --- 4. REGISTAR A ENTRADA NA CONTA PESSOAL (PF) COM A CATEGORIA ---
            const { error: errReceita } = await supabase.from('transacoes').insert([{
                conta_id: contaDestinoId,
                categoria_id: categoriaReceitaId, // Agora enviamos o ID
                tipo: 'RECEITA',
                descricao: 'Recebimento de Pró-labore',
                valor: valorNum,
                data_vencimento: dataAtual,
                data_pagamento: dataAtual,
                status: 'PAGO'
            }]);
            if (errReceita) throw errReceita;

            // --- 5. ATUALIZAR SALDOS DAS CONTAS ---
            const contaOrigem = contasPj.find(c => c.id === contaOrigemId);
            const contaDestino = contasPf.find(c => c.id === contaDestinoId);

            await supabase.from('contas_bancarias').update({ saldo_atual: Number(contaOrigem.saldo_atual) - valorNum }).eq('id', contaOrigemId);
            await supabase.from('contas_bancarias').update({ saldo_atual: Number(contaDestino.saldo_atual) + valorNum }).eq('id', contaDestinoId);

            Alert.alert('Sucesso!', 'A sua retirada foi processada e o dinheiro já consta na sua conta pessoal.', [
                { text: 'Voltar ao Painel', onPress: () => navigation.goBack() }
            ]);

        } catch (err: any) {
            Alert.alert('Erro na transação', err.message);
        } finally {
            setProcessando(false);
        }
    };

    const formatarMoeda = (valor: number) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btnVoltar}>
                    <AntDesign name="close" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Minha Retirada</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color="#1D4ED8" /></View>
            ) : (
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                    <View style={styles.infoCard}>
                        <MaterialCommunityIcons name="lightbulb-on-outline" size={24} color="#D97706" style={{ marginBottom: 8 }} />
                        <Text style={styles.infoText}>
                            A sua empresa gerou {formatarMoeda(lucroAtual)} de lucro este mês.
                            Sugerimos retirar até 50% (<Text style={{ fontWeight: 'bold' }}>{formatarMoeda(sugestaoRetirada)}</Text>) como Pró-labore para manter o caixa saudável.
                        </Text>
                    </View>

                    <Text style={styles.label}>Valor da Retirada (R$)</Text>
                    <TextInput
                        style={styles.inputValor}
                        keyboardType="numeric"
                        value={valor.toString()}
                        onChangeText={setValor}
                        placeholder="0.00"
                        placeholderTextColor="#94A3B8"
                    />

                    <Text style={styles.label}>De onde vai sair? (Conta Empresa)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollContas}>
                        {contasPj.map(c => (
                            <TouchableOpacity key={c.id} style={[styles.cardConta, contaOrigemId === c.id && styles.cardContaAtivo]} onPress={() => setContaOrigemId(c.id)}>
                                <Text style={[styles.nomeConta, contaOrigemId === c.id && { color: '#1D4ED8' }]}>{c.nome}</Text>
                                <Text style={styles.saldoConta}>Saldo: {formatarMoeda(Number(c.saldo_atual))}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <Text style={styles.label}>Para onde vai? (Conta Pessoal)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollContas}>
                        {contasPf.map(c => (
                            <TouchableOpacity key={c.id} style={[styles.cardConta, contaDestinoId === c.id && styles.cardContaAtivo]} onPress={() => setContaDestinoId(c.id)}>
                                <Text style={[styles.nomeConta, contaDestinoId === c.id && { color: '#1D4ED8' }]}>{c.nome}</Text>
                                <Text style={styles.saldoConta}>Saldo: {formatarMoeda(Number(c.saldo_atual))}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <TouchableOpacity onPress={handleConfirmar} disabled={processando} style={{ marginTop: 24 }}>
                        <LinearGradient colors={['#0F172A', '#1D4ED8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGradient}>
                            {processando ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Confirmar Minha Retirada</Text>}
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
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#FFF' },
    btnVoltar: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
    content: { padding: 24, paddingBottom: 60 },
    infoCard: { backgroundColor: '#FEF3C7', padding: 16, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: '#FDE68A' },
    infoText: { color: '#92400E', fontSize: 14, lineHeight: 22 },
    label: { fontSize: 14, fontWeight: 'bold', color: '#0F172A', marginBottom: 8, marginTop: 16 },
    inputValor: { backgroundColor: '#FFF', fontSize: 32, fontWeight: '900', color: '#1D4ED8', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', textAlign: 'center', marginBottom: 8 },
    scrollContas: { flexDirection: 'row', paddingBottom: 8 },
    cardConta: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', marginRight: 12, minWidth: 160 },
    cardContaAtivo: { borderColor: '#1D4ED8', backgroundColor: '#EFF6FF', borderWidth: 2 },
    nomeConta: { fontSize: 14, fontWeight: 'bold', color: '#0F172A', marginBottom: 4 },
    saldoConta: { fontSize: 12, color: '#64748B' },
    btnGradient: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});