import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform 
} from 'react-native';
import { supabase, createTempClient } from '../../services/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const RequirementItem = ({ met, text }: { met: boolean, text: string }) => (
  <View style={styles.requirementRow}>
    <Ionicons 
      name={met ? "checkmark-circle" : "close-circle-outline"} 
      size={14} 
      color={met ? "#2E7D32" : "#D1D1D1"} 
    />
    <Text style={[styles.requirementText, { color: met ? "#2E7D32" : "#999" }]}>
      {text}
    </Text>
  </View>
);

export default function AddEntregadorScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  
  const [newEntregador, setNewEntregador] = useState({
    full_name: '',
    cpf: '',
    email: '',
    phone: '',
    birth_date: '',
    password: '',
    role: 'entregador',
    vehicle_plate: '', // Campo extra para entregadores
  });

  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false, uppercase: false, lowercase: false, number: false, special: false,
  });

  const isPasswordValid = Object.values(passwordRequirements).every(req => req);
  const passwordsMatch = newEntregador.password === confirmPassword;
  const showMatchError = confirmPassword.length > 0 && !passwordsMatch;

  // --- UTILITÁRIOS E MÁSCARAS ---
  const maskCPF = (t: string) => t.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').substring(0, 14);
  const maskPhone = (t: string) => t.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').substring(0, 15);
  const maskDate = (t: string) => t.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2').substring(0, 10);

  const checkPassword = (pass: string) => {
    setNewEntregador({ ...newEntregador, password: pass });
    setPasswordRequirements({
      length: pass.length >= 6 && pass.length <= 10,
      uppercase: /[A-Z]/.test(pass),
      lowercase: /[a-z]/.test(pass),
      number: /[0-9]/.test(pass),
      special: /[@$!%*?&#]/.test(pass),
    });
  };

  const validateCPF = (cpf: string) => {
    const cleanCPF = cpf.replace(/\D/g, '');
    if (cleanCPF.length !== 11 || !!cleanCPF.match(/(\d)\1{10}/)) return false;
    const digits = cleanCPF.split('').map(Number);
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += digits[i] * (10 - i);
    let check1 = (sum * 10) % 11;
    if (check1 === 10 || check1 === 11) check1 = 0;
    if (check1 !== digits[9]) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += digits[i] * (11 - i);
    let check2 = (sum * 10) % 11;
    if (check2 === 10 || check2 === 11) check2 = 0;
    if (check2 !== digits[10]) return false;
    return true;
  };

  async function handleAddEntregador() {
    const { full_name, email, password, cpf, phone, birth_date, role } = newEntregador;
    const rawCPF = cpf.replace(/\D/g, '');

    if (!full_name || !email || !password || rawCPF.length !== 11) {
      Alert.alert("Erro", "Nome, E-mail, Senha e CPF são obrigatórios.");
      return;
    }

    if (!validateCPF(rawCPF)) {
      Alert.alert("CPF Inválido", "O número de CPF informado não é válido.");
      return;
    }

    try {
      setSaving(true);
      const tempSupabase = createTempClient();

      // 1. Criar no Auth
      const { data: authData, error: authError } = await tempSupabase.auth.signUp({
        email, 
        password, 
        options: { data: { full_name, role: 'entregador' } }
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Atualizar o Profile unificado
        const { error: profileError } = await tempSupabase
          .from('profiles')
          .update({
            full_name,
            cpf: rawCPF,
            phone: phone.replace(/\D/g, ''),
            role: 'entregador',
            ativo: true,
            is_active: true, // Mantendo compatibilidade com suas colunas
          })
          .eq('id', authData.user.id);

        if (profileError) throw profileError;
      }

      Alert.alert("Sucesso", "Entregador cadastrado com sucesso!");
      navigation.goBack();

    } catch (error: any) {
      Alert.alert("Erro", error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Novo Entregador</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.sectionHeader}>
            <Ionicons name="bicycle" size={18} color="#D4AF37" />
            <Text style={styles.sectionTitle}>Dados do Entregador</Text>
          </View>
          
          <View style={styles.mainCard}>
            <Text style={styles.label}>Nome Completo *</Text>
            <TextInput style={styles.input} value={newEntregador.full_name} onChangeText={(t) => setNewEntregador({...newEntregador, full_name: t})} placeholder="Nome do entregador" />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.label}>CPF *</Text>
                <TextInput 
                  style={[styles.input, newEntregador.cpf.length === 14 && !validateCPF(newEntregador.cpf) && { borderColor: '#E53935' }]} 
                  value={newEntregador.cpf}
                  keyboardType="numeric"
                  onChangeText={(t) => setNewEntregador({...newEntregador, cpf: maskCPF(t)})}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>WhatsApp</Text>
                <TextInput style={styles.input} value={newEntregador.phone} keyboardType="phone-pad" onChangeText={(t) => setNewEntregador({...newEntregador, phone: maskPhone(t)})} placeholder="(00) 00000-0000" />
              </View>
            </View>

            <Text style={styles.label}>E-mail de Acesso *</Text>
            <TextInput style={styles.input} value={newEntregador.email} autoCapitalize="none" keyboardType="email-address" onChangeText={(t) => setNewEntregador({...newEntregador, email: t})} placeholder="email@entregador.com" />
          </View>

          <View style={styles.sectionHeader}>
            <Ionicons name="lock-closed" size={18} color="#D4AF37" />
            <Text style={styles.sectionTitle}>Segurança</Text>
          </View>

          <View style={styles.mainCard}>
            <Text style={styles.label}>Senha Temporária *</Text>
            <View style={styles.passwordContainer}>
              <TextInput 
                style={[styles.input, { flex: 1, borderWidth: 0, marginBottom: 0 }]} 
                value={newEntregador.password} 
                secureTextEntry={!showPassword} 
                onChangeText={checkPassword} 
                onFocus={() => setIsPasswordFocused(true)} 
                onBlur={() => setIsPasswordFocused(false)} 
                placeholder="6 a 10 dígitos" 
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#999" />
              </TouchableOpacity>
            </View>

            {isPasswordFocused && (
              <View style={styles.requirementsContainer}>
                <RequirementItem met={passwordRequirements.length} text="6 a 10 caracteres" />
                <RequirementItem met={passwordRequirements.uppercase} text="Maiúscula" />
                <RequirementItem met={passwordRequirements.lowercase} text="Minúscula" />
                <RequirementItem met={passwordRequirements.number} text="Número" />
                <RequirementItem met={passwordRequirements.special} text="Especial (@$!%*?&)" />
              </View>
            )}

            <Text style={styles.label}>Confirmar Senha *</Text>
            <View style={[styles.passwordContainer, showMatchError && { borderColor: '#E53935' }]}>
              <TextInput style={[styles.input, { flex: 1, borderWidth: 0, marginBottom: 0 }]} value={confirmPassword} secureTextEntry={!showPassword} onChangeText={setConfirmPassword} placeholder="Repetir senha" />
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, (saving || !isPasswordValid || !passwordsMatch) && { backgroundColor: '#CCC' }]} 
              onPress={handleAddEntregador} disabled={saving || !isPasswordValid || !passwordsMatch}
            >
              {saving ? <ActivityIndicator color="#FFF" /> : (
                <View style={styles.buttonInner}>
                  <Text style={styles.saveButtonText}>CADASTRAR ENTREGADOR</Text>
                  <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                </View>
              )}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  backButton: { padding: 8, backgroundColor: '#FFF', borderRadius: 12, elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
  scrollContent: { padding: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 10, marginLeft: 5 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#1A1A1A', marginLeft: 8, textTransform: 'uppercase' },
  mainCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, elevation: 3, borderWidth: 1, borderColor: '#F0F0F0', marginBottom: 20 },
  label: { fontSize: 11, fontWeight: '700', color: '#666', marginBottom: 6, marginLeft: 4 },
  input: { backgroundColor: '#F9FAFB', padding: 14, borderRadius: 12, fontSize: 14, color: '#1A1A1A', borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 15 },
  row: { flexDirection: 'row' },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 10 },
  eyeIcon: { paddingHorizontal: 12 },
  requirementsContainer: { marginBottom: 15, paddingHorizontal: 5 },
  requirementRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  requirementText: { fontSize: 11, marginLeft: 6, fontWeight: '500' },
  saveButton: { backgroundColor: '#1A1A1A', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 10 },
  buttonInner: { flexDirection: 'row', alignItems: 'center' },
  saveButtonText: { color: '#FFF', fontWeight: '800', fontSize: 14, marginRight: 8 },
});