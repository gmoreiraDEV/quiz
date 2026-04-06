function normalizeOptionalUrl(value: string | undefined) {
  const normalized = value?.trim();
  if (!normalized) {
    return "";
  }

  return normalized.replace(/\/+$/, "");
}

export const publicEnv = {
  ierTypebotPublicUrl: normalizeOptionalUrl(
    process.env.NEXT_PUBLIC_IER_TYPEBOT_PUBLIC_URL,
  ),
} as const;
