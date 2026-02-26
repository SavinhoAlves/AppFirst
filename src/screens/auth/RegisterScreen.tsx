import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image, ScrollView } from 'react-native';
import { supabase } from '../../services/supabase';
import { useNavigation } from '@react-navigation/native';

const logoImg = require('../../assets/img/logo-capitania-2.png');

export default function RegisterScreen() {
  const navigation = useNavigation<any>();
  const [form, setForm] = useState({ cpf: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (!form.cpf || !form.email || !form.password) return Alert.alert('Ops', 'Preencha todos os campos!');
    if (form.password !== form.confirm) return Alert.alert('Erro', 'As senhas são diferentes.');
    
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email: form.email, password: form.password });
      if (error) throw error;
      if (data.user) {
        await supabase.from('profiles').update({ cpf: form.cpf, email: form.email }).eq('id', data.user.id);
        Alert.alert('Sucesso!', 'Seja bem-vindo à Capitania! Verifique seu e-mail.');
        navigation.goBack();
      }
    } catch (e: any) { Alert.alert('Erro', e.message); }
    finally { setLoading(false); }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backBtnText}>← VOLTAR</Text>
      </TouchableOpacity>

      <Text style={styles.title}>CADASTRO DE SÓCIO</Text>
      <Text style={styles.subtitle}>Junte-se à Capitania Cruz de Malte</Text>

      <View style={styles.formCard}>
        {[
          { label: 'NÚMERO DO CPF', key: 'cpf', kType: 'numeric' as const, secure: false },
          { label: 'ENDEREÇO DE E-MAIL', key: 'email', kType: 'email-address' as const, secure: false },
          { label: 'CRIAR SENHA', key: 'password', kType: 'default' as const, secure: true },
          { label: 'CONFIRMAR SENHA', key: 'confirm', kType: 'default' as const, secure: true },
        ].map((item) => (
          <View key={item.key} style={styles.inputGroup}>
            <Text style={styles.label}>{item.label}</Text>
            <TextInput 
              style={styles.input}
              value={(form as any)[item.key]}
              onChangeText={(txt) => setForm({...form, [item.key]: txt})}
              placeholder="Preencha aqui..."
              placeholderTextColor="#444"
              keyboardType={item.kType}
              secureTextEntry={item.secure}
              autoCapitalize="none"
            />
          </View>
        ))}

        <TouchableOpacity style={styles.registerBtn} onPress={handleSignUp} activeOpacity={0.8}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.registerBtnText}>CONFIRMAR ADESÃO</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' }, // Fundo branco na tela de cadastro para inverter o visual
  content: { padding: 30, paddingTop: 60 },
  backBtn: { marginBottom: 30 },
  backBtnText: { color: '#000', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
  title: { color: '#000', fontSize: 26, fontWeight: '900', textAlign: 'left' },
  subtitle: { color: '#888', fontSize: 14, textAlign: 'left', marginBottom: 40 },
  formCard: { width: '100%' },
  inputGroup: { marginBottom: 25 },
  label: { color: '#000', fontSize: 10, fontWeight: 'bold', marginBottom: 5, letterSpacing: 1 },
  input: { 
    backgroundColor: '#F5F5F5', 
    color: '#000', 
    padding: 18, 
    borderRadius: 8, 
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#EEE'
  },
  registerBtn: { 
    backgroundColor: '#000', // Botão preto no fundo branco (Visual clássico da camisa do Vasco)
    padding: 20, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginTop: 20 
  },
  registerBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15, letterSpacing: 2 }
});