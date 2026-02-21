import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    getProfile();
  }, []);

  async function getProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
    }
  }

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('Erro ao sair');
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meu Perfil</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.label}>E-mail</Text>
        <Text style={styles.value}>{profile?.email}</Text>
        
        <View style={styles.divider} />
        
        <Text style={styles.label}>Nome Completo</Text>
        <Text style={styles.value}>{profile?.full_name || 'Não informado'}</Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={20} color="#F87171" />
        <Text style={styles.logoutText}>Sair do Aplicativo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', padding: 25 },
  header: { marginTop: 40, marginBottom: 30 },
  title: { fontSize: 28, fontWeight: '900', color: '#000' },
  infoCard: { backgroundColor: '#F9F9F9', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#EEE' },
  label: { fontSize: 12, color: '#888', fontWeight: 'bold', marginBottom: 5 },
  value: { fontSize: 16, color: '#000', marginBottom: 15 },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 10 },
  logoutBtn: { marginTop: 'auto', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20 },
  logoutText: { color: '#F87171', fontWeight: 'bold', marginLeft: 10 }
});