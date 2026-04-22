import { getSessionUserId } from "../../_utils/auth.js";

function resp(data, status = 200) {
    return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

export async function onRequestDelete({ params, request, env }) {
    const userId = await getSessionUserId(env, request);
    if (!userId) return resp({ error: "Unauthorized" }, 401);
    await env.DB.prepare("DELETE FROM journal_entries WHERE id = ? AND user_id = ?").bind(params.id, userId).run();
    return resp({ success: true });
}

// PATCH /api/journal/:id — toggle is_public
export async function onRequestPatch({ params, request, env }) {
    const userId = await getSessionUserId(env, request);
    if (!userId) return resp({ error: "Unauthorized" }, 401);

    const { is_public } = await request.json().catch(() => ({}));
    if (is_public === undefined) return resp({ error: "Missing is_public" }, 400);

    await env.DB.prepare(
        "UPDATE journal_entries SET is_public = ? WHERE id = ? AND user_id = ?"
    ).bind(is_public ? 1 : 0, params.id, userId).run();

    return resp({ success: true, is_public: is_public ? 1 : 0 });
}
