import { ensureStateTables, resp } from "../_utils/state.js";

async function bridgeCheck(env) {
  if (!env.LOKI_BRIDGE_URL) return { configured: false, ok: false };
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const response = await fetch(env.LOKI_BRIDGE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system: "Health check. Return a tiny JSON-safe reply.",
        messages: [{ role: "user", content: "health" }],
        health: true
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);
    return { configured: true, ok: response.ok, status: response.status };
  } catch (error) {
    return { configured: true, ok: false, error: String(error.message || error).slice(0, 160) };
  }
}

export async function onRequestGet({ env }) {
  let d1 = { configured: !!env.DB, ok: false };
  if (env.DB) {
    try {
      await ensureStateTables(env);
      await env.DB.prepare("SELECT 1 AS ok").first();
      d1 = { configured: true, ok: true };
    } catch (error) {
      d1 = { configured: true, ok: false, error: String(error.message || error).slice(0, 160) };
    }
  }

  const providers = {
    xai: {
      configured: !!env.XAI_API_KEY,
      model: env.XAI_LOKI_MODEL || env.PIXIE_AGENT_XAI_MODEL || "grok-3-mini"
    },
    anthropic: {
      configured: !!env.ANTHROPIC_API_KEY,
      model: env.PIXIE_AGENT_MODEL || "claude-haiku-4-5-20251001"
    },
    bridge: await bridgeCheck(env),
    fallback: { configured: true, ok: true }
  };

  const liveProviderReady = providers.xai.configured || providers.anthropic.configured || providers.bridge.ok;
  return resp({
    ok: d1.ok && (liveProviderReady || providers.fallback.ok),
    mode: liveProviderReady ? "live" : "quiet",
    primary: env.PIXIE_AGENT_PRIMARY || "xai",
    providers,
    memory: d1,
    fallback_ready: true
  });
}
