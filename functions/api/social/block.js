import { getSessionUserId } from "../../_utils/auth.js";

function resp(data, status = 200) {
    return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

// GET /api/social/block?user_id=X — check if you're blocking user X
export async function onRequestGet({ request, env }) {
    const userId = await getSessionUserId(env, request);
    if (!userId) return resp({ error: "Unauthorized" }, 401);

    const url = new URL(request.url);
    const targetId = parseInt(url.searchParams.get("user_id"));
    if (!targetId) return resp({ error: "Missing user_id" }, 400);

    const { results } = await env.DB.prepare(
        "SELECT 1 FROM blocks WHERE blocker_id = ? AND blocked_id = ?"
    ).bind(userId, targetId).all();

    return resp({ is_blocking: results.length > 0 });
}

// POST /api/social/block — block a user { user_id }
export async function onRequestPost({ request, env }) {
    const userId = await getSessionUserId(env, request);
    if (!userId) return resp({ error: "Unauthorized" }, 401);

    const { user_id } = await request.json().catch(() => ({}));
    if (!user_id) return resp({ error: "Missing user_id" }, 400);
    if (user_id === userId) return resp({ error: "Cannot block yourself" }, 400);

    await env.DB.prepare(
        "INSERT OR IGNORE INTO blocks (blocker_id, blocked_id, created_at) VALUES (?, ?, ?)"
    ).bind(userId, user_id, Math.floor(Date.now() / 1000)).run();

    // Also unfollow each other
    await env.DB.prepare("DELETE FROM follows WHERE follower_id = ? AND following_id = ?").bind(userId, user_id).run().catch(() => {});
    await env.DB.prepare("DELETE FROM follows WHERE follower_id = ? AND following_id = ?").bind(user_id, userId).run().catch(() => {});

    return resp({ success: true, is_blocking: true });
}

// DELETE /api/social/block — unblock a user { user_id }
export async function onRequestDelete({ request, env }) {
    const userId = await getSessionUserId(env, request);
    if (!userId) return resp({ error: "Unauthorized" }, 401);

    const { user_id } = await request.json().catch(() => ({}));
    if (!user_id) return resp({ error: "Missing user_id" }, 400);

    await env.DB.prepare(
        "DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?"
    ).bind(userId, user_id).run();

    return resp({ success: true, is_blocking: false });
}
