import React, { useEffect, useState } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, StyleSheet, 
  ActivityIndicator, Platform, Linking 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

export default function HomeEntregador({ navigation }: any) {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  const fetchPedidos = async (silencioso = false) => {
    try {
      if (!silencioso) setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      // Master, verifique se na sua tabela 'pedidos' a coluna é 'user_id' ou 'cliente_id'
      // TESTE RÁPIDO: Veja se o card aparece com este select simplificado
      const { data, error } = await supabase
  .from('pedidos')
  .select(`
    *,
    profiles:socio_id (
      full_name,
      street
    )
  `)
  .order('created_at', { ascending: false });

// console.log("ERRO:", error);
// console.log("PEDIDOS:", data);
      
      if (!error) setPedidos(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPedidos();
    const canal = supabase.channel('pedidos-realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'pedidos' 
      }, () => fetchPedidos(true)) // <--- O "true" aqui é o fetch silencioso
      .subscribe();
    return () => { supabase.removeChannel(canal); };
  }, []);

  const abrirRota = (endereco: string) => {
    if (endereco === 'Endereço não informado') return;
    
    const url = Platform.select({
      ios: `maps:0,0?q=${endereco}`,
      android: `geo:0,0?q=${endereco}`,
    });
    if (url) Linking.openURL(url);
  };

  const aceitarCorrida = async (pedidoId: string) => {
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('pedidos')
      .update({
        entregador_id: user?.id,
        status: 'saiu_para_entrega'
      })
      .eq('id', pedidoId);

    if (error) {
      console.log('Erro ao aceitar corrida:', error);
    }
  };

  const renderCard = ({ item }: { item: any }) => {
    // Lógica robusta para pegar dados do pedido ou do perfil do cliente
    const enderecoExibicao = item.endereco_entrega || item.profiles?.endereco || 'Endereço não informado';
    const nomeExibicao = item.nome_cliente || item.profiles?.full_name || 'Cliente';
    const isDisponivel = item.status === 'aguardando_entregador';
    const podeAceitar =  item.status === 'aguardando_entregador' && !item.entregador_id;
    
    return (
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={() => navigation.navigate('DetalhesPedido', { pedido: item })}
      >
        <LinearGradient
          colors={isDisponivel ? ['#252525', '#1a1a1a'] : ['#1e1c15', '#121212']}
          style={[styles.card, isDisponivel && styles.cardDisponivelBorder]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.idContainer}>
              <Text style={styles.txtId}>#{String(item.numero_sequencial).padStart(4, '0')}</Text>
              <Text style={styles.txtTempo}>
                {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: isDisponivel ? '#D4AF37' : '#444' }]}>
              <Text style={[styles.statusText, { color: isDisponivel ? '#000' : '#FFF' }]}>
                {isDisponivel ? 'NOVA ENTREGA' : 'EM ANDAMENTO'}
              </Text>
            </View>
          </View>

          <View style={styles.destinationContainer}>
            <View style={styles.iconColumn}>
              <Ionicons name="person" size={16} color="#D4AF37" />
              <View style={styles.line} />
              <Ionicons name="location" size={20} color="#D4AF37" />
            </View>
            
            <View style={styles.addressInfo}>
              <Text style={styles.labelSmall}>CLIENTE</Text>
              <Text style={styles.txtCliente}>{nomeExibicao}</Text>
              
              <View style={{ height: 12 }} />

              <Text style={styles.labelSmall}>DESTINO</Text>
              <Text style={styles.txtAddress} numberOfLines={2}>
                {enderecoExibicao}
              </Text>
            </View>

            {/* BOTÃO DE ROTA USANDO A VARIÁVEL TRATADA */}
            {!isDisponivel && enderecoExibicao !== 'Endereço não informado' && (
              <TouchableOpacity 
                style={styles.mapBtn}
                onPress={() => abrirRota(enderecoExibicao)}
              >
                <Ionicons name="navigate-circle" size={44} color="#D4AF37" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.labelSmall}>VOCÊ RECEBE</Text>
              <Text style={styles.txtValor}>R$ {Number(item.valor_total).toFixed(2)}</Text>
            </View>
            {podeAceitar ? (
              <TouchableOpacity
                style={styles.btnAceitar}
                onPress={() => aceitarCorrida(item.id)}
              >
                <Text style={styles.txtAceitar}>Aceitar corrida</Text>
                <Ionicons name="checkmark-circle" size={18} color="#000" />
              </TouchableOpacity>
            ) : (
              <View style={styles.btnVerDetalhes}>
                <Text style={styles.txtVerDetalhes}>Ver Detalhes</Text>
                <Ionicons name="arrow-forward" size={16} color="#D4AF37" />
              </View>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" translucent />
      
      <View style={styles.mainHeader}>
        <View>
          <Text style={styles.welcome}>Olá, Entregador</Text>
          <Text style={styles.headerTitle}>Suas Entregas</Text>
        </View>
        <TouchableOpacity style={styles.profileBtn}>
          <LinearGradient colors={['#D4AF37', '#AA8A2E']} style={styles.profileGradient}>
            <Ionicons name="person" size={20} color="#000" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#D4AF37" size="large" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={pedidos}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="bicycle-outline" size={60} color="#333" />
              <Text style={styles.emptyText}>Buscando novos pedidos...</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

// Estilos mantidos com pequenos ajustes de espaçamento
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  mainHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 10, 
    marginBottom: 20 
  },
  welcome: { color: '#666', fontSize: 14, fontWeight: '500' },
  headerTitle: { color: '#414141', fontSize: 28, fontWeight: '900' },
  profileBtn: { width: 45, height: 45, borderRadius: 22.5, overflow: 'hidden' },
  profileGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: 20 },
  card: { 
    borderRadius: 24, 
    padding: 20, 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: '#333',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 10 } })
  },
  cardDisponivelBorder: { borderColor: '#D4AF37' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  idContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  txtId: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  txtTempo: { color: '#666', fontSize: 12 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: '900' },
  destinationContainer: { flexDirection: 'row', gap: 15, marginBottom: 20, alignItems: 'center' },
  iconColumn: { alignItems: 'center', justifyContent: 'center' },
  line: { width: 2, height: 20, backgroundColor: '#333', marginVertical: 4 },
  addressInfo: { flex: 1, justifyContent: 'center' },
  labelSmall: { color: '#666', fontSize: 10, fontWeight: 'bold', marginBottom: 2 },
  txtCliente: { color: '#FFF', fontSize: 17, fontWeight: 'bold' },
  txtAddress: { color: '#EEE', fontSize: 15, fontWeight: '500' },
  mapBtn: { paddingLeft: 10 },
  cardFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-end', 
    borderTopWidth: 1, 
    borderTopColor: '#333', 
    paddingTop: 15 
  },
  txtValor: { color: '#D4AF37', fontSize: 24, fontWeight: 'bold' },
  btnVerDetalhes: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  txtVerDetalhes: { color: '#D4AF37', fontWeight: 'bold', fontSize: 14 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#333', marginTop: 15, fontSize: 16 },

  btnAceitar: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  backgroundColor: '#D4AF37',
  paddingHorizontal: 14,
  paddingVertical: 8,
  borderRadius: 12
},

txtAceitar: {
  color: '#000',
  fontWeight: 'bold',
  fontSize: 14
},
});