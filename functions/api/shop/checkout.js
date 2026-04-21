import { getSessionUserId } from "../../_utils/auth.js";

const PACKS = {
    starter: { credits: 5,  amount: 299,  name: "5 Dream Animations" },
    value:   { credits: 20, amount: 999,  name: "20 Dream Animations" },
    max:     { credits: 50, amount: 1999, name: "50 Dream Animations" },
};

export async function onRequestPost({ request, env }) {
    const userId = await getSessionUserId(env, request);
    if (!userId) return resp({ error: "Unauthorized" }, 401);

    const { pack } = await request.json().catch(() => ({}));
    const selected = PACKS[pack];
    if (!selected) return resp({ error: "Invalid pack" }, 400);

    const params = new URLSearchParams({
        mode: "payment",
        success_url: "https://pixie-portal.com/?purchase=success",
        cancel_url: "https://pixie-portal.com/",
        client_reference_id: String(userId),
        "line_items[0][price_data][currency]": "usd",
        "line_items[0][price_data][product_data][name]": selected.name,
        "line_items[0][price_data][product_data][description]": `${selected.credits} dream animation credits for Pixie Portal`,
        "line_items[0][price_data][unit_amount]": String(selected.amount),
        "line_items[0][quantity]": "1",
        "metadata[credits]": String(selected.credits),
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
    if (!session.url) return resp({ error: "Failed to create session" }, 500);

    return resp({ url: session.url });
}

function resp(data, status = 200) {
    return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}
