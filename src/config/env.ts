// Load Supabase URL and key, support both VITE_ and existing NEXT_PUBLIC_ prefixes
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SOLANA_RPC_URL = import.meta.env.VITE_RPC_ENDPOINT ||
  "https://api.devnet.solana.com";
const MERCHANT_PUBLIC_KEY = import.meta.env.VITE_MERCHANT_PUBLIC_KEY ||
  "FScsYChomLrKYsMrpsi1RZJXtnqQKnVqywFJZAxCyc2G";

// Ensure the required VITE_ env vars are provided
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing.");
}

if (!import.meta.env.VITE_RPC_ENDPOINT) {
  console.warn("Using fallback value for Solana RPC URL");
}

if (!import.meta.env.VITE_MERCHANT_PUBLIC_KEY) {
  console.warn("Using fallback value for Merchant Public Key");
}

import { createClient } from "@supabase/supabase-js";

// Initialize the Supabase client
export const supabase = createClient(
  SUPABASE_URL as string,
  SUPABASE_ANON_KEY as string,
);

export const config = {
  SOLANA_RPC_URL,
  MERCHANT_PUBLIC_KEY,
};
