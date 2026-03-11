import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Switch, 
  ActivityIndicator, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { supabase } from '../../services/supabase';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

export default function GestaoEntregadoresScreen() {
  const navigation = useNavigation<any>();
  const [entregadores, setEntregadores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // useFocusEffect garante que a lista atualize sempre que você voltar da tela de cadastro
  useFocusEffect(
    useCallback(() => {
      fetchEntregadores();
    }, [])
  );

  const fetchEntregadores = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'entregador')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setEntregadores(data || []);
    } catch (error: any) {
      Alert.alert("Erro ao buscar", error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleAtivo = async (id: string, statusAtual: boolean) => {
    // Atualiza o campo 'ativo' (ou 'is_active' conforme seu banco)
    const { error } = await supabase
      .from('profiles')
      .update({ ativo: !statusAtual }) 
      .eq('id', id);

    if (!error) {
      setEntregadores(prev => 
        prev.map(ent => ent.id === id ? { ...ent, ativo: !statusAtual } : ent)
      );
    } else {
      Alert.alert("Erro", "Não foi possível alterar o status.");
    }
  };

  const renderEntregador = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.info}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.full_name ? item.full_name.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
        <View>
          <Text style={styles.nome}>{item.full_name}</Text>
          <View style={styles.badgeRow}>
             <Text style={styles.statusLabel}>
                {item.em_rota ? '🟢 Em Rota' : '⚪ Disponível'}
              </Text>
              {/* Exibe o CPF mascarado para conferência rápida se desejar */}
              <Text style={styles.subText}> • {item.cpf}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.action}>
        <Switch
          value={item.ativo}
          onValueChange={() => toggleAtivo(item.id, item.ativo)}
          trackColor={{ false: "#CCC", true: "#1A1A1A" }}
          thumbColor={item.ativo ? "#D4AF37" : "#f4f3f4"}
        />
        <Text style={[styles.ativoText, { color: item.ativo ? '#2E7D32' : '#666' }]}>
          {item.ativo ? 'ATIVO' : 'INATIVO'}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.title}>Gestão de Entregadores</Text>
        <TouchableOpacity onPress={fetchEntregadores} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={20} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4AF37" />
          <Text style={styles.loadingText}>Carregando entregadores...</Text>
        </View>
      ) : (
        <FlatList
          data={entregadores}
          keyExtractor={item => item.id}
          renderItem={renderEntregador}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="bicycle-outline" size={50} color="#CCC" />
              <Text style={styles.empty}>Nenhum entregador cadastrado.</Text>
            </View>
          }
        />
      )}

      {/* Navega para a nova tela AddEntregador que criamos */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('AddEntregadorScreen')}
      >
        <Ionicons name="add" size={32} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 20, 
    paddingVertical: 15,
    backgroundColor: '#FFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#EEE' 
  },
  backBtn: { padding: 5 },
  refreshBtn: { padding: 5 },
  title: { fontSize: 18, fontWeight: '900', color: '#1A1A1A' },
  listContent: { padding: 20, paddingBottom: 100 },
  card: { 
    backgroundColor: '#FFF', 
    padding: 16, 
    borderRadius: 20, 
    marginBottom: 12, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  info: { flexDirection: 'row', alignItems: 'center' },
  avatar: { 
    width: 48, 
    height: 48, 
    borderRadius: 16, 
    backgroundColor: '#1A1A1A', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 15 
  },
  avatarText: { color: '#D4AF37', fontWeight: '900', fontSize: 20 },
  nome: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statusLabel: { fontSize: 11, color: '#666', fontWeight: '600' },
  subText: { fontSize: 11, color: '#999' },
  action: { alignItems: 'center', width: 60 },
  ativoText: { fontSize: 9, fontWeight: '900', marginTop: 4, letterSpacing: 0.5 },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 25,
    backgroundColor: '#1A1A1A',
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#666', fontSize: 14 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  empty: { textAlign: 'center', marginTop: 10, color: '#999', fontSize: 14 }
});