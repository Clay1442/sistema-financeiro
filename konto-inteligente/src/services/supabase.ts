import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Substitua pelas chaves copiadas no Passo 1
const supabaseUrl = 'https://ikpzqoghkuycadawriae.supabase.co';
const supabaseAnonKey = 'sb_publishable_Ka7ojAGoMcFC90HJfWQuMQ__xMt8aox';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});