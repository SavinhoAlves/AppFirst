import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Switch, ActivityIndicator, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase';

export default function AdminProdutosScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'lista' | 'cadastro'>('lista');
  
  // Estados do Formulário de Produto
  const [editId, setEditId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('');
  const [precoSocio, setPrecoSocio] = useState('');
  const [precoNaoSocio, setPrecoNaoSocio] = useState('');
  
  // Estados de Categoria e Lista
  const [categorias, setCategorias] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  
  // Modais
  const [isCatModalVisible, setIsCatModalVisible] = useState(false);
  const [isActionModalVisible, setIsActionModalVisible] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<any>(null);
  const [novaCategoria, setNovaCategoria] = useState('');

  useEffect(() => {
  fetchData(); // Carga inicial

  // A MÁGICA DO REALTIME AQUI:
  const subscription = supabase
    .channel('estoque_realtime')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'produtos' }, 
      () => {
        console.log('Estoque mudou! Atualizando lista...');
        fetchData(); // Re-executa a busca automaticamente
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(subscription); };
}, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: cats } = await supabase.from('categorias').select('*').order('ordem');
      const { data: prods } = await supabase.from('produtos').select('*').order('created_at', { ascending: false });
      if (cats) setCategorias(cats);
      if (prods) setProdutos(prods);
    } catch (error) {
      console.error("Erro ao buscar:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async () => {
    if (!nome || !categoria || !precoSocio || !precoNaoSocio) {
      Alert.alert("Atenção", "Preencha os campos obrigatórios (*).");
      return;
    }

    setLoading(true);
    const dadosProduto = {
      nome,
      descricao,
      categoria,
      preco_socio: parseFloat(precoSocio.replace(',', '.')),
      preco_nao_socio: parseFloat(precoNaoSocio.replace(',', '.')),
      disponivel: editId ? produtoSelecionado.disponivel : true
    };

    const { error } = editId 
      ? await supabase.from('produtos').update(dadosProduto).eq('id', editId)
      : await supabase.from('produtos').insert([dadosProduto]);

    if (!error) {
      Alert.alert("Sucesso", editId ? "Produto atualizado!" : "Produto cadastrado!");
      limparFormulario();
      setView('lista');
      fetchData();
    } else {
      Alert.alert("Erro", error.message);
    }
    setLoading(false);
  };

  const handleSaveCategory = async () => {
    if (!novaCategoria.trim()) return;
    setLoading(true);
    const { error } = await supabase.from('categorias').insert([{ nome: novaCategoria.trim(), ordem: 0 }]);
    if (!error) {
      setNovaCategoria('');
      setIsCatModalVisible(false);
      fetchData();
    }
    setLoading(false);
  };

  const handleDeleteProduct = async (id: string) => {
    Alert.alert("Excluir", "Deseja remover este item permanentemente?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: async () => {
        const { error } = await supabase.from('produtos').delete().eq('id', id);
        if (!error) {
          setIsActionModalVisible(false);
          fetchData();
        }
      }}
    ]);
  };

  const prepararEdicao = (item: any) => {
    setEditId(item.id);
    setProdutoSelecionado(item);
    setNome(item.nome);
    setDescricao(item.descricao);
    setCategoria(item.categoria);
    setPrecoSocio(item.preco_socio.toString());
    setPrecoNaoSocio(item.preco_nao_socio.toString());
    setIsActionModalVisible(false);
    setView('cadastro');
  };

  const limparFormulario = () => {
    setEditId(null); setNome(''); setDescricao(''); setCategoria(''); setPrecoSocio(''); setPrecoNaoSocio('');
  };

  const toggleDisponibilidade = async (id: string, status: boolean) => {
    const { error } = await supabase.from('produtos').update({ disponivel: !status }).eq('id', id);
    if (!error) fetchData();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestão de Estoque</Text>
        <TouchableOpacity onPress={() => {
            if(view === 'cadastro') limparFormulario();
            setView(view === 'lista' ? 'cadastro' : 'lista');
          }} style={styles.toggleViewBtn}>
          <Ionicons name={view === 'lista' ? "add-circle" : "list-circle"} size={32} color="#D4AF37" />
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator color="#D4AF37" style={{ marginVertical: 10 }} />}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {view === 'cadastro' ? (
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>{editId ? 'EDITAR PRODUTO' : 'NOVO PRODUTO'}</Text>
            
            <Text style={styles.label}>NOME DO PRODUTO *</Text>
            <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Ex: Chopp Brahma" />

            <View style={styles.labelRow}>
              <Text style={styles.label}>CATEGORIA *</Text>
              <TouchableOpacity onPress={() => setIsCatModalVisible(true)}>
                <Text style={styles.addCatText}>+ Nova Categoria</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catGridContainer}>
              {categorias.map(c => (
                <TouchableOpacity 
                  key={c.id} 
                  style={[styles.catChip, categoria === c.nome && styles.catChipActive]}
                  onPress={() => setCategoria(c.nome)}
                >
                  <Text style={[styles.catChipText, categoria === c.nome && styles.catChipTextActive]}>{c.nome}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.label}>PREÇO SÓCIO *</Text>
                <TextInput style={styles.input} value={precoSocio} onChangeText={setPrecoSocio} keyboardType="numeric" placeholder="8.00" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>NÃO SÓCIO *</Text>
                <TextInput style={styles.input} value={precoNaoSocio} onChangeText={setPrecoNaoSocio} keyboardType="numeric" placeholder="12.00" />
              </View>
            </View>

            <Text style={styles.label}>DESCRIÇÃO</Text>
            <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={descricao} onChangeText={setDescricao} multiline placeholder="Ex: Tulipa 300ml gelada" />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProduct}>
              <Text style={styles.saveBtnText}>{editId ? 'ATUALIZAR' : 'SALVAR E INTEGRAR'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Text style={styles.sectionTitle}>DISPONIBILIDADE NO BAR</Text>
            {produtos.map(item => (
              <TouchableOpacity key={item.id} onPress={() => { setProdutoSelecionado(item); setIsActionModalVisible(true); }}>
                <View style={[styles.productCard, !item.disponivel && { opacity: 0.6 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.prodName}>{item.nome}</Text>
                    <Text style={styles.prodCategory}>{item.categoria.toUpperCase()}</Text>
                    <Text style={styles.prodPrice}>Sócio: R$ {item.preco_socio} | Não Sócio: R$ {item.preco_nao_socio}</Text>
                  </View>
                  <Switch 
                    value={item.disponivel} 
                    onValueChange={() => toggleDisponibilidade(item.id, item.disponivel)}
                    trackColor={{ true: '#2E7D32', false: '#767577' }}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* MODAL DE AÇÕES (EDITAR/EXCLUIR) */}
      <Modal visible={isActionModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.menuCard}>
            <Text style={styles.menuTitle}>{produtoSelecionado?.nome}</Text>
            <View style={styles.divisorMenu} />
            <TouchableOpacity style={styles.menuItem} onPress={() => prepararEdicao(produtoSelecionado)}>
              <View style={[styles.iconCircle, { backgroundColor: '#F0F9FF' }]}>
                <Ionicons name="create-outline" size={20} color="#007AFF" />
              </View>
              <Text style={styles.menuItemText}>Editar Informações</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleDeleteProduct(produtoSelecionado?.id)}>
              <View style={[styles.iconCircle, { backgroundColor: '#FFF1F0' }]}>
                <Ionicons name="trash-outline" size={20} color="#FF4D4F" />
              </View>
              <Text style={[styles.menuItemText, { color: '#FF4D4F' }]}>Remover do Estoque</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={() => setIsActionModalVisible(false)}>
              <View style={styles.iconCircle}>
                <Ionicons name="close-outline" size={20} color="#666" />
              </View>
              <Text style={[styles.menuItemText, { color: '#666' }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL DE CATEGORIA (ESTILIZADO) */}
      <Modal visible={isCatModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.menuCard}>
            <Text style={styles.menuTitle}>Nova Categoria</Text>
            <Text style={[styles.label, { textAlign: 'center', marginBottom: 15 }]}>DEFINA O NOME DO GRUPO</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Ex: Porções, Destilados..." 
              value={novaCategoria} 
              onChangeText={setNovaCategoria} 
              autoFocus
            />
            <View style={styles.row}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#F5F5F5' }]} onPress={() => setIsCatModalVisible(false)}>
                <Text style={{ fontWeight: '700', color: '#666' }}>Sair</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#1A1A1A' }]} onPress={handleSaveCategory}>
                <Text style={{ fontWeight: '700', color: '#D4AF37' }}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#FFF', elevation: 4 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#1A1A1A' },
  content: { padding: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '900', color: '#666', marginBottom: 20, letterSpacing: 1 },
  form: { backgroundColor: '#FFF', padding: 20, borderRadius: 20, elevation: 2 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  addCatText: { fontSize: 11, color: '#D4AF37', fontWeight: 'bold' },
  label: { fontSize: 10, fontWeight: '800', color: '#999', marginBottom: 5 },
  input: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 14, marginBottom: 18, fontSize: 16 },
  row: { flexDirection: 'row' },
  catGridContainer: { marginBottom: 18 },
  catChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 25, backgroundColor: '#F0F0F0', marginRight: 10 },
  catChipActive: { backgroundColor: '#1A1A1A' },
  catChipText: { fontSize: 13, color: '#666', fontWeight: '600' },
  catChipTextActive: { color: '#D4AF37', fontWeight: '800' },
  saveBtn: { backgroundColor: '#1A1A1A', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#FFF', fontWeight: '900' },
  productCard: { flexDirection: 'row', backgroundColor: '#FFF', padding: 18, borderRadius: 18, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: '#EEE' },
  prodName: { fontWeight: '800', fontSize: 16 },
  prodCategory: { fontSize: 9, color: '#D4AF37', fontWeight: '900' },
  prodPrice: { fontSize: 12, color: '#666', marginTop: 6 },
  
  // Estilos do Modal Flutuante
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  menuCard: { backgroundColor: '#FFF', borderRadius: 25, width: '100%', padding: 20, elevation: 20 },
  menuTitle: { fontSize: 18, fontWeight: '900', color: '#1A1A1A', textAlign: 'center', marginBottom: 10 },
  divisorMenu: { height: 1, backgroundColor: '#EEE', marginBottom: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F9F9F9' },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuItemText: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  modalBtn: { flex: 1, padding: 15, borderRadius: 15, alignItems: 'center', marginHorizontal: 5 },
  
  backBtn: { padding: 5 },
  toggleViewBtn: { padding: 5 }
});