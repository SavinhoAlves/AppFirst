import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { supabase } from '../../services/supabase';
import { getNextMatch } from '../../services/footballApi';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// --- FUNÇÃO DE FORMATAÇÃO DE NOME ---
const formatDisplayName = (fullName: string | null, email?: string) => {
  if (fullName && fullName.trim().length > 0) {
    const parts = fullName.trim().split(/\s+/);
    return parts.length > 1 ? `${parts[0]} ${parts[1]}` : parts[0];
  }
  if (email) {
    const emailPrefix = email.split('@')[0];
    return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
  }
  return 'Sócio';
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [nextMatch, setNextMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isVip = userProfile?.is_active === true;

  const formatEventDate = (timestamp: number) => {
    if (!timestamp) return "";
    const date = new Date(timestamp * 1000); 
    const day = date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
    const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${day.toUpperCase()} • ${time}`;
  };

  async function requestPermissions() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') console.log('Permissão negada');
  }

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const [profileRes, matchData] = await Promise.all([
          user ? supabase.from('profiles').select('*').eq('id', user.id).single() : null,
          getNextMatch() 
        ]);
        if (profileRes?.data) setUserProfile(profileRes.data);
        setNextMatch(matchData);
        await requestPermissions();
      } catch (error) {
        console.error("Erro:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleNavigation = (screenName: string) => {
    if (!screenName) return;
    navigation.navigate(screenName);
  };

  const handleFinanceiro = () => {
    if (userProfile?.role === 'master' || userProfile?.role === 'admin') {
      navigation.navigate('Financeiro');
    } else {
      Alert.alert("Acesso Restrito", "Apenas administradores podem acessar.");
    }
  };

  const handleLogout = async () => {
    Alert.alert("Sair", "Deseja encerrar sua sessão?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", onPress: () => supabase.auth.signOut(), style: "destructive" }
    ]);
  };

  const handleSetReminder = async () => {
    if (!nextMatch) return;
    const reminderTime = new Date((nextMatch.timestamp * 1000) - 15 * 60 * 1000); 
    if (reminderTime < new Date()) {
      Alert.alert("Atenção", "O jogo já está muito próximo!");
      return;
    }
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "💢 O GIGANTE VAI JOGAR!",
          body: `${nextMatch.homeTeam.name} x ${nextMatch.awayTeam.name} em 15 min!`,
        },
        trigger: { date: reminderTime } as Notifications.DateTriggerInput,
      });
      Alert.alert("Sucesso", "Lembrete ativado!");
    } catch (e) {
      Alert.alert("Erro", "Não foi possível agendar.");
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color="#D4AF37" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 1. HEADER FIXO (Fora do ScrollView) */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top + 10 }]}>
        <View>
          <Text style={styles.welcome}>Saudações Vascaínas,</Text>
          <Text style={styles.userName}>
            {formatDisplayName(userProfile?.full_name, userProfile?.email)}
          </Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* 2. CONTEÚDO ROLÁVEL */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Card de Jogo */}
        <View style={styles.matchCard}>
          <View style={styles.cardHeader}>
            <View style={styles.matchBadge}>
              <Text style={styles.matchBadgeText}>{nextMatch?.tournament || 'PRÓXIMO JOGO'}</Text>
            </View>
            {nextMatch && (
              <TouchableOpacity onPress={handleSetReminder} style={styles.bellIcon}>
                <Ionicons name="notifications-outline" size={20} color="#D4AF37" />
              </TouchableOpacity>
            )}
          </View>

          {nextMatch ? (
            <>
              <View style={styles.matchInfo}>
                <View style={styles.team}>
                  <Image source={{ uri: nextMatch.homeTeam.logo }} style={styles.teamLogo} />
                  <Text style={styles.teamName}>{nextMatch.homeTeam.name}</Text>
                </View>
                <Text style={styles.vsText}>X</Text>
                <View style={styles.team}>
                  <Image source={{ uri: nextMatch.awayTeam.logo }} style={styles.teamLogo} />
                  <Text style={styles.teamName}>{nextMatch.awayTeam.name}</Text>
                </View>
              </View>
              <View style={styles.matchFooter}>
                <Ionicons name="location-outline" size={14} color="#D4AF37" />
                <Text style={styles.matchDetails}>
                  {nextMatch.venue} • {formatEventDate(nextMatch.timestamp)}
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.matchDetails}>Buscando o próximo jogo...</Text>
          )}
        </View>

        {/* Card de Vantagens */}
        <View style={styles.vantagensCard}>
          <View style={styles.vantagensHeader}>
            <Ionicons name="star" size={18} color="#D4AF37" />
            <Text style={styles.vantagensTitle}>CLUBE DE VANTAGENS</Text>
          </View>
          <Text style={styles.vantagensText}>
            {isVip 
              ? "Você tem 15% de desconto em toda a rede parceira para o próximo jogo!" 
              : "Torne-se sócio VIP e libere descontos exclusivos em barbearias e bares!"}
          </Text>
          <TouchableOpacity 
            style={styles.vantagensBtn}
            onPress={() => isVip ? handleNavigation('Vantagens') : handleNavigation('Financeiro')}
          >
            <Text style={styles.vantagensBtnText}>
              {isVip ? "VER PARCEIROS" : "QUERO SER VIP"}
            </Text>
            <Ionicons name="arrow-forward" size={16} color="#1A1A1A" />
          </TouchableOpacity>
        </View>

        {/* Grade de Serviços */}
        <Text style={styles.sectionTitle}>SERVIÇOS DA CAPITANIA</Text>
        <View style={styles.menuGrid}>
          <MenuCard title="Cruz de Malte" icon="beer-outline" onPress={() => handleNavigation('CruzDeMalte')} />
          <MenuCard title="Eventos" icon="calendar-outline" onPress={() => handleNavigation('Eventos')} />
          <MenuCard title="Caravanas" icon="bus-outline" onPress={() => handleNavigation('Caravanas')} />
          {(userProfile?.role === 'admin' || userProfile?.role === 'master') && (
            <MenuCard title="Gestão Sócios" icon="people-outline" onPress={() => handleNavigation('SocioManagement')} />
          )}
          <MenuCard title="Financeiro" icon="wallet-outline" onPress={handleFinanceiro} />
        </View>
      </ScrollView>
    </View>
  );
}

// MenuCard Component
function MenuCard({ title, icon, onPress }: { title: string, icon: any, onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={26} color="#464646" />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { justifyContent: 'center', alignItems: 'center' },
  // Estilo do Header Fixo
  fixedHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingBottom: 15,
    backgroundColor: '#F8F9FA', // Mesma cor do fundo para mesclar
    zIndex: 10,
  },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },
  welcome: { color: '#666', fontSize: 13, fontWeight: '500' },
  userName: { color: '#1A1A1A', fontSize: 24, fontWeight: '800' },
  logoutBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EEE' },
  matchCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 30, borderWidth: 1, borderColor: '#EAEAEA' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  matchBadge: { backgroundColor: '#D4AF3715', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  matchBadgeText: { color: '#D4AF37', fontSize: 11, fontWeight: '800' },
  bellIcon: { padding: 8, backgroundColor: '#F8F9FA', borderRadius: 12 },
  matchInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  team: { alignItems: 'center', flex: 1 },
  teamLogo: { width: 50, height: 50, marginBottom: 8, resizeMode: 'contain' },
  teamName: { color: '#333', fontWeight: '800', fontSize: 13, textAlign: 'center' },
  vsText: { color: '#EEE', fontWeight: '900', fontSize: 18 },
  matchFooter: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingTop: 15 },
  matchDetails: { color: '#999', fontSize: 12, marginLeft: 6 },
  sectionTitle: { color: '#1A1A1A', fontSize: 14, fontWeight: '800', marginBottom: 18 },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', height: 130, backgroundColor: '#FFF', borderRadius: 22, padding: 18, marginBottom: 16, justifyContent: 'center', borderWidth: 1, borderColor: '#F0F0F0' },
  iconContainer: { backgroundColor: '#F0F2F5', padding: 10, borderRadius: 14, marginBottom: 12, alignSelf: 'flex-start' },
  cardTitle: { color: '#2D2D2D', fontWeight: '700', fontSize: 14 },
  vantagensCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 15, marginBottom: 25, borderLeftWidth: 5, borderLeftColor: '#D4AF37' },
  vantagensHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  vantagensTitle: { color: '#D4AF37', fontWeight: '800', fontSize: 12, marginLeft: 8 },
  vantagensText: { color: '#444', fontSize: 13, lineHeight: 18, marginBottom: 12 },
  vantagensBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F0F0F0', padding: 10, borderRadius: 10 },
  vantagensBtnText: { fontWeight: '700', fontSize: 12 }
});