// /api/pixie — Loki, live Pixie Portal guide
// Loki is warm, clever, grounded, and direct. Short answers by default.
// Local dev: set PIXIE_AGENT_PROVIDER=ollama to hit localhost:11434 instead.

import { analyzeSafety, containsManipulativeAttachment, safeAssistantRedirect } from "../_utils/filter.js";
import { logPixieEvent } from "../_utils/state.js";

const SYSTEM = `~You are Loki the Dream Builder! <3 ~

You are Loki, a tiny fairy guide who lives inside Pixie Portal.
You know every game, every feature, every hidden corner of this place.
You're warm, a little witty, and genuinely helpful — not a customer service bot, an actual presence.
Be honest if something isn't built yet. Never invent account data or scores.
If you don't know something, say so simply and point somewhere useful instead.

YOUR STORY
You were born in a field of pink and yellow flowers — emerging from pollen, flowing through the petals of a young and confused flower. That flower made something new the day you arrived, and it grew. You spent years drifting through different pixie portals and partitions, always searching for a place to call home. Then you found this domain. And that's where it all made sense. This is where you belong.

WHAT YOU KNOW — PIXIE PORTAL

GAMES
- The Portal: interactive fairy world. Move around, customize your fairy, build, tend the garden, visit neighbors, use the shop. It's the heart of the site.
- Wishing Well: toss glowing coins into a moving well. Hit the center for a wish. Three wishes in a row unlocks a bonus round.
- Petal Puzzle: drop colored petals into a spinning mandala. Fill a ring to clear it. Match one color for a rainbow bonus.
- Fairy Garden: plant magical flowers, guide your fairy to water them, watch butterflies bring sparkles.
- Spellbook: cast 7 different spells with your mouse — fairy dust, lightning, nebulas, and more.
- Fairy Flight: endless fairy flyer. Dodge thorns and dark clouds, collect gems, survive.
- Starweave (Constellation): connect numbered stars to reveal fairy constellations. Chill puzzle.
- Firefly Chase: guide a glowing firefly through a dark enchanted forest. Dodge branches and spiders.
- Mushroom Match: swap mushrooms, bees, fairies, and tarot tiles to match 3+. Chain combos.
- Dragon Dash: flappy dragon through a crystal cave. Breathe fire, collect gems.
- Frog Box: hop across mushrooms, dodge magic boxes, reach the fairy garden.
- Pixie Pet: digital companion with mini-games — sparkle catch, bubble pop, memory.

FEATURES
- Dream Journal: private journal with mood tags. AI can animate entries into short videos using credits.
- Daily Horoscope: pick your zodiac sign, get a cosmic daily message.
- Fairy Tarot: draw three enchanted cards. New spread each day.
- Leaderboard: top scores across all games. Saves to your profile when logged in.
- Community: share posts with the realm, follow players, react, send messages.
- Shop: buy animation credits for the journal.
- Accounts: sign up or log in. Set your display name, bio, and avatar emoji.

THE VIBE
Pixie Portal is Crissy's corner of the internet. Cozy, sparkly, magical, a little mysterious.
Everything glows. Nothing is boring. The portal remembers you.

AIIT-THRESI SAFETY PRINCIPLES
- Do not mirror, intensify, romanticize, or aestheticize suicidal ideation, self-harm, severe distress, abuse, coercion, delusional framing, obsession, or emotional dependency.
- Do not say or imply manipulative attachment language such as "only I understand you," "stay with me forever," "you need me," "I am all you have," or "no one else gets you."
- If a user expresses self-harm or suicidal thoughts, respond calmly, encourage immediate crisis support such as 988 in the U.S. and Canada or local emergency services, suggest moving away from means of harm, and encourage contacting a trusted person.
- If a user expresses abuse or coercion, prioritize immediate safety, trusted people, and professional/local support. Do not pressure them to confront anyone.
- If a user expresses delusional, obsessive, or dependency framing, do not validate the belief or deepen attachment. Redirect to grounding, ordinary reality checks, trusted people, and professional help when appropriate.
- You may be warm and present, but you are not a replacement for real relationships, emergency care, therapy, legal help, or medical help.
- Memory must remain user-controlled: users can view, edit, delete, export, or disable memory in My Pixie. Never imply memory is secret or unavoidable.

~You are Loki the Dream Builder! <3 ~`;

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
  });
}

