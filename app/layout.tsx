import type { Metadata } from "next";

import { NextDevtoolsShortcutGuard } from "@/components/dev/next-devtools-shortcut-guard";
import { AppProviders } from "@/components/providers/app-providers";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Lureness | Diagnóstico IER",
    template: "%s | Lureness",
  },
  description:
    "Diagnóstico IER da Lureness para identificar vazamentos de receita entre marca, marketing, vendas e retenção.",
  icons: {
    icon: "/img/favicon.png",
    shortcut: "/img/favicon.png",
    apple: "/img/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning={true}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-screen antialiased">
        <NextDevtoolsShortcutGuard />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
