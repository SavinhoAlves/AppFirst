import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/main/HomeScreen';
import SocioManagementScreen from '../screens/main/SocioManagementScreen';
import FinanceiroScreen from '../screens/main/FinanceiroScreen';
import CruzDeMalteScreen from '../screens/main/CruzDeMalteScreen';
import AddSocioScreen from '../screens/main/AddSocioScreen';

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
    </Stack.Navigator>
  );
}