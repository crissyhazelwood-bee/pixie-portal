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

        // Generate a secure reset token
        const tokenBytes = crypto.getRandomValues(new Uint8Array(24));
        const token = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('');
        const tokenHash = await hashRecoveryCode(token);
        const expiresAt = Date.now() / 1000 + 3600; // 1 hour

        // Clear any existing unused tokens for this user
        await env.DB.prepare(
            "DELETE FROM password_reset_tokens WHERE user_id = ? AND used = 0"
        ).bind(user.id).run();

        // Store the new token
        await env.DB.prepare(
            "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)"
        ).bind(user.id, tokenHash, expiresAt).run();

        // Send email via Resend
        const resetLink = `https://pixie-portal.com/?reset=${token}`;
        const emailHtml = `
            <div style="font-family:'Helvetica Neue',sans-serif;max-width:520px;margin:0 auto;background:#0d0820;padding:40px;border-radius:16px;">
                <h1 style="font-size:28px;color:#ff96c8;margin-bottom:6px;">Pixie Portal ✦</h1>
                <p style="color:#b496ff;font-size:16px;margin-bottom:28px;">Password Reset</p>
                <p style="color:#d0b8f0;font-size:15px;">Hey ${user.display_name},</p>
                <p style="color:#d0b8f0;font-size:15px;">Someone requested a password reset for your Pixie Portal account. Click the button below to set a new password.</p>
                <div style="text-align:center;margin:32px 0;">
                    <a href="${resetLink}" style="background:linear-gradient(135deg,#ff96c8,#b496ff);color:#0a0614;padding:14px 32px;border-radius:30px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">Reset My Password ✦</a>
                </div>
                <p style="color:#604878;font-size:13px;">This link expires in 1 hour. If you didn't request this, ignore this email — your account is safe.</p>
                <p style="color:#604878;font-size:13px;">Or paste this link in your browser:<br><span style="color:#9070b0;word-break:break-all;">${resetLink}</span></p>
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
                subject: "Reset your Pixie Portal password ✦",
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
