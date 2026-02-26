import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://vqeuxwnkxqnzjpoxvnwf.supabase.co';
const supabaseAnonKey = 'sb_publishable_sviXWQQBg3sLYHylH_cxgA_Pz1BmF7E';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});