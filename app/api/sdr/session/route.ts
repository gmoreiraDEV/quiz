import { NextResponse } from "next/server";

import { getSDRSessionState } from "@/lib/quiz";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const leadToken = url.searchParams.get("lead_token")?.trim();

  if (!leadToken) {
    return NextResponse.json({ error: "lead_token é obrigatório." }, { status: 400 });
  }

  const result = await getSDRSessionState(leadToken);
  if (result.state === "processing") {
    return NextResponse.json(
      {
        leadToken,
        message: "Ainda estamos processando o resultado do quiz.",
        state: "processing",
      },
      { status: 202 },
    );
  }

  return NextResponse.json({
    session: result.session,
    state: "ready",
  });
}
