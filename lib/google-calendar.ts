import { createSign } from "node:crypto";

import { getQuizAppConfig } from "@/lib/app-config";
import { serverEnv } from "@/lib/env";

type CalendarDateParts = {
  day: number;
  hour: number;
  minute: number;
  month: number;
  second: number;
  year: number;
};

type GoogleTokenCache = {
  accessToken: string;
  expiresAt: number;
};

type CalendarBusyPeriod = {
  end: string;
  start: string;
};

type GoogleFreeBusyResponse = {
  calendars?: Record<
    string,
    {
      busy?: CalendarBusyPeriod[];
    }
  >;
};

type GoogleCalendarEvent = {
  conferenceData?: {
    entryPoints?: Array<{
      entryPointType?: string;
      uri?: string;
    }>;
  };
  hangoutLink?: string;
  htmlLink?: string;
  id?: string;
};

type GoogleCalendarErrorResponse = {
  error?: {
    message?: string;
  };
};

export type PublicBookingSlot = {
  end: string;
  label: string;
  start: string;
};

export type PublicBookingDay = {
  dateKey: string;
  label: string;
  slots: PublicBookingSlot[];
};

export type GoogleCalendarBookingResult = {
  bookingMetadata: Record<string, unknown>;
  eventId: string;
  eventUrl: string | null;
  meetingUrl: string | null;
  scheduledFor: string;
  scheduledUntil: string;
};

function getGoogleCalendarErrorMessage(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  const record = body as GoogleCalendarErrorResponse;
  return record.error?.message?.trim() || null;
}

const TOKEN_AUDIENCE = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar";
const googleTokenCache = globalThis as typeof globalThis & {
  __quizGoogleCalendarTokenCache?: GoogleTokenCache;
};

type GoogleCalendarBaseConfig = {
  calendarId: string;
  lookaheadDays: number;
  slotMinutes: number;
  timeZone: string;
  workdayEndHour: number;
  workdayStartHour: number;
};

type GoogleCalendarOauthConfig = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
};

function getGoogleCalendarBaseConfig(): GoogleCalendarBaseConfig | null {
  const {
    googleCalendarCalendarId,
    googleCalendarLookaheadDays,
    googleCalendarSlotMinutes,
    googleCalendarTimeZone,
    googleCalendarWorkdayEndHour,
    googleCalendarWorkdayStartHour,
  } = serverEnv;

  if (!googleCalendarCalendarId) {
    return null;
  }

  return {
    calendarId: googleCalendarCalendarId,
    lookaheadDays: Number.isFinite(googleCalendarLookaheadDays)
      ? Math.max(3, Math.min(21, googleCalendarLookaheadDays))
      : 10,
    slotMinutes: Number.isFinite(googleCalendarSlotMinutes)
      ? Math.max(15, Math.min(120, googleCalendarSlotMinutes))
      : 30,
    timeZone: googleCalendarTimeZone,
    workdayEndHour: Number.isFinite(googleCalendarWorkdayEndHour)
      ? Math.max(googleCalendarWorkdayStartHour + 1, googleCalendarWorkdayEndHour)
      : 18,
    workdayStartHour: Number.isFinite(googleCalendarWorkdayStartHour)
      ? Math.max(6, Math.min(20, googleCalendarWorkdayStartHour))
      : 9,
  };
}

function getGoogleCalendarServiceAccountConfig() {
  const baseConfig = getGoogleCalendarBaseConfig();
  const {
    googleCalendarClientEmail,
    googleCalendarDelegatedUser,
    googleCalendarPrivateKey,
  } = serverEnv;

  if (!baseConfig || !googleCalendarClientEmail || !googleCalendarPrivateKey) {
    return null;
  }

  return {
    ...baseConfig,
    clientEmail: googleCalendarClientEmail,
    delegatedUser: googleCalendarDelegatedUser || null,
    privateKey: googleCalendarPrivateKey,
  };
}

