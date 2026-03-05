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

export default function AddSocioScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  
  const [newSocio, setNewSocio] = useState({
    full_name: '',
    cpf: '',
    email: '',
    phone: '',
    birth_date: '',
    password: '',
    role: 'socio',
    // Novos campos baseados no seu banco:
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    membership_type: 'Padrão'
  });

  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false, uppercase: false, lowercase: false, number: false, special: false,
  });

  const isPasswordValid = Object.values(passwordRequirements).every(req => req);
  const passwordsMatch = newSocio.password === confirmPassword;
  const showMatchError = confirmPassword.length > 0 && !passwordsMatch;

  const formatDateToISO = (dateStr: string) => {
    if (!dateStr) return null;
    const [day, month, year] = dateStr.split('/');
    
    // Garante que o ano tenha 4 dígitos (ex: 17 vira 2017)
    const fullYear = year?.length === 2 ? `20${year}` : year;
    
    // Retorna no formato YYYY-MM-DD que o banco exige
    return `${fullYear}-${month}-${day}`;
    };

  // --- MÁSCARAS ---
  const maskCPF = (t: string) => t.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').substring(0, 14);
  const maskPhone = (t: string) => t.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').substring(0, 15);
  const maskDate = (t: string) => t.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2').substring(0, 10);

  const checkPassword = (pass: string) => {
    setNewSocio({ ...newSocio, password: pass });
    if (pass.length === 0) {
      setPasswordRequirements({ length: false, uppercase: false, lowercase: false, number: false, special: false });
      return;
    }
    setPasswordRequirements({
      length: pass.length >= 6 && pass.length <= 8,
      uppercase: /[A-Z]/.test(pass),
      lowercase: /[a-z]/.test(pass),
      number: /[0-9]/.test(pass),
      special: /[@$!%*?&#]/.test(pass),
    });
  };

  async function handleAddSocio() {
    const { full_name, email, password, cpf, phone, birth_date, role, street, number, neighborhood, city, state, membership_type } = newSocio;
    const rawCPF = cpf.replace(/\D/g, '');

    if (!full_name || !email || !password || rawCPF.length !== 11) {
      Alert.alert("Erro", "Nome, E-mail, Senha e CPF são obrigatórios.");
      return;
    }

    try {
      setSaving(true);

      // 2. Crie o cliente que não persiste sessão
      const tempSupabase = createTempClient();

      // 3. Use o tempSupabase para o signUp
        const { data: authData, error: authError } = await tempSupabase.auth.signUp({
        email, 
        password, 
        options: { data: { full_name } }
        });

      if (authError) throw authError;

      if (authData.user) {
      // 4. Para o UPDATE no banco, você pode usar o cliente principal (supabase)
      // pois o Admin tem permissão para editar perfis (se o RLS permitir)
      // OU continuar usando o tempSupabase, já que ele retornou o user.id
      const { error: profileError } = await tempSupabase
        .from('profiles')
        .update({
          full_name,
          cpf: rawCPF,
          phone: phone.replace(/\D/g, ''),
          birth_date: formatDateToISO(birth_date),
          role: 'socio',
          is_active: true,
          is_admin: false,
          street,
          number,
          neighborhood,
          city,
          state,
          membership_type,
          join_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;
    }

    Alert.alert("Sucesso", "Sócio cadastrado! Você continua logado como Admin.");
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
        <Text style={styles.headerTitle}>Novo Cadastro</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* SEÇÃO 1: DADOS PESSOAIS */}
          <View style={styles.sectionHeader}>
            <Ionicons name="person" size={18} color="#D4AF37" />
            <Text style={styles.sectionTitle}>Dados Pessoais</Text>
          </View>
          
          <View style={styles.mainCard}>
            <Text style={styles.label}>Nome Completo *</Text>
            <TextInput style={styles.input} value={newSocio.full_name} onChangeText={(t) => setNewSocio({...newSocio, full_name: t})} placeholder="Ex: João Silva" />

            <View style={styles.row}>
              <View style={{ flex: 1.2, marginRight: 10 }}>
                <Text style={styles.label}>CPF *</Text>
                <TextInput style={styles.input} value={newSocio.cpf} keyboardType="numeric" onChangeText={(t) => setNewSocio({...newSocio, cpf: maskCPF(t)})} placeholder="000.000.000-00" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Nascimento</Text>
                <TextInput style={styles.input} value={newSocio.birth_date} keyboardType="numeric" onChangeText={(t) => setNewSocio({...newSocio, birth_date: maskDate(t)})} placeholder="DD/MM/AAAA" />
              </View>
            </View>

            <Text style={styles.label}>E-mail *</Text>
            <TextInput style={styles.input} value={newSocio.email} autoCapitalize="none" keyboardType="email-address" onChangeText={(t) => setNewSocio({...newSocio, email: t})} placeholder="email@exemplo.com" />
            
            <Text style={styles.label}>Telefone</Text>
            <TextInput style={styles.input} value={newSocio.phone} keyboardType="phone-pad" onChangeText={(t) => setNewSocio({...newSocio, phone: maskPhone(t)})} placeholder="(00) 00000-0000" />
          </View>

          {/* SEÇÃO 2: ENDEREÇO */}
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={18} color="#D4AF37" />
            <Text style={styles.sectionTitle}>Endereço</Text>
          </View>

          <View style={styles.mainCard}>
            <View style={styles.row}>
              <View style={{ flex: 3, marginRight: 10 }}>
                <Text style={styles.label}>Rua</Text>
                <TextInput style={styles.input} value={newSocio.street} onChangeText={(t) => setNewSocio({...newSocio, street: t})} placeholder="Logradouro" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Nº</Text>
                <TextInput style={styles.input} value={newSocio.number} onChangeText={(t) => setNewSocio({...newSocio, number: t})} placeholder="00" />
              </View>
            </View>
            
            <Text style={styles.label}>Bairro</Text>
            <TextInput style={styles.input} value={newSocio.neighborhood} onChangeText={(t) => setNewSocio({...newSocio, neighborhood: t})} placeholder="Ex: Centro" />

            <View style={styles.row}>
              <View style={{ flex: 2, marginRight: 10 }}>
                <Text style={styles.label}>Cidade</Text>
                <TextInput style={styles.input} value={newSocio.city} onChangeText={(t) => setNewSocio({...newSocio, city: t})} placeholder="Cidade" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Estado (UF)</Text>
                <TextInput style={styles.input} value={newSocio.state} onChangeText={(t) => setNewSocio({...newSocio, state: t})} placeholder="RJ" maxLength={2} autoCapitalize="characters" />
              </View>
            </View>
          </View>

          {/* SEÇÃO 3: SEGURANÇA */}
          <View style={styles.sectionHeader}>
            <Ionicons name="lock-closed" size={18} color="#D4AF37" />
            <Text style={styles.sectionTitle}>Segurança</Text>
          </View>

          <View style={styles.mainCard}>
            <Text style={styles.label}>Senha de Acesso *</Text>
            <View style={styles.passwordContainer}>
              <TextInput style={[styles.input, { flex: 1, borderWidth: 0, marginBottom: 0 }]} value={newSocio.password} secureTextEntry={!showPassword} onChangeText={checkPassword} onFocus={() => setIsPasswordFocused(true)} onBlur={() => setIsPasswordFocused(false)} placeholder="6 a 8 dígitos" textContentType="oneTimeCode" />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}><Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#999" /></TouchableOpacity>
            </View>

            {isPasswordFocused && (
              <View style={styles.requirementsContainer}>
                <RequirementItem met={passwordRequirements.length} text="6 a 8 caracteres" />
                <RequirementItem met={passwordRequirements.uppercase} text="Maiúscula" />
                <RequirementItem met={passwordRequirements.lowercase} text="Minúscula" />
                <RequirementItem met={passwordRequirements.number} text="Número" />
                <RequirementItem met={passwordRequirements.special} text="Especial (@$!%*?&)" />
              </View>
            )}

            <Text style={styles.label}>Confirmar Senha *</Text>
            <View style={[styles.passwordContainer, showMatchError && { borderColor: '#E53935', borderWidth: 1.5 }]}>
              <TextInput style={[styles.input, { flex: 1, borderWidth: 0, marginBottom: 0 }]} value={confirmPassword} secureTextEntry={!showPassword} onChangeText={setConfirmPassword} placeholder="Repetir senha" />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}><Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#999" /></TouchableOpacity>
            </View>
            {showMatchError && (
              <View style={styles.errorContainer}>
                <Ionicons name="warning" size={14} color="#E53935" />
                <Text style={styles.errorText}>As senhas não coincidem</Text>
              </View>
            )}

            <TouchableOpacity 
              style={[styles.saveButton, (saving || !isPasswordValid || !passwordsMatch) && { backgroundColor: '#CCC' }]} 
              onPress={handleAddSocio} disabled={saving || !isPasswordValid || !passwordsMatch}
            >
              {saving ? <ActivityIndicator color="#FFF" /> : (
                <View style={styles.buttonInner}>
                  <Text style={styles.saveButtonText}>FINALIZAR CADASTRO</Text>
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
  errorContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, marginLeft: 5 },
  errorText: { color: '#E53935', fontSize: 11, fontWeight: '600', marginLeft: 5 },
});