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

export function getSingleValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value.find((entry) => entry.trim())?.trim() ?? "";
  }

  return value?.trim() ?? "";
}

function normalizeVariableValue(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : "";
}

export function buildTypebotPrefilledVariables(args: {
  extraVariables?: Record<string, string | undefined>;
  searchParams: SearchParamsInput;
}) {
  const variables: Record<string, string> = {};

  for (const key of FORWARDED_QUERY_KEYS) {
    const value = getSingleValue(args.searchParams[key]);
    if (!value) {
      continue;
    }

    variables[key] = value;
  }

  for (const [key, value] of Object.entries(args.extraVariables ?? {})) {
    const normalized = normalizeVariableValue(value);
    if (!normalized) {
      continue;
    }

    variables[key] = normalized;
  }

  return variables;
}

export function resolveTypebotStandardConfig(args: {
  explicitApiHost?: string;
  explicitTypebot?: string;
  publicUrl: string;
}) {
  const explicitApiHost = normalizeVariableValue(args.explicitApiHost);
  const explicitTypebot = normalizeVariableValue(args.explicitTypebot);

  if (explicitApiHost && explicitTypebot) {
    return {
      apiHost: explicitApiHost,
      typebot: explicitTypebot,
    };
  }

  const normalizedUrl = normalizeVariableValue(args.publicUrl);
  if (!normalizedUrl) {
    return null;
  }

  try {
    const url = new URL(normalizedUrl);
    const pathSegments = url.pathname.split("/").filter(Boolean);
    const typebot = explicitTypebot || pathSegments.at(-1) || "";
    const apiHost = explicitApiHost || url.origin;

    if (!apiHost || !typebot) {
      return null;
    }

    return {
      apiHost,
      typebot,
    };
  } catch {
    return null;
  }
}

export function buildTypebotViewerUrl(args: {
  extraSearchParams?: Record<string, string | undefined>;
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

    for (const [key, value] of Object.entries(args.extraSearchParams ?? {})) {
      const normalized = value?.trim();
      if (!normalized) {
        continue;
      }

      url.searchParams.set(key, normalized);
    }

    return url.toString();
  } catch {
    return "";
  }
}
