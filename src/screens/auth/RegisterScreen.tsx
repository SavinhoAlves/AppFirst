import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform 
} from 'react-native';
import { supabase } from '../../services/supabase';
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

export default function RegisterScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  
  const [newSocio, setNewSocio] = useState({
    full_name: '',
    cpf: '',
    email: '',
    phone: '',
    birth_date: '',
    password: '',
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
  });

  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false, uppercase: false, lowercase: false, number: false, special: false,
  });

  // O botão habilita se todos os requisitos de senha forem atendidos
  const isPasswordValid = Object.values(passwordRequirements).every(req => req);

  // --- MÁSCARAS ---
  const maskCPF = (t: string) => t.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').substring(0, 14);
  const maskPhone = (t: string) => t.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').substring(0, 15);
  const maskDate = (t: string) => t.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2').substring(0, 10);

  const formatDateToISO = (dateStr: string) => {
    if (!dateStr || dateStr.length !== 10) return null;
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
  };

  const checkPassword = (pass: string) => {
    setNewSocio({ ...newSocio, password: pass });
    setPasswordRequirements({
      length: pass.length >= 6 && pass.length <= 15,
      uppercase: /[A-Z]/.test(pass),
      lowercase: /[a-z]/.test(pass),
      number: /[0-9]/.test(pass),
      special: /[@$!%*?&#]/.test(pass),
    });
  };

  async function handleRegister() {
    const { full_name, email, password, cpf, phone, birth_date, street, number, neighborhood, city, state } = newSocio;
    const rawCPF = cpf.replace(/\D/g, '');

    if (!full_name || !email || !password || rawCPF.length !== 11) {
      Alert.alert("Erro", "Nome, E-mail, Senha e CPF são obrigatórios.");
      return;
    }

    try {
      setSaving(true);

      // 1. Cadastro no Auth (O Supabase loga o usuário automaticamente aqui)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email, 
        password, 
        options: { data: { full_name } }
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Inserção/Atualização na tabela Profiles
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            full_name,
            email: email.toLowerCase(),
            cpf: rawCPF,
            phone: phone.replace(/\D/g, ''),
            birth_date: formatDateToISO(birth_date),
            street,
            number,
            neighborhood,
            city,
            state: state.toUpperCase().substring(0, 2),
            role: 'socio',
            membership_type: 'Padrão',
            join_date: new Date().toISOString().split('T')[0],
          }, { onConflict: 'id' });

        if (profileError) {
          console.error("Erro no Perfil:", profileError);
          throw profileError;
        }

        // --- SOLUÇÃO PARA A TELA DE FUNDO ---
        // Deslogamos o usuário imediatamente. Isso limpa a sessão 
        // e impede que o navegador de rotas mude para a Home ao fundo.
        await supabase.auth.signOut();

        Alert.alert(
          "Sucesso!", 
          "Seja bem-vindo à Capitania Cruz de Malte! Faça login para continuar.",
          [
            { 
              text: "OK", 
              onPress: () => {
                navigation.navigate('Login'); 
              }
            }
          ]
        );
      }
    } catch (error: any) {
      Alert.alert("Erro no cadastro", error.message);
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
        <Text style={styles.headerTitle}>Novo Sócio</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.sectionHeader}>
            <Ionicons name="person" size={16} color="#B8860B" />
            <Text style={styles.sectionTitle}>Dados Pessoais</Text>
          </View>
          <View style={styles.mainCard}>
            <Text style={styles.label}>Nome Completo *</Text>
            <TextInput style={styles.input} value={newSocio.full_name} onChangeText={(t) => setNewSocio({...newSocio, full_name: t})} placeholder="Seu nome completo" />

            <View style={styles.row}>
              <View style={{ flex: 1.2, marginRight: 10 }}>
                <Text style={styles.label}>CPF *</Text>
                <TextInput style={styles.input} value={newSocio.cpf} keyboardType="numeric" onChangeText={(t) => setNewSocio({...newSocio, cpf: maskCPF(t)})} placeholder="000.000..." maxLength={14} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Nascimento</Text>
                <TextInput style={styles.input} value={newSocio.birth_date} keyboardType="numeric" onChangeText={(t) => setNewSocio({...newSocio, birth_date: maskDate(t)})} placeholder="DD/MM/AAAA" maxLength={10} />
              </View>
            </View>

            <Text style={styles.label}>WhatsApp</Text>
            <TextInput style={styles.input} value={newSocio.phone} keyboardType="phone-pad" onChangeText={(t) => setNewSocio({...newSocio, phone: maskPhone(t)})} placeholder="(00) 00000-0000" />
          </View>

          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={16} color="#B8860B" />
            <Text style={styles.sectionTitle}>Endereço de Entrega</Text>
          </View>
          <View style={styles.mainCard}>
            <View style={styles.row}>
              <View style={{ flex: 3, marginRight: 10 }}>
                <Text style={styles.label}>Rua</Text>
                <TextInput style={styles.input} value={newSocio.street} onChangeText={(t) => setNewSocio({...newSocio, street: t})} placeholder="Logradouro" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Nº</Text>
                <TextInput style={styles.input} value={newSocio.number} onChangeText={(t) => setNewSocio({...newSocio, number: t})} placeholder="70" />
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
                <Text style={styles.label}>UF</Text>
                <TextInput style={styles.input} value={newSocio.state} onChangeText={(t) => setNewSocio({...newSocio, state: t})} placeholder="RJ" maxLength={2} autoCapitalize="characters" />
              </View>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Ionicons name="lock-closed" size={16} color="#B8860B" />
            <Text style={styles.sectionTitle}>Acesso ao App</Text>
          </View>
          <View style={styles.mainCard}>
            <Text style={styles.label}>E-mail *</Text>
            <TextInput style={styles.input} value={newSocio.email} autoCapitalize="none" keyboardType="email-address" onChangeText={(t) => setNewSocio({...newSocio, email: t})} placeholder="exemplo@email.com" />
            
            <Text style={styles.label}>Crie uma Senha *</Text>
            <View style={styles.passwordContainer}>
              <TextInput style={[styles.input, { flex: 1, borderWidth: 0, marginBottom: 0 }]} value={newSocio.password} secureTextEntry={!showPassword} onChangeText={checkPassword} onFocus={() => setIsPasswordFocused(true)} placeholder="6 a 15 dígitos" />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#999" />
              </TouchableOpacity>
            </View>

            <View style={styles.requirementsContainer}>
              <RequirementItem met={passwordRequirements.length} text="6 a 15 caracteres" />
              <RequirementItem met={passwordRequirements.uppercase} text="Letra Maiúscula" />
              <RequirementItem met={passwordRequirements.lowercase} text="Letra Minúscula" />
              <RequirementItem met={passwordRequirements.number} text="Número" />
              <RequirementItem met={passwordRequirements.special} text="Especial (@$!%*?&)" />
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, (saving || !isPasswordValid) && { backgroundColor: '#CCC' }]} 
              onPress={handleRegister} 
              disabled={saving || !isPasswordValid}
            >
              {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>FINALIZAR E ENTRAR</Text>}
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
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#1A1A1A', marginLeft: 8, textTransform: 'uppercase' },
  mainCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, elevation: 3, borderWidth: 1, borderColor: '#F0F0F0', marginBottom: 20 },
  label: { fontSize: 10, fontWeight: '700', color: '#666', marginBottom: 6, marginLeft: 4 },
  input: { backgroundColor: '#F9FAFB', padding: 14, borderRadius: 12, fontSize: 14, color: '#1A1A1A', borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 15 },
  row: { flexDirection: 'row' },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 10 },
  eyeIcon: { paddingHorizontal: 12 },
  requirementsContainer: { marginBottom: 15, paddingHorizontal: 5 },
  requirementRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  requirementText: { fontSize: 11, marginLeft: 6, fontWeight: '500' },
  saveButton: { backgroundColor: '#1A1A1A', paddingVertical: 18, borderRadius: 14, alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: '#D4AF37', fontWeight: '800', fontSize: 14 },
});