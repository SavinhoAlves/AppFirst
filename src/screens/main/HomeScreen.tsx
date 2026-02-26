import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { supabase } from '../../services/supabase';
import { getNextMatch } from '../../services/footballApi';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Adicionei a prop 'navigation' para você conseguir abrir a gestão de sócios
export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [nextMatch, setNextMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [profileResponse, matchData] = await Promise.all([
        fetchUserProfile(),
        getNextMatch()
      ]);
      setUserProfile(profileResponse);
      setNextMatch(matchData);
      setLoading(false);
      requestPermissions();
    }
    loadData();
  }, []);

  async function requestPermissions() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('Permissão de notificação negada');
    }
  }

  async function fetchUserProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      return data;
    }
    return null;
  }

  const formatEventDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const day = date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
    const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${day.toUpperCase()} • ${time}`;
  };

  async function handleSetReminder() {
    if (!nextMatch) return;
    const gameTime = nextMatch.timestamp * 1000;
    const reminderTime = new Date(gameTime - 15 * 60 * 1000); 
    const now = new Date();

    if (reminderTime < now) {
      Alert.alert("Atenção", "O jogo já está muito próximo ou já começou!");
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "💢 O GIGANTE VAI JOGAR!",
          body: `${nextMatch.homeTeam.name} x ${nextMatch.awayTeam.name} começa em 15 minutos!`,
          sound: true,
        },
        trigger: { date: reminderTime } as Notifications.DateTriggerInput,
      });
      Alert.alert("Lembrete Ativado", "A Capitania te avisará 15 minutos antes do apito inicial!");
    } catch (error) {
      Alert.alert("Erro", "Não foi possível agendar o lembrete.");
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color="#D4AF37" size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        
        <View style={styles.header}>
          <View>
            <Text style={styles.welcome}>Saudações Vascaínas,</Text>
            <Text style={styles.userName}>{userProfile?.full_name || "Sávio Alves"}</Text>
            {/* Reativado o selo para o Master User */}
            {userProfile?.role === 'master' && (
              <Text style={styles.masterBadge}>🏆 MASTER USER</Text>
            )}
          </View>
          <TouchableOpacity onPress={() => supabase.auth.signOut()} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.matchCard}>
          {/* Cabeçalho do Card: Badge à esquerda e Sino à direita */}
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
            <Text style={styles.matchDetails}>Buscando o próximo jogo do Vasco...</Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>SERVIÇOS DA CAPITANIA</Text>
        <View style={styles.menuGrid}>
          <MenuCard title="Cruz de Malte" icon="beer-outline" />
          <MenuCard title="Eventos" icon="calendar-outline" />
          <MenuCard title="Caravanas" icon="bus-outline" />
          
          {/* Botão Gestão Sócios agora funcional para o Master */}
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => navigation.navigate('SocioManagement')}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="people-outline" size={26} color="#FFF" />
            </View>
            <Text style={styles.cardTitle}>Gestão Sócios</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function MenuCard({ title, icon }: { title: string, icon: any }) {
  return (
    <TouchableOpacity style={styles.card}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={26} color="#FFF" />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F0F' },
  center: { justifyContent: 'center', alignItems: 'center' },
  content: { padding: 25 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  welcome: { color: '#888', fontSize: 13 },
  userName: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  masterBadge: { color: '#D4AF37', fontSize: 10, fontWeight: '900', marginTop: 4, letterSpacing: 1 },
  logoutBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center' },
  matchCard: { backgroundColor: '#151515', borderRadius: 20, padding: 20, marginBottom: 35, borderWidth: 1, borderColor: '#222' },
  // matchBadge: { backgroundColor: '#D4AF3720', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 15 },
  matchBadgeText: { color: '#D4AF37', fontSize: 10, fontWeight: '900' },
  matchInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  team: { alignItems: 'center', flex: 1 },
  teamLogo: { width: 50, height: 50, marginBottom: 8, resizeMode: 'contain', backgroundColor: 'transparent'},
  teamName: { color: '#FFF', fontWeight: '900', fontSize: 13, textAlign: 'center' },
  vsText: { color: '#444', fontWeight: '900', fontSize: 16, marginHorizontal: 10 },
  matchFooter: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#222', paddingTop: 12 },
  matchDetails: { color: '#888', fontSize: 11, marginLeft: 5 },
  reminderBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#D4AF3715', paddingVertical: 10, borderRadius: 12, marginTop: 15, borderWidth: 1, borderColor: '#D4AF3730' },
  reminderBtnText: { color: '#D4AF37', fontSize: 10, fontWeight: '900', marginLeft: 8, letterSpacing: 1 },
  sectionTitle: { color: '#FFF', fontSize: 12, fontWeight: '900', marginBottom: 20 },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', height: 130, backgroundColor: '#181818', borderRadius: 20, padding: 15, marginBottom: 16, justifyContent: 'center', borderWidth: 1, borderColor: '#222' },
  iconContainer: { backgroundColor: '#252525', padding: 8, borderRadius: 10, marginBottom: 12, alignSelf: 'flex-start' },
  cardTitle: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15},
  matchBadge: { backgroundColor: '#D4AF3720', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8},
  bellIcon: { padding: 5, backgroundColor: '#1A1A1A', borderRadius: 10},
});