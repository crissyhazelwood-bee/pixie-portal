async function verifyStripeSignature(rawBody, sigHeader, secret) {
    const parts = sigHeader.split(",");
    const tPart = parts.find(p => p.startsWith("t="));
    const v1Part = parts.find(p => p.startsWith("v1="));
    if (!tPart || !v1Part) return false;

    const timestamp = tPart.slice(2);
    const signature = v1Part.slice(3);
    const payload = `${timestamp}.${rawBody}`;

    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
    const computed = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
    return computed === signature;
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
        const credits = parseInt(session.metadata?.credits, 10);

        if (userId && credits) {
            await env.DB.prepare(
                "UPDATE users SET animation_credits = animation_credits + ? WHERE id = ?"
            ).bind(credits, userId).run();
        }
    }

    return new Response("OK");
}
