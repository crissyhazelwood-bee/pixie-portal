export async function onRequestPost({ request, env }) {
    const { amount } = await request.json().catch(() => ({}));
    const valid = [500, 1000, 1500];
    if (!valid.includes(amount)) return resp({ error: "Invalid amount" }, 400);

    const labels = { 500: "$5", 1000: "$10", 1500: "$15" };

    const params = new URLSearchParams({
        mode: "payment",
        "line_items[0][price_data][currency]": "usd",
        "line_items[0][price_data][product_data][name]": `Pixie Portal Donation — ${labels[amount]}`,
        "line_items[0][price_data][product_data][description]": "Thank you for supporting Pixie Portal development ✦",
        "line_items[0][price_data][unit_amount]": String(amount),
        "line_items[0][quantity]": "1",
        success_url: "https://pixie-portal.com/?donated=true",
        cancel_url: "https://pixie-portal.com/",
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
    if (!session.url) return resp({ error: "Failed to create session", detail: session.error?.message }, 500);

    return resp({ url: session.url });
}

function resp(data, status = 200) {
    return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}
