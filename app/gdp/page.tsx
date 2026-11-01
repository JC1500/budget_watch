import type { Metadata } from "next";
import Link from "next/link";

import { GDPDetailCharts } from "@/components/gdp-detail-charts";

export const metadata: Metadata = {
  title: "GDP | Budget Watch",
  description:
    "Explore state-wise and national GDP data from MoSPI.",
};

export default function GDPPage() {
  return (
    <main className="page-shell gdp-detail-page">
      <nav className="gdp-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Overview</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">GDP</span>
      </nav>
      <header className="gdp-detail-intro">
        <Link className="gdp-back-link" href="/">
          <span aria-hidden="true">←</span> Back to Overview
        </Link>
        <p className="eyebrow">National Accounts Statistics</p>
        <h1>GDP</h1>
        <p className="intro-copy">
          State-wise and national GDP observations from MoSPI
        </p>
      </header>
      <GDPDetailCharts />
    </main>
  );
}