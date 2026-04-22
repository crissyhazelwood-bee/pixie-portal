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
        SELECT c.id, c.user_id, c.content, c.created_at,
               u.username, u.display_name, u.avatar_emoji
        FROM comments c
        JOIN users u ON u.id = c.user_id
        WHERE c.target_type = ? AND c.target_id = ?
        ORDER BY c.created_at ASC
    `).bind(targetType, parseInt(targetId)).all();

    return resp({ comments: results });
}

// DELETE /api/social/comments — delete a comment { comment_id }
export async function onRequestDelete({ request, env }) {
    const userId = await getSessionUserId(env, request);
    if (!userId) return resp({ error: "Unauthorized" }, 401);

    const { comment_id } = await request.json().catch(() => ({}));
    if (!comment_id) return resp({ error: "Missing comment_id" }, 400);

    const { results } = await env.DB.prepare(
        "SELECT user_id FROM comments WHERE id = ?"
    ).bind(parseInt(comment_id)).all();
    if (!results[0]) return resp({ error: "Comment not found" }, 404);
    if (results[0].user_id !== userId) return resp({ error: "Forbidden" }, 403);

    await env.DB.prepare("DELETE FROM comments WHERE id = ?").bind(parseInt(comment_id)).run();
    return resp({ success: true });
}

// POST /api/social/comments — add comment { target_type, target_id, content }
export async function onRequestPost({ request, env }) {
    const userId = await getSessionUserId(env, request);
    if (!userId) return resp({ error: "Unauthorized" }, 401);

    const { target_type, target_id, content } = await request.json().catch(() => ({}));
    if (!target_type || !target_id || !content?.trim()) return resp({ error: "Missing params" }, 400);
    if (content.trim().length > 500) return resp({ error: "Comment too long (max 500 chars)" }, 400);
    if (isBlocked(content)) return resp({ error: "Comment contains inappropriate content" }, 400);

    // Check if content owner has blocked the commenter
    try {
        let ownerRes;
        if (target_type === 'journal') {
            ownerRes = await env.DB.prepare("SELECT user_id FROM journal_entries WHERE id = ?").bind(parseInt(target_id)).all();
        } else if (target_type === 'community_post') {
            ownerRes = await env.DB.prepare("SELECT user_id FROM community_posts WHERE id = ?").bind(parseInt(target_id)).all();
        }
        const ownerId = ownerRes?.results[0]?.user_id;
        if (ownerId && ownerId !== userId) {
            const { results: blockCheck } = await env.DB.prepare(
                "SELECT 1 FROM blocks WHERE blocker_id = ? AND blocked_id = ?"
            ).bind(ownerId, userId).all();
            if (blockCheck.length > 0) return resp({ error: "Unable to comment" }, 403);
        }
    } catch (_) {}

    const now = Math.floor(Date.now() / 1000);
    const result = await env.DB.prepare(
        "INSERT INTO comments (user_id, target_type, target_id, content, created_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(userId, target_type, parseInt(target_id), content.trim(), now).run();

    // Notify the content owner (if not self)
    try {
        let ownerRes;
        if (target_type === 'journal') {
            ownerRes = await env.DB.prepare("SELECT user_id FROM journal_entries WHERE id = ?").bind(parseInt(target_id)).all();
        } else if (target_type === 'community_post') {
            ownerRes = await env.DB.prepare("SELECT user_id FROM community_posts WHERE id = ?").bind(parseInt(target_id)).all();
        }
        const ownerId = ownerRes?.results[0]?.user_id;
        if (ownerId && ownerId !== userId) {
            await env.DB.prepare(
                "INSERT INTO notifications (user_id, actor_id, type, target_type, target_id, created_at) VALUES (?, ?, 'comment', ?, ?, ?)"
            ).bind(ownerId, userId, target_type, parseInt(target_id), now).run();
        }
    } catch (_) {}

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
