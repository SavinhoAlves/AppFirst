import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { supabase } from '../../services/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function CozinhaScreen() {
  const [pedidos, setPedidos] = useState<any[]>([]);

  useEffect(() => {
    fetchPedidosCozinha();

    const subscription = supabase
      .channel('cozinha_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => {
        fetchPedidosCozinha();
      })
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, []);

  const fetchPedidosCozinha = async () => {
  const { data } = await supabase
    .from('pedidos')
    .select('*')
    .neq('status', 'finalizado')
    .order('created_at', { ascending: true });

  if (data) {
    const categoriasCozinha = ['Comida', 'Petiscos', 'Porções', 'Lanches'];

    // Filtramos manualmente aqui
    const pedidosDeCozinha = data.map(pedido => ({
      ...pedido,
      itens: pedido.itens.filter((item: any) => 
        categoriasCozinha.includes(item.categoria)
      )
    })).filter(pedido => pedido.itens.length > 0);

    setPedidos(pedidosDeCozinha);
  }
};

  const alterarStatusCozinha = async (id: string, novoStatus: string) => {
    await supabase.from('pedidos').update({ status: novoStatus }).eq('id', id);
    fetchPedidosCozinha();
  };

  const formatarTempoCozinha = (dataISO: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(dataISO).getTime()) / 60000);
    return diff > 60 ? `+1h` : `${diff}m`;
  };

  const renderCardCozinha = ({ item }: any) => {
    const isPronto = item.status === 'pronto';

    return (
      <View style={[styles.card, isPronto && styles.cardPronto]}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.mesaTexto}>MESA {item.mesa}</Text>
            <Text style={styles.socioTexto}>{item.socio_nome || 'Cliente'}</Text>
          </View>
          <View style={styles.tempoBadge}>
            <Text style={styles.tempoTexto}>{formatarTempoCozinha(item.created_at)}</Text>
          </View>
        </View>

        <ScrollView style={styles.itensLista} showsVerticalScrollIndicator={false}>
          {item.itens.map((itemProd: any, index: number) => (
            <View key={index} style={styles.itemLinha}>
              <View style={styles.qtdBox}>
                <Text style={styles.qtdTexto}>{itemProd.quantidade}</Text>
              </View>
              <Text style={[styles.nomeProduto, isPronto && styles.textoRiscado]}>
                {itemProd.nome}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.cardFooter}>
          {!isPronto ? (
            <TouchableOpacity 
              style={styles.btnPronto} 
              onPress={() => alterarStatusCozinha(item.id, 'pronto')}
            >
              <Text style={styles.btnProntoTexto}>PRONTO PARA ENTREGA</Text>
              <Ionicons name="checkmark-circle" size={24} color="#000" />
            </TouchableOpacity>
          ) : (
            <View style={styles.statusProntoContainer}>
              <Text style={styles.statusProntoTexto}>AGUARDANDO RETIRADA</Text>
              <TouchableOpacity onPress={() => alterarStatusCozinha(item.id, 'preparando')}>
                <Text style={styles.reverterTexto}>Desfazer</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.title}>COZINHA CAPITANIA</Text>
          <Text style={styles.subtitle}>Pedidos de Alimentação</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countTexto}>{pedidos.length} EM PREPARO</Text>
        </View>
      </View>

      <FlatList
        data={pedidos}
        keyExtractor={(item) => item.id}
        renderItem={renderCardCozinha}
        numColumns={Platform.OS === 'web' ? 4 : 1}
        columnWrapperStyle={Platform.OS === 'web' ? styles.row : null}
        contentContainerStyle={styles.listPadding}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20 },
  topBar: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 25,
    borderBottomWidth: 2,
    borderBottomColor: '#1A1A1A',
    paddingBottom: 15
  },
  title: { color: '#FFF', fontSize: 32, fontWeight: '900', letterSpacing: 1 },
  subtitle: { color: '#D4AF37', fontSize: 14, fontWeight: 'bold' },
  countBadge: { backgroundColor: '#D4AF37', padding: 12, borderRadius: 10 },
  countTexto: { fontWeight: '900', color: '#000' },

  listPadding: { paddingBottom: 50 },
  row: { justifyContent: 'flex-start' },

  card: { 
    backgroundColor: '#111', 
    width: Platform.OS === 'web' ? '23.5%' : '100%', 
    margin: '0.7%',
    borderRadius: 20,
    padding: 20,
    height: 400,
    borderWidth: 2,
    borderColor: '#333'
  },
  cardPronto: { borderColor: '#4CAF50', backgroundColor: '#0A120A' },
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  mesaTexto: { color: '#FFF', fontSize: 30, fontWeight: '900' },
  socioTexto: { color: '#666', fontSize: 14, fontWeight: 'bold' },
  tempoBadge: { backgroundColor: '#1A1A1A', padding: 8, borderRadius: 8 },
  tempoTexto: { color: '#D4AF37', fontWeight: '900', fontSize: 16 },

  itensLista: { marginVertical: 20 },
  itemLinha: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  qtdBox: { backgroundColor: '#D4AF37', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 15 },
  qtdTexto: { color: '#000', fontWeight: '900', fontSize: 20 },
  nomeProduto: { color: '#EEE', fontSize: 20, fontWeight: '600', flex: 1 },
  textoRiscado: { textDecorationLine: 'line-through', color: '#444' },

  cardFooter: { marginTop: 'auto' },
  btnPronto: { 
    backgroundColor: '#D4AF37', 
    height: 60, 
    borderRadius: 15, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center',
    gap: 10 
  },
  btnProntoTexto: { fontWeight: '900', fontSize: 16, color: '#000' },
  
  statusProntoContainer: { alignItems: 'center', gap: 5 },
  statusProntoTexto: { color: '#4CAF50', fontWeight: '900', fontSize: 18 },
  reverterTexto: { color: '#666', fontSize: 12, textDecorationLine: 'underline' }
});