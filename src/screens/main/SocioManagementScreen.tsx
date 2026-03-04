import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TextInput, 
  TouchableOpacity, ActivityIndicator, Alert, Share, Platform 
} from 'react-native';
import { supabase } from '../../services/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Libs de exportação
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import XLSX from 'xlsx';

export default function SocioManagementScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [socios, setSocios] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  async function fetchSocios() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setSocios(data || []);
    } catch (error: any) {
      Alert.alert("Erro", "Não foi possível carregar os sócios.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchSocios();
  }, []);

  const filteredSocios = socios.filter(s =>
    String(s.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    String(s.cpf ?? '').includes(search)
  );

  async function toggleStatus(id: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      setSocios(prev => prev.map(s => s.id === id ? { ...s, is_active: !currentStatus } : s));
    } catch (error) {
      Alert.alert("Erro", "Não foi possível alterar o status.");
    }
  }

  const exportToPDF = async () => {
    const htmlContent = `
      <html>
        <body style="font-family: sans-serif; padding: 20px;">
          <h1 style="text-align: center; color: #1A1A1A;">Relatório de Sócios - Capitânia</h1>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr style="background-color: #1A1A1A; color: white;">
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Nome</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">CPF</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredSocios.map(s => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 10px;">${s.full_name}</td>
                  <td style="border: 1px solid #ddd; padding: 10px;">${s.cpf}</td>
                  <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${s.is_active ? 'Ativo' : 'Inativo'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>`;
    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      Alert.alert("Erro", "Não foi possível gerar o PDF.");
    }
  };

  const exportToExcel = async () => {
    try {
      const dataToExport = filteredSocios.map(s => ({
        Nome: s.full_name,
        CPF: s.cpf,
        Email: s.email,
        Status: s.is_active ? 'Ativo' : 'Inativo',
        Cargo: s.role
      }));
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Socios");
      const isWeb = Platform.OS === 'web';
      const wbout = XLSX.write(wb, { type: isWeb ? 'array' : 'base64', bookType: 'xlsx' });
      if (isWeb) {
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'socios.xlsx'; a.click();
        return;
      }
      const fs: any = FileSystem;
      const directory = fs.cacheDirectory || fs.documentDirectory;
      if (!directory) throw new Error("Armazenamento indisponível");
      const uri = directory + 'lista_socios.xlsx';
      await FileSystem.writeAsStringAsync(uri, wbout, { encoding: 'base64' as any });
      await Sharing.shareAsync(uri);
    } catch (error: any) {
      Alert.alert("Erro", error.message);
    }
  };

  const handleShareOptions = () => {
    Alert.alert("Exportar Lista", "Escolha o formato:", [
      { text: "Gerar PDF", onPress: exportToPDF },
      { text: "Gerar Excel", onPress: exportToExcel },
      { text: "Cancelar", style: "cancel" }
    ]);
  };

  const renderSocio = ({ item }: { item: any }) => (
    <View style={styles.socioCard}>
      <View style={styles.socioInfo}>
        <Text style={styles.socioName}>{String(item.full_name ?? '')}</Text>
        <Text style={styles.socioSub}>
          {String(item.cpf ?? '')}
          {' • '}
          {String(item.role ?? '').toUpperCase()}
        </Text>
      </View>
      <TouchableOpacity 
        style={[styles.statusBadge, { backgroundColor: item.is_active ? '#E8F5E9' : '#FFEBEE' }]}
        onPress={() => toggleStatus(item.id, item.is_active)}
      >
        <Text style={[styles.statusText, { color: item.is_active ? '#2E7D32' : '#C62828' }]}>
          {item.is_active ? 'ATIVO' : 'INATIVO'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Gestão de Sócios</Text>
            <Text style={styles.count}>{filteredSocios.length} cadastrados</Text>
          </View>
          <TouchableOpacity onPress={handleShareOptions} style={styles.shareButton}>
            <Ionicons name="share-outline" size={24} color="#D4AF37" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#999" />
        <TextInput 
          style={styles.searchInput}
          placeholder="Nome ou CPF..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#999"
        />
      </View>
      {loading ? (
        <ActivityIndicator color="#D4AF37" size="large" style={{ marginTop: 50 }} />
      ) : (
        <FlatList 
          data={filteredSocios}
          keyExtractor={(item, index) => String(item.id ?? index)}
          renderItem={renderSocio}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchSocios(); }}
          ListEmptyComponent={
            <View style={{marginTop: 50}}>
              <Text style={{textAlign: 'center', color: '#999'}}>
                Nenhum sócio encontrado.
              </Text>
            </View>
          }
        />
      )}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddSocio')}>
        <Ionicons name="add" size={32} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { paddingHorizontal: 20, paddingVertical: 15 },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 15, padding: 8, backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#EEE' },
  shareButton: { padding: 10, backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#EEE' },
  title: { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
  count: { fontSize: 12, color: '#666' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', marginHorizontal: 20, paddingHorizontal: 15, height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#EEE' },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#333' },
  list: { padding: 20, paddingBottom: 100 },
  socioCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#F0F0F0' },
  socioInfo: { flex: 1 },
  socioName: { fontSize: 16, fontWeight: '700', color: '#333' },
  socioSub: { fontSize: 12, color: '#999', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800' },
  fab: { position: 'absolute', right: 20, bottom: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: '#D4AF37', justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3 },
  empty: { textAlign: 'center', marginTop: 50, color: '#999' }
});