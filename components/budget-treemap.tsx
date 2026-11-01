import Link from "next/link";
import type { BudgetEntry } from "@/lib/budget-data";
import { getDepartmentRank } from "@/lib/analytics/budget";
import {
  calculateShare,
  formatCroreExact,
  formatShare,
} from "@/lib/format";
import { useLanguage } from "@/lib/i18n/provider";

type Rectangle = {
  entry: BudgetEntry;
  x: number;
  y: number;
  width: number;
  height: number;
};

function layoutTreemap(
  entries: BudgetEntry[],
  x = 0,
  y = 0,
  width = 100,
  height = 100,
): Rectangle[] {
  if (entries.length === 0) return [];
  if (entries.length === 1) {
    return [{ entry: entries[0], x, y, width, height }];
  }

  const total = entries.reduce((sum, entry) => sum + entry.amountCrore, 0);
  if (total <= 0) return [];

  const splitAt = entries.slice(0, -1).reduce(
    (best, _entry, index) => {
      const currentTotal = entries
        .slice(0, index + 1)
        .reduce((sum, candidate) => sum + candidate.amountCrore, 0);
      return Math.abs(currentTotal / total - 0.5) <
        Math.abs(best.ratio - 0.5)
        ? { index: index + 1, ratio: currentTotal / total }
        : best;
    },
    { index: 1, ratio: entries[0].amountCrore / total },
  );
  const firstGroup = entries.slice(0, splitAt.index);
  const secondGroup = entries.slice(splitAt.index);
  const firstShare =
    firstGroup.reduce((sum, entry) => sum + entry.amountCrore, 0) / total;

  if (width >= height) {
    const firstWidth = width * firstShare;
    return [
      ...layoutTreemap(firstGroup, x, y, firstWidth, height),
      ...layoutTreemap(
        secondGroup,
        x + firstWidth,
        y,
        width - firstWidth,
        height,
      ),
    ];
  }

  const firstHeight = height * firstShare;
  return [
    ...layoutTreemap(firstGroup, x, y, width, firstHeight),
    ...layoutTreemap(
      secondGroup,
      x,
      y + firstHeight,
      width,
      height - firstHeight,
    ),
  ];
}

export function BudgetTreemap({ entries }: { entries: BudgetEntry[] }) {
  const { t } = useLanguage();
  const total = entries.reduce((sum, entry) => sum + entry.amountCrore, 0);
  const positiveEntries = [...entries]
    .filter((entry) => entry.amountCrore > 0)
    .sort((a, b) => b.amountCrore - a.amountCrore);
  const rectangles = layoutTreemap(positiveEntries);
  const nonPositiveCount = entries.length - positiveEntries.length;

  return (
    <section className="panel" aria-labelledby="treemap-title">
      <div className="panel-header">
        <div>
          <h2 className="panel-title" id="treemap-title">
            {t("Budget distribution by department")}
          </h2>
          <p className="panel-subtitle">
            {t("Rectangle area represents each department's allocation")}
          </p>
        </div>
      </div>
      {rectangles.length > 0 ? (
        <>
          <div className="treemap" aria-label={t("Budget distribution treemap")}>
            {rectangles.map(({ entry, x, y, width, height }, index) => {
              const share = calculateShare(entry.amountCrore, total);
              const rank = getDepartmentRank(entry, entries);
              return (
                <Link
                  aria-label={`${entry.department}, ${t("rank")} ${rank}, ${formatCroreExact(entry.amountCrore)}, ${formatShare(share)} ${t("of listed total")}`}
                  className={`treemap-tile${width > 13 && height > 14 ? " treemap-tile-labeled" : ""}`}
                  href={`/departments/${entry.id}?year=${encodeURIComponent(entry.financialYear)}`}
                  key={entry.id}
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    width: `${width}%`,
                    height: `${height}%`,
                    backgroundColor: index % 2 === 0 ? "#e5eee7" : "#dce9df",
                  }}
                  title={`${entry.department}\n${t("Rank")} ${rank}\n${formatCroreExact(entry.amountCrore)}\n${formatShare(share)} ${t("of listed total")}`}
                >
                  {width > 13 && height > 14 && (
                    <>
                      <span className="treemap-name" data-i18n-skip="true">{entry.department}</span>
                      <span className="treemap-amount">
                        {formatCroreExact(entry.amountCrore)}
                      </span>
                    </>
                  )}
                </Link>
              );
            })}
          </div>
          <p className="ranking-caption">
            {t("Select a rectangle for department details. Hover or focus to view the exact allocation and share.")}
            {nonPositiveCount > 0 &&
              ` ${nonPositiveCount} non-positive allocation${nonPositiveCount === 1 ? "" : "s"} cannot be shown with area.`}
          </p>
          <ul className="sr-only">
            {positiveEntries.map((entry) => (
              <li key={entry.id}>
                {entry.department}: {formatCroreExact(entry.amountCrore)},{" "}
                {formatShare(calculateShare(entry.amountCrore, total))} of listed total.
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="empty-state" role="status">
          {t("Budget distribution is not available in this snapshot.")}
        </div>
      )}
    </section>
  );
}
