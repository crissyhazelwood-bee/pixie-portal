import { getSessionUserId } from "../../_utils/auth.js";

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

    const player = await getOrCreatePlayer(env, userId);
    const now = Math.floor(Date.now() / 1000);
    const lastDaily = player.last_daily_at || 0;

    if (lastDaily >= now - 86400) {
        return resp({ error: "Already claimed today" }, 400);
    }

    // Streak: if last claim was within 48 hours, continue streak; else reset to 1
    const newStreak = lastDaily >= now - 172800 ? (player.streak || 0) + 1 : 1;

    let pointsEarned = 20;
    let bonus = 0;
    if (newStreak > 0 && newStreak % 7 === 0) { bonus = 50; pointsEarned += bonus; }

    await env.DB.prepare(
        "UPDATE portal_players SET points = points + ?, streak = ?, last_daily_at = ? WHERE user_id = ?"
    ).bind(pointsEarned, newStreak, now, userId).run();

    return resp({ success: true, pointsEarned, bonus, streak: newStreak, totalPoints: player.points + pointsEarned });
}

function resp(data, status = 200) {
    return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}
