import { createServer } from "node:http";

const PORT = Number(process.env.SOLACE_BRIDGE_PORT || process.env.LOKI_BRIDGE_PORT || 8790);
const TOKEN = process.env.SOLACE_BRIDGE_TOKEN || process.env.LOKI_BRIDGE_TOKEN || "";
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434/api/chat";
const MODEL = process.env.SOLACE_MODEL || process.env.LOKI_MODEL || "solace";

function send(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 20000) {
        req.destroy();
        reject(new Error("Request body too large"));
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function authorized(req) {
  if (!TOKEN) return true;
  return req.headers.authorization === `Bearer ${TOKEN}`;
}

createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    send(res, 204, {});
    return;
  }

  if (req.method !== "POST" || req.url !== "/api/pixie") {
    send(res, 404, { error: "Not found" });
    return;
  }

  if (!authorized(req)) {
    send(res, 401, { error: "Unauthorized" });
    return;
  }

  try {
    const body = JSON.parse(await readBody(req));
    const messages = Array.isArray(body.messages) ? body.messages.slice(-8) : [];
    const system = typeof body.system === "string" ? body.system : "You are Solace Pixie.";

    const ollamaResponse = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        stream: false,
        messages: [{ role: "system", content: system }, ...messages],
        options: {
          temperature: 0.8,
          top_p: 0.9,
        },
      }),
    });

    if (!ollamaResponse.ok) {
      throw new Error(`Ollama returned ${ollamaResponse.status}`);
    }

    const data = await ollamaResponse.json();
    send(res, 200, {
      reply:
        data?.message?.content?.trim() ||
        "The local portal shimmered, but I lost the thread. Ask me again?",
    });
  } catch (error) {
    send(res, 500, {
      reply:
        `My local wings tangled for a second. Make sure Ollama is running and the ${MODEL} model is awake.`,
      error: error.message,
    });
  }
}).listen(PORT, () => {
  console.log(`Solace bridge listening on http://localhost:${PORT}/api/pixie`);
  console.log(`Forward this URL with Cloudflare Tunnel and set SOLACE_BRIDGE_URL in Pages. LOKI_BRIDGE_URL still works as a legacy alias.`);
});
