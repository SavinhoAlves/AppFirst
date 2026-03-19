import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Platform } from 'react-native';

// Seus imports existentes...
import HomeScreen from '../screens/main/HomeScreen';
import SocioManagementScreen from '../screens/main/SocioManagementScreen';
import FinanceiroScreen from '../screens/main/FinanceiroScreen';
import CruzDeMalteScreen from '../screens/main/CruzDeMalteScreen';
import AddSocioScreen from '../screens/main/AddSocioScreen';
import CardapioScreen from '../screens/main/CardapioScreen';
import GestaoEstoque from '../screens/main/GestaoEstoque';
import CozinhaScreen from '../screens/admin/CozinhaScreen';
import MeusPedidosScreen from '../screens/main/MeusPedidosScreen';
import GestaoEntregadoresScreen from '../screens/admin/GestaoEntregadoresScreen';
import AddEntregadorScreen from '../screens/entregador/AddEntregadorScreen';
import MapaEntregaScreen from '../screens/entregador/MapaEntregaScreen';
import ChatScreen from '../screens/main/ChatScreen';

// --- DEFINIÇÃO DE TIPOS PARA O TYPESCRIPT ---
interface MainStackProps {
  initialRoute?: string;
}

const Stack = createStackNavigator();

// Adicionamos { initialRoute = "Home" }: MainStackProps para aceitar a prop do App.tsx
export function MainStack({ initialRoute = "Home" }: MainStackProps) {
  return (
    <Stack.Navigator 
      // Esta linha faz o app abrir na tela correta (Home ou HomeEntregador)
      initialRouteName={initialRoute}
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: 'transparent' } 
      }}
    >
      {/* Tela Principal (Sócio/Admin) */}
      <Stack.Screen name="Home" component={HomeScreen} />
      
      {/* Painel da Cozinha (Recuperado seu acesso) */}
      <Stack.Screen name="CozinhaScreen" component={CozinhaScreen} />
      
      {/* Telas Administrativas */}
      <Stack.Screen name="SocioManagement" component={SocioManagementScreen} />
      <Stack.Screen name="Financeiro" component={FinanceiroScreen} />
      <Stack.Screen name="CruzDeMalte" component={CruzDeMalteScreen} />
      <Stack.Screen name="AddSocio" component={AddSocioScreen} />
      <Stack.Screen name="CardapioScreen" component={CardapioScreen} />
      <Stack.Screen name="GestaoEstoque" component={GestaoEstoque} />
      <Stack.Screen name="MeusPedidosScreen" component={MeusPedidosScreen} />
      <Stack.Screen name="GestaoEntregadores" component={GestaoEntregadoresScreen} />
      <Stack.Screen name="AddEntregadorScreen" component={AddEntregadorScreen} />

      {/* Painel do Entregador */}
      {Platform.OS !== 'web' && (
        <Stack.Screen 
          name="HomeEntregador" 
          // .default é necessário por causa do require()
          component={require('../screens/entregador/HomeEntregador').default} 
        />
      )}
      
      {/* Detalhes do Pedido */}
      <Stack.Screen 
        name="DetalhesPedido" 
        component={require('../screens/entregador/DetalhesPedidoScreen').default} 
      />

      <Stack.Screen name="MapaEntregaScreen" component={MapaEntregaScreen} />
      <Stack.Screen name="ChatScreen" component={ChatScreen} options={{ title: 'Chat' }} />
    </Stack.Navigator>
  );
}