import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../../services/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import * as Location from 'expo-location';

export default function HomeEntregador({ navigation }: any) {
  const [pedidosParaEntrega, setPedidosParaEntrega] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPedidos = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    // Busca pedidos disponíveis OU pedidos que já estão em rota com este entregador
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .or(`status.eq.aguardando_entregador,and(entregador_id.eq.${user?.id},status.in.(saiu_para_entrega,entregador_no_local))`)
      .order('created_at', { ascending: true });
    
    if (!error) {
      setPedidosParaEntrega(data || []);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    Alert.alert("Sair", "Deseja realmente encerrar a sessão?", [
      { text: "Cancelar", style: "cancel" },
      { 
        text: "Sair", 
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          navigation.replace('Login'); 
        } 
      }
    ]);
  };

  // Função para abrir o GPS externo (Google Maps / Waze)
  const abrirNavegacaoGps = (destino: string) => {
    if (!destino) {
      Alert.alert("Erro", "Destino não encontrado.");
      return;
    }
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destino)}`;
    Linking.openURL(url);
  };

  useEffect(() => {
    let subscription: any;

    const iniciarRastreamento = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        async (location) => {
          const { latitude, longitude } = location.coords;
          const { data: { user } } = await supabase.auth.getUser();

          // 1. Procurar se este entregador tem um pedido ativo (em entrega ou no local)
          const { data: pedidoAtivo } = await supabase
            .from('pedidos')
            .select('id')
            .eq('entregador_id', user?.id)
            .in('status', ['saiu_para_entrega', 'entregador_no_local'])
            .maybeSingle();

          // 2. Se houver pedido ativo, envia a posição vinculada ao ID do pedido
          if (pedidoAtivo) {
            await supabase.from('localizacao_entregadores').upsert({
              pedido_id: pedidoAtivo.id, // VÍNCULO CRUCIAL
              entregador_id: user?.id,
              latitude,
              longitude,
              ultima_atualizacao: new Date().toISOString(),
            }, { onConflict: 'pedido_id' }); // Atualiza a posição baseada no pedido
          }
        }
      );
    };

    iniciarRastreamento();
    return () => subscription?.remove();
  }, []);

  const atualizarStatusPedido = async (id: string, novoStatus: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const updates: any = { status: novoStatus };
    
    if (novoStatus === 'saiu_para_entrega') {
      updates.entregador_id = user?.id;

      // 1. Pega posição atual do entregador
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      
      // 2. Cria o registro vinculado ao PEDIDO_ID (Crucial para o Sócio ver)
      await supabase.from('localizacao_entregadores').upsert({
        pedido_id: id, // O ID do pedido vindo do parâmetro
        entregador_id: user?.id,
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        ultima_atualizacao: new Date().toISOString(),
      }, { onConflict: 'pedido_id' });
    }

    const { error } = await supabase.from('pedidos').update(updates).eq('id', id);

    if (error) {
      Alert.alert("Erro", "Não foi possível atualizar o banco de dados.");
    } else {
      fetchPedidos();
    }
  } catch (err) {
    console.error("Erro Geral:", err);
  }
};

  const renderAcoes = (item: any) => {
    if (item.status === 'aguardando_entregador') {
      return (
        <TouchableOpacity 
          style={styles.btnAceitar} 
          onPress={() => atualizarStatusPedido(item.id, 'saiu_para_entrega')}
        >
          <Ionicons name="bicycle" size={20} color="#1A1A1A" />
          <Text style={styles.btnTxtAceitar}>ACEITAR CORRIDA</Text>
        </TouchableOpacity>
      );
    }

    if (item.status === 'saiu_para_entrega') {
      return (
        <View style={styles.actionsGroup}>
          <TouchableOpacity 
            style={styles.btnMapa}
            onPress={() => abrirNavegacaoGps(item.endereco_entrega || item.mesa)}
          >
            <Ionicons name="navigate-circle" size={24} color="#1A1A1A" />
            <Text style={styles.btnTxtMapa}>GPS</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.btnCheguei} 
            onPress={() => atualizarStatusPedido(item.id, 'entregador_no_local')}
          >
            <Text style={styles.btnTxtAceitar}>CHEGUEI</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (item.status === 'entregador_no_local') {
      return (
        <TouchableOpacity 
          style={styles.btnFinalizar} 
          onPress={() => {
            Alert.alert("Finalizar", "Confirmar entrega em mãos?", [
              { text: "Não", style: "cancel" },
              { text: "Sim", onPress: () => atualizarStatusPedido(item.id, 'concluido') }
            ]);
          }}
        >
          <Ionicons name="checkmark-circle" size={20} color="#FFF" />
          <Text style={styles.btnTxtFinalizar}>FINALIZAR ENTREGA</Text>
        </TouchableOpacity>
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Entregas</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={fetchPedidos} style={styles.iconBtn}>
            <Ionicons name="refresh" size={24} color="#D4AF37" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.iconBtn}>
            <Ionicons name="log-out-outline" size={26} color="#FF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? <ActivityIndicator size="large" color="#D4AF37" style={{ marginTop: 50 }} /> : (
        <FlatList
          data={pedidosParaEntrega}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 30 }}
          renderItem={({ item }) => (
            <View style={[
              styles.card, 
              item.status === 'aguardando_entregador' && styles.cardDisponivel
            ]}>
              <View style={styles.cardInfo}>
                <View style={styles.row}>
                  <Text style={styles.txtPedido}>Pedido #{String(item.numero_sequencial).padStart(4, '0')}</Text>
                  {item.status === 'aguardando_entregador' && (
                    <View style={styles.badge}><Text style={styles.badgeText}>DISPONÍVEL</Text></View>
                  )}
                </View>
                <Text style={styles.txtEnd}>
                  <Ionicons name="location" size={14} color="#BBB" /> {item.endereco_entrega || item.mesa || 'Retirada no Balcão'}
                </Text>
                <Text style={styles.txtValor}>R$ {Number(item.valor_total).toFixed(2)}</Text>
              </View>
              <View style={styles.actions}>
                {renderAcoes(item)}
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Nenhuma entrega pendente.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 20 },
  header: { color: '#D4AF37', fontSize: 24, fontWeight: 'bold' },
  headerButtons: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  iconBtn: { padding: 5 },
  card: { backgroundColor: '#1A1A1A', padding: 15, borderRadius: 12, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#444' },
  cardDisponivel: { borderLeftColor: '#D4AF37', backgroundColor: '#222' },
  cardInfo: { marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  txtPedido: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  txtEnd: { color: '#BBB', marginVertical: 4, fontSize: 14 },
  txtValor: { color: '#D4AF37', fontWeight: 'bold', fontSize: 14 },
  badge: { backgroundColor: '#D4AF37', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { color: '#1A1A1A', fontSize: 10, fontWeight: 'bold' },
  actions: { marginTop: 5 },
  actionsGroup: { flexDirection: 'row', gap: 10, width: '100%' },
  btnAceitar: { backgroundColor: '#D4AF37', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 8, gap: 8 },
  btnCheguei: { flex: 1.5, backgroundColor: '#D4AF37', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 8 },
  btnMapa: { flex: 1, backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 8, gap: 5 },
  btnTxtMapa: { color: '#1A1A1A', fontWeight: 'bold', fontSize: 13 },
  btnFinalizar: { backgroundColor: '#28A745', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 8, gap: 8 },
  btnTxtAceitar: { color: '#1A1A1A', fontWeight: '900', fontSize: 13 },
  btnTxtFinalizar: { color: '#FFF', fontWeight: '900', fontSize: 13 },
  empty: { color: '#666', textAlign: 'center', marginTop: 50 }
});