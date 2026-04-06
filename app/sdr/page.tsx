import type { Metadata } from "next";

import { LurenessMark } from "@/components/brand/lureness-mark";
import { SDRChat } from "@/components/sdr/sdr-chat";

export const metadata: Metadata = {
  title: "SDR Lureness",
};

type SdrPageProps = {
  searchParams: Promise<{ lead_token?: string | string[] }>;
};

function getLeadToken(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }

  return value?.trim() ?? "";
}

export default async function SdrPage({ searchParams }: SdrPageProps) {
  const resolvedSearchParams = await searchParams;
  const leadToken = getLeadToken(resolvedSearchParams.lead_token);

  return (
    <main className="page-frame bg-lureness-glow text-foreground">
      <div className="pointer-events-none absolute inset-0 grid-fade opacity-25" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="pb-8">
          <LurenessMark subtitle="Diagnóstico para conversa estratégica" />
        </header>

        <SDRChat leadToken={leadToken} />
      </div>
    </main>
  );
}
