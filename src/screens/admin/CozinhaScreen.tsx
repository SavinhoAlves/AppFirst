import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Platform, Pressable } from 'react-native';
import { supabase } from '../../services/supabase';
import { Ionicons } from '@expo/vector-icons';

const NOTIFICATION_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
const audioAlerta = Platform.OS === 'web' ? new Audio(NOTIFICATION_SOUND) : null;

export default function CozinhaScreen() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pedidoParaImprimir, setPedidoParaImprimir] = useState<any>(null);
  const [faturamentoDia, setFaturamentoDia] = useState(0);

  const fetchPedidos = async () => {
    try {
      // 1. Busca pedidos ativos (Note que incluímos o novo status e removemos o 'concluido')
      const { data: pedidosData } = await supabase
        .from('pedidos')
        .select('*')
        .in('status', ['pendente', 'em_producao', 'aguardando_entregador', 'saiu_para_entrega', 'entregador_no_local']) 
        .order('created_at', { ascending: true });

      // 2. Cálculo do faturamento
      const hoje = new Date().toISOString().split('T')[0];
      const { data: vendasHoje } = await supabase
        .from('pedidos')
        .select('valor_total')
        .gte('created_at', hoje)
        .neq('status', 'cancelado');

      const total = vendasHoje?.reduce((acc, curr) => acc + Number(curr.valor_total || 0), 0) || 0;
      
      setFaturamentoDia(total);
      setPedidos(pedidosData || []);
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setLoading(false);
    }
  };

  const mudarStatus = async (id: string, novoStatus: string, pedidoCompleto: any) => {
    // Baixa estoque apenas na transição para produção
    if (novoStatus === 'em_producao') {
      try {
        for (const item of pedidoCompleto.itens || []) {
          const { data: produto } = await supabase
            .from('produtos')
            .select('estoque')
            .eq('nome', item.nome)
            .single();

          if (produto) {
            const novoEstoque = Math.max(0, produto.estoque - (Number(item.quantidade) || 1));
            await supabase.from('produtos').update({ estoque: novoEstoque }).eq('nome', item.nome);
          }
        }
      } catch (e) { console.error("Erro estoque:", e); }
    }

    // Atualiza o banco de dados
    const { error } = await supabase
      .from('pedidos')
      .update({ status: novoStatus })
      .eq('id', id);

    if (!error) {
      fetchPedidos(); 
    }
  };

  const imprimirPedido = (pedido: any) => {
    if (Platform.OS === 'web') {
      setPedidoParaImprimir(pedido);
      setTimeout(() => { window.print(); setPedidoParaImprimir(null); }, 500);
    }
  };

  useEffect(() => {
    fetchPedidos();
    const channel = supabase.channel('cozinha_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, (payload) => {
        if (payload.eventType === 'INSERT' && audioAlerta) {
          audioAlerta.play().catch(() => {});
        }
        fetchPedidos();
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#D4AF37" /></View>;

  return (
    <View style={styles.container}>
      {/* TICKET DE IMPRESSÃO */}
      {pedidoParaImprimir && (
        <View style={styles.printContainer}>
          <Text style={styles.printHeader}>CAPITANIA - #{pedidoParaImprimir.numero_sequencial}</Text>
          <Text style={styles.printText}>{new Date(pedidoParaImprimir.created_at).toLocaleString()}</Text>
          <View style={styles.printDivider} />
          {pedidoParaImprimir.itens?.map((i: any, idx: number) => (
            <Text key={idx} style={styles.printItem}>{i.quantidade}x {i.nome}</Text>
          ))}
          <View style={styles.printDivider} />
          <Text style={styles.printTotal}>TOTAL: R$ {Number(pedidoParaImprimir.valor_total).toFixed(2)}</Text>
        </View>
      )}

      {/* HEADER DASHBOARD */}
      <View style={styles.headerDesktop}>
        <View>
          <Text style={styles.title}>Painel de Controle</Text>
          <View style={styles.row}>
            <View style={styles.statBadge}>
              <Ionicons name="cash-outline" size={16} color="#28A745" />
              <Text style={styles.statValue}>R$ {faturamentoDia.toFixed(2)}</Text>
            </View>
            <View style={[styles.statBadge, { marginLeft: 12 }]}>
              <Ionicons name="list" size={16} color="#D4AF37" />
              <Text style={styles.statValue}>{pedidos.length} Pedidos Ativos</Text>
            </View>
          </View>
        </View>
        <Pressable style={styles.btnRefresh} onPress={fetchPedidos}>
          <Ionicons name="refresh" size={18} color="#D4AF37" />
          <Text style={styles.btnRefreshText}>Sincronizar</Text>
        </Pressable>
      </View>

      <View style={styles.kanbanContainer}>
        <Column 
          title="BALCÃO (NOVOS)" 
          color="#FFA500" 
          data={pedidos.filter(p => p.status === 'pendente')} 
          onAction={mudarStatus} 
          onPrint={imprimirPedido}
          type="novo" 
        />
        <Column 
          title="COZINHA (PRODUÇÃO)" 
          color="#D4AF37" 
          data={pedidos.filter(p => p.status === 'em_producao')} 
          onAction={mudarStatus} 
          onPrint={imprimirPedido}
          type="producao" 
        />
        <Column 
          title="AGUARDANDO COLETA" 
          color="#007AFF" 
          data={pedidos.filter(p => ['aguardando_entregador', 'saiu_para_entrega', 'entregador_no_local'].includes(p.status))} 
          onAction={mudarStatus} 
          type="entrega" 
        />
      </View>
    </View>
  );
}

function Column({ title, color, data, onAction, onPrint, type }: any) {
  return (
    <View style={styles.column}>
      <Text style={[styles.columnTitle, { borderBottomColor: color }]}>{title}</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {data.map((p: any) => (
          <PedidoCard 
            key={p.id} 
            pedido={p} 
            type={type}
            onPrint={() => onPrint && onPrint(p)}
            onAction={(id: string, next: string, pedido: any) => onAction(id, next, pedido)} 
            btnColor={color}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function PedidoCard({ pedido, onAction, onPrint, type, btnColor }: any) {
  // Define o próximo passo baseado no status atual
  const getNextStatus = () => {
    if (pedido.status === 'pendente') return 'em_producao';
    if (pedido.status === 'em_producao') return 'aguardando_entregador';
    return null; // Outros status não têm ação no Kanban da cozinha
  };

  const nextStatus = getNextStatus();

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardId}>#{String(pedido.numero_sequencial).padStart(4, '0')}</Text>
        <Text style={styles.cardTime}>
          {new Date(pedido.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      
      <View style={styles.itensArea}>
        {pedido.itens?.map((i: any, idx: number) => (
          <Text key={idx} style={styles.itemText}>{i.quantidade}x {i.nome}</Text>
        ))}
      </View>

      <View style={styles.footerCard}>
        <Text style={styles.totalPedido}>R$ {Number(pedido.valor_total).toFixed(2)}</Text>
        <View style={styles.btnGroup}>
          {(pedido.status === 'pendente' || pedido.status === 'em_producao') && (
            <Pressable style={styles.printBtn} onPress={onPrint}>
              <Ionicons name="print-outline" size={18} color="#FFF" />
            </Pressable>
          )}
          
          {nextStatus && (
            <Pressable 
              style={[styles.actionBtn, { backgroundColor: btnColor }]} 
              onPress={() => onAction(pedido.id, nextStatus, pedido)}
            >
              <Text style={styles.btnText}>
                {pedido.status === 'pendente' ? "COZINHA" : "PRONTO"}
              </Text>
            </Pressable>
          )}

          {/* Indica visualmente quem está com o pedido na coluna de entrega */}
          {pedido.status === 'saiu_para_entrega' && (
            <View style={styles.statusIndicator}>
              <Ionicons name="bicycle" size={14} color="#007AFF" />
              <Text style={styles.statusIndicatorText}>EM ROTA</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  center: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' },
  headerDesktop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '900', color: '#D4AF37' },
  row: { flexDirection: 'row', marginTop: 5 },
  statBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1E1E', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, borderWidth: 1, borderColor: '#333' },
  statValue: { color: '#EEE', fontSize: 13, fontWeight: 'bold', marginLeft: 8 },
  btnRefresh: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2A2A2A', padding: 10, borderRadius: 8, gap: 5 },
  btnRefreshText: { color: '#D4AF37', fontWeight: 'bold', fontSize: 12 },
  kanbanContainer: { flex: 1, flexDirection: 'row', gap: 15 },
  column: { flex: 1, backgroundColor: '#1E1E1E', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#333' },
  columnTitle: { color: '#FFF', fontWeight: '900', textAlign: 'center', paddingBottom: 10, marginBottom: 15, borderBottomWidth: 3, fontSize: 12 },
  card: { backgroundColor: '#2A2A2A', borderRadius: 10, padding: 12, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardId: { color: '#D4AF37', fontWeight: '900', fontSize: 18 },
  cardTime: { color: '#666', fontSize: 10 },
  itensArea: { marginBottom: 12 },
  itemText: { color: '#EEE', fontSize: 14, marginBottom: 3 },
  footerCard: { borderTopWidth: 1, borderTopColor: '#333', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalPedido: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  btnGroup: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  printBtn: { backgroundColor: '#444', padding: 8, borderRadius: 6 },
  actionBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, minWidth: 80, alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: '900', fontSize: 10 },
  statusIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusIndicatorText: { color: '#007AFF', fontWeight: 'bold', fontSize: 10 },
  printContainer: { position: 'absolute', top: -9999, width: 300, backgroundColor: 'white', padding: 20 },
  printHeader: { fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  printText: { fontSize: 12, textAlign: 'center' },
  printDivider: { height: 1, borderBottomWidth: 1, borderColor: 'black', marginVertical: 10, borderStyle: 'dashed' },
  printItem: { fontSize: 14, fontWeight: 'bold', marginBottom: 5 },
  printTotal: { fontSize: 16, fontWeight: 'bold', textAlign: 'right', marginTop: 10 }
});