import { getSessionUserId } from "../../_utils/auth.js";
import { getUserById } from "../../_utils/db.js";

export async function onRequestGet({ request, env }) {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("session_id");

    // Method 1: verify via Stripe session (works immediately after purchase)
    if (sessionId) {
        const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
            headers: { "Authorization": `Bearer ${env.STRIPE_SECRET_KEY}` }
        });
        const session = await res.json();
        if (session.payment_status === "paid" && session.metadata?.product === "fairy_pet") {
            return Response.redirect(env.FAIRY_DOWNLOAD_URL, 302);
        }
        return new Response(JSON.stringify({ error: "Session not valid" }), { status: 403, headers: { "Content-Type": "application/json" } });
    }

    // Method 2: check if user has purchased (for re-downloads after login)
    const userId = await getSessionUserId(env, request);
    if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });

    const user = await getUserById(env, userId);
    if (!user?.fairy_purchased) return new Response(JSON.stringify({ error: "Not purchased" }), { status: 403, headers: { "Content-Type": "application/json" } });

    return Response.redirect(env.FAIRY_DOWNLOAD_URL, 302);
}
