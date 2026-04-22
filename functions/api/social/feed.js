import { getSessionUserId } from "../../_utils/auth.js";

function resp(data, status = 200) {
    return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

// GET /api/social/feed — activity from users you follow (journal entries + community posts)
export async function onRequestGet({ request, env }) {
    const userId = await getSessionUserId(env, request);
    if (!userId) return resp({ error: "Unauthorized" }, 401);

    const [{ results: journalItems }, { results: postItems }] = await Promise.all([
        env.DB.prepare(`
            SELECT je.id, je.title, je.content, je.mood, je.created_at, je.video_url,
                   u.username, u.display_name, u.avatar_emoji,
                   'journal' as type
            FROM journal_entries je
            JOIN users u ON u.id = je.user_id
            WHERE je.user_id IN (SELECT following_id FROM follows WHERE follower_id = ?)
              AND je.is_public = 1
            ORDER BY je.created_at DESC LIMIT 30
        `).bind(userId).all(),
        env.DB.prepare(`
            SELECT cp.id, cp.content, cp.created_at,
                   u.username, u.display_name, u.avatar_emoji,
                   'post' as type
            FROM community_posts cp
            JOIN users u ON u.id = cp.user_id
            WHERE cp.user_id IN (SELECT following_id FROM follows WHERE follower_id = ?)
            ORDER BY cp.created_at DESC LIMIT 30
        `).bind(userId).all(),
    ]);

    const items = [...journalItems, ...postItems].sort((a, b) => b.created_at - a.created_at).slice(0, 40);
    return resp({ feed: items });
}
