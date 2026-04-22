import { hashPassword, generateRecoveryCode, hashRecoveryCode } from "../_utils/crypto.js";
import { createSessionCookie } from "../_utils/auth.js";

export async function onRequestPost({ request, env }) {
    try {
        const { username, email, password, display_name } = await request.json();
        if (!username || !email || !password) {
            return new Response(JSON.stringify({ error: "Missing fields" }), {
                status: 400, headers: { "Content-Type": "application/json" }
            });
        }
        // BUG-09 fix: enforce minimum password length on signup (matches recover/reset-confirm)
        if (password.length < 6) {
            return new Response(JSON.stringify({ error: "Password must be at least 6 characters" }), {
                status: 400, headers: { "Content-Type": "application/json" }
            });
        }
        const hash = await hashPassword(password);
        const recoveryCode = generateRecoveryCode();
        const recoveryHash = await hashRecoveryCode(recoveryCode);

        const res = await env.DB.prepare(
            "INSERT INTO users (username, email, password_hash, recovery_code_hash, display_name, avatar_emoji, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
        ).bind(
            username.toLowerCase(),
            email.toLowerCase(),
            hash,
            recoveryHash,
            display_name || username,
            "✦",
            Date.now() / 1000
        ).run();

        const userId = res.meta.last_row_id;
        const cookie = await createSessionCookie(env, userId, 0);
        return new Response(JSON.stringify({
            success: true,
            recoveryCode,
            user: { id: userId, username, display_name: display_name || username, avatar_emoji: "✦" }
        }), { headers: { "Content-Type": "application/json", "Set-Cookie": cookie } });
    } catch (e) {
        // BUG-15 fix: distinguish UNIQUE constraint violations from other errors
        if (e.message && e.message.includes("UNIQUE constraint failed")) {
            return new Response(JSON.stringify({ error: "Username or email already taken" }), {
                status: 400, headers: { "Content-Type": "application/json" }
            });
        }
        return new Response(JSON.stringify({ error: "Signup failed, please try again" }), {
            status: 500, headers: { "Content-Type": "application/json" }
        });
    }
}
