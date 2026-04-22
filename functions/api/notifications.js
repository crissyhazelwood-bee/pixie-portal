import { getSessionUserId } from "../_utils/auth.js";

function resp(data, status = 200) {
    return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

// GET /api/notifications — list recent notifications for logged-in user
export async function onRequestGet({ request, env }) {
    const userId = await getSessionUserId(env, request);
    if (!userId) return resp({ error: "Unauthorized" }, 401);

    const { results } = await env.DB.prepare(`
        SELECT n.id, n.type, n.target_type, n.target_id, n.read_at, n.created_at,
               u.username, u.display_name, u.avatar_emoji
        FROM notifications n
        JOIN users u ON u.id = n.actor_id
        WHERE n.user_id = ?
        ORDER BY n.created_at DESC
        LIMIT 20
    `).bind(userId).all();

    const unread = results.filter(n => !n.read_at).length;
    return resp({ notifications: results, unread });
}

// POST /api/notifications — mark read { all: true } or { id: X }
export async function onRequestPost({ request, env }) {
    const userId = await getSessionUserId(env, request);
    if (!userId) return resp({ error: "Unauthorized" }, 401);

    const { all, id } = await request.json().catch(() => ({}));
    const now = Math.floor(Date.now() / 1000);

    if (all) {
        await env.DB.prepare(
            "UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL"
        ).bind(now, userId).run();
    } else if (id) {
        await env.DB.prepare(
            "UPDATE notifications SET read_at = ? WHERE id = ? AND user_id = ?"
        ).bind(now, id, userId).run();
    }

    return resp({ success: true });
}
