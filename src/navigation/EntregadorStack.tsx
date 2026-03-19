import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeEntregador from '../screens/entregador/HomeEntregador';
// IMPORTANTE: Importe a nova tela aqui
import DetalhesPedidoScreen from '../screens/entregador/DetalhesPedidoScreen'; 

const Stack = createStackNavigator();

export function EntregadorStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeEntregador" component={HomeEntregador} />
      
      {/* ADICIONE ESTA LINHA: */}
      <Stack.Screen name="DetalhesPedido" component={DetalhesPedidoScreen} />
    </Stack.Navigator>
  );
}