async function getGoogleCalendarOauthConfig(): Promise<GoogleCalendarOauthConfig | null> {
  const { googleClientId, googleClientSecret, googleRefreshToken } = serverEnv;
  if (!googleClientId || !googleClientSecret) {
    return null;
  }

  const appConfig = await getQuizAppConfig();
  const refreshToken =
    appConfig?.googleOauthRefreshToken?.trim() || googleRefreshToken;

  if (!refreshToken) {
    return null;
  }

  return {
    clientId: googleClientId,
    clientSecret: googleClientSecret,
    refreshToken,
  };
}

function encodeBase64Url(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function signJwt(payload: Record<string, unknown>, privateKey: string) {
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const unsigned = `${encodeBase64Url(JSON.stringify(header))}.${encodeBase64Url(
    JSON.stringify(payload),
  )}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();

  const signature = signer.sign(privateKey);
  return `${unsigned}.${encodeBase64Url(signature)}`;
}

async function getGoogleAccessToken() {
  const cached = googleTokenCache.__quizGoogleCalendarTokenCache;
  if (cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.accessToken;
  }

  const oauthConfig = await getGoogleCalendarOauthConfig();
  if (oauthConfig) {
    const response = await fetch(TOKEN_AUDIENCE, {
      body: new URLSearchParams({
        client_id: oauthConfig.clientId,
        client_secret: oauthConfig.clientSecret,
        grant_type: "refresh_token",
        refresh_token: oauthConfig.refreshToken,
      }),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
      cache: "no-store",
    });

    const body = (await response.json().catch(() => null)) as
      | { access_token?: string; expires_in?: number; error?: string }
      | null;

    if (!response.ok || !body?.access_token) {
      throw new Error(
        body?.error || "Não foi possível renovar o acesso OAuth do Google Calendar.",
      );
    }

    googleTokenCache.__quizGoogleCalendarTokenCache = {
      accessToken: body.access_token,
      expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000,
    };

    return body.access_token;
  }

  const config = getGoogleCalendarServiceAccountConfig();
  if (!config) {
    throw new Error("Google Calendar não configurado.");
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const jwt = signJwt(
    {
      aud: TOKEN_AUDIENCE,
      exp: issuedAt + 3600,
      iat: issuedAt,
      iss: config.clientEmail,
      scope: GOOGLE_CALENDAR_SCOPE,
      ...(config.delegatedUser ? { sub: config.delegatedUser } : {}),
    },
    config.privateKey,
  );

  const response = await fetch(TOKEN_AUDIENCE, {
    body: new URLSearchParams({
      assertion: jwt,
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    }),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
    cache: "no-store",
  });

  const body = (await response.json().catch(() => null)) as
    | { access_token?: string; expires_in?: number; error?: string }
    | null;

  if (!response.ok || !body?.access_token) {
    throw new Error(
      body?.error || "Não foi possível autenticar com o Google Calendar.",
    );
  }

  googleTokenCache.__quizGoogleCalendarTokenCache = {
    accessToken: body.access_token,
    expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000,
  };

  return body.access_token;
}

async function googleCalendarFetch(
  path: string,
  init: RequestInit & { body?: BodyInit | null } = {},
) {
  const accessToken = await getGoogleAccessToken();

  return fetch(`https://www.googleapis.com/calendar/v3${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
}

function getFormatter(
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat("en-CA", {
    calendar: "gregory",
    hour12: false,
    timeZone,
    ...options,
  });
}

function getCalendarDateParts(date: Date, timeZone: string): CalendarDateParts {
  const formatter = getFormatter(timeZone, {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    year: "numeric",
  });

  const mapped = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number.parseInt(part.value, 10)]),
  ) as Record<string, number>;

  return {
    day: mapped.day,
    hour: mapped.hour,
    minute: mapped.minute,
    month: mapped.month,
    second: mapped.second,
    year: mapped.year,
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = getCalendarDateParts(date, timeZone);
  const utcTime = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  return utcTime - date.getTime();
}

