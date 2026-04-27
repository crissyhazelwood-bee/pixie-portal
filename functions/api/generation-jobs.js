import { getSessionUserId } from "../_utils/auth.js";
import { clampText, ensureStateTables, logPixieEvent, nowSeconds, resp, safeJsonParse } from "../_utils/state.js";

const JOB_COSTS = {
  sticker: 1,
  poem: 1,
  goal_card: 1,
  self_portrait: 2,
  animated_portrait: 3,
  dream_video: 3,
  realm_background: 3
};

export async function onRequestGet({ request, env }) {
  const userId = await getSessionUserId(env, request);
  if (!userId) return resp({ error: "Unauthorized" }, 401);
  await ensureStateTables(env);
  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id") || 0);
  const query = id
    ? env.DB.prepare("SELECT * FROM generation_jobs WHERE user_id = ? AND id = ?").bind(userId, id)
    : env.DB.prepare("SELECT * FROM generation_jobs WHERE user_id = ? ORDER BY created_at DESC LIMIT 50").bind(userId);
  const { results } = await query.all();
  return resp({ jobs: results.map(row => ({ ...row, metadata: safeJsonParse(row.metadata, {}) })) });
}

export async function onRequestPost({ request, env }) {
  const userId = await getSessionUserId(env, request);
  if (!userId) return resp({ error: "Unauthorized" }, 401);
  await ensureStateTables(env);

  const body = await request.json().catch(() => ({}));
  const jobType = clampText(body.job_type || body.type, 40);
  if (!JOB_COSTS[jobType]) return resp({ error: "invalid_job_type" }, 400);
  const cost = Number(body.cost ?? JOB_COSTS[jobType]) || JOB_COSTS[jobType];

  const { meta } = await env.DB.prepare(
    "UPDATE users SET animation_credits = COALESCE(animation_credits, 0) - ? WHERE id = ? AND COALESCE(animation_credits, 0) >= ?"
  ).bind(cost, userId, cost).run();
  if (!meta || meta.changes < 1) {
    const { results } = await env.DB.prepare("SELECT animation_credits FROM users WHERE id = ?").bind(userId).all();
    return resp({ error: "insufficient_credits", need: cost, have: results[0]?.animation_credits ?? 0 }, 402);
  }

  const now = nowSeconds();
  const prompt = clampText(body.prompt, 1000);
  const provider = clampText(body.provider || "placeholder", 40);
  const metadata = JSON.stringify(body.metadata && typeof body.metadata === "object" ? body.metadata : {}).slice(0, 3000);
  const result = await env.DB.prepare(
    "INSERT INTO generation_jobs (user_id, job_type, provider, status, cost, prompt, metadata, created_at, updated_at) VALUES (?, ?, ?, 'queued', ?, ?, ?, ?, ?)"
  ).bind(userId, jobType, provider, cost, prompt, metadata, now, now).run();
  const jobId = result.meta.last_row_id;
  await logPixieEvent(env, userId, "generation_started", { job_id: jobId, job_type: jobType, cost }, "generation");

  return resp({
    success: true,
    job: {
      id: jobId,
      job_type: jobType,
      provider,
      status: "queued",
      cost,
      prompt,
      metadata: safeJsonParse(metadata, {}),
      created_at: now,
      updated_at: now
    }
  });
}

export async function onRequestPatch({ request, env }) {
  const userId = await getSessionUserId(env, request);
  if (!userId) return resp({ error: "Unauthorized" }, 401);
  await ensureStateTables(env);
  const body = await request.json().catch(() => ({}));
  const id = Number(body.id || 0);
  const status = clampText(body.status || "", 30);
  if (!id || !["queued", "processing", "done", "failed"].includes(status)) return resp({ error: "invalid_job_update" }, 400);
  const resultUrl = clampText(body.result_url, 1000);
  const externalId = clampText(body.external_id, 160);
  await env.DB.prepare(
    "UPDATE generation_jobs SET status = ?, result_url = COALESCE(?, result_url), external_id = COALESCE(?, external_id), updated_at = ? WHERE id = ? AND user_id = ?"
  ).bind(status, resultUrl || null, externalId || null, nowSeconds(), id, userId).run();
  if (status === "done") await logPixieEvent(env, userId, "generation_completed", { job_id: id, result_url: resultUrl }, "generation");
  return resp({ success: true, id, status });
}
