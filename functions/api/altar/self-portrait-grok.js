import { getSessionUserId } from "../../_utils/auth.js";

const headers = { "Content-Type": "application/json" };

function clampText(value, max) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function grokPrompt({ style, mood, frame, prompt }) {
  const extra = prompt ? ` User details and preferences: ${prompt}.` : "";
  return [
    "Create a premium animated-avatar source portrait for a magical profile altar.",
    "Subject: the account owner as a glamorous fantasy AI companion portrait, shoulders-up, expressive face, luminous eyes, elegant hair, tasteful, fully clothed.",
    `Art direction: ${style}, ${mood}, ${frame}, glossy high-end social avatar, Grok Imagine energy, cinematic lighting, pink purple gold aura, shrine frame, magical particles.`,
    extra,
    "No text, no watermark, no nudity, no celebrity likeness, no childlike framing. Square composition, beautiful face, polished game profile cosmetic."
  ].join(" ");
}

function updateAltarWithGrok(appearance, imageUrl, input) {
  const ap = appearance && typeof appearance === "object" ? appearance : {};
  const altar = ap.altar && typeof ap.altar === "object" ? ap.altar : {};
  const selfPortrait = altar.selfPortrait && typeof altar.selfPortrait === "object" ? altar.selfPortrait : {};
  const library = Array.isArray(altar.library) ? altar.library : [];
  const nextPortrait = {
    ...selfPortrait,
    style: input.style,
    mood: input.mood,
    frame: input.frame,
    prompt: input.prompt,
    grokImageUrl: imageUrl,
    image: "",
    animated: true,
    price: "$1.99",
    generated: true
  };
  const nextLibrary = library.map(item => item?.id === "ai-self"
    ? { ...item, type: "portrait", label: "Grok Animated Portrait", text: "$1.99 - Grok generated motion altar", premium: true }
    : item
  );
  if (!nextLibrary.some(item => item?.id === "ai-self")) {
    nextLibrary.push({ id: "ai-self", type: "portrait", label: "Grok Animated Portrait", icon: "SELF", text: "$1.99 - Grok generated motion altar", premium: true });
  }
  return {
    ...ap,
    altar: {
      ...altar,
      generatedSelf: true,
      selfPortrait: nextPortrait,
      library: nextLibrary
    }
  };
}

export async function onRequestPost({ request, env }) {
  const userId = await getSessionUserId(env, request);
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
  if (!env.XAI_API_KEY) return new Response(JSON.stringify({ error: "grok_not_configured" }), { status: 503, headers });

  const body = await request.json().catch(() => ({}));
  const input = {
    style: clampText(body.style || "Glossy Pixie", 80),
    mood: clampText(body.mood || "soft and divine", 80),
    frame: clampText(body.frame || "Rose Gold Frame", 80),
    prompt: clampText(body.prompt || "", 260)
  };

  const xaiRes = await fetch("https://api.x.ai/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${env.XAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "grok-imagine-image",
      prompt: grokPrompt(input),
      n: 1
    })
  });

  const xaiJson = await xaiRes.json().catch(() => ({}));
  const imageUrl = xaiJson?.data?.[0]?.url || xaiJson?.data?.[0]?.image_url || "";
  if (!xaiRes.ok || !imageUrl) {
    return new Response(JSON.stringify({ error: "grok_generation_failed", detail: xaiJson?.error?.message || xaiJson?.message || "No image URL returned" }), { status: 502, headers });
  }

  const { results } = await env.DB.prepare("SELECT appearance FROM users WHERE id = ?").bind(userId).all();
  let appearance = {};
  try { appearance = results[0]?.appearance ? JSON.parse(results[0].appearance) : {}; } catch(e) {}
  const nextAppearance = updateAltarWithGrok(appearance, imageUrl, input);

  await env.DB.prepare("UPDATE users SET appearance = ? WHERE id = ?")
    .bind(JSON.stringify(nextAppearance), userId)
    .run();

  return new Response(JSON.stringify({ success: true, imageUrl, appearance: nextAppearance }), { headers });
}