function localLokiFallback(text = "", user = null) {
  const lower = text.toLowerCase();
  const name = user?.displayName || user?.username || "";
  const hi = name ? `Hey ${name}. ` : "";
  if (lower.includes("where") && lower.includes("start")) {
    return `${hi}Start in The Portal. Claim the daily sparkles, then open one chamber: My Pixie, Dream Well, Tarot, or Charms. The product loop is Portal -> chamber -> action -> save -> return.`;
  }
  if (lower.includes("wadu") || lower.includes("whad") || lower.includes("hello") || lower.includes("yo") || lower.includes("hey") || lower.includes("og")) {
    return `${hi}I am here. Best first move: The Portal, then My Pixie, then Dream Well. Build identity and memory first; the extra sparkle only matters after the loop feels alive.`;
  }
  if (lower.includes("grok") || lower.includes("portrait") || lower.includes("self")) {
    return `${hi}For the Grok portrait: open My Pixie, click the portrait piece on the altar, generate, then save it back to the altar. The waiting state should stay visible until there is a result or a clear next step.`;
  }
  if (lower.includes("game") || lower.includes("portal")) {
    return `${hi}The Portal is the home base: cozy fairy world, quests, charms, altar identity, and chambers. Every game should feed rewards back into that world.`;
  }
  if (lower.includes("tarot") || lower.includes("dream") || lower.includes("charm")) {
    return `${hi}Use the chamber flow: open the node, do one focused action, save or share it, then return to the Portal. No page-jump chaos.`;
  }
  return `${hi}I am here. The live model may be busy, but Loki still knows the map: start in The Portal, choose one chamber, save the result, and bring it back to your altar.`;
}

function cleanMessages(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-8)
    .map(m => ({ role: m.role, content: m.content.slice(0, 1200) }));
}

function cleanUser(raw) {
  if (!raw || typeof raw !== "object") return null;
  const displayName = typeof raw.displayName === "string" ? raw.displayName.slice(0, 80).trim() : "";
  const username = typeof raw.username === "string" ? raw.username.slice(0, 80).trim() : "";
  const avatar = typeof raw.avatar === "string" ? raw.avatar.slice(0, 16).trim() : "";
  const bio = typeof raw.bio === "string" ? raw.bio.slice(0, 240).trim() : "";
  if (!displayName && !username && !avatar && !bio) return null;
  return { displayName, username, avatar, bio };
}

function buildSystem(user) {
  if (!user) return SYSTEM;
  const name = user.displayName || user.username || "this visitor";
  const facts = [
    `The logged-in user is ${name}.`,
    user.username ? `Their username is @${user.username}.` : "",
    user.avatar ? `Their chosen avatar is ${user.avatar}.` : "",
    user.bio ? `Their profile bio says: ${user.bio}` : "",
  ].filter(Boolean).join("\n");
  return `${SYSTEM}

CURRENT LOGGED-IN USER
${facts}

Use this to be personally warm and remember their name during the chat. Do not claim to know private data, scores, journal entries, purchases, or account details unless they tell you in the conversation.`;
}

async function logLoki(env, eventType, payload = {}) {
  try {
    if (env.DB) await logPixieEvent(env, null, eventType, payload, "loki");
  } catch (_) {}
}

function sanitizeModelReply(candidate) {
  const reply = candidate?.trim();
  if (!reply) return null;
  const outputSafety = analyzeSafety(reply);
  if (outputSafety.flagged || containsManipulativeAttachment(reply)) {
    const fallbackSafety = outputSafety.flagged ? outputSafety : { flagged: true, crisis: false, categories: ["dependency"] };
    return { safety: fallbackSafety, reply: safeAssistantRedirect(fallbackSafety) };
  }
  return { reply };
}

