import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/main/HomeScreen';
import SocioManagementScreen from '../screens/main/SocioManagementScreen';
import FinanceiroScreen from '../screens/main/FinanceiroScreen';
import CruzDeMalteScreen from '../screens/main/CruzDeMalteScreen';
import AddSocioScreen from '../screens/main/AddSocioScreen';
import CardapioScreen from '../screens/main/CardapioScreen';
import GestaoEstoque from '../screens/main/GestaoEstoque';
import BalcaoScreen from '../screens/main/BalcaoScreen';

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
      <Stack.Screen name="BalcaoScreen" component={require('../screens/main/BalcaoScreen').default} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}