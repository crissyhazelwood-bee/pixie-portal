import { getSessionUserId } from "../../_utils/auth.js";

// BUG-04 fix: validate game names against known games and enforce a score cap.
// Prevents fake game names and astronomically inflated scores on the leaderboard.
const VALID_GAMES = new Set([
    "fairy_flight",
    "Fairy Garden",
    "mushroom_match",
    "petal_puzzle",
    "wishing_well",
    "sparkle-catch",
    "bubble-pop",
    "spell-seq",
    "memory",
    "star-jump",
]);
const MAX_SCORE = 1_000_000;

function isValidGame(game) {
    if (typeof game !== "string") return false;
    if (VALID_GAMES.has(game)) return true;
    // Pixie Pet mini-games are submitted as "Pixie Pet: <name>"
    if (game.startsWith("Pixie Pet: ")) return true;
    return false;
}

export async function onRequestGet({ request, env }) {
    const userId = await getSessionUserId(env, request);
    if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
    const { results } = await env.DB.prepare("SELECT * FROM scores WHERE user_id = ? ORDER BY created_at DESC LIMIT 50").bind(userId).all();
    return new Response(JSON.stringify({ scores: results }), { headers: { "Content-Type": "application/json" } });
}

export async function onRequestPost({ request, env }) {
    const userId = await getSessionUserId(env, request);
    if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });

    const { game, score, details } = await request.json();

    // BUG-04: validate game name and score before inserting
    if (!isValidGame(game)) {
        return new Response(JSON.stringify({ error: "Invalid game" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    if (typeof score !== "number" || !Number.isFinite(score) || score < 0 || score > MAX_SCORE) {
        return new Response(JSON.stringify({ error: "Invalid score" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    await env.DB.prepare("INSERT INTO scores (user_id, game, score, details, created_at) VALUES (?, ?, ?, ?, ?)").bind(userId, game, score, JSON.stringify(details || {}), Date.now() / 1000).run();
    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
}
