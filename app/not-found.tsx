"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/provider";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <main className="page-shell">
      <section className="panel error-state" role="status">
        <p className="eyebrow">404</p>
        <h1>{t("Page not found")}</h1>
        <p>{t("The page you are looking for could not be found.")}</p>
        <Link className="secondary-button" href="/">
          {t("Go to Overview")}
        </Link>
      </section>
    </main>
  );
}
