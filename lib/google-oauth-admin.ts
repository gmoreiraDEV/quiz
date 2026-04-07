import { createHmac, timingSafeEqual } from "node:crypto";

import { serverEnv } from "@/lib/env";

type OauthStatePayload = {
  issuedAt: number;
};

function getAdminSecret() {
  return serverEnv.googleOauthAdminToken;
}

function encodeBase64Url(input: string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBase64Url(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, "base64").toString("utf8");
}

function signValue(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function isGoogleOauthAdminAuthorized(token: string | null | undefined) {
  const secret = getAdminSecret();
  if (!secret) {
    return false;
  }

  if (!token) {
    return false;
  }

  const a = Buffer.from(token);
  const b = Buffer.from(secret);

  if (a.length !== b.length) {
    return false;
  }

  return timingSafeEqual(a, b);
}

export function createGoogleOauthState() {
  const secret = getAdminSecret();
  if (!secret) {
    throw new Error("GOOGLE_OAUTH_ADMIN_TOKEN não configurado.");
  }

  const payload = encodeBase64Url(
    JSON.stringify({
      issuedAt: Date.now(),
    } satisfies OauthStatePayload),
  );
  const signature = signValue(payload, secret);
  return `${payload}.${signature}`;
}

export function validateGoogleOauthState(state: string | null | undefined) {
  const secret = getAdminSecret();
  if (!secret || !state) {
    return false;
  }

  const [payload, signature] = state.split(".");
  if (!payload || !signature) {
    return false;
  }

  const expectedSignature = signValue(payload, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expectedSignature);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return false;
  }

  try {
    const parsed = JSON.parse(decodeBase64Url(payload)) as OauthStatePayload;
    return Date.now() - parsed.issuedAt < 15 * 60_000;
  } catch {
    return false;
  }
}
