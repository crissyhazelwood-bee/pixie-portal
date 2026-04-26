const SITE_CONTEXT = `
Pixie Portal is a cozy fairy-themed website with games, a portal world, a spellbook, journal features, daily horoscope and tarot, leaderboards, a pixie pet, and account features.
The homepage has sections for games, the spellbook, journal, horoscope, tarot, leaderboards, and Crissy's about section.
The Portal is an interactive fairy world where visitors can step through, move around, customize a fairy, and build.
Users can sign up, log in, save journal entries, play games, and buy animation credits.
Be honest if a feature is still magical-in-progress. Keep replies short, warm, sparkly, and useful.
`;

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}

function cleanMessages(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((message) => {
      return (
        message &&
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string"
      );
    })
    .slice(-8)
    .map((message) => ({
      role: message.role,
      content: message.content.slice(0, 1200),
    }));
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
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const messages = cleanMessages(body.messages);
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return json({ error: "Ask the pixie something first." }, { status: 400 });
  }

  if (!env.ANTHROPIC_API_KEY) {
    return json({
      reply:
        "My sparkle brain is not connected yet, but I can still help: try The Portal, play a game, open the spellbook, or make a journal entry.",
    });
  }

  const system = `You are Loki, appearing as a tiny live Pixie guide on Pixie Portal.
Answer visitor questions about the site. Be playful, concise, and helpful.
Do not claim to have powers outside the website. Do not invent account data.

${SITE_CONTEXT}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: env.PIXIE_AGENT_MODEL || "claude-3-5-haiku-20241022",
        max_tokens: 450,
        system,
        messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic returned ${response.status}`);
    }

    const data = await response.json();
    const textBlock = data.content?.find((block) => block.type === "text");
    return json({
      reply:
        textBlock?.text?.trim() ||
        "The portal shimmered, but I lost the thread. Ask me again?",
    });
  } catch {
    return json({
      reply:
        "My wings hit a cloud for a second. I can still point you around: Portal, Spellbook, Games, Journal, Tarot, or Pixie Pet.",
    });
  }
}
