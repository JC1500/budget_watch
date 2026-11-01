import type { Metadata } from "next";
import Link from "next/link";
import CpiHierarchyChart from "@/components/CpiHierarchyChart";
import InflationChart from "@/components/inflation-charts";

export const metadata: Metadata = {
  title: "CPI Inflation | Budget Watch",
  description:
    "Explore monthly CPI inflation and CPI Index observations across Indian states.",
};

const states = [
  { name: "All India", code: "1" },
  { name: "Andaman And Nicobar Islands", code: "2" },
  { name: "Andhra Pradesh", code: "3" },
  { name: "Arunachal Pradesh", code: "4" },
  { name: "Assam", code: "5" },
  { name: "Bihar", code: "6" },
  { name: "Chandigarh", code: "7" },
  { name: "Chhattisgarh", code: "8" },
  { name: "Goa", code: "9" },
  { name: "Gujarat", code: "10" },
  { name: "Haryana", code: "11" },
  { name: "Himachal Pradesh", code: "12" },
  { name: "Jammu And Kashmir", code: "13" },
  { name: "Jharkhand", code: "14" },
  { name: "Karnataka", code: "15" },
  { name: "Kerala", code: "16" },
  { name: "Ladakh", code: "17" },
  { name: "Lakshadweep", code: "18" },
  { name: "Madhya Pradesh", code: "19" },
  { name: "Maharashtra", code: "20" },
  { name: "Manipur", code: "21" },
  { name: "Meghalaya", code: "22" },
  { name: "Mizoram", code: "23" },
  { name: "Nagaland", code: "24" },
  { name: "NCT of Delhi", code: "25" },
  { name: "Odisha", code: "26" },
  { name: "Puducherry", code: "27" },
  { name: "Punjab", code: "28" },
  { name: "Rajasthan", code: "29" },
  { name: "Sikkim", code: "30" },
  { name: "Tamil Nadu", code: "31" },
  { name: "Telangana", code: "32" },
  { name: "The Dadra And Nagar Haveli And Daman And Diu", code: "33" },
  { name: "Tripura", code: "34" },
  { name: "Uttar Pradesh", code: "35" },
  { name: "Uttarakhand", code: "36" },
  { name: "West Bengal", code: "37" },
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
                      state_code: "1",
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
      <CpiHierarchyChart />
    </main>
  );
}