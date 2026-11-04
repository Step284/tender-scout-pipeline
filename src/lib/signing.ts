/** HMAC-SHA256 helpers using Web Crypto (works on Cloudflare Workers). */
const enc = new TextEncoder();

export async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

/** Verifies `X-TR-Signature = hex(HMAC(secret, `${timestamp}.${payload}`))` within a 5 min window. */
export async function verifySignature(opts: {
  secret: string;
  timestamp: string | null;
  signature: string | null;
  payload: string;
  nowMs?: number;
}): Promise<boolean> {
  const { secret, timestamp, signature, payload } = opts;
  if (!timestamp || !signature) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  if (Math.abs((opts.nowMs ?? Date.now()) - ts * 1000) > 5 * 60 * 1000) return false;
  const expected = await hmacHex(secret, `${timestamp}.${payload}`);
  return safeEqual(expected, signature.toLowerCase());
}
