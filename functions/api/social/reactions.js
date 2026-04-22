import { getSessionUserId } from "../../_utils/auth.js";

function resp(data, status = 200) {
    return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

// GET /api/social/reactions?target_type=journal&target_id=5
export async function onRequestGet({ request, env }) {
    const userId = await getSessionUserId(env, request);
    const url = new URL(request.url);
    const targetType = url.searchParams.get("target_type");
    const targetId = url.searchParams.get("target_id");
    if (!targetType || !targetId) return resp({ error: "Missing params" }, 400);

    const { results } = await env.DB.prepare(
        "SELECT reaction, COUNT(*) as count FROM reactions WHERE target_type = ? AND target_id = ? GROUP BY reaction"
    ).bind(targetType, parseInt(targetId)).all();

    let myReaction = null;
    if (userId) {
        const { results: mine } = await env.DB.prepare(
            "SELECT reaction FROM reactions WHERE user_id = ? AND target_type = ? AND target_id = ?"
        ).bind(userId, targetType, parseInt(targetId)).all();
        myReaction = mine[0]?.reaction || null;
    }

    return resp({ counts: results, my_reaction: myReaction });
}

// POST /api/social/reactions — toggle reaction { target_type, target_id, reaction }
export async function onRequestPost({ request, env }) {
    const userId = await getSessionUserId(env, request);
    if (!userId) return resp({ error: "Unauthorized" }, 401);

    const { target_type, target_id, reaction = "heart" } = await request.json().catch(() => ({}));
    if (!target_type || !target_id) return resp({ error: "Missing params" }, 400);

    const { results: existing } = await env.DB.prepare(
        "SELECT id FROM reactions WHERE user_id = ? AND target_type = ? AND target_id = ?"
    ).bind(userId, target_type, parseInt(target_id)).all();

    if (existing.length > 0) {
        // Toggle off
        await env.DB.prepare(
            "DELETE FROM reactions WHERE user_id = ? AND target_type = ? AND target_id = ?"
        ).bind(userId, target_type, parseInt(target_id)).run();
        return resp({ success: true, reacted: false });
    } else {
        const now = Math.floor(Date.now() / 1000);
        await env.DB.prepare(
            "INSERT INTO reactions (user_id, target_type, target_id, reaction, created_at) VALUES (?, ?, ?, ?, ?)"
        ).bind(userId, target_type, parseInt(target_id), reaction, now).run();

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
                    "INSERT INTO notifications (user_id, actor_id, type, target_type, target_id, created_at) VALUES (?, ?, 'reaction', ?, ?, ?)"
                ).bind(ownerId, userId, target_type, parseInt(target_id), now).run();
            }
        } catch (_) {}

        return resp({ success: true, reacted: true });
    }
}
