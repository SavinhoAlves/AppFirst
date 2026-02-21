import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, TextInput, Modal, Pressable, Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

export default function GestaoMembros({ navigation }: any) {
  const [membros, setMembros] = useState<any[]>([]);
  const [membrosFiltrados, setMembrosFiltrados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMembro, setSelectedMembro] = useState<any>(null);
  const [userLogadoPerfil, setUserLogadoPerfil] = useState<any>(null);

  // CONFIGURAÇÃO MASTER (Conforme definido em suas instruções)
  const MASTER_EMAIL = 'savioalves169@gmail.com';

  useEffect(() => {
    getPerfilLogado();
    fetchMembros();

    const channel = supabase
      .channel('lista-socios')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => fetchMembros()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const filtrados = membros.filter((m) => 
      m.full_name?.toLowerCase().includes(busca.toLowerCase()) || 
      m.email?.toLowerCase().includes(busca.toLowerCase())
    );
    setMembrosFiltrados(filtrados);
  }, [busca, membros]);

  async function getPerfilLogado() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setUserLogadoPerfil(profile);
    }
  }

  async function fetchMembros() {
    const { data } = await supabase.from('profiles').select('*').order('full_name');
    if (data) {
      setMembros(data);
      setMembrosFiltrados(data);
    }
    setLoading(false);
  }

  async function alterarStatus() {
    if (!selectedMembro) return;
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !selectedMembro.is_active })
      .eq('id', selectedMembro.id);
    
    if (!error) setModalVisible(false);
  }

