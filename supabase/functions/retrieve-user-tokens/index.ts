import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Retrieve your game secret from environment
const GAME_SECRET = Deno.env.get("GAME_API_SECRET");
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  // validate secret
  const auth = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!auth || auth !== GAME_SECRET) {
    return new Response("Unauthorized", { status: 401, headers: cors });
  }

  // parse request
  const { username } = await req.json();
  if (!username) {
    return new Response("Username is required", { status: 400, headers: cors });
  }

  // direct database query with service-role key
  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data, error } = await client
    .from("user_tokens")
    .select("balance")
    .eq("username", username)
    .single();

  if (error && error.code !== "PGRST116") {
    return new Response("Database error", { status: 500, headers: cors });
  }

  const balance = data?.balance || 0;
  return new Response(JSON.stringify({ balance }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
