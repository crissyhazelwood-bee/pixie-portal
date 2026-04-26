import { hashPassword, generateRecoveryCode, hashRecoveryCode } from "../_utils/crypto.js";
import { createSessionCookie } from "../_utils/auth.js";

export async function onRequestPost({ request, env }) {
    try {
        const { username, recovery_code, new_password } = await request.json();
        if (!username || !recovery_code || !new_password) {
            return new Response(JSON.stringify({ error: "Missing fields" }), {
                status: 400, headers: { "Content-Type": "application/json" }
            });
        }
        if (new_password.length < 6) {
            return new Response(JSON.stringify({ error: "Password must be at least 6 characters" }), {
                status: 400, headers: { "Content-Type": "application/json" }
            });
        }
        const { results } = await env.DB.prepare(
            "SELECT * FROM users WHERE username = ? OR email = ?"
        ).bind(username.toLowerCase(), username.toLowerCase()).all();

        const user = results[0];
        if (!user) {
            return new Response(JSON.stringify({ error: "Account not found" }), {
                status: 404, headers: { "Content-Type": "application/json" }
            });
        }
        if (!user.recovery_code_hash) {
            return new Response(JSON.stringify({ error: "No recovery code set for this account" }), {
                status: 400, headers: { "Content-Type": "application/json" }
            });
        }
        const codeHash = await hashRecoveryCode(recovery_code);
        if (codeHash !== user.recovery_code_hash) {
            return new Response(JSON.stringify({ error: "Invalid recovery code" }), {
                status: 401, headers: { "Content-Type": "application/json" }
            });
        }
        // Valid — update password and rotate recovery code
        const newHash = await hashPassword(new_password);
        const newRecoveryCode = generateRecoveryCode();
        const newRecoveryHash = await hashRecoveryCode(newRecoveryCode);

        const newVersion = (user.session_version || 0) + 1;
        await env.DB.prepare(
            "UPDATE users SET password_hash = ?, recovery_code_hash = ?, session_version = ? WHERE id = ?"
        ).bind(newHash, newRecoveryHash, newVersion, user.id).run();

        const cookie = await createSessionCookie(env, user.id, newVersion, request);
        return new Response(JSON.stringify({
            success: true,
            recoveryCode: newRecoveryCode,
            user: { id: user.id, username: user.username, display_name: user.display_name, bio: user.bio, avatar_emoji: user.avatar_emoji }
        }), { headers: { "Content-Type": "application/json", "Set-Cookie": cookie } });
    } catch (e) {
        return new Response(JSON.stringify({ error: "Recovery failed, please try again" }), {
            status: 500, headers: { "Content-Type": "application/json" }
        });
    }
}
