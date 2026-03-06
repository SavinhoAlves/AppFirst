import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location'; 
import { supabase } from '../../services/supabase';

// --- CONFIGURAÇÃO DA SEDE ---
const SEDE_COORDS = {
  latitude: -21.4064, 
  longitude: -42.2059,
};

const RAIO_MAXIMO_METROS = 200; 

export default function CruzDeMalteScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]); // Estado para o histórico
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);

  // 1. Carregar dados do perfil e histórico
  useEffect(() => {
    async function loadInitialData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Carregar Perfil
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          setUserProfile(profile);

          // Carregar Histórico
          await fetchCheckins(user.id);
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // 2. Função para buscar o histórico de presenças
  const fetchCheckins = async (userId: string) => {
    const { data } = await supabase
      .from('checkin')
      .select('created_at')
      .eq('socio_id', userId)
      .order('created_at', { ascending: false })
      .limit(3); // Mostra os 3 últimos
    if (data) setHistory(data);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; 
    const p1 = lat1 * Math.PI / 180;
    const p2 = lat2 * Math.PI / 180;
    const deltaP = (lat2 - lat1) * Math.PI / 180;
    const deltaL = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(deltaP / 2) * Math.sin(deltaP / 2) +
              Math.cos(p1) * Math.cos(p2) *
              Math.sin(deltaL / 2) * Math.sin(deltaL / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
  };

  const handleCheckIn = async () => {
    try {
      setCheckingIn(true);
      let { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus !== 'granted') {
        Alert.alert("Acesso Negado", "Precisamos da localização para validar sua presença.");
        return;
      }

      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = location.coords;
      const distance = calculateDistance(latitude, longitude, SEDE_COORDS.latitude, SEDE_COORDS.longitude);

      if (distance > RAIO_MAXIMO_METROS) {
        Alert.alert("Fora do Alcance", `Você está a ${Math.round(distance)}m da sede.`);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: insertData, error } = await supabase
        .from('checkin')
        .insert([{ socio_id: user.id }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          Alert.alert("Atenção", "Você já realizou seu check-in de hoje!");
        } else {
          Alert.alert("Erro no Banco", error.message);
        }
        return;
      }

      if (insertData) {
        await fetchCheckins(user.id); // Atualiza o histórico na tela
        Alert.alert("💢 Presença Confirmada!", "Bom jogo, vascaíno!");
      }
    } catch (error: any) {
      Alert.alert("Erro", "Falha ao realizar check-in.");
    } finally {
      setCheckingIn(false);
    }
  };

  const nameParts = userProfile?.full_name?.split(' ') || ['Sócio'];
  const displayName = nameParts.length > 1 ? `${nameParts[0]} ${nameParts[1]}` : nameParts[0];

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color="#D4AF37" size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Cruz de Malte</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* CARTEIRINHA DIGITAL */}
        <View style={styles.idCard}>
          <View style={styles.cardHeader}>
             <Text style={styles.cardBrand}>CAPITANIA</Text>
             <Ionicons name="shield-checkmark-outline" size={24} color="#D4AF37" />
          </View>
          <Text style={styles.cardLabel}>MEMBRO OFICIAL</Text>
          <Text style={styles.cardUserName}>{displayName.toUpperCase()}</Text>
          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.cardLabel}>CATEGORIA</Text>
              <Text style={styles.cardValue}>
                {userProfile?.membership_type ? userProfile.membership_type.toUpperCase() : 'PADRÃO'}
              </Text>
            </View>
            <View style={[styles.statusTag, { backgroundColor: userProfile?.is_active ? '#2E7D32' : '#C62828' }]}>
              <Text style={styles.statusText}>{userProfile?.is_active ? 'ATIVO' : 'INATIVO'}</Text>
            </View>
          </View>
        </View>

        {/* MURAL DE AVISOS (Novidade) */}
        <Text style={styles.sectionLabel}>MURAL DA DIRETORIA</Text>
        <View style={styles.newsCard}>
          <Ionicons name="megaphone-outline" size={20} color="#1A1A1A" />
          <Text style={styles.newsText}>
            Neste domingo: Sorteio de camisa oficial para quem fizer check-in até as 15h!
          </Text>
        </View>

        {/* BOTÃO DE CHECK-IN */}
        <Text style={styles.sectionLabel}>PRESENÇA NO QG</Text>
        <TouchableOpacity 
          style={[styles.checkInBtn, checkingIn && { opacity: 0.7 }]} 
          onPress={handleCheckIn}
          disabled={checkingIn}
        >
          {checkingIn ? <ActivityIndicator color="#FFF" /> : <Ionicons name="location" size={30} color="#FFF" />}
          <View style={{ marginLeft: 15 }}>
            <Text style={styles.checkInTitle}>{checkingIn ? "Validando..." : "Fazer Check-in"}</Text>
            <Text style={styles.checkInSub}>Confirme sua presença na sede da Capitania</Text>
          </View>
        </TouchableOpacity>

        {/* ÚLTIMAS PRESENÇAS (Novidade) */}
        {history.length > 0 && (
          <View style={styles.historyContainer}>
            {history.map((item, index) => (
              <View key={index} style={styles.historyItem}>
                <Ionicons name="checkmark-circle" size={18} color="#2E7D32" />
                <Text style={styles.historyText}>
                  Presença confirmada em: {new Date(item.created_at).toLocaleDateString('pt-BR')}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* BOTÃO CARDÁPIO COMPLETO (Novidade) */}
        <Text style={styles.sectionLabel}>GASTRONOMIA</Text>
        <TouchableOpacity 
          style={styles.menuFullBtn} 
          onPress={() => navigation.navigate('CardapioScreen')}
        >
          <View style={styles.menuIconContainer}>
            <Ionicons name="restaurant" size={24} color="#D4AF37" />
          </View>
          <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={styles.menuFullTitle}>Cardápio da Sede</Text>
            <Text style={styles.checkInSub}>Bebidas, petiscos e pratos do dia</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: '800', marginLeft: 10, color: '#1A1A1A' },
  content: { padding: 20 },
  // Carteirinha
  idCard: { backgroundColor: '#1A1A1A', borderRadius: 20, padding: 20, marginBottom: 25, elevation: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  cardBrand: { color: '#666', fontWeight: '800', fontSize: 10, letterSpacing: 2 },
  cardLabel: { color: '#888', fontSize: 9, fontWeight: '700', marginBottom: 2 },
  cardUserName: { color: '#FFF', fontSize: 18, fontWeight: '900', marginBottom: 15 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardValue: { color: '#D4AF37', fontSize: 12, fontWeight: '800' },
  statusTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  statusText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  // Mural
  newsCard: { backgroundColor: '#D4AF3722', padding: 15, borderRadius: 15, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 4, borderLeftColor: '#D4AF37', marginBottom: 20 },
  newsText: { flex: 1, marginLeft: 12, fontSize: 13, color: '#333', fontWeight: '600', lineHeight: 18 },
  // Check-in
  checkInBtn: { backgroundColor: '#1A1A1A', borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  checkInTitle: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  checkInSub: { color: '#888', fontSize: 11 },
  sectionLabel: { fontSize: 12, fontWeight: '800', marginTop: 15, marginBottom: 15, color: '#999', letterSpacing: 1 },
  // Histórico
  historyContainer: { marginBottom: 20 },
  historyItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#EEE' },
  historyText: { marginLeft: 10, fontSize: 12, color: '#666', fontWeight: '600' },
  // Cardápio
  menuFullBtn: { backgroundColor: '#FFF', borderRadius: 20, padding: 15, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#EEE', elevation: 2 },
  menuIconContainer: { backgroundColor: '#1A1A1A', padding: 10, borderRadius: 12 },
  menuFullTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
});