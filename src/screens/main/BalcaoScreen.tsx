import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Platform, Animated } from 'react-native';
import { supabase } from '../../services/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function BalcaoScreen() {
  const [pedidos, setPedidos] = useState<any[]>([]);

  const playAlertSound = () => {
    if (Platform.OS === 'web') {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(() => {});
    }
  };

  useEffect(() => {
    fetchPedidos();
    const subscription = supabase
      .channel('balcao_premium')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, (payload) => {
        if (payload.eventType === 'INSERT') playAlertSound();
        fetchPedidos();
      })
      .subscribe();
    return () => { supabase.removeChannel(subscription); };
  }, []);

  const fetchPedidos = async () => {
    const { data } = await supabase
      .from('pedidos')
      .select('*')
      .neq('status', 'finalizado')
      .order('created_at', { ascending: true });
    if (data) setPedidos(data);
  };

  const atualizarStatus = async (id: string, novoStatus: string) => {
    await supabase.from('pedidos').update({ status: novoStatus }).eq('id', id);
  };

  const renderPedidoCard = ({ item }: any) => {
    const isPrep = item.status === 'preparando';
    
    return (
      <View style={[styles.pedidoCard, isPrep && styles.cardPrep]}>
        <View style={[styles.statusTag, { backgroundColor: isPrep ? '#007AFF' : '#D4AF37' }]}>
          <Text style={styles.statusTagText}>{item.status.toUpperCase()}</Text>
        </View>

        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.mesaLabel}>MESA</Text>
            <Text style={styles.mesaNumero}>{item.mesa}</Text>
          </View>
          <Text style={styles.horaText}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        <View style={styles.divisor} />

        <ScrollView style={styles.itensArea} showsVerticalScrollIndicator={true}>
          {item.itens.map((prod: any, idx: number) => (
            <View key={idx} style={styles.itemLinha}>
              <View style={styles.qtdBadge}>
                <Text style={styles.qtdText}>{prod.quantidade}</Text>
              </View>
              <Text style={styles.itemNome}>{prod.nome}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.cardFooter}>
          <View style={styles.footerInfo}>
            <Text style={styles.totalLabel}>TOTAL DO PEDIDO</Text>
            <Text style={styles.totalValor}>R$ {item.valor_total.toFixed(2)}</Text>
          </View>
          
          <View style={styles.buttonGroup}>
            {item.status === 'pendente' ? (
              <TouchableOpacity 
                style={[styles.actionBtn, styles.btnStart]} 
                onPress={() => atualizarStatus(item.id, 'preparando')}
              >
                <Ionicons name="play" size={24} color="#FFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.actionBtn, styles.btnDone]} 
                onPress={() => atualizarStatus(item.id, 'finalizado')}
              >
                <Ionicons name="checkmark-done" size={24} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <Text style={styles.logoText}>CAPITANIA</Text>
        <View style={styles.statsBox}>
          <Text style={styles.statsNumber}>{pedidos.length}</Text>
          <Text style={styles.statsLabel}>PEDIDOS EM ABERTO</Text>
        </View>
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor: '#D4AF37'}]}/><Text style={styles.legendText}>Pendente</Text></View>
          <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor: '#007AFF'}]}/><Text style={styles.legendText}>Em Preparo</Text></View>
        </View>
      </View>

      <View style={styles.mainContent}>
        <FlatList
          data={pedidos}
          keyExtractor={(item) => item.id}
          renderItem={renderPedidoCard}
          numColumns={Platform.OS === 'web' ? 4 : 1}
          columnWrapperStyle={Platform.OS === 'web' ? styles.gridRow : null}
          contentContainerStyle={styles.listPadding}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080808', flexDirection: 'row' },
  
  // SIDEBAR ESTILO DASHBOARD
  sidebar: { width: 220, backgroundColor: '#111', padding: 25, borderRightWidth: 1, borderRightColor: '#222', alignItems: 'center' },
  logoText: { color: '#D4AF37', fontSize: 22, fontWeight: '900', letterSpacing: 2, marginBottom: 40 },
  statsBox: { alignItems: 'center', backgroundColor: '#1A1A1A', padding: 20, borderRadius: 20, width: '100%', marginBottom: 30 },
  statsNumber: { color: '#FFF', fontSize: 42, fontWeight: '900' },
  statsLabel: { color: '#666', fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
  legendContainer: { width: '100%', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: '#AAA', fontSize: 12 },

  // ÁREA PRINCIPAL
  mainContent: { flex: 1, padding: 20 },
  gridRow: { justifyContent: 'flex-start' },
  listPadding: { paddingBottom: 40 },

  // CARD ESTILO KDS
  pedidoCard: { 
    backgroundColor: '#1A1A1A', 
    width: '23.5%', 
    margin: '0.7%', 
    borderRadius: 24, 
    padding: 20, 
    height: 380, // Altura fixa para manter o grid simétrico
    borderWidth: 1,
    borderColor: '#333',
    justifyContent: 'space-between'
  },
  cardPrep: { borderColor: '#007AFF', backgroundColor: '#121721' },
  statusTag: { position: 'absolute', top: -10, right: 20, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  statusTagText: { color: '#000', fontSize: 10, fontWeight: '900' },
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  mesaLabel: { color: '#666', fontSize: 10, fontWeight: '900' },
  mesaNumero: { color: '#FFF', fontSize: 36, fontWeight: '900', marginTop: -5 },
  horaText: { color: '#444', fontSize: 14, fontWeight: 'bold' },
  
  divisor: { height: 1, backgroundColor: '#222', marginVertical: 15 },
  
  itensArea: { flex: 1 },
  itemLinha: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  qtdBadge: { backgroundColor: '#222', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 12 },
  qtdText: { color: '#D4AF37', fontWeight: '900', fontSize: 14 },
  itemNome: { color: '#DDD', fontSize: 15, fontWeight: '500', flex: 1 },

  cardFooter: { borderTopWidth: 1, borderTopColor: '#222', paddingTop: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerInfo: { flex: 1 },
  totalLabel: { color: '#555', fontSize: 9, fontWeight: '900' },
  totalValor: { color: '#D4AF37', fontSize: 18, fontWeight: '900' },
  
  buttonGroup: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  btnStart: { backgroundColor: '#D4AF37' },
  btnDone: { backgroundColor: '#4CAF50' }
});