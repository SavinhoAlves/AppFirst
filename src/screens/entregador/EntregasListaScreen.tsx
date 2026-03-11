import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../../services/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function EntregasListaScreen({ navigation }: any) {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarPedidos();
    
    // Realtime para novas entregas que surgirem
    const subscription = supabase
      .channel('lista_entregas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => {
        carregarPedidos();
      })
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, []);

  const carregarPedidos = async () => {
    // Busca pedidos PRONTOS (disponíveis) ou EM ROTA (já dele)
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .in('status', ['pronto', 'em_rota'])
      .order('created_at', { ascending: false });

    if (data) setPedidos(data);
    setLoading(false);
  };

  const iniciarEntrega = async (pedidoId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('pedidos')
      .update({ 
        status: 'em_rota', 
        entregador_id: user?.id 
      })
      .eq('id', pedidoId);

    if (!error) {
      Alert.alert("Sucesso", "Rota iniciada! O mapa agora está visível para o sócio.");
      // Aqui navegaremos para a tela de Mapa que criaremos a seguir
      // navigation.navigate('MapaEntrega', { pedidoId });
    }
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.pedidoId}>#{String(item.numero_sequencial).padStart(4, '0')}</Text>
        <View style={[styles.badge, { backgroundColor: item.status === 'em_rota' ? '#007BFF' : '#28A745' }]}>
          <Text style={styles.badgeText}>{item.status === 'em_rota' ? 'EM ROTA' : 'DISPONÍVEL'}</Text>
        </View>
      </View>

      <Text style={styles.address}><Ionicons name="location" size={14} /> Mesa/Local: {item.mesa}</Text>
      <Text style={styles.total}>Total: R$ {item.valor_total.toFixed(2)}</Text>

      {item.status === 'pronto' ? (
        <TouchableOpacity style={styles.btnAcao} onPress={() => iniciarEntrega(item.id)}>
          <Text style={styles.btnText}>COLETAR PEDIDO</Text>
          <Ionicons name="bicycle" size={20} color="#FFF" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          style={[styles.btnAcao, { backgroundColor: '#1A1A1A' }]}
          onPress={() => navigation.navigate('MapaEntrega', { pedidoId: item.id })}
        >
          <Text style={styles.btnText}>VER NO MAPA / FINALIZAR</Text>
          <Ionicons name="map-outline" size={20} color="#FFF" />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Painel do Entregador</Text>
      </View>

      {loading ? <ActivityIndicator size="large" color="#D4AF37" /> : (
        <FlatList
          data={pedidos}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={<Text style={styles.empty}>Nenhuma entrega pendente.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F4F4' },
  header: { padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE', paddingTop: 50 },
  title: { fontSize: 22, fontWeight: '900', color: '#1A1A1A' },
  card: { backgroundColor: '#FFF', padding: 15, borderRadius: 15, marginBottom: 15, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  pedidoId: { fontSize: 18, fontWeight: '800' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  address: { color: '#666', marginBottom: 5 },
  total: { fontWeight: 'bold', fontSize: 16, marginBottom: 15 },
  btnAcao: { 
    backgroundColor: '#28A745', 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 12, 
    borderRadius: 10 
  },
  btnText: { color: '#FFF', fontWeight: 'bold', marginRight: 10 },
  empty: { textAlign: 'center', marginTop: 50, color: '#999' }
});