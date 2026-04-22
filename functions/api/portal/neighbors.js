import { getSessionUserId } from "../../_utils/auth.js";

export async function onRequestGet({ request, env }) {
    const userId = await getSessionUserId(env, request);
    if (!userId) return resp({ error: "Unauthorized" }, 401);

    const url = new URL(request.url);
    const targetId = url.searchParams.get("userId");

    if (targetId) {
        const { results } = await env.DB.prepare(
            "SELECT pp.placed_json, u.display_name, u.username FROM portal_players pp JOIN users u ON u.id = pp.user_id WHERE pp.user_id = ?"
        ).bind(parseInt(targetId, 10)).all();
        if (!results[0]) return resp({ error: "Not found" }, 404);
        const row = results[0];
        let placed = {};
        try { placed = JSON.parse(row.placed_json || '{}'); } catch(e) {}
        return resp({
            placed,
            displayName: row.display_name || row.username || 'Fairy',
        });
    }

    // List all other players who have a portal
    const { results } = await env.DB.prepare(
        "SELECT pp.user_id, pp.points, u.display_name, u.username, u.avatar_emoji FROM portal_players pp JOIN users u ON u.id = pp.user_id WHERE pp.user_id != ? ORDER BY pp.points DESC LIMIT 20"
    ).bind(userId).all();

    return resp({ neighbors: results.map(function(r) { return {
        userId: r.user_id,
        displayName: r.display_name || r.username || 'Fairy',
        username: r.username,
        points: r.points,
        avatar: r.avatar_emoji || '🧚',
    }; }) });
}

function resp(data, status = 200) {
    return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}
