import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomInput } from '../../components/CustomInput';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function ResetPasswordScreen({ navigation }: any) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleUpdatePassword() {
    if (newPassword.length < 6) {
      return Alert.alert('Erro', 'A senha deve ter pelo menos 6 dígitos.');
    }
    if (newPassword !== confirmPassword) {
      return Alert.alert('Erro', 'As senhas não coincidem.');
    }

    setLoading(true);
    try {
      // 1. Pegar a sessão atual de forma garantida
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) throw new Error("Sessão expirada. Refaça o login.");

      // 2. Atualiza a senha no Auth (isso sempre funciona se estiver logado)
      const { error: authError } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (authError) throw authError;

      // 3. Atualiza a flag no Profile
      const { data, error: profileError } = await supabase
        .from('profiles')
        .update({ force_password_change: false })
        .eq('id', user.id)
        .select(); // Adicionamos o select para confirmar que houve alteração
      
      // Se não retornar data, a política RLS barrou
      if (profileError || !data || data.length === 0) {
        throw new Error("Erro de permissão ao atualizar perfil. Verifique as políticas RLS.");
      }

      Alert.alert('Sucesso', 'Sua conta foi ativada com sucesso!');
      navigation.replace('Voltar');

    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image 
          source={require('../../assets/logo-capitania-3.png')} 
          style={styles.logo} 
          resizeMode="contain" 
        />
        <Text style={styles.title}>Defina sua senha</Text>
        <Text style={styles.subtitle}>Este é seu primeiro acesso. Escolha uma senha segura.</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.passwordWrapper}>
          <CustomInput 
            label="NOVA SENHA" 
            placeholder="Mínimo 6 caracteres" 
            value={newPassword} 
            onChangeText={setNewPassword} 
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity 
            style={styles.eyeIcon} 
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={22} color="#AAA" />
          </TouchableOpacity>
        </View>

        <CustomInput 
          label="CONFIRMAR SENHA" 
          placeholder="Digite a mesma senha" 
          value={confirmPassword} 
          onChangeText={setConfirmPassword} 
          secureTextEntry={!showPassword}
        />

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleUpdatePassword} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#D4AF37" />
          ) : (
            <Text style={styles.buttonText}>ATIVAR MINHA CONTA</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', paddingHorizontal: 30 },
  header: { alignItems: 'center', marginTop: 40, marginBottom: 30 },
  logo: { width: 120, height: 120, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#000' },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 5 },
  form: { width: '100%' },
  passwordWrapper: { position: 'relative' },
  eyeIcon: { position: 'absolute', right: 15, top: 45, zIndex: 10 },
  button: { 
    backgroundColor: '#000', 
    padding: 18, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 20 
  },
  buttonText: { color: '#D4AF37', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 }
});