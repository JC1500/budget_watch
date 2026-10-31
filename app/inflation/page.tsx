import type { Metadata } from "next";
import Link from "next/link";
import { InflationHistoryCharts } from "@/components/inflation-charts";
import {
  getHeadlineInflationRecords,
  getLatestCPIIndexRecord,
  getLatestInflationRecord,
} from "@/lib/data/inflation";

export const metadata: Metadata = {
  title: "CPI Inflation | Budget Watch",
  description:
    "Explore monthly CPI inflation and CPI Index observations for All India, Combined, CPI (General).",
};

function formatMonthYear(record: { month: string; year: string } | null) {
  return record ? `${record.month} ${record.year}` : "Not available";
}

export default function InflationPage() {
  const records = getHeadlineInflationRecords();
  const latestInflation = getLatestInflationRecord();
  const latestIndex = getLatestCPIIndexRecord();

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
          Monthly CPI observations · All India · Combined · CPI (General)
        </p>
      </header>

      <section
        className="gdp-detail-summary inflation-summary"
        aria-label="Latest CPI observations"
      >
        <article className="gdp-summary-metric">
          <span>Latest inflation</span>
          <strong>
            {latestInflation?.inflation === null ||
            latestInflation?.inflation === undefined
              ? "Not available"
              : `${latestInflation.inflation.toFixed(2)}%`}
          </strong>
          <small>{formatMonthYear(latestInflation)}</small>
        </article>
        <article className="gdp-summary-metric">
          <span>Latest CPI Index</span>
          <strong>
            {latestIndex?.index === null || latestIndex?.index === undefined
              ? "Not available"
              : latestIndex.index.toFixed(2)}
          </strong>
          <small>{formatMonthYear(latestIndex)}</small>
        </article>
      </section>

      <InflationHistoryCharts records={records} />

      <section className="panel inflation-about" aria-labelledby="inflation-about-title">
        <div className="panel-header">
          <div>
            <h2 className="panel-title" id="inflation-about-title">
              About the data
            </h2>
          </div>
        </div>
        <p>
          The <code>inflation</code> field is used for the monthly CPI inflation
          rate, while <code>index</code> is shown separately as the CPI Index.
          Both charts use only the headline series filtered to All India,
          Combined, and CPI (General). Values come from the CPI records stored
          locally in this project.
        </p>
      </section>
    </main>
  );
}
