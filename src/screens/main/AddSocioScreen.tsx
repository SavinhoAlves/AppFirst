import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { supabase } from '../../services/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AddSocioScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [saving, setSaving] = useState(false);
  
  const [newSocio, setNewSocio] = useState({
    full_name: '',
    cpf: '',
    email: '',
    role: 'socio',
    is_active: true
  });

  async function handleAddSocio() {
    if (!newSocio.full_name || !newSocio.cpf || !newSocio.email) {
      Alert.alert("Campos obrigatórios", "Por favor, preencha nome, CPF e e-mail.");
      return;
    }

    try {
      setSaving(true);
      
      // Inserção direta na tabela profiles
      const { error } = await supabase
        .from('profiles')
        .insert([{
          ...newSocio,
          updated_at: new Date()
        }]);

      if (error) throw error;

      Alert.alert(
        "Sucesso", 
        "Sócio cadastrado com sucesso!",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
      
    } catch (error: any) {
      Alert.alert("Erro ao salvar", error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* HEADER PERSONALIZADO */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Novo Sócio</Text>
        <View style={{ width: 40 }} /> {/* Equilíbrio visual */}
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Informações Pessoais</Text>
            
            <Text style={styles.label}>Nome Completo</Text>
            <TextInput 
              style={styles.input} 
              value={newSocio.full_name}
              onChangeText={(t) => setNewSocio({...newSocio, full_name: t})}
              placeholder="Ex: João Silva"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>CPF</Text>
            <TextInput 
              style={styles.input} 
              value={newSocio.cpf}
              keyboardType="numeric"
              onChangeText={(t) => setNewSocio({...newSocio, cpf: t})}
              placeholder="000.000.000-00"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>E-mail</Text>
            <TextInput 
              style={styles.input} 
              value={newSocio.email}
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={(t) => setNewSocio({...newSocio, email: t})}
              placeholder="email@exemplo.com"
              placeholderTextColor="#999"
            />

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={20} color="#D4AF37" />
              <Text style={styles.infoText}>
                O sócio será cadastrado como "Ativo" por padrão e terá acesso às vantagens da Capitânia.
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, saving && { opacity: 0.7 }]} 
            onPress={handleAddSocio}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.saveButtonText}>CONFIRMAR CADASTRO</Text>
                <Ionicons name="checkmark-circle" size={20} color="#FFF" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingVertical: 15 
  },
  backButton: { 
    padding: 8, 
    backgroundColor: '#FFF', 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#EEE' 
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
  scrollContent: { padding: 20 },
  card: { 
    backgroundColor: '#FFF', 
    borderRadius: 20, 
    padding: 20, 
    borderWidth: 1, 
    borderColor: '#EEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#D4AF37', 
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  label: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#666', 
    marginBottom: 8, 
    marginTop: 15 
  },
  input: { 
    backgroundColor: '#F8F9FA', 
    padding: 15, 
    borderRadius: 12, 
    fontSize: 16, 
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF9E6',
    padding: 15,
    borderRadius: 12,
    marginTop: 25,
    alignItems: 'center'
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#856404',
    marginLeft: 10,
    lineHeight: 18
  },
  saveButton: { 
    backgroundColor: '#1A1A1A', 
    padding: 20, 
    borderRadius: 15, 
    flexDirection: 'row',
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5
  },
  saveButtonText: { color: '#FFF', fontWeight: '800', fontSize: 16, letterSpacing: 1 }
});