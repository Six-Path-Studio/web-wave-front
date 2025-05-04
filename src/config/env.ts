
// Load environment variables
const SUPABASE_URL = import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 'https://stgerbqwwmvouqprlwzn.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0Z2VyYnF3d212b3VxcHJsd3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyMzY2NzEsImV4cCI6MjA2MTgxMjY3MX0.NpCxux3aOFL44LY6ctA_Nb2y1wWNxU1A2Qcnt-FKYyE';
const SOLANA_RPC_URL = import.meta.env.RPC_ENDPOINT || 'https://api.devnet.solana.com';
const MERCHANT_PUBLIC_KEY = import.meta.env.MERCHANT_PUBLIC_KEY || 'FScsYChomLrKYsMrpsi1RZJXtnqQKnVqywFJZAxCyc2G';

// Log when using fallback values
if (!import.meta.env.NEXT_PUBLIC_SUPABASE_URL || !import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('Using fallback values for Supabase configuration');
}

if (!import.meta.env.RPC_ENDPOINT) {
  console.warn('Using fallback value for Solana RPC URL');
}

if (!import.meta.env.MERCHANT_PUBLIC_KEY) {
  console.warn('Using fallback value for Merchant Public Key');
}

import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const config = {
  SOLANA_RPC_URL,
  MERCHANT_PUBLIC_KEY,
};