async function alterarCargo(novoRole: 'socio' | 'admin') {
  if (!selectedMembro) return;

  // Proteção Master
  if (selectedMembro.email === MASTER_EMAIL || selectedMembro.role === 'master') {
    Alert.alert("Negado", "Não é possível alterar o cargo de um Master.");
    return;
  }

  // Mapeia o role para o booleano is_admin por segurança
  const isAdminBool = novoRole === 'admin';

  try {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        role: novoRole, 
        is_admin: isAdminBool // Atualiza ambos simultaneamente
      })
      .eq('id', selectedMembro.id);

    if (error) {
      console.error("Erro ao atualizar:", error.message);
      Alert.alert("Erro no Supabase", error.message);
    } else {
      setModalVisible(false);
      // O fetchMembros() será chamado pelo canal de Realtime automaticamente
      Alert.alert("Sucesso", `Usuário atualizado para ${novoRole}`);
    }
  } catch (err) {
    Alert.alert("Erro", "Falha na conexão.");
  }
}

  async function removerMembro() {
    if (!selectedMembro) return;
    if (selectedMembro.role === 'master' || selectedMembro.email === MASTER_EMAIL) {
      Alert.alert("Erro", "O perfil Master não pode ser removido.");
      return;
    }

    Alert.alert("Excluir", "Deseja remover este sócio permanentemente?", [
      { text: "Cancelar", style: "cancel" },
      { 
        text: "Excluir", 
        style: "destructive", 
        onPress: async () => {
          const { error } = await supabase.from('profiles').delete().eq('id', selectedMembro.id);
          if (!error) setModalVisible(false);
        }
      }
    ]);
  }

  const renderMembro = ({ item }: any) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => {
        setSelectedMembro(item);
        setModalVisible(true);
      }}
    >
      <View style={[styles.statusIndicator, { backgroundColor: item.is_active ? '#22C55E' : '#EF4444' }]} />
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.full_name?.charAt(0) || 'V'}</Text>
      </View>
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{item.full_name}</Text>
          {/* ICONES POR ROLE */}
          {(item.role === 'master' || item.email === MASTER_EMAIL) ? (
            <Ionicons name="ribbon" size={16} color="#D4AF37" style={{ marginLeft: 6 }} />
          ) : item.role === 'admin' ? (
            <Ionicons name="shield-checkmark" size={14} color="#D4AF37" style={{ marginLeft: 6 }} />
          ) : null}
        </View>
        <Text style={styles.email}>{item.email}</Text>
      </View>
      <Ionicons name="ellipsis-horizontal" size={20} color="#CCC" />
    </TouchableOpacity>
  );

  // Verificação de poder Master
  const isMasterLogado = userLogadoPerfil?.role === 'master' || userLogadoPerfil?.email === MASTER_EMAIL;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sócios</Text>
        <TouchableOpacity style={styles.btnAdd} onPress={() => navigation.navigate('AdminRegister')}>
          <Ionicons name="add" size={28} color="#D4AF37" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" />
        <TextInput 
          style={styles.input} 
          placeholder="Buscar vascaíno..." 
          value={busca}
          onChangeText={setBusca}
          placeholderTextColor="#888"
        />
      </View>

      {loading ? <ActivityIndicator color="#000" style={{marginTop: 50}} /> : (
        <FlatList 
          data={membrosFiltrados}
          keyExtractor={(item) => item.id}
          renderItem={renderMembro}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
            <View style={styles.modalContent}>
            <View style={styles.modalIndicator} />
            
            <Text style={styles.modalTitle}>
                {selectedMembro?.full_name}
                {(selectedMembro?.role === 'master' || selectedMembro?.email === MASTER_EMAIL) && " (MASTER)"}
            </Text>
            <Text style={styles.modalSubtitle}>{selectedMembro?.email}</Text>

            {/* 1. SE O MEMBRO SELECIONADO FOR O MASTER: BLOQUEIO TOTAL */}
            {(selectedMembro?.role === 'master' || selectedMembro?.email === MASTER_EMAIL) ? (
                <View style={styles.masterProtection}>
                <Ionicons name="lock-closed" size={20} color="#888" />
                <Text style={styles.masterProtectionText}>Este perfil possui proteção Master.</Text>
                </View>
            ) : 
            /* 2. SE O MEMBRO SELECIONADO FOR VOCÊ MESMO: BLOQUEIO DE AUTO-GESTÃO */
            (selectedMembro?.id === userLogadoPerfil?.id) ? (
                <View style={styles.masterProtection}>
                <Ionicons name="person-circle-outline" size={20} color="#888" />
                <Text style={styles.masterProtectionText}>Você não pode alterar seu próprio status.</Text>
                </View>
            ) : (
                /* 3. OPÇÕES LIBERADAS PARA OUTROS MEMBROS */
                <>
                <TouchableOpacity style={styles.modalOption} onPress={alterarStatus}>
                    <Ionicons 
                    name={selectedMembro?.is_active ? "close-circle-outline" : "checkmark-circle-outline"} 
                    size={24} color={selectedMembro?.is_active ? "#EF4444" : "#22C55E"} 
                    />
                    <Text style={styles.modalOptionText}>
                    {selectedMembro?.is_active ? "Desativar Membro" : "Ativar Membro"}
                    </Text>
                </TouchableOpacity>

                {/* GESTÃO DE CARGOS: APENAS O MASTER PODE ALTERAR CARGOS */}
                {(userLogadoPerfil?.role === 'master' || userLogadoPerfil?.email === MASTER_EMAIL) && (
                    <TouchableOpacity 
                    style={[styles.modalOption, { marginTop: 10, borderColor: '#D4AF37', borderWidth: selectedMembro?.role === 'socio' ? 1 : 0 }]} 
                    onPress={() => alterarCargo(selectedMembro?.role === 'admin' ? 'socio' : 'admin')}
                    >
                    <Ionicons 
                        name={selectedMembro?.role === 'admin' ? "arrow-down-circle-outline" : "shield-checkmark"} 
                        size={24} 
                        color={selectedMembro?.role === 'admin' ? "#666" : "#D4AF37"} 
                    />
                    <Text style={styles.modalOptionText}>
                        {selectedMembro?.role === 'admin' ? "Rebaixar para Sócio" : "Tornar Administrador"}
                    </Text>
                    </TouchableOpacity>
                )}

                {/* REMOVER: APENAS MASTER OU ADMINS PODEM REMOVER SÓCIOS (MAS ADMIN NÃO REMOVE ADMIN) */}
                {(userLogadoPerfil?.role === 'master' || (userLogadoPerfil?.role === 'admin' && selectedMembro?.role !== 'admin')) && (
                    <TouchableOpacity 
                    style={[styles.modalOption, { marginTop: 10 }]} 
                    onPress={removerMembro}
                    >
                    <Ionicons name="trash-outline" size={24} color="#EF4444" />
                    <Text style={[styles.modalOptionText, { color: '#EF4444' }]}>
                        Remover permanentemente
                    </Text>
                    </TouchableOpacity>
                )}
                </>
            )}

            <TouchableOpacity style={styles.modalClose} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCloseText}>Cancelar</Text>
            </TouchableOpacity>
            </View>
        </Pressable>
        </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', paddingHorizontal: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '900', color: '#000' },
  btnAdd: { backgroundColor: '#000', width: 45, height: 45, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 15, height: 50, marginBottom: 20 },
  input: { flex: 1, marginLeft: 10, fontSize: 16, color: '#000' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F0F0F0' },
  statusIndicator: { width: 4, height: 30, borderRadius: 2, marginRight: 12 },
  avatar: { width: 45, height: 45, borderRadius: 12, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { color: '#D4AF37', fontWeight: 'bold', fontSize: 18 },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontWeight: 'bold', fontSize: 16, color: '#000' },
  email: { color: '#888', fontSize: 13 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, alignItems: 'center' },
  modalIndicator: { width: 40, height: 5, backgroundColor: '#EEE', borderRadius: 10, marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  modalSubtitle: { fontSize: 14, color: '#888', marginBottom: 25 },
  modalOption: { flexDirection: 'row', alignItems: 'center', width: '100%', padding: 18, backgroundColor: '#F9F9F9', borderRadius: 15 },
  modalOptionText: { marginLeft: 15, fontSize: 16, fontWeight: '600', color: '#000' },
  modalClose: { marginTop: 20, padding: 10 },
  modalCloseText: { color: '#888', fontWeight: 'bold' },
  masterProtection: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', padding: 20, borderRadius: 15, width: '100%' },
  masterProtectionText: { marginLeft: 10, color: '#888', fontStyle: 'italic' }
});