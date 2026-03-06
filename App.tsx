import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking'; // 1. Importe o Linking do Expo
import { supabase } from './src/services/supabase'; 
import { AuthStack } from './src/navigation/AuthStack'; 
import { MainStack } from './src/navigation/MainStack'; 

// 2. Configure o mapeamento de URLs para os nomes das telas
const linking = {
  prefixes: [Linking.createURL('/')],
  config: {
    screens: {
      // Telas do AuthStack
      Login: 'login',
      Register: 'cadastro',
      // Telas do MainStack (Devem bater exatamente com os names no MainStack.tsx)
      Home: 'home',
      SocioManagement: 'socios',
      Financeiro: 'financeiro',
      CruzDeMalte: 'cruzdemalte',
      AddSocio: 'novo-socio',
      CardapioScreen: 'cardapio',
      GestaoEstoque: 'estoque',
      BalcaoScreen: 'balcao', // <--- Isso fará o /balcao funcionar
    },
  },
};

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setLoading(false);
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
      {/* 3. Adicione a prop 'linking' no NavigationContainer */}
      <NavigationContainer linking={linking}>
        <StatusBar style="dark" />
        {!session ? <AuthStack /> : <MainStack />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#F8F9FA' 
  }
});