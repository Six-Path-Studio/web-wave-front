// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// We'll call the SendGrid API directly via fetch

// CORS headers
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: cors,
    });
  }

  try {
    const { email, username, amount, reference, items } = await req.json();
    if (!email || !username || !amount || !reference) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: cors },
      );
    }

    const API_KEY = Deno.env.get("SENDGRID_API_KEY");
    const FROM = Deno.env.get("SENDGRID_FROM");
    if (!API_KEY || !FROM) {
      return new Response(JSON.stringify({ error: "Env vars not set" }), {
        status: 500,
        headers: cors,
      });
    }

    const itemsHtml = Array.isArray(items)
      ? items.map((i) => `<li>${i.qty} x ${i.name} @ $${i.price}</li>`).join("")
      : "";

    const html = `
      <p>Hi ${username},</p>
      <p>Thank you for your purchase!</p>
      <ul>
        <li>Reference: ${reference}</li>
        <li>Amount: $${amount.toFixed(2)}</li>
      </ul>
      ${itemsHtml ? `<p>Items:</p><ul>${itemsHtml}</ul>` : ""}
      <p>Thanks for shopping!</p>
    `;

    // Send via HTTP
    const msg = {
      personalizations: [{ to: [{ email }] }],
      from: { email: FROM },
      subject: "Your Six Path Studio Store Receipt",
      content: [{ type: "text/html", value: html }],
    };
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(msg),
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`SendGrid error ${res.status}: ${errorText}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
