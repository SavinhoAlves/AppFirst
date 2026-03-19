import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform, LogBox } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import * as Linking from 'expo-linking';
import { supabase } from './src/services/supabase'; 
import { MainStack } from './src/navigation/MainStack';
import { AuthStack } from './src/navigation/AuthStack';

// Oculta avisos não críticos para uma experiência de desenvolvimento mais limpa
LogBox.ignoreLogs(['expo-notifications', 'expo-go']);

export const linking = {
  prefixes: [Linking.createURL('/')],
  config: {
    screens: {
      Home: 'home',
      HomeEntregador: 'entregas',
      CozinhaScreen: 'cozinha',
      // Adicione outras rotas se necessário
    },
  },
};

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Efeito principal: Verifica autenticação e busca o perfil do usuário
  useEffect(() => {
    async function checkUser() {
      try {
        // 1. Pega a sessão atual do Supabase
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);

        if (currentSession) {
          // 2. Busca o cargo (role) do usuário na tabela 'profiles'
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', currentSession.user.id)
            .single();
          
          // Define o cargo padrão como 'socio' se não houver perfil
          setUserRole(profile?.role || 'socio');
        }
      } catch (error) {
        console.error('Erro ao verificar usuário:', error);
      } finally {
        setLoading(false);
      }
    }

    checkUser();

    // Ouvinte para mudanças de autenticação (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, _session) => {
      setSession(_session);
      // Se deslogar, limpa o cargo do usuário
      if (!_session) setUserRole(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // CORREÇÃO DE VISIBILIDADE (ANDROID): 
  // Ajusta a cor dos ícones da barra de botões do sistema (voltar/home).
  useEffect(() => {
    if (Platform.OS === 'android') {
      // 'light' para ícones brancos (fundo escuro do entregador), 'dark' para ícones pretos
      const style = userRole === 'entregador' ? 'light' : 'dark';
      NavigationBar.setButtonStyleAsync(style).catch(() => {});
    }
  }, [userRole]);

  // Tela de carregamento enquanto busca o perfil
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  const isEntregador = userRole === 'entregador';

  return (
    <SafeAreaProvider> 
      <NavigationContainer 
        linking={linking} 
        // Aplica o tema escuro no nível do sistema para o entregador, 
        // o que ajuda o Navigator a entender o contraste.
        theme={isEntregador ? DarkTheme : DefaultTheme}
      >
        {/* SOLUÇÃO DO VÍDEO (COR DOS ÍCONES): 
          Aqui está o segredo. Se for entregador (fundo preto):
          style="light" -> Força as Horas, Bateria e WiFi a ficarem BRANCOS.
          translucent -> Permite que o fundo preto do app suba até o topo.
          backgroundColor="transparent" -> Garante que não tenha uma tarja cinza no topo.
        */}
        <StatusBar 
          style={isEntregador ? "light" : "dark"} 
          translucent 
          backgroundColor="transparent" 
        />
        
        {!session ? (
          <AuthStack />
        ) : (
          /* ROTEAMENTO DINÂMICO MASTER (UNIFICADO):
            Envia a prop 'initialRoute' para o MainStack decidir por onde começar.
            Isso resolve o conflito visual e mantém o acesso à Cozinha.
          */
          <MainStack initialRoute={isEntregador ? "HomeEntregador" : "Home"} />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#000' // Fundo preto para evitar flash branco no carregamento
  }
});