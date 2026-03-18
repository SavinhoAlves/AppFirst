import * as Location from 'expo-location';
import { supabase } from './supabase';

export const iniciarRastreioEntregador = async (pedidoId: string) => {
  // 1. Pede permissão
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;

  // 2. Começa a vigiar a posição
  return await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      distanceInterval: 10, // Atualiza a cada 10 metros
      timeInterval: 5000,   // Ou a cada 5 segundos
    },
    async (location) => {
      const { latitude, longitude } = location.coords;
      
      // 3. Joga no banco de dados (o Sócio vai ler isso no mapa dele)
      await supabase.from('localizacao_entregas').upsert({
        pedido_id: pedidoId,
        latitude,
        longitude,
        ultima_atualizacao: new Date().toISOString(),
      });
    }
  );
};