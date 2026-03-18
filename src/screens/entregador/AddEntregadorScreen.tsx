import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform 
} from 'react-native';
import { supabase } from '../../services/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RegisterEntregadorScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    cpf: '',
    phone: '',
    password: '',
    cnh_numero: '',
    veiculo_tipo: '',
    veiculo_placa: ''
  });

  const maskCPF = (t: string) => t.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4").substring(0, 14);
  const maskPlaca = (t: string) => t.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 7);

  async function handleRegister() {
    if (!form.full_name || !form.email || !form.password || !form.cpf) {
      return Alert.alert("Erro", "Nome, E-mail, Senha e CPF são obrigatórios.");
    }

    setLoading(true);
    try {
      // 1. Cadastro no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.full_name, role: 'entregador' } }
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Inserção na tabela específica de entregadores
        const { error: dbError } = await supabase
          .from('entregadores')
          .insert({
            id: authData.user.id,
            email: form.email.toLowerCase(),
            full_name: form.full_name,
            cpf: form.cpf.replace(/\D/g, ''),
            phone: form.phone.replace(/\D/g, ''),
            cnh_numero: form.cnh_numero,
            veiculo_tipo: form.veiculo_tipo,
            veiculo_placa: form.veiculo_placa.toUpperCase(),
            is_active: true
          });

        if (dbError) throw dbError;

        Alert.alert("Sucesso", "Cadastro de entregador realizado!");
        navigation.navigate('Login');
      }
    } catch (error: any) {
      Alert.alert("Erro no cadastro", error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>

        <Text style={styles.title}>CADASTRO ENTREGADOR</Text>
        <Text style={styles.subtitle}>Seja um parceiro logístico da Capitania</Text>

        <View style={styles.section}>
          <Text style={styles.label}>NOME COMPLETO *</Text>
          <TextInput style={styles.input} value={form.full_name} onChangeText={v => setForm({...form, full_name: v})} placeholder="Nome conforme CNH" />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.label}>CPF *</Text>
              <TextInput style={styles.input} value={form.cpf} keyboardType="numeric" onChangeText={v => setForm({...form, cpf: maskCPF(v)})} placeholder="000.000..." />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>CNH</Text>
              <TextInput style={styles.input} value={form.cnh_numero} keyboardType="numeric" onChangeText={v => setForm({...form, cnh_numero: v})} placeholder="Nº Registro" />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados do Veículo</Text>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.label}>TIPO (MOTO/CARRO)</Text>
              <TextInput style={styles.input} value={form.veiculo_tipo} onChangeText={v => setForm({...form, veiculo_tipo: v})} placeholder="Ex: Moto" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>PLACA</Text>
              <TextInput style={styles.input} value={form.veiculo_placa} onChangeText={v => setForm({...form, veiculo_placa: maskPlaca(v)})} placeholder="ABC1D23" />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acesso</Text>
          <Text style={styles.label}>E-MAIL *</Text>
          <TextInput style={styles.input} autoCapitalize="none" value={form.email} onChangeText={v => setForm({...form, email: v})} placeholder="email@exemplo.com" />
          
          <Text style={styles.label}>SENHA *</Text>
          <TextInput style={styles.input} secureTextEntry value={form.password} onChangeText={v => setForm({...form, password: v})} placeholder="Mínimo 6 dígitos" />
        </View>

        <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#D4AF37" /> : <Text style={styles.btnText}>CADASTRAR ENTREGADOR</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { padding: 25 },
  backBtn: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '900', color: '#000' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 30 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: '#1A1A1A', borderLeftWidth: 3, borderLeftColor: '#D4AF37', paddingLeft: 10 },
  label: { fontSize: 10, fontWeight: 'bold', color: '#444', marginBottom: 5 },
  input: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#DDD', marginBottom: 15, fontSize: 14 },
  row: { flexDirection: 'row' },
  btn: { backgroundColor: '#000', padding: 20, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#D4AF37', fontWeight: 'bold', fontSize: 16 }
});