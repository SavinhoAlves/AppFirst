import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, RefreshControl, Modal, ScrollView, Platform 
} from 'react-native';
import { supabase } from '../../services/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function MeusPedidosScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [pedidoParaRastrear, setPedidoParaRastrear] = useState<any>(null);
  const [modalRastreioVisible, setModalRastreioVisible] = useState(false);

  const fetchPedidos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('pedidos')
        .select('*') 
        .eq('socio_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPedidos(data || []);

      // Sincroniza o pedido aberto no modal com os novos dados do banco
      if (pedidoParaRastrear) {
        const pedidoFresco = data?.find(p => p.id === pedidoParaRastrear.id);
        if (pedidoFresco) {
          // Usamos spread para garantir que o React detecte a mudança de objeto e atualize a UI
          setPedidoParaRastrear({ ...pedidoFresco }); 
        }
      }
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPedidos();

    // Escuta mudanças na tabela de pedidos em tempo real
    const sub = supabase.channel('mudancas_pedidos_cliente')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'pedidos' }, 
        () => {
          fetchPedidos();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [pedidoParaRastrear?.id]);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pendente': 
        return { label: 'Recebido', color: '#D4AF37', step: 1, desc: 'Pedido confirmado' };
      case 'em_producao': 
        return { label: 'Preparando', color: '#D4AF37', step: 2, desc: 'Estamos na cozinha' }; 
      case 'aguardando_entregador': 
        return { label: 'Pronto', color: '#D4AF37', step: 2.5, desc: 'Aguardando entregador' }; 
      case 'saiu_para_entrega': 
        return { label: 'Em Rota', color: '#D4AF37', step: 3, desc: 'O entregador saiu' }; 
      case 'concluido': 
        return { label: 'Finalizado', color: '#28A745', step: 4, desc: 'Pedido entregue com sucesso!' };
      default: 
        return { label: 'Status', color: '#999', step: 0, desc: '' };
    }
  };

  const renderPedido = ({ item }: any) => {
    const statusInfo = getStatusInfo(item.status);
    const isDelivery = item.status === 'saiu_para_entrega';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.numeroPedido}>#{String(item.numero_sequencial).padStart(4, '0')}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label.toUpperCase()}</Text>
          </View>
        </View>

        <Text style={styles.resumoItens} numberOfLines={1}>
          {item.itens?.map((i: any) => i.nome).join(', ') || 'Nenhum item'}
        </Text>

        <View style={styles.divisor} />

        <View style={styles.footerPedido}>
          <Text style={styles.valorTotal}>R$ {Number(item.valor_total || 0).toFixed(2)}</Text>
          
          <TouchableOpacity 
            style={[styles.btnRastrear, isDelivery && styles.btnRastrearActive]}
            onPress={() => { setPedidoParaRastrear(item); setModalRastreioVisible(true); }}
          >
            <Ionicons name={isDelivery ? "bicycle" : "receipt-outline"} size={16} color={isDelivery ? "#FFF" : "#D4AF37"} />
            <Text style={[styles.btnRastrearText, isDelivery && { color: '#FFF' }]}>
              {isDelivery ? "Rastrear" : "Detalhes"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Minhas Compras</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={pedidos}
        keyExtractor={(item) => item.id}
        renderItem={renderPedido}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchPedidos} />}
        ListEmptyComponent={
          !loading ? <Text style={styles.emptyText}>Nenhum pedido encontrado.</Text> : <ActivityIndicator color="#D4AF37" />
        }
      />

      {/* MODAL DE RASTREIO - Removida a trava externa para permitir abrir sempre */}
      <Modal visible={modalRastreioVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            
            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalRastreioVisible(false)}>
              <Ionicons name="close-circle" size={32} color="#DDD" />
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.rastreioHeader}>
                <Text style={styles.rastreioSub}>Pedido #{String(pedidoParaRastrear?.numero_sequencial).padStart(4, '0')}</Text>
                <Text style={styles.rastreioTitle}>Acompanhamento</Text>
              </View>

              <View style={styles.timeline}>
                <TimelineStep 
                  title="Recebido" 
                  desc="Pedido confirmado" 
                  icon="checkmark-circle" 
                  active={getStatusInfo(pedidoParaRastrear?.status).step >= 1} 
                />
                <TimelineStep 
                  title="Preparando" 
                  desc="Na cozinha" 
                  icon="flame" 
                  active={getStatusInfo(pedidoParaRastrear?.status).step >= 2} 
                />
                <TimelineStep 
                  title="Em Rota" 
                  desc="Acompanhe pelo mapa" 
                  icon="bicycle" 
                  active={getStatusInfo(pedidoParaRastrear?.status).step >= 3} 
                />
                <TimelineStep 
                  title="Entregue" 
                  desc={pedidoParaRastrear?.status === 'concluido' ? "Obrigado pela preferência!" : "Aguardando chegada"} 
                  icon="star" 
                  active={getStatusInfo(pedidoParaRastrear?.status).step >= 4} 
                  isLast={true} 
                />
              </View>

              {pedidoParaRastrear?.status === 'concluido' && (
                <View style={styles.avisoSucesso}>
                  <Ionicons name="information-circle" size={16} color="#28A745" />
                  <Text style={styles.avisoSucessoText}>
                    Seu pedido foi finalizado. Se houver qualquer dúvida, entre em contato conosco.
                  </Text>
                </View>
              )}

              {/* BOTÃO DINÂMICO DE MAPA - Aparece se estiver em rota OU se já tiver um entregador atribuído */}
              {(pedidoParaRastrear?.status === 'saiu_para_entrega' || pedidoParaRastrear?.entregador_id) && pedidoParaRastrear?.status !== 'concluido' && (
                <TouchableOpacity 
                  style={styles.btnAbrirMapa}
                  onPress={() => {
                    setModalRastreioVisible(false);
                    navigation.navigate('MapaEntregaScreen', { pedidoId: pedidoParaRastrear.id });
                  }}
                >
                  <View style={styles.btnAbrirMapaContent}>
                    <Ionicons name="map" size={20} color="#1A1A1A" />
                    <Text style={styles.btnAbrirMapaText}>VER MOTORISTA NO MAPA</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#1A1A1A" />
                </TouchableOpacity>
              )}

              <View style={styles.resumoBox}>
                <Text style={styles.resumoTitle}>Itens do Pedido</Text>
                {pedidoParaRastrear?.itens?.map((item: any, idx: number) => {
                  const quantidade = Number(item.quantidade || 1);
                  const precoExibicao = Number(item.preco ?? item.preco_socio ?? item.valor ?? 0);
                  return (
                    <View key={idx} style={styles.itemLinha}>
                      <Text style={styles.itemText}>{quantidade}x {item.nome}</Text>
                      <Text style={styles.itemPrice}>R$ {(precoExibicao * quantidade).toFixed(2)}</Text>
                    </View>
                  );
                })}
                <View style={[styles.divisor, { marginVertical: 10 }]} />
                <View style={styles.itemLinha}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>R$ {Number(pedidoParaRastrear?.valor_total || 0).toFixed(2)}</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function TimelineStep({ title, desc, icon, active, isLast }: any) {
  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepLeft}>
        <View style={[styles.stepIcon, { backgroundColor: active ? '#D4AF37' : '#F0F0F0' }]}>
          <Ionicons name={icon} size={18} color={active ? '#FFF' : '#CCC'} />
        </View>
        {!isLast && <View style={[styles.stepLine, { backgroundColor: active ? '#D4AF37' : '#F0F0F0' }]} />}
      </View>
      <View style={styles.stepRight}>
        <Text style={[styles.stepTitle, { color: active ? '#1A1A1A' : '#AAA' }]}>{title}</Text>
        <Text style={styles.stepDesc}>{desc}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#1A1A1A' },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40 },
  card: { backgroundColor: '#FFF', borderRadius: 22, padding: 20, marginBottom: 16, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 10 }, android: { elevation: 3 } }) },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  numeroPedido: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800' },
  resumoItens: { color: '#888', fontSize: 13, marginBottom: 15 },
  divisor: { height: 1, backgroundColor: '#F5F5F5', marginBottom: 15 },
  footerPedido: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  valorTotal: { fontSize: 18, fontWeight: '900', color: '#1A1A1A' },
  btnRastrear: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#D4AF37' },
  btnRastrearActive: { backgroundColor: '#D4AF37', borderColor: '#D4AF37' },
  btnRastrearText: { color: '#D4AF37', fontWeight: '800', fontSize: 12, marginLeft: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 25, height: '85%' },
  modalHandle: { width: 40, height: 5, backgroundColor: '#EEE', borderRadius: 3, alignSelf: 'center', marginBottom: 15 },
  closeBtn: { position: 'absolute', right: 20, top: 20, zIndex: 10 },
  rastreioHeader: { marginBottom: 30, marginTop: 10 },
  rastreioSub: { fontSize: 13, fontWeight: '700', color: '#D4AF37', textTransform: 'uppercase' },
  rastreioTitle: { fontSize: 26, fontWeight: '900', color: '#1A1A1A' },
  timeline: { paddingLeft: 10, marginBottom: 20 },
  stepContainer: { flexDirection: 'row', height: 70 },
  stepLeft: { alignItems: 'center', marginRight: 15 },
  stepIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  stepLine: { width: 3, flex: 1, marginVertical: -5 },
  stepRight: { paddingTop: 2 },
  stepTitle: { fontSize: 16, fontWeight: '800' },
  stepDesc: { fontSize: 12, color: '#999', marginTop: 2 },
  btnAbrirMapa: { backgroundColor: '#D4AF37', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderRadius: 18, marginBottom: 25 },
  btnAbrirMapaContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  btnAbrirMapaText: { color: '#1A1A1A', fontWeight: '900', fontSize: 14 },
  resumoBox: { backgroundColor: '#F8F9FA', borderRadius: 20, padding: 20, marginBottom: 40 },
  resumoTitle: { fontSize: 14, fontWeight: '800', color: '#1A1A1A', marginBottom: 15 },
  itemLinha: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  itemText: { fontSize: 14, color: '#444', fontWeight: '600' },
  itemPrice: { fontSize: 14, color: '#888' },
  totalLabel: { fontSize: 16, fontWeight: '800' },
  totalValue: { fontSize: 18, fontWeight: '900', color: '#1A1A1A' },
  avisoSucesso: { backgroundColor: '#E8F5E9', padding: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 8 },
  avisoSucessoText: { color: '#2E7D32', fontSize: 12, fontWeight: '600', flex: 1},
});