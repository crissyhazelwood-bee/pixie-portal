import { getSessionUserId } from "../../_utils/auth.js";

export async function onRequestPost({ request, env }) {
    const userId = await getSessionUserId(env, request);
    if (!userId) return resp({ error: "Unauthorized" }, 401);

    let body;
    try { body = await request.json(); } catch(e) { return resp({ error: "Invalid JSON" }, 400); }

    const raw = JSON.stringify(body.placed || {});
    if (raw.length > 50000) return resp({ error: "Too large" }, 400);

    await env.DB.prepare("UPDATE portal_players SET placed_json = ? WHERE user_id = ?")
        .bind(raw, userId).run();

    return resp({ success: true });
}

function resp(data, status = 200) {
    return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}
