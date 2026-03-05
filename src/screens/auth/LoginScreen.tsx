import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Image
} from 'react-native';
import { supabase } from '../../services/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoginScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handleCpfChange = (text: string) => {
    const onlyNums = text.replace(/\D/g, '');
    setCpf(onlyNums);
  };

  async function handleLogin() {
    const cleanCpf = cpf.trim();
    const cleanPassword = password.trim();

    if (cleanCpf.length !== 11 || !cleanPassword) {
      Alert.alert('Atenção', 'Preencha o CPF e a senha corretamente.');
      return;
    }

    setLoading(true);

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, is_active')
        .eq('cpf', cleanCpf)
        .single();

      if (profileError || !profile) {
        throw new Error('CPF não encontrado ou não cadastrado.');
      }

      if (!profile.is_active) {
        throw new Error('Sua conta está inativa na Capitania.');
      }

      const { error: authError } = await supabase.auth.signInWithPassword({ 
        email: profile.email, 
        password: cleanPassword 
      });
      
      if (authError) {
        throw new Error('Senha incorreta. Tente novamente.');
      }

    } catch (error: any) {
      Alert.alert('Erro no acesso', error.message);
      setLoading(false);
    }
  }

  const getInputStyle = (inputName: string) => [
    styles.inputContainer,
    focusedInput === inputName && styles.inputContainerFocused
  ];

  const getIconColor = (inputName: string) => 
    focusedInput === inputName ? '#B8860B' : '#999';

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={[styles.scrollInner, { paddingTop: insets.top + 20 }]}
        bounces={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Image 
            source={require('../../assets/img/NEW-LOGO-CAPITANIA.png')} 
            style={styles.logo} 
          />
          <Text style={styles.subtitle}>Sua conexão oficial com o Gigante</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.fieldLabel}>CPF</Text>
          <View style={getInputStyle('cpf')}>
            <Ionicons name="person-outline" size={20} color={getIconColor('cpf')} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="000.000.000-00"
              placeholderTextColor="#AAA"
              value={cpf}
              onChangeText={handleCpfChange}
              keyboardType="numeric"
              maxLength={11}
              onFocus={() => setFocusedInput('cpf')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          <Text style={styles.fieldLabel}>Senha</Text>
          <View style={getInputStyle('password')}>
            <Ionicons name="lock-closed-outline" size={20} color={getIconColor('password')} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Digite sua senha"
              placeholderTextColor="#AAA"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              onFocus={() => setFocusedInput('password')}
              onBlur={() => setFocusedInput(null)}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#999" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Esqueceu a senha?</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.loginBtnText}>ENTRAR</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={[styles.footer, { marginBottom: insets.bottom + 20 }]}>
          <Text style={styles.footerText}>Ainda não é membro? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.signUpText}>Cadastre-se aqui</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8F9FA',
  },
  scrollInner: { 
    flexGrow: 1, 
    paddingHorizontal: 30, 
    justifyContent: 'space-between',
  },
  header: { 
    alignItems: 'center', 
    marginTop: 20,
  },
  logo: { 
    width: 180, 
    height: 180, 
    resizeMode: 'contain',
    marginBottom: 30,
  },
  subtitle: { 
    color: '#666', 
    fontSize: 14, 
    fontWeight: '500',
    textAlign: 'center',
  },
  form: { 
    flex: 1, 
    justifyContent: 'center',
    marginVertical: 20,
  },
  fieldLabel: { 
    color: '#444', 
    fontSize: 12, 
    fontWeight: '700', 
    marginBottom: 8, 
    textTransform: 'uppercase', 
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#EEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  inputContainerFocused: { 
    borderColor: '#B8860B', 
    backgroundColor: '#FFF',
  },
  inputIcon: { 
    marginRight: 12,
  },
  input: { 
    flex: 1, 
    color: '#222', 
    fontSize: 16, 
    fontWeight: '500',
  },
  eyeIcon: { 
    padding: 5,
  },
  forgotBtn: { 
    alignSelf: 'flex-end', 
    marginBottom: 30, 
    marginTop: -5,
  },
  forgotText: { 
    color: '#B8860B', 
    fontSize: 13, 
    fontWeight: '600',
  },
  loginBtn: {
    backgroundColor: '#222',
    height: 58,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  loginBtnDisabled: { 
    opacity: 0.7,
  },
  loginBtnText: { 
    color: '#D4AF37',
    fontSize: 15, 
    fontWeight: '800', 
    letterSpacing: 1.5,
  },
  footer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    paddingVertical: 10,
  },
  footerText: { 
    color: '#666', 
    fontSize: 14,
  },
  signUpText: { 
    color: '#B8860B', 
    fontSize: 14, 
    fontWeight: '700',
  },
});