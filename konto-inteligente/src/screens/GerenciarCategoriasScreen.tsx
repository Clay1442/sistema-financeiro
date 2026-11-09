import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { supabase } from '../services/supabase';
import { AntDesign } from '@expo/vector-icons';

export default function GerenciarCategoriasScreen({ route, navigation }: any) {
  const { perfilId } = route.params;

  const [categorias, setCategorias] = useState<any[]>([]);
  const [nomeNovaCategoria, setNomeNovaCategoria] = useState('');
  const [tipoNovaCategoria, setTipoNovaCategoria] = useState<'RECEITA' | 'DESPESA'>('DESPESA');
  
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarCategorias();
  }, []);

  const carregarCategorias = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('id, nome, tipo')
        .eq('perfil_id', perfilId)
        .order('tipo', { ascending: true })
        .order('nome', { ascending: true });

      if (error) throw error;
      setCategorias(data || []);
    } catch (error: any) {
      Alert.alert('Erro ao buscar categorias', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdicionar = async () => {
    if (!nomeNovaCategoria.trim()) {
      return Alert.alert('Atenção', 'Digite um nome para a categoria.');
    }

    setSalvando(true);
    try {
      const { error } = await supabase
        .from('categorias')
        .insert([{
          perfil_id: perfilId,
          nome: nomeNovaCategoria.trim(),
          tipo: tipoNovaCategoria
        }]);

      if (error) throw error;

      setNomeNovaCategoria(''); // Limpa o campo
      carregarCategorias(); // Recarrega a lista

    } catch (error: any) {
      Alert.alert('Erro ao salvar', error.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async (id: string, nome: string) => {
    Alert.alert(
      'Excluir Categoria',
      `Tem certeza que deseja excluir "${nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('categorias').delete().eq('id', id);
              if (error) throw error;
              carregarCategorias();
            } catch (error: any) {
              Alert.alert('Erro ao excluir', 'Esta categoria pode estar vinculada a uma transação existente.');
            }
          } 
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btnVoltar}>
          <AntDesign name="left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Minhas Categorias</Text>
      </View>

      {/* Formulário para Adicionar */}
      <View style={styles.cardAdicionar}>
        <Text style={styles.label}>Nova Categoria</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Ex: Uber, Ração, Fornecedores..." 
          value={nomeNovaCategoria} 
          onChangeText={setNomeNovaCategoria} 
        />
        
        <View style={styles.rowTipos}>
          <TouchableOpacity 
            style={[styles.btnTipo, tipoNovaCategoria === 'RECEITA' && styles.btnReceita]}
            onPress={() => setTipoNovaCategoria('RECEITA')}
          >
            <Text style={[styles.txtTipo, tipoNovaCategoria === 'RECEITA' && { color: '#FFF' }]}>Receita</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.btnTipo, tipoNovaCategoria === 'DESPESA' && styles.btnDespesa]}
            onPress={() => setTipoNovaCategoria('DESPESA')}
          >
            <Text style={[styles.txtTipo, tipoNovaCategoria === 'DESPESA' && { color: '#FFF' }]}>Despesa</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.btnPrincipal} onPress={handleAdicionar} disabled={salvando}>
          {salvando ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Adicionar</Text>}
        </TouchableOpacity>
      </View>

      {/* Lista de Categorias Existentes */}
      <Text style={[styles.label, { marginTop: 24, marginBottom: 12 }]}>Categorias Cadastradas</Text>
      {loading ? (
        <ActivityIndicator color="#10B981" />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {categorias.map(cat => (
            <View key={cat.id} style={styles.categoriaItem}>
              <View style={styles.categoriaInfo}>
                <View style={[styles.dot, { backgroundColor: cat.tipo === 'RECEITA' ? '#10B981' : '#EF4444' }]} />
                <Text style={styles.categoriaNome}>{cat.nome}</Text>
              </View>
              <TouchableOpacity onPress={() => handleExcluir(cat.id, cat.nome)}>
                <AntDesign name="delete" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#F9FAFB', paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  btnVoltar: { marginRight: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  
  cardAdicionar: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  label: { fontSize: 16, color: '#4B5563', marginBottom: 8, fontWeight: '600' },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16 },
  
  rowTipos: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  btnTipo: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB', alignItems: 'center' },
  btnReceita: { backgroundColor: '#10B981', borderColor: '#10B981' }, 
  btnDespesa: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
  txtTipo: { fontSize: 14, fontWeight: 'bold', color: '#6B7280' },
  
  btnPrincipal: { backgroundColor: '#111827', padding: 12, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  categoriaItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#F3F4F6' },
  categoriaInfo: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  categoriaNome: { fontSize: 16, color: '#374151', fontWeight: '500' }
});