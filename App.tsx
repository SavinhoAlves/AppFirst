import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { supabase } from './src/services/supabase'; 
import { AuthStack } from './src/navigation/AuthStack'; 
import { MainStack } from './src/navigation/MainStack'; 
import { LogBox } from 'react-native';

LogBox.ignoreLogs(['expo-notifications', 'expo-go']);

// Carregamento seguro: evita que o Web tente compilar o mapa
const EntregadorStack = Platform.OS !== 'web' 
  ? require('./src/navigation/EntregadorStack').EntregadorStack 
  : null;

const linking = {
  prefixes: [Linking.createURL('/')],
  config: {
    screens: {
      Login: 'login',
      Register: 'cadastro',
      Home: 'home',
      CozinhaScreen: 'cozinha', 
      MeusPedidosScreen: 'meus-pedidos',
    },
  },
};

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUser() {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      
      if (currentSession) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentSession.user.id)
          .single();
        setUserRole(profile?.role || 'socio');
      }
      setLoading(false);
    }

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, _session) => {
      setSession(_session);
      if (!_session) setUserRole(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <SafeAreaProvider> 
      <NavigationContainer linking={linking}>
        <StatusBar style="dark" />
        {!session ? (
          <AuthStack />
        ) : (userRole === 'entregador' && Platform.OS !== 'web' && EntregadorStack) ? (
          <EntregadorStack /> 
        ) : (
          <MainStack />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' }
});