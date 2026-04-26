const STYLES = new Set(["skald", "prophecy", "soft", "battle"]);
const MOODS = new Set(["moonlit", "fierce", "tender", "strange"]);
const MODES = new Set(["free", "prophecy", "share"]);

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
  });
}

function cleanText(value, max) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function fallbackPoem(subject, style, mood) {
  const cleanSubject = subject || "the unnamed omen";
  return {
    title: "The Eye Turns",
    poem: [
      `The Eye found ${cleanSubject} under ${mood} light,`,
      "a small bright mark on the old road stone.",
      "No crown spoke louder than the listening dark,",
      "no raven returned with an empty bone.",
      "",
      "Walk once for courage, twice for flame,",
      "and leave one spark where silence came."
    ].join("\n"),
    omen: `A ${style} path opens when attention becomes action.`,
    shareLine: "Choose a path. Wake the rune."
  };
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

  const subject = cleanText(body.subject, 180);
  const inspiration = cleanText(body.inspiration, 300);
  const style = STYLES.has(body.style) ? body.style : "skald";
  const mood = MOODS.has(body.mood) ? body.mood : "moonlit";
  const mode = MODES.has(body.mode) ? body.mode : "free";
  if (!subject) return json({ error: "Subject required" }, { status: 400 });

  if (!env.ANTHROPIC_API_KEY) {
    return json(fallbackPoem(subject, style, mood));
  }

  const prompt = `You are the Poem Weaver inside Odin's Eye, a mystical mythology feature in Pixie Portal.
Write an original short poem.
Tone should be mythic, vivid, clean, and shareable.
Avoid copyrighted imitation.
Avoid religious claims of real divination.
Use the user's subject as inspiration.
Return JSON only:
{
  "title": "...",
  "poem": "...",
  "omen": "...",
  "shareLine": "..."
}

Subject: ${subject}
Style: ${style}
Mood: ${mood}
Mode: ${mode}
Inspiration: ${inspiration || "none"}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 18000);
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: env.ODIN_POEM_MODEL || "claude-haiku-4-5-20251001",
        max_tokens: 900,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`Anthropic ${response.status}`);
    const data = await response.json();
    const text = data.content?.find((b) => b.type === "text")?.text || "";
    const parsed = JSON.parse(text.replace(/^```json\s*|\s*```$/g, "").trim());
    return json({
      title: cleanText(parsed.title, 120) || "The Eye Turns",
      poem: cleanText(parsed.poem, 900),
      omen: cleanText(parsed.omen, 220),
      shareLine: cleanText(parsed.shareLine, 160),
    });
  } catch {
    return json({ error: "The ravens scattered. Try again." }, { status: 502 });
  }
}
