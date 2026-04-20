import { clearSessionCookie } from "../_utils/auth.js";
export async function onRequestPost() {
  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json", "Set-Cookie": clearSessionCookie() } });
}
