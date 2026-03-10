import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { supabase } from '../../services/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function ProdutosScreen() {
  const [produtos, setProdutos] = useState<any[]>([]);

  useEffect(() => {
    fetchProdutos();
  }, []);

  const fetchProdutos = async () => {
    const { data } = await supabase.from('produtos').select('*').order('nome');
    if (data) setProdutos(data);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gerenciamento de Estoque</Text>
        <TouchableOpacity style={styles.btnAdd}>
          <Text style={styles.btnText}>+ Adicionar Produto</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={produtos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View>
              <Text style={styles.prodNome}>{item.nome}</Text>
              <Text style={styles.prodCat}>{item.categoria}</Text>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>Sócio: R$ {item.preco_socio.toFixed(2)}</Text>
              <Text style={styles.price}>Padrão: R$ {item.preco_padrao.toFixed(2)}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 30, backgroundColor: '#F9F9F9' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold' },
  btnAdd: { backgroundColor: '#D4AF37', padding: 12, borderRadius: 8 },
  btnText: { color: '#000', fontWeight: 'bold' },
  card: { backgroundColor: '#FFF', padding: 20, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, borderWidth: 1, borderColor: '#EEE' },
  prodNome: { fontSize: 18, fontWeight: 'bold' },
  prodCat: { color: '#666' },
  priceContainer: { alignItems: 'flex-end' },
  price: { fontWeight: '600', color: '#333' }
});