import { prisma } from "@/lib/prisma";

const QUIZ_APP_CONFIG_ID = "singleton";

export async function getQuizAppConfig() {
  return prisma.quizAppConfig.findUnique({
    where: {
      id: QUIZ_APP_CONFIG_ID,
    },
  });
}

export async function saveGoogleOauthRefreshToken(args: {
  refreshToken: string;
  scope: string | null;
}) {
  return prisma.quizAppConfig.upsert({
    where: {
      id: QUIZ_APP_CONFIG_ID,
    },
    update: {
      googleOauthConnectedAt: new Date(),
      googleOauthRefreshToken: args.refreshToken,
      googleOauthScope: args.scope ?? undefined,
    },
    create: {
      googleOauthConnectedAt: new Date(),
      googleOauthRefreshToken: args.refreshToken,
      googleOauthScope: args.scope,
      id: QUIZ_APP_CONFIG_ID,
    },
  });
}
