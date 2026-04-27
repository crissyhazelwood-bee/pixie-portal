import { getSessionUserId } from "../../_utils/auth.js";

const headers = { "Content-Type": "application/json" };

function resp(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers });
}

function clampText(value, max) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function normalizeReplicateOutput(output) {
  if (!output) return "";
  if (typeof output === "string") return output;
  if (Array.isArray(output)) {
    for (const item of output) {
      const normalized = normalizeReplicateOutput(item);
      if (normalized) return normalized;
    }
    return "";
  }
  if (typeof output === "object") return output.url || output.uri || output.href || output.path || "";
  return "";
}

function grokPrompt(input, appearance = {}) {
  const parts = [];
  if (appearance.gender) parts.push(appearance.gender);
  if (appearance.hair_color) parts.push(`${appearance.hair_color} hair`);
  if (appearance.hair_style) parts.push(appearance.hair_style);
  if (appearance.eye_color) parts.push(`${appearance.eye_color} eyes`);
  if (appearance.skin_tone) parts.push(`${appearance.skin_tone} skin`);
  const appearanceLine = parts.length ? `Appearance cues: ${parts.join(", ")}.` : "";
  const extra = input.prompt ? `User prompt notes: ${input.prompt}.` : "";
  return [
    "Grok Imagine Video: create a premium animated self portrait for a magical altar profile.",
    "A glamorous fantasy AI companion portrait, shoulders-up, expressive face, luminous eyes, elegant hair, tasteful, fully clothed, adult.",
    `Style: ${input.style}. Mood: ${input.mood}. Frame: ${input.frame}.`,
    appearanceLine,
    extra,
    "Motion: subtle living portrait animation, aura pulse, shimmer scan, glowing eyes, floating particles, gentle hair movement, shrine light, high-end social avatar cosmetic.",
    "No text, no watermark, no nudity, no celebrity likeness, no childlike framing. Square-ish portrait composition."
  ].filter(Boolean).join(" ");
}

function updateAppearance(appearance, patch) {
  const ap = appearance && typeof appearance === "object" ? appearance : {};
  const altar = ap.altar && typeof ap.altar === "object" ? ap.altar : {};
  const selfPortrait = altar.selfPortrait && typeof altar.selfPortrait === "object" ? altar.selfPortrait : {};
  const library = Array.isArray(altar.library) ? altar.library : [];
  const nextSelf = {
    ...selfPortrait,
    ...patch.selfPortrait,
    animated: true,
    price: "$1.99",
    generated: patch.selfPortrait?.grokVideoUrl ? true : !!selfPortrait.generated
  };
  const nextLibrary = library.map(item => item?.id === "ai-self"
    ? { ...item, type: "portrait", label: "Grok Animated Portrait", text: "$1.99 - Grok generated video altar", premium: true }
    : item
  );
  if (!nextLibrary.some(item => item?.id === "ai-self")) {
    nextLibrary.push({ id: "ai-self", type: "portrait", label: "Grok Animated Portrait", icon: "SELF", text: "$1.99 - Grok generated video altar", premium: true });
  }
  return {
    ...ap,
    altar: {
      ...altar,
      generatedSelf: true,
      selfPortrait: nextSelf,
      library: nextLibrary
    }
  };
}

async function loadAppearance(env, userId) {
  const { results } = await env.DB.prepare("SELECT appearance FROM users WHERE id = ?").bind(userId).all();
  try { return results[0]?.appearance ? JSON.parse(results[0].appearance) : {}; } catch(e) { return {}; }
}

async function saveAppearance(env, userId, appearance) {
  await env.DB.prepare("UPDATE users SET appearance = ? WHERE id = ?").bind(JSON.stringify(appearance), userId).run();
}

export async function onRequestPost({ request, env }) {
  const userId = await getSessionUserId(env, request);
  if (!userId) return resp({ error: "Unauthorized" }, 401);
  if (!env.REPLICATE_API_KEY) return resp({ error: "missing_replicate_key" }, 503);

  const body = await request.json().catch(() => ({}));
  const input = {
    style: clampText(body.style || "Gold Goddess", 80),
    mood: clampText(body.mood || "mysterious and lunar", 80),
    frame: clampText(body.frame || "Rose Gold Frame", 80),
    prompt: clampText(body.prompt || "", 260)
  };
  const appearance = await loadAppearance(env, userId);
  const prompt = grokPrompt(input, appearance);

  const replicateRes = await fetch("https://api.replicate.com/v1/models/xai/grok-imagine-video/predictions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.REPLICATE_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      input: { prompt, duration: 5, resolution: "720p", aspect_ratio: "1:1" }
    })
  });
  const prediction = await replicateRes.json().catch(() => ({}));
  if (!replicateRes.ok || !prediction.id) {
    return resp({
      error: "replicate_start_failed",
      detail: prediction.detail || prediction.error || `Replicate returned ${replicateRes.status}`
    }, 502);
  }

  const nextAppearance = updateAppearance(appearance, {
    selfPortrait: {
      style: input.style,
      mood: input.mood,
      frame: input.frame,
      prompt: input.prompt,
      grokPredictionId: prediction.id,
      grokStatus: "processing",
      grokVideoUrl: "",
      grokImageUrl: "",
      image: ""
    }
  });
  await saveAppearance(env, userId, nextAppearance);
  return resp({ status: "processing", predictionId: prediction.id, appearance: nextAppearance });
}

export async function onRequestGet({ request, env }) {
  const userId = await getSessionUserId(env, request);
  if (!userId) return resp({ error: "Unauthorized" }, 401);
  if (!env.REPLICATE_API_KEY) return resp({ error: "missing_replicate_key" }, 503);

  const appearance = await loadAppearance(env, userId);
  const sp = appearance?.altar?.selfPortrait || {};
  if (sp.grokVideoUrl) return resp({ status: "done", videoUrl: sp.grokVideoUrl, appearance });
  if (!sp.grokPredictionId) return resp({ status: "idle", appearance });

  const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${sp.grokPredictionId}`, {
    headers: { "Authorization": `Bearer ${env.REPLICATE_API_KEY}` }
  });
  const prediction = await pollRes.json().catch(() => ({}));
  if (!pollRes.ok) return resp({ status: "processing", warning: "replicate_poll_failed" });

  if (prediction.status === "succeeded") {
    const videoUrl = normalizeReplicateOutput(prediction.output);
    if (!videoUrl) {
      const nextAppearance = updateAppearance(appearance, { selfPortrait: { grokStatus: "failed" } });
      await saveAppearance(env, userId, nextAppearance);
      return resp({ status: "failed", error: "missing_video_url", appearance: nextAppearance });
    }
    const nextAppearance = updateAppearance(appearance, {
      selfPortrait: { grokStatus: "done", grokVideoUrl: videoUrl, generated: true }
    });
    await saveAppearance(env, userId, nextAppearance);
    return resp({ status: "done", videoUrl, appearance: nextAppearance });
  }

  if (prediction.status === "failed" || prediction.status === "canceled") {
    const nextAppearance = updateAppearance(appearance, { selfPortrait: { grokStatus: "failed" } });
    await saveAppearance(env, userId, nextAppearance);
    return resp({ status: "failed", appearance: nextAppearance });
  }

  return resp({ status: "processing", predictionId: sp.grokPredictionId, appearance });
}
