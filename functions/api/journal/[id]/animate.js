import { getSessionUserId } from "../../../_utils/auth.js";

const STYLE_PREFIXES = {
    auto: "",
    anime: "Studio Ghibli anime style, hand-drawn, soft pastel colors, ",
    watercolor: "dreamy watercolor painting style, soft brushstrokes, delicate washes of color, ",
    cartoon: "vibrant cartoon animation style, bold outlines, bright colors, playful, ",
    surreal: "surreal dreamlike style, impossible landscapes, melting shapes, ethereal, ",
    fantasy: "magical fantasy illustration style, ethereal glowing light, enchanted atmosphere, ",
};

const EXEMPT_USER_IDS = [1, 8]; // Crissy (thatbee), Rhet (rhetfurreal) — unlimited

export function normalizeReplicateVideoUrl(output) {
    if (!output) return "";
    if (typeof output === "string") return output;
    if (Array.isArray(output)) {
        for (const item of output) {
            const normalized = normalizeReplicateVideoUrl(item);
            if (normalized) return normalized;
        }
        return "";
    }
    if (typeof output === "object") {
        return output.url || output.uri || output.href || output.path || "";
    }
    return "";
}

function refundCredits(env, userId, creditCost, creditPreDeducted) {
    if (!creditPreDeducted) return Promise.resolve();
    return env.DB.prepare(
        "UPDATE users SET animation_credits = animation_credits + ? WHERE id = ?"
    ).bind(creditCost, userId).run();
}

export async function onRequestPost({ params, request, env }) {
    const userId = await getSessionUserId(env, request);
    if (!userId) return resp({ error: "Unauthorized" }, 401);
    if (!env.REPLICATE_API_KEY) return resp({ error: "missing_replicate_key" }, 500);

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
        await refundCredits(env, userId, creditCost, creditPreDeducted);
        return resp({ error: "Not found" }, 404);
    }

    const entry = results[0];
    const prefix = STYLE_PREFIXES[style] || "";
    const text = prompt_override || [entry.title, entry.content].filter(Boolean).join(". ").slice(0, 350);

    // Build appearance description from saved user appearance
    const { results: userRows } = await env.DB.prepare(
        "SELECT appearance FROM users WHERE id = ?"
    ).bind(userId).all();
    let appearanceLine = "";
    try {
        const ap = userRows[0]?.appearance ? JSON.parse(userRows[0].appearance) : null;
        if (ap) {
            const parts = [];
            if (ap.hair_color) parts.push(`hair color: ${ap.hair_color}`);
            if (ap.hair_style) parts.push(`hairstyle: ${ap.hair_style}`);
            if (ap.eye_color) parts.push(`eye color: ${ap.eye_color}`);
            if (ap.skin_tone) parts.push(`skin: ${ap.skin_tone}`);
            if (ap.height) parts.push(`height: ${ap.height}`);
            if (ap.build) parts.push(`build: ${ap.build}`);
            const who = ap.gender ? `a ${ap.gender}` : "a person";
            if (parts.length > 0) appearanceLine = ` The main character is ${who} — ${parts.join(", ")}.`;
            else if (ap.gender) appearanceLine = ` The main character is a ${ap.gender}.`;
        }
    } catch(e) {}

    const prompt = `${prefix}Cinematic animated sequence: ${text}.${appearanceLine} Dreamy glowing atmosphere, ethereal magical visuals, smooth motion.`;

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

    const prediction = await replicateRes.json().catch(() => ({}));
    if (!replicateRes.ok) {
        await refundCredits(env, userId, creditCost, creditPreDeducted);
        return resp({
            error: "replicate_start_failed",
            detail: prediction.detail || prediction.error || `Replicate returned ${replicateRes.status}`,
        }, 502);
    }
    if (!prediction.id) {
        // Replicate failed — refund pre-deducted credits (not the daily slot)
        await refundCredits(env, userId, creditCost, creditPreDeducted);
        return resp({ error: "replicate_missing_prediction_id", detail: prediction.error || prediction.detail || "" }, 502);
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
    if (!env.REPLICATE_API_KEY) return resp({ error: "missing_replicate_key" }, 500);

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
    const prediction = await pollRes.json().catch(() => ({}));

    if (!pollRes.ok) {
        return resp({
            status: "processing",
            warning: "replicate_poll_failed",
            detail: prediction.detail || prediction.error || `Replicate returned ${pollRes.status}`,
        });
    }

    if (prediction.status === "succeeded") {
        const videoUrl = normalizeReplicateVideoUrl(prediction.output);
        if (!videoUrl) {
            await env.DB.prepare(
                "UPDATE journal_entries SET video_status = 'failed' WHERE id = ? AND user_id = ?"
            ).bind(params.id, userId).run();
            return resp({ status: "failed", error: "missing_video_url" });
        }
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
