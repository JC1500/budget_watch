import { Suspense } from "react";
import { notFound } from "next/navigation";
import { GDPDetailPage } from "@/components/gdp-detail-page";
import type { GDPMetric } from "@/lib/data/gdp";
import { getGDPOverviewData, getGDPRecords } from "@/lib/data/gdp";

type GDPPageProps = {
  params: Promise<{ year: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function isGDPMetric(value: string | undefined): value is GDPMetric {
  return value === "nominal" || value === "real" || value === "growth";
}

export function generateStaticParams() {
  return getGDPRecords().map((record) => ({ year: record.year }));
}

async function GDPYearDetail({
  params,
  searchParams,
}: GDPPageProps) {
  const [{ year }, query] = await Promise.all([params, searchParams]);
  const data = getGDPOverviewData();
  const detail = data.details.find((entry) => entry.record.year === year);
  if (!detail) notFound();

  return (
    <GDPDetailPage
      data={data}
      detail={detail}
      initialMetric={
        typeof query.metric === "string" && isGDPMetric(query.metric)
          ? query.metric
          : "nominal"
      }
    />
  );
}

export default function GDPYearPage(props: GDPPageProps) {
  return (
    <Suspense
      fallback={
        <main className="page-shell gdp-detail-page" aria-label="Loading GDP details">
          <div className="gdp-detail-summary">
            {Array.from({ length: 4 }, (_, index) => (
              <div className="gdp-summary-metric skeleton" key={index} />
            ))}
          </div>
          <div className="panel skeleton table-skeleton" />
        </main>
      }
    >
      <GDPYearDetail {...props} />
    </Suspense>
  );
}
