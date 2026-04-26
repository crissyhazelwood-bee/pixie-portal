// /api/poem — AI poem generator for Odin's Eye (1 per user per day)

import { getSessionUserId } from "../_utils/auth.js";

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
  });
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
  // Require login
  const userId = await getSessionUserId(env, request);
  if (!userId) {
    return json({ error: "You need to be logged in to weave a poem." }, { status: 401 });
  }

  // Check one-per-day limit (UTC date)
  const today = new Date().toISOString().slice(0, 10);
  const { results } = await env.DB.prepare(
    "SELECT poem_date FROM users WHERE id = ?"
  ).bind(userId).all();
  const user = results[0];
  if (user && user.poem_date === today) {
    return json({ error: "You've already woven your poem for today. Come back tomorrow." }, { status: 429 });
  }

  let body = {};
  try { body = await request.json(); }
  catch { return json({ error: "Invalid JSON" }, { status: 400 }); }

  const subject = typeof body.subject === "string" ? body.subject.slice(0, 200).trim() : "";
  const style   = typeof body.style   === "string" ? body.style.slice(0, 50).trim()   : "Free Verse";
  const mood    = typeof body.mood    === "string" ? body.mood.slice(0, 50).trim()    : "Lyrical";
  const theme   = typeof body.theme   === "string" ? body.theme.slice(0, 200).trim()  : "";

  if (!subject) {
    return json({ error: "A subject is required." }, { status: 400 });
  }

  if (!env.ANTHROPIC_API_KEY) {
    return json({ error: "Poem magic isn't wired up yet." }, { status: 503 });
  }

  const prompt = [
    `Write a ${style} poem with a ${mood} mood about: ${subject}`,
    theme ? `Additional inspiration: ${theme}` : "",
    "The poem should feel magical, evocative, and inspired by mythology and nature.",
    "Return only the poem itself — no title, no explanation, no extra text.",
  ].filter(Boolean).join("\n");

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
        max_tokens: 500,
        system: "You are a master poet who weaves mythology, nature, and magic into verse. Write beautiful, original poems. Return only the poem — no titles, no explanations, just the poem itself.",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) throw new Error(`Anthropic ${response.status}`);

    const data = await response.json();
    const block = data.content?.find(b => b.type === "text");
    const poem = block?.text?.trim() || "The muse went quiet. Try again.";

    // Record today's date so user can't generate again until tomorrow
    await env.DB.prepare(
      "UPDATE users SET poem_date = ? WHERE id = ?"
    ).bind(today, userId).run();

    return json({ poem });
  } catch {
    return json({ error: "The poem got lost in the stars. Try again." }, { status: 502 });
  }
}
