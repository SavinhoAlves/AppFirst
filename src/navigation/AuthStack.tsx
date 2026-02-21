import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/Login';
import RegisterScreen from '../screens/Register';

const Stack = createNativeStackNavigator();

export function AuthStack() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false, // Remove a barra superior padrão
        contentStyle: { backgroundColor: '#fff' } 
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}