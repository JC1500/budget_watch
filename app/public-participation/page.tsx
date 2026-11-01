import type { Metadata } from "next";
import Link from "next/link";

import PLFSCharts from "@/components/plfs-chart";

export const metadata: Metadata = {
  title: "Employment & Public Participation | Budget Watch",
  description:
    "Explore employment and labour force participation data from PLFS.",
};

export default function PublicParticipationPage() {
  return (
    <main className="page-shell gdp-detail-page">
      <nav className="gdp-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Overview</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Employment &amp; Public Participation</span>
      </nav>
      <header className="gdp-detail-intro">
        <Link className="gdp-back-link" href="/">
          <span aria-hidden="true">←</span> Back to Overview
        </Link>
        <p className="eyebrow">Periodic Labour Force Survey</p>
        <h1>Employment &amp; Public Participation</h1>
        <p className="intro-copy">
          Annual employment and labour force participation indicators from MoSPI
        </p>
      </header>
      <PLFSCharts />
    </main>
  );
}
