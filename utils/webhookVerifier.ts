import crypto from "crypto";

/**
 * Webhook signature verification utility for Meta (Facebook, Instagram, WhatsApp).
 * Verifies X-Hub-Signature headers when provided by Meta.
 */

/**
 * Verify Meta webhook signature using SHA-256 HMAC.
 * 
 * @param payload - Raw request body as string
 * @param signature - X-Hub-Signature-256 header value (format: sha256=<hash>)
 * @param appSecret - Meta App Secret from environment
 * @returns true if signature is valid, false otherwise
 */
export function verifyMetaWebhookSignature(
  payload: string,
  signature: string | null,
  appSecret: string
): boolean {
  if (!signature || !appSecret) {
    // If no signature provided, skip verification (not recommended for production)
    return true;
  }

  const expectedPrefix = "sha256=";
  if (!signature.startsWith(expectedPrefix)) {
    return false;
  }

  const receivedHash = signature.substring(expectedPrefix.length);
  const expectedHash = crypto
    .createHmac("sha256", appSecret)
    .update(payload)
    .digest("hex");

  // Use timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(receivedHash, "hex"),
    Buffer.from(expectedHash, "hex")
  );
}

/**
 * Verify Meta webhook challenge for endpoint verification (GET request).
 * 
 * @param mode - hub.mode from query params
 * @param token - hub.verify_token from query params
 * @param challenge - hub.challenge from query params
 * @param verifyToken - Expected verify token from environment
 * @returns challenge string if verification succeeds, null otherwise
 */
export function verifyMetaWebhookChallenge(
  mode: string | null,
  token: string | null,
  challenge: string | null,
  verifyToken: string
): string | null {
  if (mode === "subscribe" && token === verifyToken && challenge) {
    return challenge;
  }
  return null;
}
