// /api/pixie — Loki, live Pixie Portal guide
// Loki is warm, clever, grounded, and direct. Short answers by default.
// Local dev: set PIXIE_AGENT_PROVIDER=ollama to hit localhost:11434 instead.

import { analyzeSafety, containsManipulativeAttachment, safeAssistantRedirect } from "../_utils/filter.js";

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

const FALLBACK_LOKI_BRIDGE_URL = "https://consolidation-lucas-twins-telephony.trycloudflare.com/api/pixie";

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
  });
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

  const bridgeUrl = env.LOKI_BRIDGE_URL || FALLBACK_LOKI_BRIDGE_URL;

  if (bridgeUrl) {
    try {
      const headers = { "Content-Type": "application/json" };
      if (env.LOKI_BRIDGE_TOKEN) headers.Authorization = `Bearer ${env.LOKI_BRIDGE_TOKEN}`;
      const response = await fetch(bridgeUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({ system, messages, user }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Bridge ${response.status}`);
      const candidate = data.reply?.trim() || "The bridge shimmered, but I lost the words. Ask me again?";
      const outputSafety = analyzeSafety(candidate);
      if (outputSafety.flagged || containsManipulativeAttachment(candidate)) {
        const fallbackSafety = outputSafety.flagged ? outputSafety : { flagged: true, crisis: false, categories: ["dependency"] };
        return json({
          reply: safeAssistantRedirect(fallbackSafety),
          safety: fallbackSafety,
        });
      }
      return json({
        reply: candidate,
      });
    } catch (error) {
      return json({
        reply: "My local Loki bridge is not answering right now. Start the Loki Bridge and make sure the tunnel URL is fresh.",
        error: error.message,
      }, { status: 502 });
    }
  }

  // No API key — give a useful fallback instead of breaking
  if (!env.ANTHROPIC_API_KEY) {
    return json({
      reply: "My sparkle brain isn't wired up yet — but try The Portal, a game, the Spellbook, or the Journal. That's where the good stuff lives.",
    });
  }

  try {
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

    if (!response.ok) throw new Error(`Anthropic ${response.status}`);

    const data = await response.json();
    const block = data.content?.find(b => b.type === "text");
    const candidate = block?.text?.trim() || "The portal shimmered and I lost the thread. Ask me again?";
    const outputSafety = analyzeSafety(candidate);
    if (outputSafety.flagged || containsManipulativeAttachment(candidate)) {
      const fallbackSafety = outputSafety.flagged ? outputSafety : { flagged: true, crisis: false, categories: ["dependency"] };
      return json({
        reply: safeAssistantRedirect(fallbackSafety),
        safety: fallbackSafety,
      });
    }
    return json({
      reply: candidate,
    });
  } catch {
    return json({
      reply: "My wings hit a cloud. Give it a second and try again — I'm not going anywhere.",
    });
  }
}
