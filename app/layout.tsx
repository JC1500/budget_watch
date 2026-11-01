import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { getBudgetEntities, getFinancialYears } from "@/lib/budget-data";
import { LanguageProvider } from "@/lib/i18n/provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Budget Watch | Public finance, made legible",
  description:
    "Explore Government of India department and scheme budget allocations across financial years.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LanguageProvider>
          <SiteHeader years={getFinancialYears()} entities={getBudgetEntities()} />
          {children}
          <footer className="site-footer">
            <div className="footer-inner">
              <span>Budget Watch</span>
              <span>Public finance, made legible.</span>
            </div>
          </footer>
        </LanguageProvider>
      </body>
    </html>
  );
}
