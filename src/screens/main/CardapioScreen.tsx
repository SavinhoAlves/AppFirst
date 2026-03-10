import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CardapioScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [produtos, setProdutos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [carrinho, setCarrinho] = useState<any[]>([]);
  const [exibirBilhete, setExibirBilhete] = useState(false);
  const [mesa, setMesa] = useState('');
  const [proximoNumeroPedido, setProximoNumeroPedido] = useState<number>(1);
  const [enviando, setEnviando] = useState(false);

  // Estados de Filtro
  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todas');

  // 1. CARREGAR CACHE AO INICIAR
  useEffect(() => {
    const carregarCarrinhoSalvo = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem('@carrinho_cache');
        if (jsonValue != null) {
          setCarrinho(JSON.parse(jsonValue));
        }
      } catch (e) {
        console.error("Erro ao carregar cache", e);
      }
    };
    carregarCarrinhoSalvo();
  }, []);

  // 2. SALVAR CACHE SEMPRE QUE O CARRINHO MUDAR
  useEffect(() => {
    const salvarCarrinho = async () => {
      try {
        const jsonValue = JSON.stringify(carrinho);
        await AsyncStorage.setItem('@carrinho_cache', jsonValue);
      } catch (e) {
        console.error("Erro ao salvar cache", e);
      }
    };
    // Só salva se houver algo ou se o carrinho acabar de ser esvaziado manualmente
    salvarCarrinho();
  }, [carrinho]);

  useEffect(() => {
    fetchData();
    buscarProximoNumero();

    const subscription = supabase
      .channel('estoque_realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'produtos' },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, []);

  const fetchData = async () => {
    const { data: cats } = await supabase.from('categorias').select('*').order('ordem');
    if (cats) setCategorias([{ id: '0', nome: 'Todas' }, ...cats]);

    const { data: prods } = await supabase.from('produtos').select('*').eq('disponivel', true).order('nome');
    if (prods) setProdutos(prods);
  };

  const buscarProximoNumero = async () => {
    const { data } = await supabase
      .from('pedidos')
      .select('numero_sequencial')
      .order('numero_sequencial', { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      setProximoNumeroPedido(data[0].numero_sequencial + 1);
    } else {
      setProximoNumeroPedido(1);
    }
  };

  const produtosFiltrados = useMemo(() => {
    return produtos.filter(p => {
      const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase());
      const matchCat = categoriaAtiva === 'Todas' || p.categoria === categoriaAtiva;
      return matchBusca && matchCat;
    });
  }, [busca, categoriaAtiva, produtos]);

  const totalPedido = useMemo(() => {
    return carrinho.reduce((acc, item) => acc + (item.preco_socio * item.quantidade), 0);
  }, [carrinho]);

  const adicionarAoCarrinho = (produto: any) => {
    setCarrinho(prev => {
      const existe = prev.find(p => p.id === produto.id);
      if (existe) {
        return prev.map(p => p.id === produto.id ? { ...p, quantidade: p.quantidade + 1 } : p);
      }
      return [...prev, { ...produto, quantidade: 1 }];
    });
  };

  const removerItemDoCarrinho = (produtoId: string) => {
    setCarrinho(prev => {
      return prev.map(item => {
        if (item.id === produtoId) {
          return { ...item, quantidade: item.quantidade - 1 };
        }
        return item;
      }).filter(item => item.quantidade > 0);
    });
  };

  const finalizarPedido = async () => {
  if (enviando) return;
  setEnviando(true);

  try {
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('pedidos').insert([{
      itens: carrinho,
      valor_total: totalPedido,
      mesa: mesa || "Sem mesa",
      status: 'pendente',
      socio_id: user?.id,
    }]);

    if (error) throw error;

    // 1. Limpa o cache e o estado local
    await AsyncStorage.removeItem('@carrinho_cache');
    setCarrinho([]);
    setExibirBilhete(false);
    setMesa('');
    
    // 2. Exibe o alerta e redireciona ao clicar em OK
    Alert.alert(
      "Sucesso!", 
      "Pedido finalizado com sucesso.",
      [
        { 
          text: "OK", 
          onPress: () => navigation.navigate('MeusPedidosScreen' as never) // Substitua 'MeusPedidos' pelo nome real da sua rota
        }
      ]
    );
    
  } catch (err: any) {
    console.error("Erro ao finalizar:", err);
    Alert.alert("Erro", "Não foi possível finalizar o pedido: " + err.message);
  } finally {
    setEnviando(false);
  }
};

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cardápio</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('GestaoEstoque' as never)}
          style={styles.headerBtn}
        >
          <Ionicons name="construct-outline" size={24} color="#D4AF37" />
        </TouchableOpacity>
      </View>

      {/* BUSCA */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={{ marginRight: 10 }} />
        <TextInput
          placeholder="O que você deseja?"
          style={styles.searchInput}
          value={busca}
          onChangeText={setBusca}
        />
      </View>

      {/* CATEGORIAS */}
      <View style={{ height: 50, marginBottom: 10 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
          {categorias.map(cat => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setCategoriaAtiva(cat.nome)}
              style={[styles.chip, categoriaAtiva === cat.nome && styles.chipAtivo]}
            >
              <Text style={[styles.chipText, categoriaAtiva === cat.nome && styles.chipTextAtivo]}>
                {cat.nome}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={produtosFiltrados}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 150 }}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Text style={styles.nomeProd}>{item.nome}</Text>
              <Text style={styles.descProd} numberOfLines={2}>{item.descricao || "Disponível no balcão."}</Text>
              <Text style={styles.precoProd}>R$ {item.preco_socio.toFixed(2)}</Text>
            </View>
            <TouchableOpacity onPress={() => adicionarAoCarrinho(item)} style={styles.addBtn}>
              <Ionicons name="add" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}
      />

      {/* BILHETE / SACOLA */}
      {carrinho.length > 0 && (
        <View style={[styles.sacolaContainer, { bottom: insets.bottom > 0 ? insets.bottom + 10 : 20 }]}>
          {exibirBilhete ? (
            <View style={styles.bilhete}>
              <View style={styles.bilheteHeader}>
                <View>
                  <Text style={styles.bilheteTitle}>Meu Bilhete</Text>
                  {/* <Text style={styles.pedidoNumero}>PEDIDO Nº #{proximoNumeroPedido}</Text> */}
                </View>
                <TouchableOpacity onPress={() => setExibirBilhete(false)}>
                  <Ionicons name="chevron-down" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.inputMesa}
                placeholder={`PEDIDO Nº #${String(proximoNumeroPedido).padStart(4, '0')}`}
                keyboardType="numeric"
                value={mesa}
                onChangeText={setMesa}
              />

              <ScrollView style={{ maxHeight: 200 }}>
                {carrinho.map(item => (
                  <View key={item.id} style={styles.itemLinha}>
                    <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                        <Text style={styles.itemQtd}>{item.quantidade}x</Text>
                        <Text style={styles.itemNome} numberOfLines={1}>{item.nome}</Text>
                    </View>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.itemSubtotal}>R$ {(item.preco_socio * item.quantidade).toFixed(2)}</Text>
                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() => removerItemDoCarrinho(item.id)}
                      >
                        <Ionicons name="close-circle" size={22} color="#FF4D4F" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>

              <View style={styles.divisor} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>R$ {totalPedido.toFixed(2)}</Text>
              </View>

              <TouchableOpacity style={styles.finalizarBtn} onPress={finalizarPedido}>
                <Text style={styles.finalizarBtnText}>FINALIZAR PEDIDO</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.btnSacola} onPress={() => setExibirBilhete(true)}>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{carrinho.length}</Text>
                </View>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, height: 60 },
  headerBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#1A1A1A' },
  searchContainer: { flexDirection: 'row', backgroundColor: '#FFF', margin: 20, paddingHorizontal: 15, borderRadius: 15, height: 50, alignItems: 'center', elevation: 2 },
  searchInput: { flex: 1, fontSize: 14, color: '#333' },
  chip: { backgroundColor: '#EEE', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginRight: 10, height: 40, justifyContent: 'center' },
  chipAtivo: { backgroundColor: '#1A1A1A' },
  chipText: { color: '#666', fontWeight: '700' },
  chipTextAtivo: { color: '#D4AF37' },
  card: { flexDirection: 'row', backgroundColor: '#FFF', padding: 16, borderRadius: 20, marginBottom: 15, elevation: 3 },
  nomeProd: { fontSize: 16, fontWeight: '800' },
  descProd: { fontSize: 12, color: '#888', marginVertical: 4 },
  precoProd: { fontSize: 15, fontWeight: '900', color: '#D4AF37' },
  addBtn: { backgroundColor: '#1A1A1A', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  sacolaContainer: { position: 'absolute', left: 20, right: 20 },
  btnSacola: { backgroundColor: '#1A1A1A', borderRadius: 22, height: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  btnSacolaText: { color: '#FFF', fontWeight: '800', flex: 1, marginLeft: 15 },
  btnSacolaTotal: { color: '#D4AF37', fontWeight: '900' },
  badge: { backgroundColor: '#D4AF37', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#1A1A1A', fontWeight: '900' },
  bilhete: { backgroundColor: '#FFF', borderRadius: 30, padding: 25, elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.3, shadowRadius: 10 },
  bilheteHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  bilheteTitle: { fontSize: 20, fontWeight: '900' },
  pedidoNumero: { fontSize: 12, fontWeight: '800', color: '#D4AF37', marginTop: -2 },
  inputMesa: { backgroundColor: '#F5F5F5', padding: 15, borderRadius: 12, marginBottom: 30, textAlign: 'center', fontWeight: '900' },
  itemLinha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  itemQtd: { fontWeight: '900', color: '#D4AF37' },
  itemNome: { marginLeft: 10, color: '#333', fontWeight: '600' },
  itemSubtotal: { fontWeight: '700' },
  removeBtn: { marginLeft: 15 },
  divisor: { height: 1, backgroundColor: '#EEE', marginVertical: 15, marginTop: 30 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, marginTop: 10 },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#666' },
  totalValue: { fontSize: 22, fontWeight: '900' },
  finalizarBtn: { backgroundColor: '#1A1A1A', padding: 18, borderRadius: 15, alignItems: 'center' },
  finalizarBtnText: { color: '#FFF', fontWeight: '900' }
});