import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator, Image, Linking, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { supabase } from '../../services/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';

export default function MapaRastreioSocio({ route }: any) {
  const { pedidoId } = route.params;
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  
  const [posicaoEntregador, setPosicaoEntregador] = useState<any>(null);
  const [posicaoSocio, setPosicaoSocio] = useState<any>(null);
  const [dadosEntregador, setDadosEntregador] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tempoEstimado, setTempoEstimado] = useState("Calculando...");
  const [progresso, setProgresso] = useState(0.1);

  const mapStyleDark = [
    { "elementType": "geometry", "stylers": [{ "color": "#212121" }] },
    { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#212121" }] },
    { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#2c2c2c" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] }
  ];

  const traduzirVeiculo = (tipo: string) => {
  const tipos: { [key: string]: string } = {
    'motorcycle': 'Motocicleta',
    'car': 'Carro',
    'bicycle': 'Bicicleta',
    'walking': 'A pé',
    'scooter': 'Patinete/Scooter'
  };
  return tipos[tipo.toLowerCase()] || 'Veículo';
};

  const calcularTempoEProgresso = (entregadorLat: number, entregadorLon: number, socioLat: number, socioLon: number) => {
    if (!entregadorLat || !socioLat) return;

    const radlat1 = Math.PI * entregadorLat / 180;
    const radlat2 = Math.PI * socioLat / 180;
    const theta = entregadorLon - socioLon;
    const radtheta = Math.PI * theta / 180;
    
    let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    if (dist > 1) dist = 1;
    dist = Math.acos(dist);
    dist = dist * 180 / Math.PI;
    dist = dist * 60 * 1.1515 * 1.609344;

    const minutosBase = Math.round(dist * 4);
    const tempoFinal = minutosBase < 1 ? "Menos de 1 min" : `${minutosBase}-${minutosBase + 3} min`;
    setTempoEstimado(tempoFinal);

    const progressoDinamico = Math.max(0.1, Math.min(0.95, 1 - (dist / 5))); 
    setProgresso(progressoDinamico);
  };

  const abrirSuporte = () => {
    const telefone = "5522999999999"; 
    const mensagem = `Olá, preciso de ajuda com o meu pedido ID: ${pedidoId}`;
    const url = `whatsapp://send?phone=${telefone}&text=${encodeURIComponent(mensagem)}`;

    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert("Erro", "O WhatsApp não está instalado.");
      }
    });
  };

  useEffect(() => {
    let channel: any;

    async function carregarDadosIniciais() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert("Atenção", "Ative o GPS para ver a sua distância do entregador.");
        }

        const location = await Location.getCurrentPositionAsync({});
        const pontoSocio = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setPosicaoSocio(pontoSocio);

        const { data: localizacao } = await supabase
          .from('localizacao_entregadores')
          .select('latitude, longitude, entregador_id')
          .eq('pedido_id', pedidoId)
          .maybeSingle();

        if (localizacao) {
          const pontoEntregador = {
            latitude: localizacao.latitude,
            longitude: localizacao.longitude,
          };
          setPosicaoEntregador(pontoEntregador);

          calcularTempoEProgresso(
            localizacao.latitude, 
            localizacao.longitude, 
            pontoSocio.latitude, 
            pontoSocio.longitude
          );

          // Busca perfil estendido
          const { data: perfil } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, entregadores(placa_veiculo, tipo_veiculo, modelo_veiculo, cor_veiculo)')
            .eq('id', localizacao.entregador_id)
            .single();
          
          if (perfil) setDadosEntregador(perfil);

          // Centraliza entre os dois
          mapRef.current?.animateToRegion({
            latitude: (pontoSocio.latitude + localizacao.latitude) / 2,
            longitude: (pontoSocio.longitude + localizacao.longitude) / 2,
            latitudeDelta: Math.abs(pontoSocio.latitude - localizacao.latitude) * 1.5,
            longitudeDelta: Math.abs(pontoSocio.longitude - localizacao.longitude) * 1.5,
          }, 1000);
        }

        // --- REALTIME AJUSTADO ---
        channel = supabase
          .channel(`rastreio_${pedidoId}`)
          .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'localizacao_entregadores', 
            filter: `pedido_id=eq.${pedidoId}` 
          }, (payload) => {
            const { latitude, longitude } = payload.new;
            const novaPosicaoEntregador = { latitude, longitude };
            
            setPosicaoEntregador(novaPosicaoEntregador);
            
            // Recalcula usando a sua posição fixa do pontoSocio definido no início
            calcularTempoEProgresso(latitude, longitude, pontoSocio.latitude, pontoSocio.longitude);

            mapRef.current?.animateToRegion({
              ...novaPosicaoEntregador,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005
            }, 1000);
          })
          .subscribe();

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    carregarDadosIniciais();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [pedidoId]);

  if (loading || !posicaoEntregador) {
  return (
    <View style={styles.loadingContainer}>
      <StatusBar style="light" translucent />
      
      {/* Botão de voltar no topo */}
      <View style={[styles.headerFloating, { top: insets.top + 10 }]}>
        <TouchableOpacity style={styles.miniBackBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      <ActivityIndicator size="large" color="#D4AF37" />
      <Text style={styles.loadingText}>Localizando entregador...</Text>
    </View>
  );
}

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent />

      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          ...posicaoEntregador,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005
        }}
        customMapStyle={mapStyleDark}
      >
        <Marker coordinate={posicaoEntregador}>
          <View style={styles.markerContainer}>
            <View style={styles.markerBadge}>
              <Ionicons name="bicycle-outline" size={20} color="#1A1A1A" />
            </View>
            <View style={styles.markerArrow} />
          </View>
        </Marker>

        {posicaoSocio && (
          <Marker coordinate={posicaoSocio}>
            <View style={styles.userMarkerContainer}>
              <View style={styles.userMarkerBadge}>
                <Ionicons name="home" size={20} color="#FFF" />
              </View>
              <View style={styles.userMarkerArrow} />
            </View>
          </Marker>
        )}
      </MapView>

      <View style={[styles.headerFloating, { top: insets.top + 10 }]}>
        <TouchableOpacity style={styles.miniBackBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.ajudaBtn} onPress={abrirSuporte}>
          <Text style={styles.ajudaText}>Ajuda</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.statusCardUpper, { top: insets.top + 70 }]}>
        <Text style={styles.statusMainText}>O entregador está a caminho</Text>
        <View style={styles.progressContainer}>
            <View style={[styles.progressBarActive, { width: `${progresso * 100}%` }]} />
        </View>
        <Text style={styles.previsaoText}>Previsão: <Text style={{ fontWeight: '900', color: '#1A1A1A' }}>{tempoEstimado}</Text></Text>
      </View>

      <View style={[styles.infoCard, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.dragHandle} />
        <View style={styles.infoContent}>
          <Image 
            source={{ uri: dadosEntregador?.avatar_url || 'https://via.placeholder.com/150' }} 
            style={styles.avatarImg} 
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>{dadosEntregador?.full_name || 'Entregador'}</Text>
            {dadosEntregador?.entregadores ? (
              <View>
                <Text style={styles.infoSubtitle}>
                  {/* Exibe o tipo de veículo traduzido + Modelo */}
                  {traduzirVeiculo(dadosEntregador.entregadores.tipo_veiculo)} • {dadosEntregador.entregadores.modelo_veiculo}
                </Text>
                <Text style={[styles.infoSubtitle, { fontWeight: 'bold', color: '#D4AF37' }]}>
                  Placa: {dadosEntregador.entregadores.placa_veiculo}
                </Text>
              </View>
            ) : (
              <Text style={styles.infoSubtitle}>Em rota de entrega</Text>
            )}
          </View>

          <TouchableOpacity 
            style={styles.chatBtn}
            onPress={() => navigation.navigate('ChatScreen', { pedidoId, receiverName: dadosEntregador?.full_name })}
          >
            <Ionicons name="chatbubble-ellipses" size={20} color="#1A1A1A" />
            <Text style={styles.chatBtnText}>Chat</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A1A' },
  map: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A1A1A' },
  loadingText: { marginTop: 15, color: '#D4AF37', fontWeight: '700', fontSize: 16 },
  markerContainer: { alignItems: 'center', justifyContent: 'center' },
  markerBadge: {
    backgroundColor: '#D4AF37',
    padding: 8,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFF',
    elevation: 5,
  },
  markerArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFF',
    transform: [{ rotate: '180deg' }],
    marginTop: -2,
  },
  userMarkerContainer: { alignItems: 'center', justifyContent: 'center' },
  userMarkerBadge: {
    backgroundColor: '#1A1A1A', // Cor escura para contrastar com o dourado do entregador
    padding: 8,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#D4AF37', // Borda dourada para combinar com o app
    elevation: 5,
  },
  userMarkerArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#D4AF37',
    transform: [{ rotate: '180deg' }],
    marginTop: -2,
  },
  headerFloating: { position: 'absolute', left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 },
  miniBackBtn: { backgroundColor: '#FFF', width: 45, height: 45, borderRadius: 23, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  ajudaBtn: { backgroundColor: '#FFF', paddingHorizontal: 20, height: 45, borderRadius: 23, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  ajudaText: { fontWeight: '800', color: '#1A1A1A', fontSize: 14 },
  statusCardUpper: { 
    position: 'absolute', 
    left: 20, 
    right: 20, 
    backgroundColor: '#FFF', 
    borderRadius: 20, 
    padding: 20, 
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statusMainText: { fontWeight: '800', fontSize: 17, color: '#1A1A1A', marginBottom: 12 },
  progressContainer: { height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, marginBottom: 12, overflow: 'hidden' },
  progressBarActive: { height: '100%', backgroundColor: '#28A745', width: '40%', borderRadius: 3 },
  previsaoText: { color: '#666', fontSize: 14 },
  infoCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingHorizontal: 25,
    paddingTop: 12,
  },
  dragHandle: { width: 40, height: 5, backgroundColor: '#F0F0F0', borderRadius: 10, alignSelf: 'center', marginBottom: 20 },
  infoContent: { flexDirection: 'row', alignItems: 'center' },
  statusIconEspera: { width: 45, height: 45, borderRadius: 12, backgroundColor: '#FFF9E6', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarImg: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
  infoTitle: { fontWeight: '900', fontSize: 19, color: '#1A1A1A' },
  infoSubtitle: { color: '#999', fontSize: 14, marginTop: 2 },
  chatBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F5F5F5', 
    paddingHorizontal: 18, 
    paddingVertical: 10, 
    borderRadius: 25, 
    gap: 8 
  },
  chatBtnText: { fontWeight: '800', fontSize: 15, color: '#1A1A1A' },
});