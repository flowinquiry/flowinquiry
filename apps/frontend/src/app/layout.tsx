import "./globals.css";
import "./theme.css";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { PublicEnvScript } from "next-runtime-env";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorProvider } from "@/providers/error-provider";
import ReactQueryProvider from "@/providers/react-query-provider";
import { ThemeProvider } from "@/providers/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "FlowInquiry",
    template: "%s – FlowInquiry",
  },
  description:
    "FlowInquiry - The Ultimate Project and Ticket Management Solution for Teams",
};

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const locale = await getLocale();

  return (
    <html suppressHydrationWarning={true} lang={locale}>
      <head>
        <PublicEnvScript />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        {/* Fallback title — overridden per-page via generateMetadata */}
        <title>FlowInquiry</title>
      </head>
      <body className={inter.className}>
        <ErrorProvider>
          <ThemeProvider attribute="class" defaultTheme="system">
            <ReactQueryProvider>
              <TooltipProvider>
                <NextIntlClientProvider>{children}</NextIntlClientProvider>
              </TooltipProvider>
              <Toaster />
            </ReactQueryProvider>
          </ThemeProvider>
        </ErrorProvider>
      </body>
    </html>
  );
};

export default RootLayout;
