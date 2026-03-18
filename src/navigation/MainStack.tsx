import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Platform } from 'react-native';

// Imports seguros para Web e Mobile
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
import ChatScreen from '../screens/main/ChatScreen'; // Importe o arquivo acima

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

      {/* ESTA É A CHAVE: 
          Só carregamos o EntregadorStack se NÃO for Web.
          Usamos require() aqui dentro para que o compilador Web ignore o arquivo.
      */}
      {Platform.OS !== 'web' && (
        <Stack.Screen 
          name="EntregadorStack" 
          component={require('./EntregadorStack').EntregadorStack} 
        />
      )}

      {/* Rota do Mapa - Agora registrada corretamente para o Sócio */}
      <Stack.Screen name="MapaEntregaScreen" component={MapaEntregaScreen} />
      <Stack.Screen name="ChatScreen" component={ChatScreen} options={{ title: 'Chat' }} />
    </Stack.Navigator>
  );
}