import { NextResponse } from "next/server";

import { serverEnv } from "@/lib/env";
import { buildGoogleOauthAuthorizationUrl } from "@/lib/google-calendar";
import {
  createGoogleOauthState,
  isGoogleOauthAdminAuthorized,
} from "@/lib/google-oauth-admin";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!isGoogleOauthAdminAuthorized(token)) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 401 });
  }

  const origin = `${url.protocol}//${url.host}`;
  const redirectUri =
    serverEnv.googleOauthRedirectUri || `${origin}/api/google/oauth/callback`;

  const authorizationUrl = buildGoogleOauthAuthorizationUrl({
    redirectUri,
    state: createGoogleOauthState(),
  });

  return NextResponse.redirect(authorizationUrl);
}
