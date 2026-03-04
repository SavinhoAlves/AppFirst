import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CruzDeMalteScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Cruz de Malte</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Status do QG */}
        <View style={styles.statusCard}>
          <View style={[styles.indicator, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.statusText}>O QG está aberto para Vasco x Flamengo!</Text>
        </View>

        {/* Botão de Check-in */}
        <TouchableOpacity style={styles.checkInBtn}>
          <Ionicons name="location" size={30} color="#FFF" />
          <View style={{ marginLeft: 15 }}>
            <Text style={styles.checkInTitle}>Fazer Check-in no QG</Text>
            <Text style={styles.checkInSub}>Confirme sua presença no consulado</Text>
          </View>
        </TouchableOpacity>

        {/* Cardápio Rápido */}
        <Text style={styles.sectionLabel}>PEDIDOS RÁPIDOS</Text>
        <View style={styles.menuRow}>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="beer" size={24} color="#D4AF37" />
            <Text style={styles.menuItemText}>Chopp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="fast-food" size={24} color="#D4AF37" />
            <Text style={styles.menuItemText}>Petiscos</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: '800', marginLeft: 10 },
  content: { padding: 20 },
  statusCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 15, marginBottom: 20, borderWidth: 1, borderColor: '#EEE' },
  indicator: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  statusText: { fontWeight: '600', color: '#333' },
  checkInBtn: { backgroundColor: '#1A1A1A', borderRadius: 20, padding: 25, flexDirection: 'row', alignItems: 'center', elevation: 5 },
  checkInTitle: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  checkInSub: { color: '#AAA', fontSize: 12 },
  sectionLabel: { fontSize: 14, fontWeight: '800', marginTop: 30, marginBottom: 15, color: '#666' },
  menuRow: { flexDirection: 'row', justifyContent: 'space-between' },
  menuItem: { backgroundColor: '#FFF', width: '48%', padding: 20, borderRadius: 15, alignItems: 'center', borderWidth: 1, borderColor: '#EEE' },
  menuItemText: { fontWeight: '700', marginTop: 10 }
});