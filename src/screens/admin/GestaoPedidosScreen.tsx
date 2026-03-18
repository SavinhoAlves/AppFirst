import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../../services/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function GestaoPedidosScreen() {
  const [pedidos, setPedidos] = useState<any[]>([]);

  const fetchTodosPedidos = async () => {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .neq('status', 'concluido') // Foca apenas no que está em aberto
      .order('created_at', { ascending: true });

    if (!error) setPedidos(data || []);
  };

  const atualizarStatus = async (id: string, novoStatus: string) => {
    const { error } = await supabase
      .from('pedidos')
      .update({ status: novoStatus })
      .eq('id', id);

    if (error) {
      Alert.alert("Erro", "Não foi possível atualizar o status.");
    } else {
      fetchTodosPedidos(); // Recarrega a lista
    }
  };

  useEffect(() => { fetchTodosPedidos(); }, []);

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <Text style={styles.numero}>Pedido #{String(item.numero_sequencial).padStart(4, '0')}</Text>
      <Text style={styles.itens}>{item.itens.map((i: any) => i.nome).join(', ')}</Text>
      
      <View style={styles.buttonRow}>
        {item.status === 'pendente' && (
          <TouchableOpacity 
            style={[styles.btn, { backgroundColor: '#FFA500' }]}
            onPress={() => atualizarStatus(item.id, 'em_preparo')}
          >
            <Text style={styles.btnText}>CONFIRMAR (BALCÃO)</Text>
          </TouchableOpacity>
        )}

        {item.status === 'em_preparo' && (
          <TouchableOpacity 
            style={[styles.btn, { backgroundColor: '#D4AF37' }]}
            onPress={() => atualizarStatus(item.id, 'saiu_para_entrega')}
          >
            <Text style={styles.btnText}>PRONTO (ENVIAR P/ COZINHA)</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Painel de Gestão</Text>
      <FlatList data={pedidos} renderItem={renderItem} keyExtractor={it => it.id} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 20, paddingTop: 60 },
  title: { fontSize: 22, fontWeight: '900', marginBottom: 20 },
  card: { backgroundColor: '#FFF', padding: 15, borderRadius: 15, marginBottom: 15, elevation: 2 },
  numero: { fontWeight: 'bold', fontSize: 16 },
  itens: { color: '#666', marginVertical: 8 },
  buttonRow: { flexDirection: 'row', marginTop: 10 },
  btn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 }
});