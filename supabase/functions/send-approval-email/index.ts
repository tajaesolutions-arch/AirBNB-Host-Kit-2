import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  try {
    const { email, fullName } = await req.json();
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const sendgridKey = Deno.env.get("SENDGRID_API_KEY");
    const fromEmail = Deno.env.get("APPROVAL_FROM_EMAIL") ?? "noreply@hostkit.app";
    const subject = "Your Host Kit account has been approved";
    const body = `Hi ${fullName || "there"},\n\nYour Host Kit account has been approved. You can now log in and access your assigned workspace.\n\nLogin to continue managing your properties, tasks, and operations.\n\nThanks,\nThe Host Kit Team`;

    if (!resendKey && !sendgridKey) {
      console.warn("Approval email skipped: provider env vars not configured.");
      return new Response(JSON.stringify({ sent: false, warning: "Email provider not configured" }), { status: 200 });
    }

    if (resendKey) {
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: fromEmail, to: [email], subject, text: body }),
      });
      if (!resp.ok) throw new Error(`Resend failed: ${await resp.text()}`);
      return new Response(JSON.stringify({ sent: true, provider: "resend" }), { status: 200 });
    }

    const resp = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: { "Authorization": `Bearer ${sendgridKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ personalizations: [{ to: [{ email }] }], from: { email: fromEmail }, subject, content: [{ type: "text/plain", value: body }] }),
    });
    if (!resp.ok) throw new Error(`SendGrid failed: ${await resp.text()}`);
    return new Response(JSON.stringify({ sent: true, provider: "sendgrid" }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ sent: false, error: (error as Error).message }), { status: 500 });
  }
});
