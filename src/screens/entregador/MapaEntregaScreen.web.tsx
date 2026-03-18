import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function MapaRastreioSocio() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
      </TouchableOpacity>

      <View style={styles.centralBox}>
        <Ionicons name="map-outline" size={80} color="#D4AF37" />
        <Text style={styles.title}>Visualização não disponível no Web</Text>
        <Text style={styles.subtitle}>
          O rastreamento em tempo real via mapa é exclusivo para o aplicativo móvel dos Sócios.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center', padding: 20 },
  backBtn: { position: 'absolute', top: 40, left: 20, backgroundColor: '#FFF', padding: 10, borderRadius: 50 },
  centralBox: { alignItems: 'center', maxWidth: 400, textAlign: 'center' },
  title: { color: '#FFF', fontSize: 22, fontWeight: '900', marginTop: 20, textAlign: 'center' },
  subtitle: { color: '#999', fontSize: 14, marginTop: 10, textAlign: 'center', lineHeight: 22 },
});