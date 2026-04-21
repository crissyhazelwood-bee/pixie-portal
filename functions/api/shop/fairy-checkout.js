import { getSessionUserId } from "../../_utils/auth.js";

export async function onRequestPost({ request, env }) {
    const userId = await getSessionUserId(env, request);
    if (!userId) return resp({ error: "Unauthorized" }, 401);

    const params = new URLSearchParams({
        mode: "payment",
        "line_items[0][price]": "price_1TOn9xLC5xzjThRrziQAvgkP",
        "line_items[0][quantity]": "1",
        success_url: "https://pixie-portal.com/?purchase=fairy&session_id={CHECKOUT_SESSION_ID}",
        cancel_url: "https://pixie-portal.com/",
        client_reference_id: String(userId),
        "metadata[product]": "fairy_pet",
    });

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${env.STRIPE_SECRET_KEY}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
    });

    const session = await res.json();
    if (!session.url) return resp({ error: "Failed to create session", detail: session.error?.message || JSON.stringify(session) }, 500);

    return resp({ url: session.url });
}

function resp(data, status = 200) {
    return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}
