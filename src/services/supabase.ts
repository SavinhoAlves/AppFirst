import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://sbejbptfypovecieaxik.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiZWpicHRmeXBvdmVjaWVheGlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMjQ3MjIsImV4cCI6MjA4ODkwMDcyMn0.mGnlYTyVDqxTxXbKNCnLMqK8TDdUnkJj4nG6R3fOrhg';

// Cliente Principal (Mantém o Admin logado)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    // persistSession: true,
    detectSessionInUrl: false,
    storageKey: 'capitania-auth-v3',
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