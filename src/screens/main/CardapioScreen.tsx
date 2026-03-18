import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CardapioScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const [produtos, setProdutos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [carrinho, setCarrinho] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [exibirBilhete, setExibirBilhete] = useState(false);
  const [mesa, setMesa] = useState('');
  const [proximoNumeroPedido, setProximoNumeroPedido] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todas');

  useEffect(() => {
    const inicializarDados = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        const [profileRes, catsRes, prodsRes] = await Promise.all([
          user ? supabase.from('profiles').select('*').eq('id', user.id).single() : null,
          supabase.from('categorias').select('*').order('ordem'),
          supabase.from('produtos').select('*').eq('disponivel', true).order('nome')
        ]);

        if (profileRes?.data) setUserProfile(profileRes.data);
        if (catsRes.data) setCategorias([{ id: '0', nome: 'Todas' }, ...catsRes.data]);
        if (prodsRes.data) setProdutos(prodsRes.data);

        await Promise.all([buscarProximoNumero(), carregarCarrinhoSalvo()]);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    inicializarDados();

    const subscription = supabase
      .channel('estoque_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'produtos' }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, []);

  useEffect(() => {
    const salvarCarrinho = async () => {
      try {
        await AsyncStorage.setItem('@carrinho_cache', JSON.stringify(carrinho));
      } catch (e) { console.error(e); }
    };
    salvarCarrinho();
  }, [carrinho]);

  const carregarCarrinhoSalvo = async () => {
    const jsonValue = await AsyncStorage.getItem('@carrinho_cache');
    if (jsonValue != null) setCarrinho(JSON.parse(jsonValue));
  };

  const fetchData = async () => {
    const { data: prods } = await supabase.from('produtos').select('*').eq('disponivel', true).order('nome');
    if (prods) setProdutos(prods);
  };

  const buscarProximoNumero = async () => {
    const { data } = await supabase.from('pedidos').select('numero_sequencial').order('numero_sequencial', { ascending: false }).limit(1);
    setProximoNumeroPedido(data && data.length > 0 ? data[0].numero_sequencial + 1 : 1);
  };

  const produtosFiltrados = useMemo(() => {
    return produtos.filter(p => (
      (categoriaAtiva === 'Todas' || p.categoria === categoriaAtiva) &&
      p.nome.toLowerCase().includes(busca.toLowerCase())
    ));
  }, [busca, categoriaAtiva, produtos]);

  const totalPedido = useMemo(() => carrinho.reduce((acc, item) => acc + (item.preco_socio * item.quantidade), 0), [carrinho]);

  const adicionarAoCarrinho = (produto: any) => {
    setCarrinho(prev => {
      const existe = prev.find(p => p.id === produto.id);
      if (existe) return prev.map(p => p.id === produto.id ? { ...p, quantidade: p.quantidade + 1 } : p);
      return [...prev, { ...produto, quantidade: 1 }];
    });
  };

  const removerItemDoCarrinho = (produtoId: string) => {
    setCarrinho(prev => prev.map(item => item.id === produtoId ? { ...item, quantidade: item.quantidade - 1 } : item).filter(i => i.quantidade > 0));
  };

  const finalizarPedido = async () => {
    if (enviando || carrinho.length === 0) return;
    setEnviando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.rpc('finalizar_pedido_transacional', {
        p_socio_id: user?.id,
        p_mesa: mesa || "Balcão",
        p_valor_total: totalPedido,
        p_itens: carrinho
      });

      if (error) throw error;

      await AsyncStorage.removeItem('@carrinho_cache');
      setCarrinho([]);
      setExibirBilhete(false);
      setMesa('');
      Alert.alert("Sucesso!", "Pedido enviado!", [{ text: "Ver Pedidos", onPress: () => navigation.navigate('MeusPedidosScreen') }]);
    } catch (err: any) {
      Alert.alert("Erro", err.message);
    } finally { setEnviando(false); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#D4AF37" /></View>;

  return (
    <View style={styles.container}>
      {/* OVERLAY: Camada escura que cobre a tela toda */}
      {exibirBilhete && (
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1} 
          onPress={() => setExibirBilhete(false)} 
        />
      )}

      <View style={[styles.mainContent, { paddingTop: insets.top }]}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cardápio Capitania</Text>
          
          {(userProfile?.role === 'admin' || userProfile?.role === 'master') ? (
            <TouchableOpacity onPress={() => navigation.navigate('GestaoEstoque')} style={styles.headerBtn}>
              <Ionicons name="construct-outline" size={22} color="#D4AF37" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 44 }} /> 
          )}
        </View>

        {/* BUSCA */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={{ marginRight: 10 }} />
          <TextInput placeholder="O que vamos pedir hoje?" style={styles.searchInput} value={busca} onChangeText={setBusca} />
        </View>

        {/* CATEGORIAS */}
        <View style={{ height: 50, marginBottom: 10 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
            {categorias.map(cat => (
              <TouchableOpacity key={cat.id} onPress={() => setCategoriaAtiva(cat.nome)} style={[styles.chip, categoriaAtiva === cat.nome && styles.chipAtivo]}>
                <Text style={[styles.chipText, categoriaAtiva === cat.nome && styles.chipTextAtivo]}>{cat.nome}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* LISTA */}
        <FlatList
          data={produtosFiltrados}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 150 }}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <Text style={styles.nomeProd}>{item.nome}</Text>
                <Text style={styles.descProd} numberOfLines={2}>{item.descricao || "Item fresco da casa."}</Text>
                <Text style={styles.precoProd}>R$ {item.preco_socio.toFixed(2)}</Text>
              </View>
              <TouchableOpacity onPress={() => adicionarAoCarrinho(item)} style={styles.addBtn}>
                <Ionicons name="add" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
          )}
        />
      </View>

      {/* FOOTER / BILHETE */}
      {carrinho.length > 0 && (
        <View style={[styles.sacolaContainer, { bottom: insets.bottom + 15 }]}>
          {exibirBilhete ? (
            <View style={styles.bilhete}>
              <View style={styles.bilheteHeader}>
                <View>
                  <Text style={styles.bilheteTitle}>Meu Bilhete</Text>
                  <Text style={styles.pedidoNumero}>PEDIDO Nº #{String(proximoNumeroPedido).padStart(4, '0')}</Text>
                </View>
                <TouchableOpacity onPress={() => setExibirBilhete(false)}>
                  <Ionicons name="chevron-down-circle" size={30} color="#1A1A1A" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.divisor} />
              
              <ScrollView style={{ maxHeight: 250 }}>
                {carrinho.map(item => (
                  <View key={item.id} style={styles.itemLinha}>
                    <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                        <Text style={styles.itemQtd}>{item.quantidade}x</Text>
                        <Text style={styles.itemNome} numberOfLines={1}>{item.nome}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.itemSubtotal}>R$ {(item.preco_socio * item.quantidade).toFixed(2)}</Text>
                      <TouchableOpacity onPress={() => removerItemDoCarrinho(item.id)} style={styles.removeBtn}>
                        <Ionicons name="remove-circle" size={24} color="#FF4D4F" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>

              <View style={styles.divisor} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total do Pedido</Text>
                <Text style={styles.totalValue}>R$ {totalPedido.toFixed(2)}</Text>
              </View>

              <TouchableOpacity style={[styles.finalizarBtn, enviando && { opacity: 0.6 }]} onPress={finalizarPedido} disabled={enviando}>
                {enviando ? <ActivityIndicator color="#FFF" /> : <Text style={styles.finalizarBtnText}>ENVIAR PEDIDO</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.btnSacola} onPress={() => setExibirBilhete(true)}>
                <View style={styles.badge}><Text style={styles.badgeText}>{carrinho.reduce((a, b) => a + b.quantidade, 0)}</Text></View>
                <Text style={styles.btnSacolaText}>Ver meu bilhete</Text>
                <Text style={styles.btnSacolaTotal}>R$ {totalPedido.toFixed(2)}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  mainContent: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 50,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, height: 60 },
  headerBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#1A1A1A', letterSpacing: -0.5 },
  searchContainer: { flexDirection: 'row', backgroundColor: '#FFF', margin: 20, paddingHorizontal: 15, borderRadius: 15, height: 54, alignItems: 'center', elevation: 4 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '600', color: '#333' },
  chip: { backgroundColor: '#E0E0E0', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, marginRight: 10, height: 38, justifyContent: 'center' },
  chipAtivo: { backgroundColor: '#1A1A1A' },
  chipText: { color: '#666', fontWeight: '800', fontSize: 12 },
  chipTextAtivo: { color: '#D4AF37' },
  card: { flexDirection: 'row', backgroundColor: '#FFF', padding: 16, borderRadius: 20, marginBottom: 15, marginHorizontal: 2, elevation: 3 },
  nomeProd: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  descProd: { fontSize: 12, color: '#999', marginVertical: 4, fontWeight: '500' },
  precoProd: { fontSize: 16, fontWeight: '900', color: '#D4AF37' },
  addBtn: { backgroundColor: '#1A1A1A', width: 44, height: 44, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  sacolaContainer: { position: 'absolute', left: 20, right: 20, zIndex: 100 },
  btnSacola: { backgroundColor: '#1A1A1A', borderRadius: 20, height: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, elevation: 10 },
  btnSacolaText: { color: '#FFF', fontWeight: '800', flex: 1, marginLeft: 15, fontSize: 16 },
  btnSacolaTotal: { color: '#D4AF37', fontWeight: '900', fontSize: 16 },
  badge: { backgroundColor: '#D4AF37', width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#1A1A1A', fontWeight: '900', fontSize: 12 },
  bilhete: { 
    backgroundColor: '#FFF', 
    borderRadius: 30, 
    padding: 25, 
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15 
  },
  bilheteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bilheteTitle: { fontSize: 22, fontWeight: '900', color: '#1A1A1A' },
  pedidoNumero: { fontSize: 11, fontWeight: '800', color: '#D4AF37' },
  itemLinha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  itemQtd: { fontWeight: '900', color: '#D4AF37', fontSize: 14 },
  itemNome: { marginLeft: 10, color: '#1A1A1A', fontWeight: '700', fontSize: 14 },
  itemSubtotal: { fontWeight: '800', color: '#333' },
  removeBtn: { marginLeft: 12 },
  divisor: { height: 1, backgroundColor: '#EEE', marginVertical: 15 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  totalLabel: { fontSize: 16, fontWeight: '800', color: '#999' },
  totalValue: { fontSize: 24, fontWeight: '900', color: '#1A1A1A' },
  finalizarBtn: { backgroundColor: '#1A1A1A', padding: 20, borderRadius: 18, alignItems: 'center' },
  finalizarBtnText: { color: '#FFF', fontWeight: '900', fontSize: 16, letterSpacing: 1 }
});