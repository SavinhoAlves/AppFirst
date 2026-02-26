import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../../services/supabase'; 
import { useNavigation } from '@react-navigation/native';

const logoImg = require('../../assets/img/logo-capitania-2.png');

export default function LoginScreen() {
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const navigation = useNavigation<any>();

  const handleLogin = async () => {
    if (!cpf || !password) return Alert.alert("Atenção", "Preencha o CPF e a senha.");
    setLoading(true);
    try {
      const { data: profile } = await supabase.from('profiles').select('email').eq('cpf', cpf).single();
      if (!profile) {
        Alert.alert("Erro", "Sócio não encontrado.");
        setLoading(false); return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email: profile.email, password: password });
      if (error) Alert.alert("Erro", "Credenciais incorretas.");
    } catch (err) { Alert.alert("Erro", "Falha de conexão."); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.inner}>
        <Image source={logoImg} style={styles.logo} resizeMode="contain" />
        
        <Text style={styles.welcomeText}>CAPITANIA</Text>
        <Text style={styles.subWelcome}>CRUZ DE MALTE</Text>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>CPF DO SÓCIO</Text>
            <TextInput 
              style={[styles.input, focusedField === 'cpf' && styles.inputFocused]}
              placeholder="000.000.000-00"
              placeholderTextColor="#666"
              value={cpf}
              onChangeText={setCpf}
              keyboardType="numeric"
              onFocus={() => setFocusedField('cpf')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>SENHA</Text>
            <TextInput 
              style={[styles.input, focusedField === 'pass' && styles.inputFocused]}
              placeholder="••••••••"
              placeholderTextColor="#666"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocusedField('pass')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          {/* Botão Branco - Estilo Premium Vasco */}
          <TouchableOpacity style={styles.button} onPress={handleLogin} activeOpacity={0.9} disabled={loading}>
            {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>ACESSAR CAPITANIA</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.footerLink}>
          <Text style={styles.footerText}>Não tem uma conta? <Text style={styles.whiteText}>Cadastre-se</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F0F' }, // Cinza quase preto, evita o "preto puro" do rival
  inner: { flex: 1, justifyContent: 'center', padding: 35 },
  logo: { width: 120, height: 120, alignSelf: 'center', marginBottom: 15 },
  welcomeText: { color: '#FFF', fontSize: 28, fontWeight: '900', textAlign: 'center', letterSpacing: 2 },
  subWelcome: { color: '#D4AF37', fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 40, letterSpacing: 4 },
  form: { width: '100%' },
  inputContainer: { marginBottom: 25 },
  label: { color: '#AAA', fontSize: 11, fontWeight: 'bold', marginBottom: 8, letterSpacing: 1.5 },
  input: { 
    backgroundColor: 'transparent', 
    color: '#FFF', 
    paddingVertical: 12, 
    fontSize: 18, 
    borderBottomWidth: 1.5, 
    borderColor: '#333' 
  },
  inputFocused: { borderColor: '#FFF' }, // Brilha em branco ao focar
  button: { 
    backgroundColor: '#FFF', // Botão Branco para destacar do rival
    padding: 20, 
    borderRadius: 5, // Bordas mais retas lembram a tradição
    alignItems: 'center', 
    marginTop: 20,
    shadowColor: '#FFF', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5
  },
  buttonText: { color: '#000', fontWeight: '900', fontSize: 15, letterSpacing: 2 },
  footerLink: { marginTop: 40, alignSelf: 'center' },
  footerText: { color: '#666', fontSize: 14 },
  whiteText: { color: '#D4AF37', fontWeight: 'bold' }
});