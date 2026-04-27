import { getSessionUserId } from "../_utils/auth.js";
export async function onRequestPut({ request, env }) {
  const userId = await getSessionUserId(env, request);
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  const { display_name, bio, avatar_emoji, appearance } = await request.json();
  // BUG-14 fix: default missing fields to empty string so we never store NULL
  // BUG-18 fix: enforce field length limits
  const safeName = (display_name || "").slice(0, 40);
  const safeBio = (bio || "").slice(0, 500);
  const safeEmoji = (avatar_emoji || "✦").slice(0, 10);
  let safeAppearance = null;
  if (appearance && typeof appearance === 'object') {
    const altar = appearance.altar && typeof appearance.altar === 'object' ? appearance.altar : null;
    safeAppearance = JSON.stringify({
      gender: (appearance.gender || "").slice(0, 40),
      hair_color: (appearance.hair_color || "").slice(0, 80),
      hair_style: (appearance.hair_style || "").slice(0, 80),
      eye_color: (appearance.eye_color || "").slice(0, 80),
      skin_tone: (appearance.skin_tone || "").slice(0, 80),
      height: (appearance.height || "").slice(0, 40),
      build: (appearance.build || "").slice(0, 80),
      altar: altar ? {
        patron: (altar.patron || "").slice(0, 40),
        theme: (altar.theme || "").slice(0, 40),
        quote: (altar.quote || "").slice(0, 180),
        note: (altar.note || "").slice(0, 180),
        stickers: Array.isArray(altar.stickers) ? altar.stickers.slice(0, 12).map(s => String(s).slice(0, 40)) : [],
        generatedSelf: !!altar.generatedSelf
      } : undefined,
    });
  }
  await env.DB.prepare("UPDATE users SET display_name=?, bio=?, avatar_emoji=?, appearance=COALESCE(?, appearance) WHERE id=?").bind(safeName, safeBio, safeEmoji, safeAppearance, userId).run();
  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
}
