function normalizeOptionalUrl(value: string | undefined) {
  const normalized = value?.trim();
  if (!normalized) {
    return "";
  }

  return normalized.replace(/\/+$/, "");
}

function normalizeOptionalString(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : "";
}

export const publicEnv = {
  googleCalendarBookingUrl: normalizeOptionalUrl(
    process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_BOOKING_URL,
  ),
  ierTypebotApiHost: normalizeOptionalUrl(
    process.env.NEXT_PUBLIC_IER_TYPEBOT_API_HOST,
  ),
  ierTypebotId: normalizeOptionalString(
    process.env.NEXT_PUBLIC_IER_TYPEBOT_ID,
  ),
  ierTypebotPublicUrl: normalizeOptionalUrl(
    process.env.NEXT_PUBLIC_IER_TYPEBOT_PUBLIC_URL,
  ),
} as const;

export const serverEnv = {
  googleCalendarBookingUrl:
    normalizeOptionalUrl(process.env.GOOGLE_CALENDAR_BOOKING_URL) ||
    publicEnv.googleCalendarBookingUrl,
  googleCalendarCalendarId: normalizeOptionalString(
    process.env.GOOGLE_CALENDAR_CALENDAR_ID,
  ),
  googleCalendarClientEmail: normalizeOptionalString(
    process.env.GOOGLE_CALENDAR_CLIENT_EMAIL,
  ),
  googleCalendarDelegatedUser: normalizeOptionalString(
    process.env.GOOGLE_CALENDAR_DELEGATED_USER,
  ),
  googleCalendarPrivateKey: normalizeOptionalString(
    process.env.GOOGLE_CALENDAR_PRIVATE_KEY,
  ).replace(/\\n/g, "\n"),
  googleClientId: normalizeOptionalString(process.env.GOOGLE_CLIENT_ID),
  googleClientSecret: normalizeOptionalString(process.env.GOOGLE_CLIENT_SECRET),
  googleOauthAdminToken: normalizeOptionalString(
    process.env.GOOGLE_OAUTH_ADMIN_TOKEN,
  ),
  googleOauthRedirectUri: normalizeOptionalUrl(
    process.env.GOOGLE_OAUTH_REDIRECT_URI,
  ),
  googleRefreshToken: normalizeOptionalString(process.env.GOOGLE_REFRESH_TOKEN),
  googleCalendarSlotMinutes: Number.parseInt(
    normalizeOptionalString(process.env.GOOGLE_CALENDAR_SLOT_MINUTES) || "30",
    10,
  ),
  googleCalendarLookaheadDays: Number.parseInt(
    normalizeOptionalString(process.env.GOOGLE_CALENDAR_LOOKAHEAD_DAYS) || "10",
    10,
  ),
  googleCalendarTimeZone:
    normalizeOptionalString(process.env.GOOGLE_CALENDAR_TIMEZONE) ||
    "America/Sao_Paulo",
  googleCalendarWorkdayEndHour: Number.parseInt(
    normalizeOptionalString(process.env.GOOGLE_CALENDAR_WORKDAY_END_HOUR) ||
      "18",
    10,
  ),
  googleCalendarWorkdayStartHour: Number.parseInt(
    normalizeOptionalString(process.env.GOOGLE_CALENDAR_WORKDAY_START_HOUR) ||
      "9",
    10,
  ),
  openAiModel:
    normalizeOptionalString(process.env.OPENAI_MODEL) || "gpt-4.1-mini",
  quizTypebotWebhookSecret: normalizeOptionalString(
    process.env.QUIZ_TYPEBOT_WEBHOOK_SECRET,
  ),
} as const;
