import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://vqeuxwnkxqnzjpoxvnwf.supabase.co';
const supabaseAnonKey = 'sb_publishable_sviXWQQBg3sLYHylH_cxgA_Pz1BmF7E';

// Cliente Principal (Mantém o Admin logado)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Função para criar um cliente temporário (Para cadastrar terceiros)
export const createTempClient = () => createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // <-- IMPORTANTE: Não salva a sessão
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});