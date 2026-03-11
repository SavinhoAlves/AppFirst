import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { supabase } from '../../services/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function MapaRastreioSocio({ route }: any) {
  const { pedidoId } = route.params;
  const navigation = useNavigation();
  const [posicaoEntregador, setPosicaoEntregador] = useState<any>(null);

  useEffect(() => {
    // 1. Busca a posição atual assim que abre a tela
    const buscarPosicaoInicial = async () => {
      const { data, error } = await supabase
        .from('localizacao_entregas')
        .select('latitude, longitude')
        .eq('pedido_id', pedidoId)
        .single();

      if (data) {
        setPosicaoEntregador({
          latitude: data.latitude,
          longitude: data.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
      }
    };

    buscarPosicaoInicial();

    // 2. Escuta atualizações de movimento do entregador
    const channel = supabase
      .channel(`rastreio_pedido_${pedidoId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'localizacao_entregas',
          filter: `pedido_id=eq.${pedidoId}`,
        },
        (payload) => {
          if (payload.new) {
            setPosicaoEntregador({
              latitude: payload.new.latitude,
              longitude: payload.new.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pedidoId]);

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={posicaoEntregador}
        showsPointsOfInterest={false}
      >
        {posicaoEntregador && (
          <Marker 
            coordinate={posicaoEntregador}
            title="Seu pedido está a caminho!"
          >
            <View style={styles.markerBadge}>
              <Ionicons name="bicycle" size={22} color="#1A1A1A" />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Botão de Voltar Minimalista */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
      </TouchableOpacity>

      {/* Card Informativo Flutuante */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Acompanhando Entrega</Text>
        <Text style={styles.infoSubtitle}>O entregador está se deslocando até você.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  markerBadge: {
    backgroundColor: '#D4AF37', // Dourado do seu app
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFF',
    elevation: 5,
  },
  backBtn: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: '#FFF',
    padding: 10,
    borderRadius: 50,
    elevation: 10,
  },
  infoCard: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 20,
    elevation: 10,
    alignItems: 'center',
  },
  infoTitle: { fontWeight: '900', fontSize: 16, color: '#1A1A1A' },
  infoSubtitle: { color: '#888', fontSize: 13, marginTop: 4 },
});