import { getSessionUserId } from "../../_utils/auth.js";

function resp(data, status = 200) {
    return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

const VALID_TYPES = ["community_post", "comment", "journal"];
const VALID_REASONS = ["Spam", "Harassment", "Inappropriate content", "Hate speech", "Other"];

// POST /api/social/report — submit a report { target_type, target_id, reason }
export async function onRequestPost({ request, env }) {
    const userId = await getSessionUserId(env, request);
    if (!userId) return resp({ error: "Unauthorized" }, 401);

    const { target_type, target_id, reason } = await request.json().catch(() => ({}));
    if (!target_type || !target_id || !reason) return resp({ error: "Missing params" }, 400);
    if (!VALID_TYPES.includes(target_type)) return resp({ error: "Invalid target_type" }, 400);
    if (!VALID_REASONS.includes(reason)) return resp({ error: "Invalid reason" }, 400);

    // Prevent duplicate reports from the same user on the same item
    const { results: existing } = await env.DB.prepare(
        "SELECT 1 FROM reports WHERE reporter_id = ? AND target_type = ? AND target_id = ?"
    ).bind(userId, target_type, parseInt(target_id)).all();
    if (existing.length > 0) return resp({ error: "Already reported" }, 409);

    await env.DB.prepare(
        "INSERT INTO reports (reporter_id, target_type, target_id, reason, created_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(userId, target_type, parseInt(target_id), reason, Math.floor(Date.now() / 1000)).run();

    return resp({ success: true });
}