function zonedDateTimeToUtc(
  parts: Pick<CalendarDateParts, "day" | "hour" | "minute" | "month" | "year">,
  timeZone: string,
) {
  const guess = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0),
  );
  const offset = getTimeZoneOffsetMs(guess, timeZone);
  return new Date(guess.getTime() - offset);
}

function getDateKey(date: Date, timeZone: string) {
  const parts = getCalendarDateParts(date, timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function getWeekdayNumber(date: Date, timeZone: string) {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(date);

  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
}

function formatDayLabel(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    timeZone,
    weekday: "long",
  });

  const label = formatter.format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatTimeLabel(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(date);
}

function formatDateTimeLabel(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "long",
    timeZone,
    weekday: "long",
  }).format(date);
}

function hasOverlap(
  slotStart: Date,
  slotEnd: Date,
  busyPeriods: Array<{ end: Date; start: Date }>,
) {
  return busyPeriods.some(
    (busy) => slotStart < busy.end && slotEnd > busy.start,
  );
}

export function isGoogleCalendarSchedulingConfigured() {
  return Boolean(getGoogleCalendarBaseConfig());
}

export function getGoogleCalendarTimeZone() {
  return (
    getGoogleCalendarBaseConfig()?.timeZone ?? serverEnv.googleCalendarTimeZone
  );
}

export async function listGoogleCalendarSlotDays() {
  const config = getGoogleCalendarBaseConfig();
  if (!config) {
    throw new Error("Google Calendar não configurado.");
  }

  const now = new Date();
  const today = getCalendarDateParts(now, config.timeZone);
  const candidateSlots: Array<{
    dateKey: string;
    dayLabel: string;
    end: Date;
    label: string;
    start: Date;
  }> = [];

  for (let offset = 0; offset < config.lookaheadDays; offset += 1) {
    const anchor = new Date(
      Date.UTC(today.year, today.month - 1, today.day + offset, 12, 0, 0),
    );
    const weekday = getWeekdayNumber(anchor, config.timeZone);

    if (weekday === 0 || weekday === 6) {
      continue;
    }

    const dateKey = getDateKey(anchor, config.timeZone);
    const dayLabel = formatDayLabel(anchor, config.timeZone);
    for (
      let minutes = config.workdayStartHour * 60;
      minutes + config.slotMinutes <= config.workdayEndHour * 60;
      minutes += config.slotMinutes
    ) {
      const start = zonedDateTimeToUtc(
        {
          day: getCalendarDateParts(anchor, config.timeZone).day,
          hour: Math.floor(minutes / 60),
          minute: minutes % 60,
          month: getCalendarDateParts(anchor, config.timeZone).month,
          year: getCalendarDateParts(anchor, config.timeZone).year,
        },
        config.timeZone,
      );
      const end = new Date(start.getTime() + config.slotMinutes * 60_000);

      if (start.getTime() <= now.getTime() + 5 * 60_000) {
        continue;
      }

      candidateSlots.push({
        dateKey,
        dayLabel,
        end,
        label: formatTimeLabel(start, config.timeZone),
        start,
      });
    }
  }

  if (candidateSlots.length === 0) {
    return {
      days: [] as PublicBookingDay[],
      timeZone: config.timeZone,
    };
  }

  const response = await googleCalendarFetch("/freeBusy", {
    body: JSON.stringify({
      items: [{ id: config.calendarId }],
      timeMax: candidateSlots[candidateSlots.length - 1]?.end.toISOString(),
      timeMin: candidateSlots[0]?.start.toISOString(),
      timeZone: config.timeZone,
    }),
    method: "POST",
  });

  const body = (await response.json().catch(() => null)) as
    | GoogleFreeBusyResponse
    | { error?: { message?: string } }
    | null;

  if (!response.ok) {
    throw new Error(
      getGoogleCalendarErrorMessage(body) ||
        "Não foi possível consultar disponibilidade no Google Calendar.",
    );
  }

  const freeBusyData = body as GoogleFreeBusyResponse | null;
  const busyPeriods =
    freeBusyData?.calendars?.[config.calendarId]?.busy?.map((period) => ({
      end: new Date(period.end),
      start: new Date(period.start),
    })) ?? [];

  const availableDays = candidateSlots.reduce<Map<string, PublicBookingDay>>(
    (accumulator, slot) => {
      if (hasOverlap(slot.start, slot.end, busyPeriods)) {
        return accumulator;
      }

      const existing =
        accumulator.get(slot.dateKey) ??
        ({
          dateKey: slot.dateKey,
          label: slot.dayLabel,
          slots: [],
        } satisfies PublicBookingDay);

      existing.slots.push({
        end: slot.end.toISOString(),
        label: slot.label,
        start: slot.start.toISOString(),
      });
      accumulator.set(slot.dateKey, existing);
      return accumulator;
    },
    new Map(),
  );

  return {
    days: Array.from(availableDays.values()),
    timeZone: config.timeZone,
  };
}

