import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  Image, 
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomInput } from '../../components/CustomInput';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons'; 

const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

function LoginContent({ navigation }: any) {
  const [cpfDisplay, setCpfDisplay] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const handleCpfChange = (text: string) => {
    setCpfDisplay(maskCPF(text));
  };

  async function handleLogin() {
  const cpfClean = cpfDisplay.replace(/\D/g, '');
  if (cpfClean.length !== 11 || !password) {
    return Alert.alert('Atenção', 'Informe um CPF válido e sua senha.');
  }

  setLoading(true);
  try {
    // 1. Busca o e-mail (necessário para o Auth do Supabase)
    const { data: profile, error: searchError } = await supabase
      .from('profiles')
      .select('email')
      .eq('cpf', cpfClean)
      .single();

    if (searchError || !profile) {
      throw new Error('CPF não cadastrado na base da Capitânia.');
    }

    // 2. Autenticação
    // No momento que o login for bem-sucedido, o App.tsx vai assumir o controle.
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: password,
    });

    if (loginError) throw loginError;

    // AQUI É O SEGREDO: 
    // Não fazemos NADA. Não chamamos navigation.navigate.
    // O App.tsx vai detectar a mudança de sessão, ler o banco e decidir
    // se mostra a Home ou a ResetPassword.

  } catch (error: any) {
    Alert.alert('Erro no Acesso', error.message);
  } finally {
    setLoading(false);
  }
}

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: '#FFF' }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContent, 
            { paddingTop: insets.top + 10 }
          ]} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.contentUpper}>
            <View style={styles.header}>
              <Image 
                source={require('../../assets/logo-capitania-3.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <View style={styles.form}>
              <CustomInput 
                label="Acesso por CPF" 
                placeholder="000.000.000-00" 
                value={cpfDisplay} 
                onChangeText={handleCpfChange}
                keyboardType="numeric"
                maxLength={14}
              />

              <View style={styles.passwordWrapper}>
                <CustomInput 
                  label="Senha" 
                  placeholder="Sua senha secreta" 
                  value={password} 
                  onChangeText={setPassword} 
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon} 
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons 
                    name={showPassword ? "eye-outline" : "eye-off-outline"} 
                    size={22} 
                    color="#AAA" 
                  />
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                style={styles.button} 
                onPress={handleLogin} 
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#D4AF37" />
                ) : (
                  <Text style={styles.buttonText}>ENTRAR</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.forgotPass}>
                <Text style={styles.forgotText}>Esqueceu sua senha?</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerLabel}>Ainda não possui conta?</Text>
              <View style={styles.divider} />
            </View>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Register')} 
              style={styles.registerButton}
            >
              <Text style={styles.registerText}>CRIAR MINHA CONTA</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaProvider>
  );
}

export default function LoginScreen(props: any) {
  return <LoginContent {...props} />;
}

const styles = StyleSheet.create({
  scrollContent: { 
    paddingHorizontal: 30, 
    flexGrow: 1, 
    justifyContent: 'space-between' 
  },
  contentUpper: { flex: 1, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 20 },
  logo: { width: 150, height: 150 }, //
  form: { width: '100%' },
  passwordWrapper: { position: 'relative' },
  eyeIcon: { 
    position: 'absolute', 
    right: 15, 
    top: 45, // Alinhado com o centro do input
    zIndex: 10 
  },
  button: { 
    backgroundColor: '#000', 
    padding: 18, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 15 
  },
  buttonText: { color: '#D4AF37', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
  forgotPass: { marginTop: 15, alignItems: 'center' },
  forgotText: { color: '#666', fontSize: 13, fontWeight: '500' },
  footer: { marginTop: 30, width: '100%' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  divider: { flex: 1, height: 1, backgroundColor: '#EEE' },
  dividerLabel: { color: '#AAA', paddingHorizontal: 10, fontSize: 12 },
  registerButton: { 
    padding: 16, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#000', 
    alignItems: 'center',
    backgroundColor: '#FFF' //
  },
  registerText: { color: '#000', fontWeight: 'bold', fontSize: 14 }
});