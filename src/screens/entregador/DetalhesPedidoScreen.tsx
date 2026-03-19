import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  Alert, Linking, Platform, Dimensions, ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function DetalhesPedidoScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { pedido } = route.params;
  const [loading, setLoading] = useState(false);

  const atualizarStatus = async (novoStatus: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('pedidos')
        .update({ status: novoStatus, entregador_id: user?.id })
        .eq('id', pedido.id);

      if (!error) {
        Alert.alert("Sucesso", "Status da entrega atualizado!");
        navigation.goBack();
      }
    } catch (err) {
      Alert.alert("Erro", "Não foi possível atualizar o status.");
    } finally {
      setLoading(false);
    }
  };

  const abrirMapa = () => {
    const endereco = pedido.endereco_entrega;
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(endereco)}`,
      android: `geo:0,0?q=${encodeURIComponent(endereco)}`,
    });
    Linking.openURL(url || '');
  };

  return (
    <View style={styles.container}>
        <StatusBar style="light" translucent backgroundColor="transparent" />
      {/* HEADER FIXO */}
      <LinearGradient colors={['#1A1A1A', '#0A0A0A']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#D4AF37" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerSubtitle}>DETALHES DO PEDIDO</Text>
          <Text style={styles.headerTitle}>#{String(pedido.numero_sequencial).padStart(4, '0')}</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* CARD DE ENDEREÇO */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="location" size={20} color="#D4AF37" />
            <Text style={styles.cardLabel}>ENDEREÇO DE ENTREGA</Text>
          </View>
          <Text style={styles.addressTxt}>{pedido.endereco_entrega || 'Retirada no Balcão'}</Text>

          {pedido.endereco_entrega && pedido.endereco_entrega !== 'Balcão' && (
            <TouchableOpacity style={styles.gpsButton} onPress={abrirMapa}>
              <LinearGradient colors={['#D4AF37', '#AA8A2E']} style={styles.gpsGradient}>
                <Ionicons name="navigate" size={20} color="#000" />
                <Text style={styles.gpsText}>INICIAR ROTA NO MAPS</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* CARD DE ITENS E VALOR */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="list" size={20} color="#D4AF37" />
            <Text style={styles.cardLabel}>RESUMO DO PEDIDO</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total do Pedido</Text>
            <Text style={styles.totalValue}>R$ {Number(pedido.valor_total).toFixed(2)}</Text>
          </View>
          <Text style={styles.ganhoSubtext}>Valor integral para o entregador</Text>
        </View>

        {/* CARD DE PAGAMENTO */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="wallet" size={20} color="#D4AF37" />
            <Text style={styles.cardLabel}>MÉTODO DE PAGAMENTO</Text>
          </View>
          <View style={styles.paymentBox}>
            <Text style={styles.paymentTxt}>{pedido.forma_pagamento || 'A definir'}</Text>
            <Ionicons name="checkmark-circle" size={20} color="#28A745" />
          </View>
        </View>
      </ScrollView>

      {/* BOTÃO DE AÇÃO FIXO NO RODAPÉ */}
      <View style={styles.footer}>
        <TouchableOpacity 
          activeOpacity={0.8}
          disabled={loading}
          style={styles.mainActionBtn}
          onPress={() => {
            if (pedido.status === 'aguardando_entregador') atualizarStatus('saiu_para_entrega');
            else if (pedido.status === 'saiu_para_entrega') atualizarStatus('entregador_no_local');
            else atualizarStatus('concluido');
          }}
        >
          <LinearGradient 
            colors={pedido.status === 'entregador_no_local' ? ['#28A745', '#1e7e34'] : ['#D4AF37', '#AA8A2E']} 
            style={styles.actionGradient}
          >
            {loading ? <ActivityIndicator color="#000" /> : (
              <Text style={styles.actionBtnText}>
                {pedido.status === 'aguardando_entregador' ? 'ACEITAR ENTREGA' : 
                 pedido.status === 'saiu_para_entrega' ? 'CONFIRMAR CHEGADA' : 'FINALIZAR ENTREGA'}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2c2c2c' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingTop: 60, 
    paddingBottom: 20, 
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: '#222'
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerInfo: { marginLeft: 10 },
  headerSubtitle: { color: '#666', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  headerTitle: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  scrollContent: { padding: 20, paddingBottom: 120 },
  infoCard: { 
    backgroundColor: '#111', 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#222'
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  cardLabel: { color: '#666', fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5 },
  addressTxt: { color: '#FFF', fontSize: 18, fontWeight: '500', lineHeight: 24 },
  gpsButton: { marginTop: 20, borderRadius: 12, overflow: 'hidden' },
  gpsGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 15 },
  gpsText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
  divider: { height: 1, backgroundColor: '#222', marginVertical: 15 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: '#BBB', fontSize: 16 },
  totalValue: { color: '#D4AF37', fontSize: 28, fontWeight: 'bold' },
  ganhoSubtext: { color: '#444', fontSize: 12, marginTop: 5 },
  paymentBox: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#1a1a1a', 
    padding: 15, 
    borderRadius: 12 
  },
  paymentTxt: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  footer: { 
    position: 'absolute', 
    bottom: 0, 
    width: '100%', 
    padding: 20, 
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderTopWidth: 1,
    borderColor: '#222'
  },
  mainActionBtn: { borderRadius: 18, overflow: 'hidden', height: 65 },
  actionGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  actionBtnText: { color: '#000', fontSize: 18, fontWeight: '900' }
});