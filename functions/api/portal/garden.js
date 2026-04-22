import { getSessionUserId } from "../../_utils/auth.js";

const HERBS = {
    mint:       { name: "Mint",          emoji: "🌿", hours: 2,  points: 10, level: 1 },
    clover:     { name: "Clover",        emoji: "🍀", hours: 2,  points: 8,  level: 1 },
    rosemary:   { name: "Rosemary",      emoji: "🌱", hours: 3,  points: 12, level: 1 },
    lavender:   { name: "Lavender",      emoji: "💜", hours: 6,  points: 18, level: 2 },
    chamomile:  { name: "Chamomile",     emoji: "🌼", hours: 5,  points: 15, level: 2 },
    moonflower: { name: "Moonflower",    emoji: "🌙", hours: 10, points: 28, level: 4 },
    stardust:   { name: "Stardust Fern", emoji: "✨", hours: 8,  points: 25, level: 5 },
    moonshroom: { name: "Moonshroom",    emoji: "🍄", hours: 14, points: 35, level: 6 },
};

const LEVELS = [
    { level: 1,  minPoints: 0,     slots: 3  },
    { level: 2,  minPoints: 100,   slots: 4  },
    { level: 3,  minPoints: 300,   slots: 5  },
    { level: 4,  minPoints: 600,   slots: 6  },
    { level: 5,  minPoints: 1000,  slots: 6  },
    { level: 6,  minPoints: 1500,  slots: 8  },
    { level: 7,  minPoints: 2500,  slots: 8  },
    { level: 8,  minPoints: 4000,  slots: 10 },
    { level: 9,  minPoints: 5500,  slots: 10 },
    { level: 10, minPoints: 7500,  slots: 12 },
    { level: 11, minPoints: 10000, slots: 12 },
    { level: 12, minPoints: 13500, slots: 12 },
    { level: 13, minPoints: 18000, slots: 12 },
    { level: 14, minPoints: 23500, slots: 14 },
    { level: 15, minPoints: 30000, slots: 14 },
    { level: 16, minPoints: 39000, slots: 14 },
    { level: 17, minPoints: 50000, slots: 16 },
    { level: 18, minPoints: 63000, slots: 16 },
    { level: 19, minPoints: 79000, slots: 16 },
    { level: 20, minPoints: 98000, slots: 16 },
];

function getLevel(points) {
    return [...LEVELS].reverse().find(l => points >= l.minPoints) || LEVELS[0];
}

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

    const { action, slot, herb, score: rawScore } = await request.json().catch(() => ({}));
    const player = await getOrCreatePlayer(env, userId);
    const garden = JSON.parse(player.garden || '{}');
    const now = Math.floor(Date.now() / 1000);
    const levelData = getLevel(player.points);

    if (action === 'plant') {
        if (slot === undefined || !herb) return resp({ error: "Missing slot or herb" }, 400);
        if (slot >= levelData.slots) return resp({ error: "Slot locked" }, 403);
        if (garden[slot]) return resp({ error: "Slot occupied" }, 400);
        const herbData = HERBS[herb];
        if (!herbData) return resp({ error: "Unknown herb" }, 400);
        if (herbData.level > levelData.level) return resp({ error: "Herb locked" }, 403);

        garden[slot] = { herb, planted_at: now, watered_at: now };
        await env.DB.prepare("UPDATE portal_players SET garden = ? WHERE user_id = ?").bind(JSON.stringify(garden), userId).run();
        return resp({ success: true, garden });
    }

    if (action === 'water') {
        if (slot === undefined) return resp({ error: "Missing slot" }, 400);
        const plant = garden[slot];
        if (!plant) return resp({ error: "No plant here" }, 400);

        // Water gives 3 points (once per plant per hour)
        const lastWatered = plant.watered_at || 0;
        let pointsEarned = 0;
        if (lastWatered < now - 120) {
            pointsEarned = 3;
            await env.DB.prepare("UPDATE portal_players SET points = points + 3 WHERE user_id = ?").bind(userId).run();
        }
        garden[slot].watered_at = now;
        await env.DB.prepare("UPDATE portal_players SET garden = ? WHERE user_id = ?").bind(JSON.stringify(garden), userId).run();
        return resp({ success: true, pointsEarned, garden });
    }

    if (action === 'harvest') {
        if (slot === undefined) return resp({ error: "Missing slot" }, 400);
        const plant = garden[slot];
        if (!plant) return resp({ error: "No plant here" }, 400);
        const herbData = HERBS[plant.herb];
        if (!herbData) return resp({ error: "Unknown herb" }, 400);

        const elapsed = now - plant.planted_at;
        const growSecs = herbData.hours * 3600;
        if (elapsed < growSecs) return resp({ error: "Not ready yet" }, 400);

        const pointsEarned = herbData.points;
        delete garden[slot];
        await env.DB.prepare(
            "UPDATE portal_players SET points = points + ?, garden = ? WHERE user_id = ?"
        ).bind(pointsEarned, JSON.stringify(garden), userId).run();
        return resp({ success: true, pointsEarned, garden });
    }

    if (action === 'remove') {
        if (slot === undefined) return resp({ error: "Missing slot" }, 400);
        delete garden[slot];
        await env.DB.prepare("UPDATE portal_players SET garden = ? WHERE user_id = ?").bind(JSON.stringify(garden), userId).run();
        return resp({ success: true, garden });
    }

    if (action === 'minigame') {
        const awarded = Math.max(0, Math.min(parseInt(rawScore, 10) || 0, 50));
        if (awarded > 0) {
            await env.DB.prepare("UPDATE portal_players SET points = points + ? WHERE user_id = ?").bind(awarded, userId).run();
        }
        const { results: r2 } = await env.DB.prepare("SELECT points FROM portal_players WHERE user_id = ?").bind(userId).all();
        return resp({ success: true, awarded, points: r2[0].points });
    }

    return resp({ error: "Unknown action" }, 400);
}

function resp(data, status = 200) {
    return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}
