import React from 'react';
import { Platform } from 'react-native'; // Apenas se precisar para outra coisa
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import EntregasListaScreen from '../screens/entregador/EntregasListaScreen';
import HomeEntregador from '../screens/entregador/HomeEntregador';

// IMPORTANTE: Importe sem nenhuma extensão e sem o sufixo .native ou .web
import MapaEntregaScreen from '../screens/entregador/MapaEntregaScreen'; // SEM .native

const Stack = createNativeStackNavigator();

export function EntregadorStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* <Stack.Screen name="EntregasLista" component={EntregasListaScreen} /> */}
      <Stack.Screen name="HomeEntregador" component={HomeEntregador} />
      <Stack.Screen name="MapaEntrega" component={MapaEntregaScreen} />
    </Stack.Navigator>
  );
}