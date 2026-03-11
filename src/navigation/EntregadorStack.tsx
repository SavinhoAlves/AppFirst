import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EntregasListaScreen from '../screens/entregador/EntregasListaScreen';
import MapaEntregaScreen from '../screens/entregador/MapaEntregaScreen';

const Stack = createNativeStackNavigator();

export function EntregadorStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="EntregasLista" component={EntregasListaScreen} />
      <Stack.Screen name="MapaEntrega" component={MapaEntregaScreen} />
    </Stack.Navigator>
  );
}