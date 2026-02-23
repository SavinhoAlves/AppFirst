import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Importando as Telas
import HomeScreen from '../screens/Home';
import ProfileScreen from '../screens/Menu';
import GestaoMembros from '../screens/Admin/GestaoMembros';
import CarteiraScreen from '../screens/Carteira';
import ResetPasswordScreen from '../screens/ResetPassword'; // Ajuste o caminho conforme sua pasta
import AdminRegisterMember from '../screens/Admin/RegisterMember';
import VantagensScreen from '../screens/Vantagens';
import SugerirBeneficioScreen from '../screens/SugerirVantagens';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// 1. Criamos o Navigator das Abas (Bottom Bar)
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: '#FFF', height: 85, paddingBottom: 25 },
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarIcon: ({ color, size }) => {
          let iconName: any;
          if (route.name === 'HOME') iconName = 'home';
          else if (route.name === 'CARTEIRA') iconName = 'card';
          else if (route.name === 'MENU') iconName = 'person';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HOME" component={HomeScreen} />
      <Tab.Screen name="CARTEIRA" component={CarteiraScreen} />
      <Tab.Screen name="MENU" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// 2. O AppStack principal que permite navegar para telas "escondidas" (como Gestão)
export function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* 1. Tela principal (Abas) */}
      <Stack.Screen name="Voltar" component={TabNavigator} />
      
      {/* ADICIONE ESSA LINHA AQUI */}
      <Stack.Screen 
        name="ResetPassword" 
        component={ResetPasswordScreen} 
        options={{ gestureEnabled: false }} // Evita que o usuário "volte" sem trocar a senha
      />

      {/* ADICIONE ESTA LINHA: */}
      <Stack.Screen name="Vantagens" component={VantagensScreen} />

      <Stack.Screen name="SugerirBeneficio" component={SugerirBeneficioScreen} />

      {/* 3. Gestão de Membros */}
      <Stack.Screen 
        name="GestaoMembros" 
        component={GestaoMembros} 
        options={{ 
            headerShown: true, 
            title: 'Sócios da Capitania',
            headerTintColor: '#000',
            headerTitleStyle: { fontWeight: 'bold' }
        }} 
      />

      <Stack.Screen 
        name="AdminRegister" 
        component={AdminRegisterMember} 
        options={{ headerShown: true, title: 'Novo Cadastro' }} 
        />
    </Stack.Navigator>
  );
}