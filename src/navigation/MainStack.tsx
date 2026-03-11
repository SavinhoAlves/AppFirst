import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/main/HomeScreen';
import SocioManagementScreen from '../screens/main/SocioManagementScreen';
import FinanceiroScreen from '../screens/main/FinanceiroScreen';
import CruzDeMalteScreen from '../screens/main/CruzDeMalteScreen';
import AddSocioScreen from '../screens/main/AddSocioScreen';
import CardapioScreen from '../screens/main/CardapioScreen';
import GestaoEstoque from '../screens/main/GestaoEstoque';
import CozinhaScreen from '../screens/main/CozinhaScreen';
import MeusPedidosScreen from '../screens/main/MeusPedidosScreen';
import { EntregadorStack } from './EntregadorStack'; // Importa o Stack do entregador
import GestaoEntregadoresScreen from '../screens/admin/GestaoEntregadoresScreen';
import AddEntregadorScreen from '../screens/entregador/AddEntregadorScreen';

const Stack = createStackNavigator();

export function MainStack() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: '#F8F9FA' } 
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="SocioManagement" component={SocioManagementScreen} />
      <Stack.Screen name="Financeiro" component={FinanceiroScreen} />
      <Stack.Screen name="CruzDeMalte" component={CruzDeMalteScreen} />
      <Stack.Screen name="AddSocio" component={AddSocioScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CardapioScreen" component={require('../screens/main/CardapioScreen').default} options={{ headerShown: false }} />
      <Stack.Screen name="GestaoEstoque" component={require('../screens/main/GestaoEstoque').default} options={{ headerShown: false }} />
      <Stack.Screen name="CozinhaScreen" component={require('../screens/main/CozinhaScreen').default} options={{ headerShown: false }} />
      <Stack.Screen name="MeusPedidosScreen" component={require('../screens/main/MeusPedidosScreen').default} options={{ headerShown: false }} />
      <Stack.Screen name="GestaoEntregadores" component={GestaoEntregadoresScreen} options={{ title: 'Gerenciar Entregadores' }} />
      <Stack.Screen name="AddEntregadorScreen" component={AddEntregadorScreen} options={{ title: 'Adicionar Entregador' }} />
    </Stack.Navigator>
  );
}