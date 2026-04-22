import { getSessionUserId } from "../../_utils/auth.js";
import { isBlocked } from "../../_utils/filter.js";

function resp(data, status = 200) {
    return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

// GET /api/social/messages — list conversations, or thread if ?with=userId
export async function onRequestGet({ request, env }) {
    const userId = await getSessionUserId(env, request);
    if (!userId) return resp({ error: "Unauthorized" }, 401);

    const url = new URL(request.url);
    const withUserId = url.searchParams.get("with");

    if (withUserId) {
        // Load full thread between userId and withUserId
        const otherId = parseInt(withUserId);
        const { results: messages } = await env.DB.prepare(`
            SELECT m.id, m.sender_id, m.recipient_id, m.content, m.created_at, m.read_at,
                   u.username, u.display_name, u.avatar_emoji
            FROM messages m
            JOIN users u ON u.id = m.sender_id
            WHERE (m.sender_id = ? AND m.recipient_id = ?)
               OR (m.sender_id = ? AND m.recipient_id = ?)
            ORDER BY m.created_at ASC
        `).bind(userId, otherId, otherId, userId).all();

        // Mark incoming messages as read
        await env.DB.prepare(
            "UPDATE messages SET read_at = ? WHERE sender_id = ? AND recipient_id = ? AND read_at IS NULL"
        ).bind(Math.floor(Date.now() / 1000), otherId, userId).run();

        const { results: otherUser } = await env.DB.prepare(
            "SELECT id, username, display_name, avatar_emoji FROM users WHERE id = ?"
        ).bind(otherId).all();

        return resp({ messages, other_user: otherUser[0] || null });
    }

    // List conversations: one row per unique other user, most recent message
    const { results: convos } = await env.DB.prepare(`
        SELECT
            CASE WHEN m.sender_id = ? THEN m.recipient_id ELSE m.sender_id END AS other_id,
            u.username, u.display_name, u.avatar_emoji,
            m.content AS last_message, m.created_at AS last_at,
            SUM(CASE WHEN m.recipient_id = ? AND m.read_at IS NULL THEN 1 ELSE 0 END) AS unread
        FROM messages m
        JOIN users u ON u.id = CASE WHEN m.sender_id = ? THEN m.recipient_id ELSE m.sender_id END
        WHERE m.sender_id = ? OR m.recipient_id = ?
        GROUP BY other_id
        ORDER BY last_at DESC
    `).bind(userId, userId, userId, userId, userId).all();

    return resp({ conversations: convos });
}

// POST /api/social/messages — send a message { recipient_id, content }
export async function onRequestPost({ request, env }) {
    const userId = await getSessionUserId(env, request);
    if (!userId) return resp({ error: "Unauthorized" }, 401);

    const { recipient_id, content } = await request.json().catch(() => ({}));
    if (!recipient_id || !content?.trim()) return resp({ error: "Missing params" }, 400);
    if (content.trim().length > 1000) return resp({ error: "Message too long (max 1000 chars)" }, 400);
    if (recipient_id === userId) return resp({ error: "Cannot message yourself" }, 400);
    if (isBlocked(content)) return resp({ error: "Message contains inappropriate content" }, 400);

    const result = await env.DB.prepare(
        "INSERT INTO messages (sender_id, recipient_id, content, created_at) VALUES (?, ?, ?, ?)"
    ).bind(userId, recipient_id, content.trim(), Math.floor(Date.now() / 1000)).run();

    return resp({ success: true, id: result.meta.last_row_id });
}
