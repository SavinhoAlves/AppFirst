import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomInput } from '../../components/CustomInput';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function AdminRegisterMember({ navigation }: any) {
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const maskCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  async function handleRegister() {
    const cpfClean = cpf.replace(/\D/g, '');
    const emailClean = email.trim().toLowerCase(); // Limpeza crucial

    if (!fullName || cpfClean.length !== 11 || !emailClean) {
      return Alert.alert('Atenção', 'Preencha todos os dados do sócio.');
    }

    setLoading(true);
    try {
      // 1. Criar o usuário no Auth
      // O Supabase enviará os metadados que a Trigger usará para criar o Profile
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: emailClean,
        password: 'SenhaTemporaria123',
        options: {
          data: {
            full_name: fullName.trim(),
            cpf: cpfClean,
            force_password_change: true,
          }
        }
      });

      if (signUpError) throw signUpError;

      // Importante: O Realtime na GestaoMembros vai detectar a inserção 
      // na tabela profiles assim que a Trigger for disparada pelo Auth.
      
      Alert.alert('Sucesso', `${fullName.split(' ')[0]} cadastrado!`);
      navigation.goBack();

    } catch (error: any) {
      // Se o e-mail já existir, o Supabase retornará um erro aqui
      Alert.alert('Erro no Cadastro', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Novo Sócio</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.description}>
          O sócio receberá um acesso via CPF com a senha temporária. No primeiro login, será solicitado a troca de senha.
        </Text>
        
        <CustomInput label="NOME COMPLETO" value={fullName} onChangeText={setFullName} placeholder="Ex: Sávio Alves" />
        
        <CustomInput 
          label="CPF" 
          value={cpf} 
          onChangeText={(t) => setCpf(maskCPF(t))} 
          placeholder="000.000.000-00" 
          keyboardType="numeric" 
          maxLength={14} 
        />
        
        <CustomInput 
          label="E-MAIL" 
          value={email} 
          onChangeText={setEmail} 
          placeholder="socio@email.com" 
          autoCapitalize="none" 
        />

        <TouchableOpacity 
          style={[styles.button, loading && { opacity: 0.7 }]} 
          onPress={handleRegister} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#D4AF37" />
          ) : (
            <Text style={styles.buttonText}>CADASTRAR E CONVIDAR</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 10 },
  content: { padding: 30 },
  title: { fontSize: 24, fontWeight: '900', color: '#000', marginLeft: 10 },
  description: { fontSize: 14, color: '#888', marginBottom: 30, lineHeight: 20 },
  button: { 
    backgroundColor: '#000', 
    padding: 20, 
    borderRadius: 15, 
    alignItems: 'center', 
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5
  },
  buttonText: { color: '#D4AF37', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 }
});