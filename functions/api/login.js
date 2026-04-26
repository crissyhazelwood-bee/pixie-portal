import { verifyPassword } from "../_utils/crypto.js";
import { createSessionCookie } from "../_utils/auth.js";

export async function onRequestPost({ request, env }) {
    try {
        const { username, password } = await request.json();
        if (!username || !password) {
            return new Response(JSON.stringify({ error: "Missing fields" }), {
                status: 400, headers: { "Content-Type": "application/json" }
            });
        }
        const { results } = await env.DB.prepare(
            "SELECT * FROM users WHERE username = ? OR email = ?"
        ).bind(username.toLowerCase(), username.toLowerCase()).all();

        const user = results[0];
        if (!user) {
            return new Response(JSON.stringify({ error: "Invalid username or password" }), {
                status: 401, headers: { "Content-Type": "application/json" }
            });
        }

        // Detect old bcrypt hashes — these users need to reset via email
        if (user.password_hash && user.password_hash.startsWith('$2')) {
            return new Response(JSON.stringify({
                error: "Your account needs a password reset. Use \"Forgot your password?\" to get a reset link sent to your email.",
                needs_reset: true
            }), { status: 401, headers: { "Content-Type": "application/json" } });
        }

        if (!(await verifyPassword(password, user.password_hash))) {
            return new Response(JSON.stringify({ error: "Invalid username or password" }), {
                status: 401, headers: { "Content-Type": "application/json" }
            });
        }

        const cookie = await createSessionCookie(env, user.id, user.session_version || 0, request);
        return new Response(JSON.stringify({
            success: true,
            user: { id: user.id, username: user.username, display_name: user.display_name, bio: user.bio, avatar_emoji: user.avatar_emoji }
        }), { headers: { "Content-Type": "application/json", "Set-Cookie": cookie } });
    } catch (err) {
        return new Response(JSON.stringify({ error: "Login error: " + (err && err.message ? err.message : String(err)) }), {
            status: 500, headers: { "Content-Type": "application/json" }
        });
    }
}
