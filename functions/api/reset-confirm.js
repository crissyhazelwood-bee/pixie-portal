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

        const now = Date.now() / 1000;

        // Look up user by email
        const { results: userRes } = await env.DB.prepare(
            "SELECT id, username, display_name, bio, avatar_emoji, session_version FROM users WHERE email = ?"
        ).bind(email.toLowerCase()).all();

        if (!userRes[0]) {
            return new Response(JSON.stringify({ error: "Invalid code" }), {
                status: 401, headers: { "Content-Type": "application/json" }
            });
        }

        const user = userRes[0];

        // BUG-07 fix: find the token without hash match first, so we can rate-limit all guesses
        const { results: tokenRes } = await env.DB.prepare(
            "SELECT id, token_hash, attempts FROM password_reset_tokens WHERE user_id = ? AND used = 0 AND expires_at > ? ORDER BY id DESC LIMIT 1"
        ).bind(user.id, now).all();

        if (!tokenRes[0]) {
            return new Response(JSON.stringify({ error: "Code is invalid or has expired" }), {
                status: 401, headers: { "Content-Type": "application/json" }
            });
        }

        const token = tokenRes[0];

        // Increment attempt count before checking code (counts wrong guesses against the limit)
        await env.DB.prepare(
            "UPDATE password_reset_tokens SET attempts = attempts + 1 WHERE id = ?"
        ).bind(token.id).run();

        // BUG-07: lock out after 10 wrong attempts — invalidate token to force a fresh request
        if (token.attempts >= 10) {
            await env.DB.prepare(
                "UPDATE password_reset_tokens SET used = 1 WHERE id = ?"
            ).bind(token.id).run();
            return new Response(JSON.stringify({ error: "Too many attempts. Please request a new reset code." }), {
                status: 429, headers: { "Content-Type": "application/json" }
            });
        }

        // Verify the submitted code against the stored hash
        const codeHash = await hashRecoveryCode(code);
        if (codeHash !== token.token_hash) {
            return new Response(JSON.stringify({ error: "Code is invalid or has expired" }), {
                status: 401, headers: { "Content-Type": "application/json" }
            });
        }

        // Code is valid — update password, rotate recovery code, bump session version
        const newHash = await hashPassword(new_password);
        const newRecoveryCode = generateRecoveryCode();
        const newRecoveryHash = await hashRecoveryCode(newRecoveryCode);
        const newVersion = (user.session_version || 0) + 1;

        // BUG-10 fix: update password BEFORE marking token used.
        // If the DB write below fails, the token stays valid and the user can retry.
        await env.DB.prepare(
            "UPDATE users SET password_hash = ?, recovery_code_hash = ?, session_version = ? WHERE id = ?"
        ).bind(newHash, newRecoveryHash, newVersion, user.id).run();

        await env.DB.prepare("UPDATE password_reset_tokens SET used = 1 WHERE id = ?").bind(token.id).run();

        const cookie = await createSessionCookie(env, user.id, newVersion);
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
