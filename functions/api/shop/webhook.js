// BUG-02 fix: constant-time comparison + timestamp freshness check
// BUG-03 fix: use crypto.subtle.verify instead of string equality
async function verifyStripeSignature(rawBody, sigHeader, secret) {
    const parts = sigHeader.split(",");
    const tPart = parts.find(p => p.startsWith("t="));
    const v1Part = parts.find(p => p.startsWith("v1="));
    if (!tPart || !v1Part) return false;

    const timestamp = tPart.slice(2);
    const signature = v1Part.slice(3);

    // BUG-02: reject replayed webhooks older than 5 minutes
    if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

    const payload = `${timestamp}.${rawBody}`;

    // BUG-03: import key with "verify" permission for constant-time comparison
    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["verify"]
    );

    // Decode Stripe's hex signature to bytes, then use constant-time verify
    const sigBytes = new Uint8Array(signature.match(/.{2}/g).map(b => parseInt(b, 16)));
    return await crypto.subtle.verify("HMAC", key, sigBytes, new TextEncoder().encode(payload));
}

export async function onRequestPost({ request, env }) {
    const rawBody = await request.text();
    const sigHeader = request.headers.get("stripe-signature") || "";

    const valid = await verifyStripeSignature(rawBody, sigHeader, env.STRIPE_WEBHOOK_SECRET);
    if (!valid) return new Response("Invalid signature", { status: 400 });

    const event = JSON.parse(rawBody);

    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const userId = parseInt(session.client_reference_id, 10);
        const product = session.metadata?.product;
        const credits = parseInt(session.metadata?.credits, 10);

        // BUG-01: idempotency check — Stripe retries on failure; only process each event once
        const idempotencyResult = await env.DB.prepare(
            "INSERT OR IGNORE INTO processed_webhook_events (event_id, processed_at) VALUES (?, ?)"
        ).bind(event.id, Date.now() / 1000).run();

        if (idempotencyResult.meta.rows_written === 0) {
            return new Response("OK"); // Already processed
        }

        if (userId && credits) {
            const FIRST_PURCHASE_BONUS = { starter: 3, value: 5, max: 15 };
            const pack = session.metadata?.pack;
            const bonus = FIRST_PURCHASE_BONUS[pack] || 0;

            // Atomically apply credits + first-purchase bonus (if applicable)
            const { meta } = await env.DB.prepare(
                "UPDATE users SET animation_credits = animation_credits + ?, first_purchase_done = 1 WHERE id = ? AND first_purchase_done = 0"
            ).bind(credits + bonus, userId).run();

            if (meta.rows_written === 0) {
                // Not first purchase — just add the base credits
                await env.DB.prepare(
                    "UPDATE users SET animation_credits = animation_credits + ? WHERE id = ?"
                ).bind(credits, userId).run();
            }
        }

        if (userId && product === "fairy_pet") {
            await env.DB.prepare(
                "UPDATE users SET fairy_purchased = 1 WHERE id = ?"
            ).bind(userId).run();
        }
    }

    return new Response("OK");
}
