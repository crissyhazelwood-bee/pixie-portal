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
    const safeAltarItem = (item = {}) => ({
      id: String(item.id || "").slice(0, 80),
      type: String(item.type || "").slice(0, 40),
      label: String(item.label || "").slice(0, 80),
      icon: String(item.icon || "").slice(0, 40),
      text: String(item.text || "").slice(0, 260),
      category: String(item.category || "").slice(0, 40),
      premium: !!item.premium
    });
    const safeAltarShelves = Array.isArray(altar?.shelves) ? altar.shelves.slice(0, 4).map((shelf = {}) => ({
      id: String(shelf.id || "").slice(0, 40),
      slots: Array.isArray(shelf.slots) ? shelf.slots.slice(0, 8).map((slot = {}) => ({
        slot: String(slot.slot || "").slice(0, 60),
        itemId: String(slot.itemId || "").slice(0, 80)
      })) : []
    })) : [];
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
        visibility: altar.visibility === "private" ? "private" : "public",
        selectedSlot: altar.selectedSlot && typeof altar.selectedSlot === "object" ? {
          shelf: String(altar.selectedSlot.shelf || "").slice(0, 40),
          slot: String(altar.selectedSlot.slot || "").slice(0, 60)
        } : undefined,
        words: altar.words && typeof altar.words === "object" ? {
          bio: String(altar.words.bio || "").slice(0, 260),
          poem: String(altar.words.poem || "").slice(0, 180),
          goal: String(altar.words.goal || "").slice(0, 180),
          affirmation: String(altar.words.affirmation || "").slice(0, 180),
          notes: String(altar.words.notes || "").slice(0, 180)
        } : undefined,
        selfPortrait: altar.selfPortrait && typeof altar.selfPortrait === "object" ? {
          style: String(altar.selfPortrait.style || "").slice(0, 80),
          mood: String(altar.selfPortrait.mood || "").slice(0, 80),
          frame: String(altar.selfPortrait.frame || "").slice(0, 80),
          prompt: String(altar.selfPortrait.prompt || "").slice(0, 260),
          image: String(altar.selfPortrait.image || "").slice(0, 20000),
          animated: !!altar.selfPortrait.animated,
          price: String(altar.selfPortrait.price || "").slice(0, 20),
          generated: !!altar.selfPortrait.generated
        } : undefined,
        library: Array.isArray(altar.library) ? altar.library.slice(0, 60).map(safeAltarItem) : [],
        shelves: safeAltarShelves,
        stickers: Array.isArray(altar.stickers) ? altar.stickers.slice(0, 12).map(s => String(s).slice(0, 40)) : [],
        generatedSelf: !!altar.generatedSelf
      } : undefined,
    });
  }
  await env.DB.prepare("UPDATE users SET display_name=?, bio=?, avatar_emoji=?, appearance=COALESCE(?, appearance) WHERE id=?").bind(safeName, safeBio, safeEmoji, safeAppearance, userId).run();
  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
}