function buildEventDescription(args: {
  leadEmail: string | null;
  leadName: string | null;
  leadPhoneNumber: string | null;
  leadToken: string;
  profileName: string | null;
  score: number | null;
  summary: string | null;
}) {
  return [
    "Agendamento originado pelo quiz Lureness.",
    "",
    `Lead token: ${args.leadToken}`,
    `Nome: ${args.leadName || "Não informado"}`,
    `E-mail: ${args.leadEmail || "Não informado"}`,
    `Telefone: ${args.leadPhoneNumber || "Não informado"}`,
    `IER: ${args.score ?? "N/D"}${args.profileName ? ` · ${args.profileName}` : ""}`,
    "",
    args.summary || "Resumo pendente.",
  ].join("\n");
}

export async function createGoogleCalendarBooking(args: {
  leadEmail: string | null;
  leadName: string | null;
  leadPhoneNumber: string | null;
  leadToken: string;
  profileName: string | null;
  score: number | null;
  sessionId: string;
  startIso: string;
  submissionId: string | null;
  summary: string | null;
}) {
  const config = getGoogleCalendarBaseConfig();
  if (!config) {
    throw new Error("Google Calendar não configurado.");
  }

  const scheduledFor = new Date(args.startIso);
  if (Number.isNaN(scheduledFor.getTime())) {
    throw new Error("Horário inválido.");
  }

  const scheduledUntil = new Date(
    scheduledFor.getTime() + config.slotMinutes * 60_000,
  );

  const freeBusyResponse = await googleCalendarFetch("/freeBusy", {
    body: JSON.stringify({
      items: [{ id: config.calendarId }],
      timeMax: scheduledUntil.toISOString(),
      timeMin: scheduledFor.toISOString(),
      timeZone: config.timeZone,
    }),
    method: "POST",
  });
  const freeBusyBody = (await freeBusyResponse.json().catch(() => null)) as
    | GoogleFreeBusyResponse
    | { error?: { message?: string } }
    | null;

  if (!freeBusyResponse.ok) {
    throw new Error(
      getGoogleCalendarErrorMessage(freeBusyBody) ||
        "Não foi possível validar o horário escolhido.",
    );
  }

  const validatedFreeBusyBody = freeBusyBody as GoogleFreeBusyResponse | null;
  if (
    (validatedFreeBusyBody?.calendars?.[config.calendarId]?.busy?.length ?? 0) >
    0
  ) {
    throw new Error("Esse horário acabou de ser ocupado. Escolha outro slot.");
  }

  const baseEventPayload = {
    attendees: args.leadEmail
      ? [{ email: args.leadEmail, displayName: args.leadName || undefined }]
      : [],
    description: buildEventDescription(args),
    end: {
      dateTime: scheduledUntil.toISOString(),
      timeZone: config.timeZone,
    },
    extendedProperties: {
      private: {
        leadToken: args.leadToken,
        sessionId: args.sessionId,
        submissionId: args.submissionId || "",
      },
    },
    guestsCanInviteOthers: false,
    guestsCanModify: false,
    guestsCanSeeOtherGuests: false,
    start: {
      dateTime: scheduledFor.toISOString(),
      timeZone: config.timeZone,
    },
    summary: `Conversa estratégica Lureness · ${args.leadName || args.leadEmail || args.leadToken}`,
  };

  const attemptEventCreation = async (withConferenceData: boolean) => {
    const response = await googleCalendarFetch(
      `/calendars/${encodeURIComponent(config.calendarId)}/events?conferenceDataVersion=1&sendUpdates=all`,
      {
        body: JSON.stringify(
          withConferenceData
            ? {
                ...baseEventPayload,
                conferenceData: {
                  createRequest: {
                    requestId: crypto.randomUUID(),
                    conferenceSolutionKey: {
                      type: "hangoutsMeet",
                    },
                  },
                },
              }
            : baseEventPayload,
        ),
        method: "POST",
      },
    );

    const body = (await response.json().catch(() => null)) as
      | GoogleCalendarEvent
      | { error?: { message?: string } }
      | null;

    return {
      body,
      ok: response.ok,
      status: response.status,
    };
  };

  let created = await attemptEventCreation(true);
  if (!created.ok) {
    created = await attemptEventCreation(false);
  }

  if (!created.ok || !created.body || !("id" in created.body) || !created.body.id) {
    throw new Error(
      getGoogleCalendarErrorMessage(created.body) ||
        "Não foi possível criar o evento no Google Calendar.",
    );
  }

  const conferenceEntry =
    created.body.conferenceData?.entryPoints?.find(
      (entry) => entry.entryPointType === "video",
    )?.uri ?? null;

  return {
    bookingMetadata: created.body as Record<string, unknown>,
    eventId: created.body.id,
    eventUrl: created.body.htmlLink ?? null,
    meetingUrl: created.body.hangoutLink ?? conferenceEntry,
    scheduledFor: scheduledFor.toISOString(),
    scheduledUntil: scheduledUntil.toISOString(),
  } satisfies GoogleCalendarBookingResult;
}

