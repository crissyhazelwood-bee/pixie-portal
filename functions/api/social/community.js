import { getSessionUserId } from "../../_utils/auth.js";
import { isBlocked } from "../../_utils/filter.js";

function resp(data, status = 200) {
    return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

// GET /api/social/community — list recent community posts
export async function onRequestGet({ request, env }) {
    const url = new URL(request.url);
    const offset = parseInt(url.searchParams.get("offset") || "0");

    const { results } = await env.DB.prepare(`
        SELECT cp.id, cp.content, cp.created_at,
               u.id as user_id, u.username, u.display_name, u.avatar_emoji,
               (SELECT COUNT(*) FROM reactions WHERE target_type='post' AND target_id=cp.id) as reaction_count,
               (SELECT COUNT(*) FROM comments WHERE target_type='post' AND target_id=cp.id) as comment_count
        FROM community_posts cp
        JOIN users u ON u.id = cp.user_id
        ORDER BY cp.created_at DESC
        LIMIT 20 OFFSET ?
    `).bind(offset).all();

    return resp({ posts: results });
}

// POST /api/social/community — create a post { content }
export async function onRequestPost({ request, env }) {
    const userId = await getSessionUserId(env, request);
    if (!userId) return resp({ error: "Unauthorized" }, 401);

    const { content } = await request.json().catch(() => ({}));
    if (!content?.trim()) return resp({ error: "Missing content" }, 400);
    if (content.trim().length > 500) return resp({ error: "Post too long (max 500 chars)" }, 400);
    if (isBlocked(content)) return resp({ error: "Post contains inappropriate content" }, 400);

    const result = await env.DB.prepare(
        "INSERT INTO community_posts (user_id, content, created_at) VALUES (?, ?, ?)"
    ).bind(userId, content.trim(), Math.floor(Date.now() / 1000)).run();

    const { results: user } = await env.DB.prepare(
        "SELECT id, username, display_name, avatar_emoji FROM users WHERE id = ?"
    ).bind(userId).all();

    return resp({
        success: true,
        post: {
            id: result.meta.last_row_id,
            content: content.trim(),
            created_at: Math.floor(Date.now() / 1000),
            reaction_count: 0,
            comment_count: 0,
            ...user[0],
        }
    });
}