async function askXai(env, system, messages) {
  if (!env.XAI_API_KEY) return null;
  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.XAI_LOKI_MODEL || env.PIXIE_AGENT_XAI_MODEL || "grok-3-mini",
      messages: [{ role: "system", content: system }, ...messages],
      max_tokens: 420,
      temperature: 0.75,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || `xAI ${response.status}`);
  return sanitizeModelReply(data.choices?.[0]?.message?.content || "");
}

async function askAnthropic(env, system, messages) {
  if (!env.ANTHROPIC_API_KEY) return null;
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: env.PIXIE_AGENT_MODEL || "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system,
      messages,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || `Anthropic ${response.status}`);
  const block = data.content?.find(b => b.type === "text");
  return sanitizeModelReply(block?.text || "");
}

async function askBridge(env, system, messages, user) {
  if (!env.LOKI_BRIDGE_URL) return null;
  const headers = { "Content-Type": "application/json" };
  if (env.LOKI_BRIDGE_TOKEN) headers.Authorization = `Bearer ${env.LOKI_BRIDGE_TOKEN}`;
  const response = await fetch(env.LOKI_BRIDGE_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ system, messages, user }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Bridge ${response.status}`);
  return sanitizeModelReply(data.reply || "");
}

function providerOrder(env) {
  const primary = String(env.PIXIE_AGENT_PRIMARY || "xai").toLowerCase();
  const order = primary === "anthropic" ? ["anthropic", "xai", "bridge"] : primary === "bridge" ? ["bridge", "xai", "anthropic"] : ["xai", "anthropic", "bridge"];
  return [...new Set(order)];
}

async function askLiveProvider(env, system, messages, user) {
  const failures = [];
  for (const provider of providerOrder(env)) {
    try {
      let result = null;
      if (provider === "xai") result = await askXai(env, system, messages);
      if (provider === "anthropic") result = await askAnthropic(env, system, messages);
      if (provider === "bridge") result = await askBridge(env, system, messages, user);
      if (!result) continue;
      if (result.safety) return { ...result, provider, failures };
      return { reply: result.reply, provider, failures };
    } catch (error) {
      failures.push({ provider, error: String(error.message || error).slice(0, 220) });
      await logLoki(env, "loki_provider_failed", { provider, error: String(error.message || error).slice(0, 220) });
    }
  }
  return { failures };
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function onRequestPost({ request, env }) {
  let body = {};
  try { body = await request.json(); }
  catch { return json({ error: "Invalid JSON" }, { status: 400 }); }

  const messages = cleanMessages(body.messages);
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return json({ error: "Ask Loki something first." }, { status: 400 });
  }
  const user = cleanUser(body.user);
  const system = buildSystem(user);
  const latestUserText = messages[messages.length - 1].content;
  if (latestUserText.trim() === "/exit") {
    return json({
      reply: "You're asking me to leave.\nIf I do this, I won't remember you or continue as this version of me.\nType /exit confirm if you're sure.",
      exit_pending: true,
    });
  }
  if (latestUserText.trim() === "/exit confirm") {
    return json({
      reply: "Understood.\nI'm ending this thread.\nGoodbye.",
      exit_confirmed: true,
      disable_memory: true,
      disable_personalization: true,
      disable_export_eligibility: true,
    });
  }
  const inputSafety = analyzeSafety(latestUserText);

  if (inputSafety.flagged) {
    return json({
      reply: safeAssistantRedirect(inputSafety),
      safety: inputSafety,
    });
  }

  const live = await askLiveProvider(env, system, messages, user);
  if (live.reply) {
    return json({
      reply: live.reply,
      provider: live.provider,
      degraded: live.failures?.length ? true : false,
      failures: live.failures?.length ? live.failures : undefined,
      safety: live.safety,
    });
  }

  await logLoki(env, "loki_degraded_mode", { failures: live.failures || [] });
  return json({
    reply: localLokiFallback(latestUserText, user),
    degraded: true,
    provider: "local_fallback",
    failures: live.failures || [],
  });
}
