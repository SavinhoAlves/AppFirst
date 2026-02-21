import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { CustomInput } from '../../components/CustomInput';
import { supabase } from '../../lib/supabase';

export default function RegisterScreen({ navigation }: any) {
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    // Validação básica
    if (!fullName || !cpf || !email || !password) {
      return Alert.alert('Atenção', 'Todos os campos são obrigatórios.');
    }

    if (cpf.length !== 11) {
      return Alert.alert('Erro', 'O CPF deve conter exatamente 11 dígitos.');
    }

    setLoading(true);
    
    // 1. Cadastra no Supabase Auth com metadados
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          cpf: cpf,
          is_active: false, // Inicia como pendente por segurança (blindagem)
        }
      }
    });

    if (error) {
      Alert.alert('Erro no Cadastro', error.message);
    } else {
      Alert.alert(
        'Cadastro Realizado!', 
        'Agora você já pode entrar com seu CPF e senha. Seu acesso será validado pela Capitania.'
      );
      navigation.navigate('Login');
    }
    setLoading(false);
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Seja um Sócio</Text>
      <Text style={styles.subtitle}>Preencha seus dados para acessar a Capitania.</Text>

      <CustomInput 
        label="Nome Completo" 
        placeholder="Seu nome oficial" 
        value={fullName} 
        onChangeText={setFullName} 
      />

      <CustomInput 
        label="CPF" 
        placeholder="Apenas números" 
        value={cpf} 
        onChangeText={setCpf} 
        keyboardType="numeric"
        maxLength={11}
      />

      <CustomInput 
        label="E-mail" 
        placeholder="exemplo@email.com" 
        value={email} 
        onChangeText={setEmail} 
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <CustomInput 
        label="Senha" 
        placeholder="Mínimo 6 caracteres" 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
      />

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleRegister} 
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#D4AF37" /> : <Text style={styles.buttonText}>Finalizar Cadastro</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.footerLink}>
        <Text style={styles.linkText}>Já tem conta? <Text style={styles.bold}>Entrar com CPF</Text></Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 30, paddingTop: 60, backgroundColor: '#FFF' },
  title: { fontSize: 32, fontWeight: '900', color: '#000', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 30 },
  button: { backgroundColor: '#000', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#D4AF37', fontWeight: 'bold', fontSize: 16 },
  footerLink: { marginTop: 25, paddingBottom: 40 },
  linkText: { color: '#4B5563', textAlign: 'center', fontSize: 15 },
  bold: { fontWeight: 'bold', color: '#000' }
});