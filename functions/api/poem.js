// /api/poem — AI poem generator for Odin's Eye

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
    return json({ poem });
  } catch {
    return json({ error: "The poem got lost in the stars. Try again." }, { status: 502 });
  }
}
