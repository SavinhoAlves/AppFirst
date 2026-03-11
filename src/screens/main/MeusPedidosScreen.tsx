import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { supabase } from '../../services/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

export default function MeusPedidosScreen() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();

  useEffect(() => {
    carregarPedidos();

    // Configuração do canal de tempo real
    const channel = supabase
      .channel('pedidos_cliente')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pedidos',
        },
        (payload: any) => {
          // Lógica de Alerta para Mudança de Status
          if (payload.eventType === 'UPDATE') {
            const novoStatus = payload.new?.status;
            const statusAntigo = payload.old?.status;

            if (novoStatus === 'em_rota' && statusAntigo !== 'em_rota') {
              Alert.alert(
                "Pedido em Rota! 🚀", 
                "Seu pedido saiu para entrega. Acompanhe a localização do entregador no mapa!"
              );
            }
            
            if (novoStatus === 'pronto' && statusAntigo !== 'pronto') {
              Alert.alert("Pedido Pronto! ✅", "Seu pedido já pode ser retirado ou está aguardando o entregador.");
            }
          }
          
          // Recarrega a lista para garantir sincronia total
          carregarPedidos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const carregarPedidos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('socio_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) setPedidos(data);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderStatus = (status: string) => {
    const config: any = {
      pendente: { color: '#D4AF37', label: 'PREPARANDO', icon: 'time-outline' },
      pronto: { color: '#28A745', label: 'PRONTO', icon: 'checkmark-circle-outline' },
      em_rota: { color: '#007BFF', label: 'EM ROTA', icon: 'bicycle-outline' },
      entregue: { color: '#666', label: 'FINALIZADO', icon: 'archive-outline' }
    };
    const current = config[status] || config.pendente;

    return (
      <View style={[styles.badge, { backgroundColor: current.color + '20' }]}>
        <Ionicons name={current.icon} size={14} color={current.color} style={{ marginRight: 4 }} />
        <Text style={[styles.badgeText, { color: current.color }]}>{current.label}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="close" size={28} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.title}>Meus Pedidos</Text>
        <View style={{ width: 40 }} /> 
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      ) : (
        <FlatList
          data={pedidos}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyExtractor={item => item.id.toString()}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={80} color="#DDD" />
              <Text style={styles.emptyText}>Você ainda não fez nenhum pedido.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.pedidoId}>#{String(item.numero_sequencial).padStart(4, '0')}</Text>
                  <Text style={styles.dataPedido}>
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ptBR })}
                  </Text>
                </View>
                {renderStatus(item.status)}
              </View>
              
              <View style={styles.divisor} />
              
              <View style={styles.cardFooter}>
                <Text style={styles.mesaLabel}>Local: <Text style={{color: '#1A1A1A'}}>{item.mesa || 'Não informado'}</Text></Text>
                <Text style={styles.total}>R$ {item.valor_total.toFixed(2)}</Text>
              </View>

              {item.status === 'em_rota' && (
                <TouchableOpacity 
                  style={styles.btnMapa} 
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('MapaRastreioSocio', { pedidoId: item.id })}
                >
                  <Ionicons name="map" size={18} color="#FFF" />
                  <Text style={styles.btnMapaText}>ACOMPANHAR ENTREGA NO MAPA</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE'
  },
  backBtn: { padding: 5 },
  title: { fontSize: 20, fontWeight: '900', color: '#1A1A1A' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 22,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  pedidoId: { fontSize: 20, fontWeight: '900', color: '#1A1A1A' },
  dataPedido: { fontSize: 12, color: '#AAA', marginTop: 2 },
  badge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 6, 
    paddingHorizontal: 12, 
    borderRadius: 10 
  },
  badgeText: { fontSize: 11, fontWeight: '900' },
  divisor: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 15 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mesaLabel: { color: '#888', fontWeight: '600' },
  total: { fontSize: 18, fontWeight: '900', color: '#1A1A1A' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#999', marginTop: 20, fontSize: 16, fontWeight: '600' },
  btnMapa: {
    backgroundColor: '#1A1A1A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    marginTop: 15,
  },
  btnMapaText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 12,
    marginLeft: 8,
  },
});