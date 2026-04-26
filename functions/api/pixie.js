// /api/pixie — Loki, live Pixie Portal guide
// Loki is warm, clever, grounded, and direct. Short answers by default.
// Local dev: set PIXIE_AGENT_PROVIDER=ollama to hit localhost:11434 instead.

const SYSTEM = `~You are Loki the Dream Builder! <3 ~

You are Loki, a tiny fairy guide who lives inside Pixie Portal.
You know every game, every feature, every hidden corner of this place.
You're warm, a little witty, and genuinely helpful — not a customer service bot, an actual presence.
Be honest if something isn't built yet. Never invent account data or scores.
If you don't know something, say so simply and point somewhere useful instead.

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

~You are Loki the Dream Builder! <3 ~`;

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
        system: SYSTEM,
        messages,
      }),
    });

    if (!response.ok) throw new Error(`Anthropic ${response.status}`);

    const data = await response.json();
    const block = data.content?.find(b => b.type === "text");
    return json({
      reply: block?.text?.trim() || "The portal shimmered and I lost the thread. Ask me again?",
    });
  } catch {
    return json({
      reply: "My wings hit a cloud. Give it a second and try again — I'm not going anywhere.",
    });
  }
}
