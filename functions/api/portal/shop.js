import { getSessionUserId } from "../../_utils/auth.js";

const LEVELS = [
    { level: 1,  minPoints: 0     },
    { level: 2,  minPoints: 100   },
    { level: 3,  minPoints: 300   },
    { level: 4,  minPoints: 600   },
    { level: 5,  minPoints: 1000  },
    { level: 6,  minPoints: 1500  },
    { level: 7,  minPoints: 2500  },
    { level: 8,  minPoints: 4000  },
    { level: 9,  minPoints: 5500  },
    { level: 10, minPoints: 7500  },
    { level: 11, minPoints: 10000 },
    { level: 12, minPoints: 13500 },
    { level: 13, minPoints: 18000 },
    { level: 14, minPoints: 23500 },
    { level: 15, minPoints: 30000 },
    { level: 16, minPoints: 39000 },
    { level: 17, minPoints: 50000 },
    { level: 18, minPoints: 63000 },
    { level: 19, minPoints: 79000  },
    { level: 20, minPoints: 98000  },
    { level: 21, minPoints: 112000 },
    { level: 22, minPoints: 128000 },
    { level: 23, minPoints: 146000 },
    { level: 24, minPoints: 166000 },
    { level: 25, minPoints: 188000 },
    { level: 26, minPoints: 212000 },
    { level: 27, minPoints: 238000 },
    { level: 28, minPoints: 267000 },
    { level: 29, minPoints: 298000 },
    { level: 30, minPoints: 332000 },
    { level: 31, minPoints: 369000 },
    { level: 32, minPoints: 409000 },
    { level: 33, minPoints: 452000 },
    { level: 34, minPoints: 498000 },
    { level: 35, minPoints: 547000 },
    { level: 36, minPoints: 599000 },
    { level: 37, minPoints: 654000 },
    { level: 38, minPoints: 713000 },
    { level: 39, minPoints: 775000 },
    { level: 40, minPoints: 841000 },
    { level: 41, minPoints: 911000 },
    { level: 42, minPoints: 985000 },
    { level: 43, minPoints: 1063000 },
    { level: 44, minPoints: 1145000 },
    { level: 45, minPoints: 1231000 },
    { level: 46, minPoints: 1321000 },
    { level: 47, minPoints: 1415000 },
    { level: 48, minPoints: 1513000 },
    { level: 49, minPoints: 1615000 },
    { level: 50, minPoints: 1721000 },
];

function getLevel(points) {
    return [...LEVELS].reverse().find(l => points >= l.minPoints) || LEVELS[0];
}

const SHOP_ITEMS = {
    fairy_fountain:      { name: "Fairy Fountain",    cost: 300  },
    wishing_well:        { name: "Wishing Well",      cost: 600  },
    crystal_arch:        { name: "Crystal Arch",      cost: 500  },
    moon_shrine:         { name: "Moon Shrine",       cost: 750  },
    star_tree:           { name: "Star Tree",         cost: 1000 },
    magic_portal:        { name: "Magic Crystal",     cost: 1500 },
    pixie_throne:        { name: "Pixie Throne",      cost: 2000 },
    crystal_spire:       { name: "Crystal Spire",     cost: 2500 },
    dragon_egg:          { name: "Dragon Egg",        cost: 3000 },
    grocery_store:       { name: "Grocery Store",     cost: 400  },
    salon:               { name: "Salon",             cost: 600  },
    library:             { name: "Library",           cost: 1100 },
    post_office:         { name: "Post Office",       cost: 800  },
    city_hall:           { name: "City Hall",         cost: 3500 },
    fairy_necklace:      { name: "Crystal Necklace",  cost: 300  },
    fairy_wand:          { name: "Magic Wand",        cost: 400  },
    fairy_crown:         { name: "Fairy Crown",       cost: 500  },
    fairy_wings_rainbow: { name: "Rainbow Wings",     cost: 700  },
    fairy_aura:          { name: "Star Aura",         cost: 1000 },
    outfit_starlight:    { name: "Starlight Gown",    cost: 500  },
    outfit_rose:         { name: "Rose Petal Dress",  cost: 600  },
    outfit_moonbeam:     { name: "Moonbeam Robe",     cost: 700  },
    outfit_nature:       { name: "Nature Sprite",     cost: 800  },
    outfit_ember:        { name: "Ember Dress",       cost: 900  },
    hair_buns:           { name: "Star Buns",         cost: 300  },
    hair_long:           { name: "Long Waves",        cost: 400  },
    hair_braid:          { name: "Rainbow Braid",     cost: 450  },
    hair_pixie:          { name: "Pixie Cut",         cost: 350  },
    hair_updo:           { name: "Crystal Updo",      cost: 550   },
    moonbloom_garden:    { name: "Moonbloom Garden",  cost: 1200,  minLevel: 5  },
    dragons_lair:        { name: "Dragon's Lair",     cost: 5000,  minLevel: 10 },
    stargate_shrine:     { name: "Stargate Shrine",   cost: 12000, minLevel: 15 },
    crystal_castle:      { name: "Crystal Castle",    cost: 40000, minLevel: 20 },
    cherry_blossom_tree: { name: "Cherry Blossom Tree", cost: 800  },
    weeping_willow:      { name: "Weeping Willow",      cost: 600  },
    sunflower_field:     { name: "Sunflower Field",     cost: 500  },
    mushroom_grove:      { name: "Mushroom Grove",      cost: 700  },
    fairy_ring:          { name: "Fairy Ring",          cost: 900  },
    crystal_flowers:     { name: "Crystal Flowers",     cost: 1100 },
    aurora_tower:        { name: "Aurora Tower",        cost: 20000,  minLevel: 30 },
    phoenix_perch:       { name: "Phoenix Perch",       cost: 25000,  minLevel: 30 },
    outfit_aurora:       { name: "Aurora Gown",         cost: 2500,   minLevel: 30 },
    hair_ocean:          { name: "Ocean Waves",         cost: 2000,   minLevel: 30 },
    time_obelisk:        { name: "Time Obelisk",        cost: 50000,  minLevel: 40 },
    shadow_sanctum:      { name: "Shadow Sanctum",      cost: 65000,  minLevel: 40 },
    outfit_void:         { name: "Void Dress",          cost: 4000,   minLevel: 40 },
    fairy_wings_prismatic: { name: "Prismatic Wings",   cost: 3500,   minLevel: 40 },
    celestial_throne:    { name: "Celestial Throne",    cost: 100000, minLevel: 50 },
    world_tree:          { name: "World Tree",          cost: 80000,  minLevel: 50 },
    outfit_queen:        { name: "Queen's Regalia",     cost: 6000,   minLevel: 50 },
    fairy_halo:          { name: "Celestial Halo",      cost: 5000,   minLevel: 50 },
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
    if (item.minLevel && getLevel(player.points).level < item.minLevel) return resp({ error: "Level too low" }, 403);
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
