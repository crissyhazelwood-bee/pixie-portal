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

    const { style = "auto", prompt_override = null } = await request.json().catch(() => ({}));

    const isGrok = style === "grok";
    const creditCost = isGrok ? 2 : 1;
    let creditPreDeducted = false;

    // BUG-05 fix: atomic enforcement — no more check-then-act races
    if (!EXEMPT_USER_IDS.includes(userId)) {
        const now = Date.now() / 1000;
        const since = now - 86400;

        if (isGrok) {
            // Grok always costs 2 credits: atomically deduct upfront
            const { meta } = await env.DB.prepare(
                "UPDATE users SET animation_credits = animation_credits - ? WHERE id = ? AND animation_credits >= ?"
            ).bind(creditCost, userId, creditCost).run();
            if (meta.rows_written === 0) {
                const { results: userRes } = await env.DB.prepare(
                    "SELECT animation_credits FROM users WHERE id = ?"
                ).bind(userId).all();
                return resp({ error: "limit_reached", need: 2, have: userRes[0]?.animation_credits ?? 0 }, 429);
            }
            creditPreDeducted = true;
        } else {
            // Try to atomically claim the daily free slot
            const { meta: freeMeta } = await env.DB.prepare(
                "UPDATE users SET last_free_animation_at = ? WHERE id = ? AND (last_free_animation_at IS NULL OR last_free_animation_at <= ?)"
            ).bind(now, userId, since).run();

            if (freeMeta.rows_written === 0) {
                // Daily free already used — atomically deduct 1 credit
                const { meta: creditMeta } = await env.DB.prepare(
                    "UPDATE users SET animation_credits = animation_credits - ? WHERE id = ? AND animation_credits >= ?"
                ).bind(creditCost, userId, creditCost).run();
                if (creditMeta.rows_written === 0) {
                    return resp({ error: "limit_reached" }, 429);
                }
                creditPreDeducted = true;
            }
        }
    }

    const { results } = await env.DB.prepare(
        "SELECT id, title, content FROM journal_entries WHERE id = ? AND user_id = ?"
    ).bind(params.id, userId).all();

    if (!results[0]) {
        // Refund pre-deducted credits on not-found
        if (creditPreDeducted) {
            await env.DB.prepare(
                "UPDATE users SET animation_credits = animation_credits + ? WHERE id = ?"
            ).bind(creditCost, userId).run();
        }
        return resp({ error: "Not found" }, 404);
    }

    const entry = results[0];
    const prefix = STYLE_PREFIXES[style] || "";
    const text = prompt_override || [entry.title, entry.content].filter(Boolean).join(". ").slice(0, 350);
    const prompt = `${prefix}Cinematic animated sequence: ${text}. Dreamy glowing atmosphere, ethereal magical visuals, smooth motion.`;

    let replicateRes;

    if (isGrok) {
        replicateRes = await fetch(
            "https://api.replicate.com/v1/models/xai/grok-imagine-video/predictions",
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${env.REPLICATE_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    input: { prompt, duration: 5, resolution: "720p", aspect_ratio: "16:9" }
                })
            }
        );
    } else {
        replicateRes = await fetch(
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
    }

    const prediction = await replicateRes.json();
    if (!prediction.id) {
        // Replicate failed — refund pre-deducted credits (not the daily slot)
        if (creditPreDeducted) {
            await env.DB.prepare(
                "UPDATE users SET animation_credits = animation_credits + ? WHERE id = ?"
            ).bind(creditCost, userId).run();
        }
        return resp({ error: "Failed to start generation" }, 500);
    }

    const now = Date.now() / 1000;
    await env.DB.prepare(
        "UPDATE journal_entries SET video_prediction_id = ?, video_status = 'processing', video_started_at = ? WHERE id = ? AND user_id = ?"
    ).bind(prediction.id, now, params.id, userId).run();

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
        const videoUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
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
