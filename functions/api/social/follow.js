import { getSessionUserId } from "../../_utils/auth.js";

function resp(data, status = 200) {
    return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

// GET /api/social/follow?user_id=X — check follow status + counts for user X
export async function onRequestGet({ request, env }) {
    const userId = await getSessionUserId(env, request);
    const url = new URL(request.url);
    const targetId = parseInt(url.searchParams.get("user_id"));
    if (!targetId) return resp({ error: "Missing user_id" }, 400);

    const [{ results: followers }, { results: following }] = await Promise.all([
        env.DB.prepare("SELECT COUNT(*) as c FROM follows WHERE following_id = ?").bind(targetId).all(),
        env.DB.prepare("SELECT COUNT(*) as c FROM follows WHERE follower_id = ?").bind(targetId).all(),
    ]);

    let isFollowing = false;
    if (userId) {
        const { results: check } = await env.DB.prepare(
            "SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?"
        ).bind(userId, targetId).all();
        isFollowing = check.length > 0;
    }

    return resp({
        follower_count: followers[0].c,
        following_count: following[0].c,
        is_following: isFollowing,
    });
}

// POST /api/social/follow — follow a user { user_id }
export async function onRequestPost({ request, env }) {
    const userId = await getSessionUserId(env, request);
    if (!userId) return resp({ error: "Unauthorized" }, 401);

    const { user_id } = await request.json().catch(() => ({}));
    if (!user_id) return resp({ error: "Missing user_id" }, 400);
    if (user_id === userId) return resp({ error: "Cannot follow yourself" }, 400);

    await env.DB.prepare(
        "INSERT OR IGNORE INTO follows (follower_id, following_id, created_at) VALUES (?, ?, ?)"
    ).bind(userId, user_id, Math.floor(Date.now() / 1000)).run();

    return resp({ success: true, following: true });
}

// DELETE /api/social/follow — unfollow { user_id }
export async function onRequestDelete({ request, env }) {
    const userId = await getSessionUserId(env, request);
    if (!userId) return resp({ error: "Unauthorized" }, 401);

    const { user_id } = await request.json().catch(() => ({}));
    if (!user_id) return resp({ error: "Missing user_id" }, 400);

    await env.DB.prepare(
        "DELETE FROM follows WHERE follower_id = ? AND following_id = ?"
    ).bind(userId, user_id).run();

    return resp({ success: true, following: false });
}
