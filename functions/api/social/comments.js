import { getSessionUserId } from "../../_utils/auth.js";
import { isBlocked } from "../../_utils/filter.js";

function resp(data, status = 200) {
    return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

// GET /api/social/comments?target_type=journal&target_id=5
export async function onRequestGet({ request, env }) {
    const url = new URL(request.url);
    const targetType = url.searchParams.get("target_type");
    const targetId = url.searchParams.get("target_id");
    if (!targetType || !targetId) return resp({ error: "Missing params" }, 400);

    const { results } = await env.DB.prepare(`
        SELECT c.id, c.content, c.created_at,
               u.username, u.display_name, u.avatar_emoji
        FROM comments c
        JOIN users u ON u.id = c.user_id
        WHERE c.target_type = ? AND c.target_id = ?
        ORDER BY c.created_at ASC
    `).bind(targetType, parseInt(targetId)).all();

    return resp({ comments: results });
}

// POST /api/social/comments — add comment { target_type, target_id, content }
export async function onRequestPost({ request, env }) {
    const userId = await getSessionUserId(env, request);
    if (!userId) return resp({ error: "Unauthorized" }, 401);

    const { target_type, target_id, content } = await request.json().catch(() => ({}));
    if (!target_type || !target_id || !content?.trim()) return resp({ error: "Missing params" }, 400);
    if (content.trim().length > 500) return resp({ error: "Comment too long (max 500 chars)" }, 400);
    if (isBlocked(content)) return resp({ error: "Comment contains inappropriate content" }, 400);

    const result = await env.DB.prepare(
        "INSERT INTO comments (user_id, target_type, target_id, content, created_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(userId, target_type, parseInt(target_id), content.trim(), Math.floor(Date.now() / 1000)).run();

    const { results: user } = await env.DB.prepare(
        "SELECT username, display_name, avatar_emoji FROM users WHERE id = ?"
    ).bind(userId).all();

    return resp({
        success: true,
        comment: {
            id: result.meta.last_row_id,
            content: content.trim(),
            created_at: Math.floor(Date.now() / 1000),
            ...user[0],
        }
    });
}
