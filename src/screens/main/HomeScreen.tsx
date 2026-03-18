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

export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [nextMatch, setNextMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // ESTADO PARA MÚLTIPLOS PEDIDOS ATIVOS
  const [pedidosAtivos, setPedidosAtivos] = useState<any[]>([]);

  const formatEventDate = (timestamp: number) => {
    if (!timestamp) return "";
    const date = new Date(timestamp * 1000); 
    const day = date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
    const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${day.toUpperCase()} • ${time}`;
  };

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [profileRes, matchData] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user.id).single(),
          getNextMatch()
        ]);

        if (profileRes?.data) setUserProfile(profileRes.data);
        setNextMatch(matchData);
        
        // Busca inicial de pedidos
        buscarPedidosAtivos(user.id);

        // Configurar Realtime para atualizações de status ou novos pedidos
        const subscription = supabase
          .channel('mudanca_pedido_home')
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'pedidos', filter: `socio_id=eq.${user.id}` }, 
            () => buscarPedidosAtivos(user.id)
          )
          .subscribe();

        return () => { supabase.removeChannel(subscription); };
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const buscarPedidosAtivos = async (userId: string) => {
    const { data } = await supabase
      .from('pedidos')
      .select('*')
      // Adicione 'concluido' à lista para o banner não sumir assim que o motoboy encerra
      .in('status', ['pendente', 'em_preparo', 'em_producao', 'aguardando_entregador', 'saiu_para_entrega', 'concluido'])
      .eq('socio_id', userId)
      .order('created_at', { ascending: false });

    setPedidosAtivos(data || []);
  };

  const handleLogout = async () => {
    Alert.alert("Sair", "Deseja encerrar sua sessão?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", onPress: () => supabase.auth.signOut(), style: "destructive" }
    ]);
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
      {/* 1. HEADER FIXO */}
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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* CARD DE PRÓXIMO JOGO */}
        <View style={styles.matchCard}>
          <View style={styles.cardHeader}>
            <View style={styles.matchBadge}>
              <Text style={styles.matchBadgeText}>{nextMatch?.tournament?.toUpperCase() || 'PRÓXIMO JOGO'}</Text>
            </View>
            <TouchableOpacity style={styles.bellIcon}>
              <Ionicons name="notifications-outline" size={20} color="#D4AF37" />
            </TouchableOpacity>
          </View>

          {nextMatch ? (
            <>
              <View style={styles.matchInfo}>
                <View style={styles.team}>
                  <Image source={{ uri: nextMatch.homeTeam.logo }} style={styles.teamLogo} />
                  <Text style={styles.teamName} numberOfLines={2}>{nextMatch.homeTeam.name}</Text>
                </View>
                
                <View style={styles.vsContainer}>
                  <Text style={styles.vsText}>X</Text>
                </View>

                <View style={styles.team}>
                  <Image source={{ uri: nextMatch.awayTeam.logo }} style={styles.teamLogo} />
                  <Text style={styles.teamName} numberOfLines={2}>{nextMatch.awayTeam.name}</Text>
                </View>
              </View>

              <View style={styles.matchFooter}>
                <Ionicons name="location-outline" size={14} color="#D4AF37" />
                <Text style={styles.matchDetails} numberOfLines={1}>
                  {nextMatch.venue} • {formatEventDate(nextMatch.timestamp)}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.loadingMatch}>
              <ActivityIndicator size="small" color="#D4AF37" />
              <Text style={[styles.matchDetails, { color: '#777', marginLeft: 10 }]}>Buscando partida...</Text>
            </View>
          )}
        </View>

        {/* GRADE DE SERVIÇOS */}
        <Text style={styles.sectionTitle}>SERVIÇOS DA CAPITANIA</Text>
        <View style={styles.menuGrid}>
          <MenuCard title="Cardápio" icon="fast-food-outline" onPress={() => navigation.navigate('CardapioScreen')} />
          <MenuCard title="Cruz de Malte" icon="beer-outline" onPress={() => navigation.navigate('CruzDeMalte')} />
          <MenuCard title="Eventos" icon="calendar-outline" onPress={() => navigation.navigate('Eventos')} />
          <MenuCard title="Financeiro" icon="wallet-outline" onPress={() => navigation.navigate('Financeiro')} />
        </View>
      </ScrollView>

      {/* 3. BANNER DINÂMICO DE PEDIDOS ATIVOS */}
      {pedidosAtivos.length > 0 && (
        <TouchableOpacity 
          style={[styles.bannerAtivo, { bottom: insets.bottom + 20 }]} 
          onPress={() => navigation.navigate('MeusPedidosScreen')}
          activeOpacity={0.9}
        >
          <View style={styles.bannerContent}>
            <View style={styles.statusIconCircle}>
              <ActivityIndicator size="small" color="#D4AF37" />
            </View>
            
            <View style={{ flex: 1, marginLeft: 12 }}>
              {pedidosAtivos.length === 1 ? (
                <>
                  <Text style={styles.bannerTitle}>
                    Pedido #{String(pedidosAtivos[0].numero_sequencial).padStart(4, '0')}
                  </Text>
                  {/* Dentro do return do banner, onde exibe o status: */}
                  <Text style={styles.bannerSubtitle}>
                    Status: <Text style={{ color: pedidosAtivos[0].status === 'concluido' ? '#28A745' : '#D4AF37' }}>
                      {pedidosAtivos[0].status.toUpperCase().replaceAll('_', ' ')}
                    </Text>
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.bannerTitle}>
                    {pedidosAtivos.length} Pedidos em andamento
                  </Text>
                  <Text style={styles.bannerSubtitle}>
                    Toque para acompanhar todos
                  </Text>
                </>
              )}
            </View>

            {pedidosAtivos.length > 1 && (
              <View style={styles.badgeCount}>
                <Text style={styles.badgeCountText}>{pedidosAtivos.length}</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={20} color="#D4AF37" />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

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
  fixedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 15, backgroundColor: '#F8F9FA', zIndex: 10 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 120 },
  welcome: { color: '#666', fontSize: 13, fontWeight: '500' },
  userName: { color: '#1A1A1A', fontSize: 24, fontWeight: '800' },
  logoutBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EEE' },
  sectionTitle: { color: '#1A1A1A', fontSize: 14, fontWeight: '800', marginBottom: 18 },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', height: 120, backgroundColor: '#FFF', borderRadius: 22, padding: 18, marginBottom: 16, justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  iconContainer: { backgroundColor: '#F0F2F5', padding: 10, borderRadius: 14, marginBottom: 12, alignSelf: 'flex-start' },
  cardTitle: { color: '#2D2D2D', fontWeight: '700', fontSize: 14 },
  
  // MATCH CARD
  matchCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 25, borderWidth: 1, borderColor: '#EAEAEA', elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  matchBadge: { backgroundColor: 'rgba(212, 175, 55, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  matchBadgeText: { color: '#D4AF37', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  bellIcon: { padding: 8, backgroundColor: '#F8F9FA', borderRadius: 12 },
  matchInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10 },
  team: { alignItems: 'center', flex: 1 },
  teamLogo: { width: 55, height: 55, marginBottom: 10, resizeMode: 'contain' },
  teamName: { color: '#1A1A1A', fontWeight: '800', fontSize: 12, textAlign: 'center', height: 32 },
  vsContainer: { width: 40, alignItems: 'center' },
  vsText: { color: '#DDD', fontWeight: '900', fontSize: 18, fontStyle: 'italic' },
  matchFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingTop: 15, marginTop: 5 },
  matchDetails: { color: '#777', fontSize: 11, fontWeight: '600', marginLeft: 6 },
  loadingMatch: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },

  // BANNER IFOOD ESTILIZADO
  bannerAtivo: { position: 'absolute', left: 20, right: 20, backgroundColor: '#1A1A1A', borderRadius: 20, padding: 15, elevation: 8, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 6, zIndex: 999 },
  bannerContent: { flexDirection: 'row', alignItems: 'center' },
  statusIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(212, 175, 55, 0.1)', justifyContent: 'center', alignItems: 'center' },
  bannerTitle: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  bannerSubtitle: { color: '#999', fontSize: 11, fontWeight: '600', marginTop: 2 },
  badgeCount: { backgroundColor: '#D4AF37', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  badgeCountText: { color: '#1A1A1A', fontSize: 12, fontWeight: '900' },
});