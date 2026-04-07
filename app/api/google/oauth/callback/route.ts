import { NextResponse } from "next/server";

import { saveGoogleOauthRefreshToken } from "@/lib/app-config";
import { serverEnv } from "@/lib/env";
import { exchangeGoogleOauthCode } from "@/lib/google-calendar";
import { validateGoogleOauthState } from "@/lib/google-oauth-admin";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code")?.trim() ?? "";
  const error = url.searchParams.get("error")?.trim() ?? "";
  const state = url.searchParams.get("state");

  if (!validateGoogleOauthState(state)) {
    return NextResponse.json(
      { error: "Estado OAuth inválido ou expirado." },
      { status: 400 },
    );
  }

  if (error) {
    return NextResponse.json(
      { error: `Google OAuth retornou erro: ${error}` },
      { status: 400 },
    );
  }

  if (!code) {
    return NextResponse.json(
      { error: "Código de autorização ausente." },
      { status: 400 },
    );
  }

  const origin = `${url.protocol}//${url.host}`;
  const redirectUri =
    serverEnv.googleOauthRedirectUri || `${origin}/api/google/oauth/callback`;

  try {
    const tokenData = await exchangeGoogleOauthCode({
      code,
      redirectUri,
    });

    await saveGoogleOauthRefreshToken({
      refreshToken: tokenData.refreshToken,
      scope: tokenData.scope,
    });

    return NextResponse.redirect(`${origin}/ops/google-calendar/connected`);
  } catch (exchangeError) {
    return NextResponse.json(
      {
        error:
          exchangeError instanceof Error
            ? exchangeError.message
            : "Não foi possível salvar a conexão com o Google Calendar.",
      },
      { status: 500 },
    );
  }
}
