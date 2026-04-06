const FORWARDED_QUERY_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
  "ref",
] as const;

type SearchParamsInput = Record<string, string | string[] | undefined>;

function getSingleValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value.find((entry) => entry.trim())?.trim() ?? "";
  }

  return value?.trim() ?? "";
}

export function buildTypebotViewerUrl(args: {
  publicUrl: string;
  searchParams: SearchParamsInput;
}) {
  const normalizedUrl = args.publicUrl.trim();
  if (!normalizedUrl) {
    return "";
  }

  try {
    const url = new URL(normalizedUrl);

    for (const key of FORWARDED_QUERY_KEYS) {
      const value = getSingleValue(args.searchParams[key]);
      if (!value) {
        continue;
      }

      url.searchParams.set(key, value);
    }

    return url.toString();
  } catch {
    return "";
  }
}
