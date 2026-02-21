import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vqeuxwnkxqnzjpoxvnwf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxZXV4d25reHFuempwb3h2bndmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4ODk1MjAsImV4cCI6MjA4NjQ2NTUyMH0.LikDuKxRBoYq0jSgEuMP0xwMDwoVG4uhsU2-k9VeU5w';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: false, // Desativamos o persistSession para evitar conflitos com a Trigger
    detectSessionInUrl: false,
  },
});