import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { AuthStack } from './src/navigation/AuthStack';
import { AppStack } from './src/navigation/AppStack';
import ResetPasswordScreen from './src/screens/ResetPassword'; 
import { supabase } from './src/lib/supabase';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    async function initializeAuth() {
      // 1. FORÇAR LOGOUT AO ABRIR (Isso garante que sempre peça login)
      await supabase.auth.signOut();
      
      setSession(null);
      setMustChangePassword(false);
      setLoading(false);
    }

    initializeAuth();

    // 2. Escuta mudanças (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      
      if (session) {
        // Se logou, checa o banco ANTES de liberar a entrada
        const { data } = await supabase
          .from('profiles')
          .select('force_password_change')
          .eq('id', session.user.id)
          .single();
          
        setMustChangePassword(data?.force_password_change || false);
      } else {
        setMustChangePassword(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  // AQUI É ONDE A MÁGICA ACONTECE (SEM NAVEGAÇÃO MANUAL)
  return (
    <NavigationContainer>
      {/* Se não tem sessão -> AuthStack (Login)
          Se tem sessão e precisa mudar senha -> ResetPassword
          Se tem sessão e está tudo ok -> AppStack (Home)
      */}
      {!session ? (
        <AuthStack />
      ) : mustChangePassword ? (
        <ResetPasswordScreen />
      ) : (
        <AppStack />
      )}
      
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}