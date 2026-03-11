import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { supabase } from '../../services/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function MapaEntregaScreen({ route, navigation }: any) {
  const { pedidoId } = route.params;
  const [minhaPosicao, setMinhaPosicao] = useState<any>(null);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    let subscription: Location.LocationSubscription;

    const iniciarRastreio = async () => {
      // 1. Pedir permissão de localização
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Erro", "Precisamos de permissão de GPS para a entrega.");
        return;
      }

      // 2. Seguir a posição do entregador em tempo real
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Envia a cada 5 segundos
          distanceInterval: 10, // Ou a cada 10 metros
        },
        async (location) => {
          const { latitude, longitude } = location.coords;
          const novaPos = { latitude, longitude };
          
          setMinhaPosicao(novaPos);

          // 3. Upsert na tabela de localização para o Sócio ver no mapa dele
          await supabase
            .from('localizacao_entregas')
            .upsert({ 
              pedido_id: pedidoId,
              latitude,
              longitude,
              updated_at: new Date()
            }, { onConflict: 'pedido_id' });
        }
      );
    };

    iniciarRastreio();

    return () => {
      if (subscription) subscription.remove();
    };
  }, [pedidoId]);

  const finalizarEntrega = async () => {
    Alert.alert("Finalizar", "Confirmar que o pedido foi entregue?", [
      { text: "Não" },
      { 
        text: "Sim, Entregue", 
        onPress: async () => {
          const { error } = await supabase
            .from('pedidos')
            .update({ status: 'entregue' })
            .eq('id', pedidoId);

          if (!error) {
            // Limpa a localização após entregar
            await supabase.from('localizacao_entregas').delete().eq('pedido_id', pedidoId);
            navigation.goBack();
          }
        } 
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation={true}
        initialRegion={{
          latitude: minhaPosicao?.latitude || -22.90, // Use uma lat padrão da sua cidade
          longitude: minhaPosicao?.longitude || -43.17,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {minhaPosicao && (
          <Marker 
            coordinate={minhaPosicao} 
            title="Minha Posição"
          >
            <View style={styles.markerContainer}>
              <Ionicons name="bicycle" size={24} color="#FFF" />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Botão Flutuante para Finalizar */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.btnFinalizar} onPress={finalizarEntrega}>
          <Text style={styles.btnText}>CONFIRMAR ENTREGA</Text>
          <Ionicons name="checkmark-circle" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  footer: { position: 'absolute', bottom: 30, width: '100%', paddingHorizontal: 20 },
  btnFinalizar: { 
    backgroundColor: '#28A745', 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 18, 
    borderRadius: 15,
    elevation: 5
  },
  btnText: { color: '#FFF', fontWeight: '900', fontSize: 16, marginRight: 10 },
  backBtn: { position: 'absolute', top: 50, left: 20, backgroundColor: '#FFF', padding: 10, borderRadius: 50, elevation: 5 },
  markerContainer: { backgroundColor: '#D4AF37', padding: 8, borderRadius: 20, borderWidth: 2, borderColor: '#FFF' }
});