export function formatBookingDateTime(dateIso: string) {
  return formatDateTimeLabel(new Date(dateIso), getGoogleCalendarTimeZone());
}

export function isGoogleOauthConfigured() {
  return Boolean(serverEnv.googleClientId && serverEnv.googleClientSecret);
}

export async function hasGoogleCalendarAccessConfigured() {
  if (!getGoogleCalendarBaseConfig()) {
    return false;
  }

  if (await getGoogleCalendarOauthConfig()) {
    return true;
  }

  return Boolean(getGoogleCalendarServiceAccountConfig());
}

export function buildGoogleOauthAuthorizationUrl(args: {
  redirectUri: string;
  state: string;
}) {
  if (!serverEnv.googleClientId) {
    throw new Error("Google OAuth client não configurado.");
  }

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("client_id", serverEnv.googleClientId);
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("redirect_uri", args.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_CALENDAR_SCOPE);
  url.searchParams.set("state", args.state);
  return url.toString();
}

export async function exchangeGoogleOauthCode(args: {
  code: string;
  redirectUri: string;
}) {
  if (!serverEnv.googleClientId || !serverEnv.googleClientSecret) {
    throw new Error("Google OAuth client não configurado.");
  }

  const response = await fetch(TOKEN_AUDIENCE, {
    body: new URLSearchParams({
      client_id: serverEnv.googleClientId,
      client_secret: serverEnv.googleClientSecret,
      code: args.code,
      grant_type: "authorization_code",
      redirect_uri: args.redirectUri,
    }),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
    cache: "no-store",
  });

  const body = (await response.json().catch(() => null)) as
    | {
        access_token?: string;
        error?: string;
        refresh_token?: string;
        scope?: string;
      }
    | null;

  if (!response.ok || !body) {
    throw new Error(body?.error || "Não foi possível concluir a autorização OAuth.");
  }

  if (!body.refresh_token) {
    throw new Error(
      "O Google não retornou refresh token. Revogue o acesso anterior e tente novamente com prompt de consentimento.",
    );
  }

  return {
    refreshToken: body.refresh_token,
    scope: body.scope ?? null,
  };
}
