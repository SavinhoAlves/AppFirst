import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../../services/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function FinanceiroScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [contribuicoes, setContribuicoes] = useState<any[]>([]);
  const [totalArrecadado, setTotalArrecadado] = useState(0);

  async function fetchFinanceiro() {
    try {
      setLoading(true);
      // Busca contribuições trazendo o nome do sócio da tabela profiles
      const { data, error } = await supabase
        .from('contribuicoes')
        .select(`
          *,
          profiles:user_id (full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setContribuicoes(data || []);
      
      // Calcula o total (ajuste o nome da coluna de valor conforme seu banco)
      const total = data?.reduce((acc, item) => acc + (item.valor || 0), 0);
      setTotalArrecadado(total || 0);

    } catch (error: any) {
      Alert.alert("Erro", "Não foi possível carregar o financeiro.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFinanceiro();
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.transactionCard}>
      <View style={styles.iconBox}>
        <Ionicons name="cash-outline" size={20} color="#2E7D32" />
      </View>
      <View style={styles.details}>
        <Text style={styles.socioName}>{item.profiles?.full_name || "Sócio"}</Text>
        <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString('pt-BR')}</Text>
      </View>
      <Text style={styles.value}>R$ {item.valor?.toFixed(2)}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header com botão de voltar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Financeiro</Text>
      </View>

      {/* Card de Resumo */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Arrecadado</Text>
        <Text style={styles.summaryValue}>R$ {totalArrecadado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Balanço Mensal</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Últimas Contribuições</Text>

      {loading ? (
        <ActivityIndicator color="#D4AF37" size="large" style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={contribuicoes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>Nenhuma contribuição registrada.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  backBtn: { marginRight: 15 },
  title: { fontSize: 22, fontWeight: '800', color: '#1A1A1A' },
  summaryCard: { 
    backgroundColor: '#1A1A1A', 
    margin: 20, 
    padding: 25, 
    borderRadius: 24,
    alignItems: 'center',
    elevation: 5
  },
  summaryLabel: { color: '#AAA', fontSize: 14, marginBottom: 8 },
  summaryValue: { color: '#FFF', fontSize: 32, fontWeight: '900' },
  badge: { backgroundColor: '#D4AF37', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 15 },
  badgeText: { color: '#000', fontSize: 10, fontWeight: '800' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginHorizontal: 20, marginBottom: 15 },
  list: { paddingHorizontal: 20, paddingBottom: 30 },
  transactionCard: { 
    backgroundColor: '#FFF', 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 15, 
    borderRadius: 16, 
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EEE'
  },
  iconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  details: { flex: 1, marginLeft: 12 },
  socioName: { fontSize: 14, fontWeight: '700', color: '#333' },
  date: { fontSize: 12, color: '#999' },
  value: { fontSize: 15, fontWeight: '800', color: '#2E7D32' },
  empty: { textAlign: 'center', marginTop: 40, color: '#999' }
});