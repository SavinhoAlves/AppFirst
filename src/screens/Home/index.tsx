import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

const MASTER_EMAIL = 'savioalves169@gmail.com';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(data);
      }
      setLoading(false);
    }
    getProfile();
  }, []);

  // Dentro da sua HomeScreen...

async function handleCheckIn() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    // Inserir registro na tabela checkins
    const { error } = await supabase
      .from('checkins')
      .insert([
        { socio_id: user.id }
      ]);

    if (error) throw error;

    Alert.alert(
      "📍 Check-in Realizado!",
      "Sua presença na Capitania Cruz de Malte foi registrada com sucesso. Aproveite o jogo!"
    );
  } catch (error: any) {
    Alert.alert("Erro no Check-in", "Não foi possível registrar sua presença agora.");
    console.error(error);
  }
}

// No seu componente, procure o botão de Check-in e mude o onPress:
<TouchableOpacity style={styles.actionBtn} onPress={handleCheckIn}>
    <Ionicons name="qr-code" size={24} color="#FFF" />
    <Text style={styles.actionText}>Check-in Sede</Text>
</TouchableOpacity>

  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color="#C0C0C0" /></View>;

  return (
    <ScrollView style={styles.container}>
      {/* HEADER EXCLUSIVO CRUZ DE MALTE */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.capitaniaLabel}>CAPITANIA</Text>
          <Text style={styles.capitaniaName}>CRUZ DE MALTE</Text>
        </View>
        <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('MENU')}>
           <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{profile?.email?.charAt(0).toUpperCase()}</Text>
           </View>
        </TouchableOpacity>
      </View>

      {/* CARD DE SÓCIO ESTILIZADO (MURALHA) */}
      <View style={styles.mainCard}>
        <LinearGradient colors={['#000', '#1A1A1A']} style={styles.cardGradient}>
          <View style={styles.cardHeader}>
             <Image 
               source={{ uri: '../../assets/logo-capitania-3.png' }} 
               style={styles.cardShield} 
             />
             <View style={[
                styles.tag, 
                (profile?.role === 'master' || profile?.email === 'savioalves169@gmail.com') && { backgroundColor: '#D4AF37' } // Cor dourada para o Master
                ]}>
                <Text style={[
                    styles.tagText,
                    (profile?.role === 'master' || profile?.email === 'savioalves169@gmail.com') && { color: '#000' }
                ]}>
                    { (profile?.role === 'master' || profile?.email === 'savioalves169@gmail.com') 
                    ? 'MASTER' 
                    : profile?.role === 'admin' 
                        ? 'ADMIN' 
                        : 'SÓCIO' 
                    }
                </Text>
            </View>
          </View>

          <View style={styles.cardBody}>
            <Text style={styles.cardUserName}>{profile?.full_name || 'Vascaíno de Honra'}</Text>
            <Text style={styles.cardEmail}>{profile?.email}</Text>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.infoBox}>
               <Text style={styles.infoLabel}>STATUS</Text>
               <Text style={[styles.infoValue, { color: profile?.is_active ? '#4ADE80' : '#F87171' }]}>
                {profile?.is_active ? 'ATIVO' : 'PENDENTE'}
               </Text>
            </View>
            <View style={styles.infoBox}>
               <Text style={styles.infoLabel}>MEMBRO Nº</Text>
               <Text style={styles.infoValue}>#00{profile?.id.slice(0, 3)}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* AÇÕES RÁPIDAS */}
      <View style={styles.actionContainer}>
         <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('CARTEIRA')}>
            <Ionicons name="qr-code" size={24} color="#FFF" />
            <Text style={styles.actionText}>Check-in Sede</Text>
         </TouchableOpacity>
         
         <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#D4AF37' }]} onPress={() => Alert.alert('Mensalidade', 'Abrindo área de pagamento...')}>
            <Ionicons name="receipt" size={24} color="#000" />
            <Text style={[styles.actionText, { color: '#000' }]}>Mensalidade</Text>
         </TouchableOpacity>
      </View>

      {/* PAINEL DE CONTROLE (SÓ VOCÊ) */}
        {(profile?.role === 'admin' || profile?.role === 'master' || profile?.email === MASTER_EMAIL) && (
        <View style={styles.adminArea}>
            <Text style={styles.sectionTitle}>Comando da Capitania</Text>
            
            <TouchableOpacity 
            style={styles.adminRow}
            // ALTERE A LINHA ABAIXO:
            onPress={() => navigation.navigate('GestaoMembros')} 
            >
                <View style={styles.adminIcon}>
                <Ionicons name="people" size={20} color="#D4AF37" />
                </View>
                <View>
                <Text style={styles.adminLinkTitle}>Gestão de Membros</Text>
                <Text style={styles.adminLinkSub}>Validar novos sócios e cargos</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CCC" style={{marginLeft: 'auto'}} />
            </TouchableOpacity>
        </View>
        )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, paddingTop: 60, marginBottom: 20 },
  capitaniaLabel: { fontSize: 12, color: '#888', fontWeight: 'bold', letterSpacing: 2 },
  capitaniaName: { fontSize: 24, fontWeight: '900', color: '#000' },
  profileBtn: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EEE' },
  avatarPlaceholder: { width: '100%', height: '100%', borderRadius: 22.5, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontWeight: 'bold' },
  mainCard: { marginHorizontal: 20, borderRadius: 24, overflow: 'hidden', elevation: 15, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10 },
  cardGradient: { padding: 25 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardShield: { width: 40, height: 50, resizeMode: 'contain' },
  tag: { backgroundColor: 'rgba(212, 175, 55, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#D4AF37' },
  tagText: { color: '#D4AF37', fontSize: 10, fontWeight: 'bold' },
  cardBody: { marginTop: 30 },
  cardUserName: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  cardEmail: { color: '#888', fontSize: 14, marginTop: 4 },
  cardFooter: { flexDirection: 'row', marginTop: 30, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 20 },
  infoBox: { marginRight: 40 },
  infoLabel: { color: '#555', fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
  infoValue: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  actionContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 25 },
  actionBtn: { backgroundColor: '#000', width: '48%', height: 60, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  actionText: { color: '#FFF', fontWeight: 'bold', marginLeft: 10 },
  adminArea: { marginTop: 40, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 15 },
  adminRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAFA', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#F0F0F0' },
  adminIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  adminLinkTitle: { fontWeight: 'bold', fontSize: 15, color: '#000' },
  adminLinkSub: { fontSize: 12, color: '#888' }
});