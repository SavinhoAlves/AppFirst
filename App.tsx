import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { supabase } from './src/services/supabase'; 
import { AuthStack } from './src/navigation/AuthStack'; 
import { MainStack } from './src/navigation/MainStack'; 
// Supondo que você criará esse Stack para os entregadores
import { EntregadorStack } from './src/navigation/EntregadorStack'; 
import { LogBox } from 'react-native';

LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  '`expo-notifications` functionality is not fully supported in Expo Go',
]);

const linking = {
  prefixes: [Linking.createURL('/')],
  config: {
    screens: {
      Login: 'login',
      Register: 'cadastro',
      Home: 'home',
      EntregasLista: 'entregas', // Rota para entregador
      MapaEntrega: 'mapa-entrega',
      // ... suas outras rotas
    },
  },
};

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Função para verificar perfil e status
    const checkUserRole = async (currentSession: any) => {
      if (!currentSession) {
        setUserRole(null);
        setLoading(false);
        return;
      }

      try {
        const { data: profile } = await supabase
          .from('profiles') // Ajuste para o nome da sua tabela de perfis
          .select('role')
          .eq('id', currentSession.user.id)
          .single();

        if (profile?.role === 'entregador') {
          // Verificação extra na tabela de entregadores ativos
          const { data: entregadorData } = await supabase
            .from('entregadores')
            .select('ativo')
            .eq('id', currentSession.user.id)
            .single();

          if (!entregadorData || !entregadorData.ativo) {
            Alert.alert("Acesso Negado", "Sua conta de entregador está inativa.");
            await supabase.auth.signOut();
            setUserRole(null);
          } else {
            setUserRole('entregador');
          }
        } else {
          setUserRole(profile?.role || 'socio');
        }
      } catch (error) {
        console.error("Erro ao verificar role:", error);
      } finally {
        setLoading(false);
      }
    };

    // Sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      checkUserRole(session);
    });

    // Ouvinte de mudança de estado
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      checkUserRole(currentSession);
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
        ) : userRole === 'entregador' ? (
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