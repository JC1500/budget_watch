import type { Metadata } from "next";
import Link from "next/link";

import InflationChart from "@/components/inflation-charts";

export const metadata: Metadata = {
  title: "CPI Inflation | Budget Watch",
  description:
    "Explore monthly CPI inflation and CPI Index observations across Indian states.",
};

const states = [
  { name: "Uttarakhand", code: "1" },
  { name: "Himachal Pradesh", code: "2" },
  { name: "Punjab", code: "3" },
  { name: "Chandigarh", code: "4" },
];

const sectors = [
   { name: "Rural", code: "1" },
  { name: "Urban", code: "2" },
];

export default function InflationPage() {
  return (
    <main className="page-shell inflation-detail-page">
      <nav className="gdp-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Overview</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">CPI Inflation</span>
      </nav>

      <header className="gdp-detail-intro">
        <Link className="gdp-back-link" href="/">
          <span aria-hidden="true">←</span> Back to Overview
        </Link>

        <p className="eyebrow">Consumer Price Index</p>

        <h1>CPI Inflation</h1>

        <p className="intro-copy">
          Monthly CPI observations across Indian states
        </p>
      </header>

      <section className="inflation-chart-section">
        <h2>All-India Inflation</h2>

        <InflationChart
          variant="All-India"
          params={{
            year: "2026",
            sector_code: "3",
            division_code: "0",
            limit: 100,
            page: 1,
          }}
        />
      </section>

      <section className="inflation-chart-section">
        <h2>State-wise Inflation</h2>

        <InflationChart
          variant="State-wise"
          states={states}
          params={{
            year: "2026",
            sector_code: "3",
            division_code: "0",
            limit: 100,
            page: 1,
          }}
        />
      </section>

      <section className="inflation-chart-section">
        <h2>Sector-wise Inflation</h2>

        <InflationChart
          variant="Sector-wise"
          sectors={sectors}
          params={{
            year: "2026",
            state_code: "1",
            division_code: "0",
            limit: 100,
            page: 1,
          }}
        />
      </section>
    </main>
  );
}