import { getSessionUserId } from "../../_utils/auth.js";

const SHOP_ITEMS = {
    fairy_fountain: { name: "Fairy Fountain",  cost: 300  },
    wishing_well:   { name: "Wishing Well",    cost: 600  },
    crystal_arch:   { name: "Crystal Arch",    cost: 500  },
    moon_shrine:    { name: "Moon Shrine",     cost: 750  },
    star_tree:      { name: "Star Tree",       cost: 1000 },
    magic_portal:   { name: "Magic Crystal",   cost: 1500 },
    pixie_throne:   { name: "Pixie Throne",    cost: 2000 },
    crystal_spire:  { name: "Crystal Spire",   cost: 2500 },
    dragon_egg:     { name: "Dragon Egg",      cost: 3000 },
};

async function getOrCreatePlayer(env, userId) {
    let { results } = await env.DB.prepare("SELECT * FROM portal_players WHERE user_id = ?").bind(userId).all();
    if (!results[0]) {
        await env.DB.prepare(
            "INSERT INTO portal_players (user_id, points, streak, last_daily_at, garden, plot, created_at) VALUES (?, 0, 0, 0, '{}', '[]', ?)"
        ).bind(userId, Math.floor(Date.now() / 1000)).run();
        ({ results } = await env.DB.prepare("SELECT * FROM portal_players WHERE user_id = ?").bind(userId).all());
    }
    return results[0];
}

export async function onRequestPost({ request, env }) {
    const userId = await getSessionUserId(env, request);
    if (!userId) return resp({ error: "Unauthorized" }, 401);

    const { item_id } = await request.json().catch(() => ({}));
    if (!item_id) return resp({ error: "Missing item_id" }, 400);

    const item = SHOP_ITEMS[item_id];
    if (!item) return resp({ error: "Unknown item" }, 400);

    const player = await getOrCreatePlayer(env, userId);
    const plot = JSON.parse(player.plot || '[]');

    if (plot.includes(item_id)) return resp({ error: "Already owned" }, 400);
    if (player.points < item.cost) return resp({ error: "Not enough points" }, 400);

    plot.push(item_id);
    await env.DB.prepare(
        "UPDATE portal_players SET points = points - ?, plot = ? WHERE user_id = ?"
    ).bind(item.cost, JSON.stringify(plot), userId).run();

    const { results } = await env.DB.prepare("SELECT points FROM portal_players WHERE user_id = ?").bind(userId).all();
    return resp({ success: true, points: results[0].points, plot });
}

function resp(data, status = 200) {
    return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}
