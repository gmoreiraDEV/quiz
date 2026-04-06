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
  openAiModel:
    normalizeOptionalString(process.env.OPENAI_MODEL) || "gpt-4.1-mini",
  quizTypebotWebhookSecret: normalizeOptionalString(
    process.env.QUIZ_TYPEBOT_WEBHOOK_SECRET,
  ),
} as const;
