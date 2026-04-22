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
    { level: 1, minPoints: 0,    slots: 3,  title: "Seedling" },
    { level: 2, minPoints: 100,  slots: 4,  title: "Sprout" },
    { level: 3, minPoints: 300,  slots: 5,  title: "Bloom" },
    { level: 4, minPoints: 600,  slots: 6,  title: "Grove" },
    { level: 5, minPoints: 1000, slots: 6,  title: "Enchanted" },
    { level: 6, minPoints: 1500, slots: 8,  title: "Arcane" },
    { level: 7, minPoints: 2500, slots: 8,  title: "Mystic" },
    { level: 8, minPoints: 4000, slots: 10, title: "Legendary" },
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

export async function onRequestGet({ request, env }) {
    const userId = await getSessionUserId(env, request);
    if (!userId) return resp({ error: "Unauthorized" }, 401);

    const player = await getOrCreatePlayer(env, userId);
    const garden = JSON.parse(player.garden || '{}');
    const now = Math.floor(Date.now() / 1000);

    // Annotate garden with growth stages
    const gardenOut = {};
    for (const [slot, plant] of Object.entries(garden)) {
        if (!plant) continue;
        const herb = HERBS[plant.herb];
        if (!herb) continue;
        const elapsed = now - plant.planted_at;
        const growSecs = herb.hours * 3600;
        gardenOut[slot] = {
            ...plant,
            stage: elapsed >= growSecs ? 2 : elapsed >= growSecs * 0.5 ? 1 : 0,
            progress: Math.min(1, elapsed / growSecs),
        };
    }

    const levelData = getLevel(player.points);
    const nextLevel = LEVELS.find(l => l.minPoints > player.points);
    const dailyAvailable = (player.last_daily_at || 0) < now - 86400;

    return resp({
        points: player.points,
        level: levelData.level,
        levelTitle: levelData.title,
        slots: levelData.slots,
        streak: player.streak,
        dailyAvailable,
        garden: gardenOut,
        plot: JSON.parse(player.plot || '[]'),
        nextLevelPoints: nextLevel?.minPoints ?? null,
    });
}

function resp(data, status = 200) {
    return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}
