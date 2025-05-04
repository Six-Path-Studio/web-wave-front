
import { createClient } from '@supabase/supabase-js';

// Load environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const SOLANA_RPC_URL = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const MERCHANT_PUBLIC_KEY = import.meta.env.VITE_MERCHANT_PUBLIC_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !MERCHANT_PUBLIC_KEY) {
  console.error('Missing environment variables. Please check your .env file.');
}

// Initialize the Supabase client
export const supabase = createClient(
  SUPABASE_URL || '',
  SUPABASE_ANON_KEY || ''
);

export const config = {
  SOLANA_RPC_URL,
  MERCHANT_PUBLIC_KEY,
};
