import { hashRecoveryCode } from "../_utils/crypto.js";

export async function onRequestPost({ request, env }) {
    try {
        const { email } = await request.json();
        if (!email) {
            return new Response(JSON.stringify({ error: "Email required" }), {
                status: 400, headers: { "Content-Type": "application/json" }
            });
        }

        const { results } = await env.DB.prepare(
            "SELECT id, display_name FROM users WHERE email = ?"
        ).bind(email.toLowerCase()).all();

        // Always return success to prevent email enumeration
        if (!results[0]) {
            return new Response(JSON.stringify({ success: true }), {
                headers: { "Content-Type": "application/json" }
            });
        }

        const user = results[0];

        // BUG-08 fix: HTML-escape display_name before inserting into email template
        const safeName = (user.display_name || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

        // Generate a 6-digit code
        const arr = crypto.getRandomValues(new Uint32Array(1));
        const code = String(arr[0] % 900000 + 100000);
        const codeHash = await hashRecoveryCode(code);
        const expiresAt = Date.now() / 1000 + 3600; // 1 hour

        // Clear any existing unused tokens for this user
        await env.DB.prepare(
            "DELETE FROM password_reset_tokens WHERE user_id = ? AND used = 0"
        ).bind(user.id).run();

        // Store the new code hash
        await env.DB.prepare(
            "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)"
        ).bind(user.id, codeHash, expiresAt).run();

        // Send email via Resend
        const emailHtml = `
            <div style="font-family:'Helvetica Neue',sans-serif;max-width:520px;margin:0 auto;background:#0d0820;padding:40px;border-radius:16px;">
                <h1 style="font-size:28px;color:#ff96c8;margin-bottom:6px;">Pixie Portal ✦</h1>
                <p style="color:#b496ff;font-size:16px;margin-bottom:28px;">Password Reset</p>
                <p style="color:#d0b8f0;font-size:15px;">Hey ${safeName},</p>
                <p style="color:#d0b8f0;font-size:15px;">Someone requested a password reset for your Pixie Portal account. Enter this code on the site:</p>
                <div style="text-align:center;margin:32px 0;">
                    <div style="display:inline-block;background:linear-gradient(135deg,rgba(255,150,200,0.15),rgba(180,150,255,0.15));border:2px solid #b496ff;border-radius:16px;padding:20px 40px;">
                        <span style="font-size:36px;font-family:monospace;letter-spacing:8px;color:#f0d0ff;font-weight:700;">${code}</span>
                    </div>
                </div>
                <p style="color:#604878;font-size:13px;">This code expires in 1 hour. If you didn't request this, ignore this email — your account is safe.</p>
            </div>
        `;

        await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${env.RESEND_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                from: "Pixie Portal <portal@pixie-portal.com>",
                to: [email],
                subject: "Your Pixie Portal reset code ✦",
                html: emailHtml
            })
        });

        return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: "Failed to send reset email" }), {
            status: 500, headers: { "Content-Type": "application/json" }
        });
    }
}
