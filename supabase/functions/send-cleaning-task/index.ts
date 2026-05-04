import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
serve(async () => new Response(JSON.stringify({ ok: true, message: "Placeholder function. Configure Resend/Twilio/WhatsApp API to enable delivery." }), { headers: { "Content-Type": "application/json" } }));
