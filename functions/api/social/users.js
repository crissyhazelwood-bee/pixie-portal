import { getSessionUserId } from "../../_utils/auth.js";

function resp(data, status = 200) {
    return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

// GET /api/social/users?username=xxx — get public profile by username
// GET /api/social/users?search=xxx — search users
// GET /api/social/users?id=xxx — get by id
export async function onRequestGet({ request, env }) {
    const url = new URL(request.url);
    const username = url.searchParams.get("username");
    const search = url.searchParams.get("search");
    const id = url.searchParams.get("id");

    if (username) {
        const { results } = await env.DB.prepare(
            "SELECT id, username, display_name, bio, avatar_emoji FROM users WHERE username = ?"
        ).bind(username).all();
        if (!results[0]) return resp({ error: "User not found" }, 404);

        const user = results[0];
        const [{ results: scores }, { results: portalData }, { results: journalPub }, { results: followerData }, { results: followingData }] = await Promise.all([
            env.DB.prepare("SELECT game, score FROM leaderboard WHERE user_id = ? ORDER BY score DESC LIMIT 5").bind(user.id).all().catch(() => ({ results: [] })),
            env.DB.prepare("SELECT points, streak FROM portal_players WHERE user_id = ?").bind(user.id).all().catch(() => ({ results: [] })),
            env.DB.prepare("SELECT id, title, mood, created_at FROM journal_entries WHERE user_id = ? AND is_public = 1 ORDER BY created_at DESC LIMIT 5").bind(user.id).all().catch(() => ({ results: [] })),
            env.DB.prepare("SELECT COUNT(*) as c FROM follows WHERE following_id = ?").bind(user.id).all().catch(() => ({ results: [{ c: 0 }] })),
            env.DB.prepare("SELECT COUNT(*) as c FROM follows WHERE follower_id = ?").bind(user.id).all().catch(() => ({ results: [{ c: 0 }] })),
        ]);

        return resp({
            user: {
                ...user,
                top_scores: scores,
                portal: portalData[0] || null,
                public_journal: journalPub,
                follower_count: followerData[0]?.c || 0,
                following_count: followingData[0]?.c || 0,
            }
        });
    }

    if (id) {
        const { results } = await env.DB.prepare(
            "SELECT id, username, display_name, bio, avatar_emoji FROM users WHERE id = ?"
        ).bind(parseInt(id)).all();
        if (!results[0]) return resp({ error: "User not found" }, 404);
        return resp({ user: results[0] });
    }

    if (search) {
        const userId = await getSessionUserId(env, request);
        const q = `%${search}%`;
        const { results } = await env.DB.prepare(
            "SELECT id, username, display_name, avatar_emoji FROM users WHERE username LIKE ? OR display_name LIKE ? LIMIT 10"
        ).bind(q, q).all();

        if (userId && results.length) {
            const followChecks = await Promise.all(
                results.map(u =>
                    env.DB.prepare("SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?")
                        .bind(userId, u.id).all().catch(() => ({ results: [] }))
                )
            );
            results.forEach((u, i) => { u.is_following = followChecks[i].results.length > 0; });
        }

        return resp({ users: results });
    }

    return resp({ error: "Missing params" }, 400);
}
