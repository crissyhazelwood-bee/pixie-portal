import { hashPassword, generateRecoveryCode, hashRecoveryCode } from "../_utils/crypto.js";
import { createSessionCookie } from "../_utils/auth.js";

export async function onRequestPost({ request, env }) {
    try {
        const { email, code, new_password } = await request.json();
        if (!email || !code || !new_password) {
            return new Response(JSON.stringify({ error: "Missing fields" }), {
                status: 400, headers: { "Content-Type": "application/json" }
            });
        }
        if (new_password.length < 6) {
            return new Response(JSON.stringify({ error: "Password must be at least 6 characters" }), {
                status: 400, headers: { "Content-Type": "application/json" }
            });
        }

        // Look up user by email
        const { results: userRes } = await env.DB.prepare(
            "SELECT id FROM users WHERE email = ?"
        ).bind(email.toLowerCase()).all();

        if (!userRes[0]) {
            return new Response(JSON.stringify({ error: "Invalid code" }), {
                status: 401, headers: { "Content-Type": "application/json" }
            });
        }

        const userId = userRes[0].id;
        const codeHash = await hashRecoveryCode(code);
        const now = Date.now() / 1000;

        const { results } = await env.DB.prepare(
            "SELECT t.id as token_id, u.* FROM password_reset_tokens t JOIN users u ON t.user_id = u.id WHERE t.user_id = ? AND t.token_hash = ? AND t.used = 0 AND t.expires_at > ?"
        ).bind(userId, codeHash, now).all();

        if (!results[0]) {
            return new Response(JSON.stringify({ error: "Code is invalid or has expired" }), {
                status: 401, headers: { "Content-Type": "application/json" }
            });
        }

        const { token_id, ...user } = results[0];

        // Mark token as used
        await env.DB.prepare("UPDATE password_reset_tokens SET used = 1 WHERE id = ?").bind(token_id).run();

        // Update password and issue new recovery code
        const newHash = await hashPassword(new_password);
        const newRecoveryCode = generateRecoveryCode();
        const newRecoveryHash = await hashRecoveryCode(newRecoveryCode);

        await env.DB.prepare(
            "UPDATE users SET password_hash = ?, recovery_code_hash = ? WHERE id = ?"
        ).bind(newHash, newRecoveryHash, user.id).run();

        const cookie = await createSessionCookie(env, user.id);
        return new Response(JSON.stringify({
            success: true,
            recoveryCode: newRecoveryCode,
            user: { id: user.id, username: user.username, display_name: user.display_name, bio: user.bio, avatar_emoji: user.avatar_emoji }
        }), { headers: { "Content-Type": "application/json", "Set-Cookie": cookie } });
    } catch (e) {
        return new Response(JSON.stringify({ error: "Reset failed, please try again" }), {
            status: 500, headers: { "Content-Type": "application/json" }
        });
    }
}
