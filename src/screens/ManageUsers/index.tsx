import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function ManageUsers() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setUsers(data);
  }

  async function toggleRole(userId: string, currentRole: string, userEmail: string) {
    // Proteção Master: Você não deixa ninguém alterar o SEU e-mail (coloque seu e-mail aqui)
    if (userEmail === 'savioalves169@gmail.com') {
      return Alert.alert('Acesso Negado', 'O Administrador Master não pode ter seu poder alterado.');
    }

    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (!error) fetchUsers(); // Atualiza a lista
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestão de Sócios</Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.userCard}>
            <View>
              <Text style={styles.email}>{item.email}</Text>
              <Text style={styles.roleText}>Cargo: {item.role.toUpperCase()}</Text>
            </View>
            <TouchableOpacity 
              onPress={() => toggleRole(item.id, item.role, item.email)}
              style={[styles.roleBtn, { backgroundColor: item.role === 'admin' ? '#EF4444' : '#10B981' }]}
            >
              <Text style={{color: '#FFF'}}>{item.role === 'admin' ? 'Tirar Admin' : 'Tornar Admin'}</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F9FAFB', paddingTop: 60 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  userCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  email: { fontWeight: 'bold' },
  roleText: { color: '#666', fontSize: 12 },
  roleBtn: { padding: 8, borderRadius: 6 }
});