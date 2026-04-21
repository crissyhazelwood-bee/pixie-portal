import { getSessionUserId } from "../../../_utils/auth.js";

const STYLE_PREFIXES = {
    auto: "",
    anime: "Studio Ghibli anime style, hand-drawn, soft pastel colors, ",
    watercolor: "dreamy watercolor painting style, soft brushstrokes, delicate washes of color, ",
    cartoon: "vibrant cartoon animation style, bold outlines, bright colors, playful, ",
    surreal: "surreal dreamlike style, impossible landscapes, melting shapes, ethereal, ",
    fantasy: "magical fantasy illustration style, ethereal glowing light, enchanted atmosphere, ",
};

const EXEMPT_USER_IDS = [1]; // Crissy (thatbee) — unlimited

export async function onRequestPost({ params, request, env }) {
    const userId = await getSessionUserId(env, request);
    if (!userId) return resp({ error: "Unauthorized" }, 401);

    const { style = "auto" } = await request.json().catch(() => ({}));

    let useCredit = false;

    if (!EXEMPT_USER_IDS.includes(userId)) {
        const since = Date.now() / 1000 - 86400;
        const { results: dailyCheck } = await env.DB.prepare(
            "SELECT 1 FROM journal_entries WHERE user_id = ? AND video_started_at > ? LIMIT 1"
        ).bind(userId, since).all();

        if (dailyCheck.length > 0) {
            // Daily free already used — check purchased credits
            const { results: userRes } = await env.DB.prepare(
                "SELECT animation_credits FROM users WHERE id = ?"
            ).bind(userId).all();
            const credits = userRes[0]?.animation_credits ?? 0;
            if (credits <= 0) return resp({ error: "limit_reached" }, 429);
            useCredit = true;
        }
    }

    const { results } = await env.DB.prepare(
        "SELECT id, title, content FROM journal_entries WHERE id = ? AND user_id = ?"
    ).bind(params.id, userId).all();
    if (!results[0]) return resp({ error: "Not found" }, 404);

    const entry = results[0];
    const prefix = STYLE_PREFIXES[style] || "";
    const text = [entry.title, entry.content].filter(Boolean).join(". ").slice(0, 350);
    const prompt = `${prefix}Cinematic animated sequence: ${text}. Dreamy glowing atmosphere, ethereal magical visuals, smooth motion.`;

    const replicateRes = await fetch(
        "https://api.replicate.com/v1/models/wan-video/wan-2.2-t2v-fast/predictions",
        {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${env.REPLICATE_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                input: { prompt, num_frames: 81, resolution: "480p", aspect_ratio: "16:9", go_fast: true }
            })
        }
    );

    const prediction = await replicateRes.json();
    if (!prediction.id) return resp({ error: "Failed to start generation" }, 500);

    const now = Date.now() / 1000;
    await env.DB.prepare(
        "UPDATE journal_entries SET video_prediction_id = ?, video_status = 'processing', video_started_at = ? WHERE id = ? AND user_id = ?"
    ).bind(prediction.id, now, params.id, userId).run();

    if (useCredit) {
        await env.DB.prepare(
            "UPDATE users SET animation_credits = animation_credits - 1 WHERE id = ?"
        ).bind(userId).run();
    }

    return resp({ status: "processing", prediction_id: prediction.id });
}

export async function onRequestGet({ params, request, env }) {
    const userId = await getSessionUserId(env, request);
    if (!userId) return resp({ error: "Unauthorized" }, 401);

    const { results } = await env.DB.prepare(
        "SELECT id, video_url, video_prediction_id, video_status FROM journal_entries WHERE id = ? AND user_id = ?"
    ).bind(params.id, userId).all();
    if (!results[0]) return resp({ error: "Not found" }, 404);

    const entry = results[0];

    if (!entry.video_prediction_id || entry.video_status === "idle") return resp({ status: "idle" });
    if (entry.video_status === "done") return resp({ status: "done", video_url: entry.video_url });
    if (entry.video_status === "failed") return resp({ status: "failed" });

    // Poll Replicate for current status
    const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${entry.video_prediction_id}`, {
        headers: { "Authorization": `Bearer ${env.REPLICATE_API_KEY}` }
    });
    const prediction = await pollRes.json();

    if (prediction.status === "succeeded") {
        const videoUrl = prediction.output;
        await env.DB.prepare(
            "UPDATE journal_entries SET video_url = ?, video_status = 'done' WHERE id = ? AND user_id = ?"
        ).bind(videoUrl, params.id, userId).run();
        return resp({ status: "done", video_url: videoUrl });
    }

    if (prediction.status === "failed" || prediction.status === "canceled") {
        await env.DB.prepare(
            "UPDATE journal_entries SET video_status = 'failed' WHERE id = ? AND user_id = ?"
        ).bind(params.id, userId).run();
        return resp({ status: "failed" });
    }

    return resp({ status: "processing" });
}

function resp(data, status = 200) {
    return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}
