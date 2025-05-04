import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GAME_SECRET = Deno.env.get("GAME_API_SECRET");
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  // authenticate
  const auth = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!auth || auth !== GAME_SECRET) {
    return new Response("Unauthorized", { status: 401, headers: cors });
  }

  // parse & validate
  const { username, amount } = await req.json();
  if (!username || typeof amount !== "number" || amount <= 0) {
    return new Response("Invalid payload", { status: 400, headers: cors });
  }

  // query & update
  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: user, error: fetchError } = await client
    .from("user_tokens")
    .select("balance")
    .eq("username", username)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    return new Response("Database error", { status: 500, headers: cors });
  }

  const current = user?.balance || 0;
  if (current < amount) {
    return new Response("Insufficient balance", { status: 400, headers: cors });
  }

  const newBalance = current - amount;
  const { error: updateError } = await client
    .from("user_tokens")
    .update({ balance: newBalance })
    .eq("username", username);

  if (updateError) {
    return new Response("Update failed", { status: 500, headers: cors });
  }

  return new Response(JSON.stringify({ remaining: newBalance }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
