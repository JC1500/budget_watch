import { getDataStatus, getDatasetMetadata } from "@/lib/budget-data";

export default function DataSourcesPage() {
  const datasets = getDatasetMetadata();
  const status = getDataStatus();

  return (
    <main className="page-shell">
      <section className="page-intro">
        <div>
          <p className="eyebrow">Methodology & provenance</p>
          <h1>Data sources</h1>
          <p className="intro-copy">
            What is included in this preview, and what still needs verification.
          </p>
        </div>
      </section>
      <article className="panel prose-panel">
        {(status.errors.length > 0 || status.invalidRecords > 0) && (
          <div className="data-warning" role="status">
            <strong>Some local data needs attention.</strong>
            {status.errors.map((error) => <p key={error}>{error}</p>)}
            {status.invalidRecords > 0 && (
              <p>{status.invalidRecords} invalid department or scheme record(s) were skipped.</p>
            )}
          </div>
        )}
        <h2>Files currently used</h2>
        <p>
          Budget Watch reads the updated local JSON datasets on the server.
          Department totals and nested scheme allocations are normalized
          separately; scheme rows are never added to department totals.
        </p>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Financial year</th>
                <th scope="col">Filename</th>
                <th className="numeric" scope="col">Department records</th>
                <th className="numeric" scope="col">Scheme records</th>
                <th scope="col">Available data fields</th>
                <th scope="col">Unit</th>
              </tr>
            </thead>
            <tbody>
              {datasets.map((dataset) => (
                <tr key={dataset.filename}>
                  <td>{dataset.year}</td>
                  <td>{dataset.filename}</td>
                  <td className="numeric">{dataset.recordCount}</td>
                  <td className="numeric">{dataset.schemeCount}</td>
                  <td>{dataset.availableFields.join(", ")}</td>
                  <td>{dataset.unit}</td>
                </tr>
              ))}
              {datasets.length === 0 && (
                <tr>
                  <td colSpan={6}>No valid financial-year files were found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <h2>Current preview dataset</h2>
        <p>
          The department names, ministry names, totals, financial years, and
          scheme allocations are loaded from these project JSON files. No
          PostgreSQL connection is configured in this repository.
        </p>

        <h2>Coverage and limitations</h2>
        <ul>
          <li>The source files cover 2021–22 through 2026–27.</li>
          <li>Each file provides ministry totals, department totals, and nested scheme allocations in ₹ crore; revenue and capital sub-totals are not included.</li>
          <li>Department labels are normalized only for whitespace, trailing punctuation, and two explicit name changes; other differing labels are kept separate.</li>
          <li>Because these source files provide no scheme identifier, scheme history is matched by exact normalized scheme name within its parent department. Renamed labels are kept separate instead of being fuzzily merged.</li>
          <li>Repeated same-name scheme rows within one department and year are combined; missing scheme years remain unavailable. Negative source allocations are retained.</li>
          <li>No official source URL, document title, publication date, or page metadata is present in the JSON.</li>
        </ul>

        <h2>Methodology</h2>
        <ul>
          <li>All listed amounts are interpreted as ₹ crore, as supplied.</li>
          <li>Total allocation is the sum of listed department amounts.</li>
          <li>Scheme-level aggregates use scheme rows only. They are never combined with parent department totals.</li>
          <li>Median allocation is the middle value after sorting the listed amounts.</li>
          <li>Department share is its allocation divided by the total of listed allocations.</li>
          <li>Scheme share of department uses the same-year scheme allocation divided by the parent department&apos;s total; share of total uses the same-year government-wide sum of department totals.</li>
          <li>Year-over-year change is (current − previous) ÷ previous × 100; it is not shown when the prior value is missing or zero.</li>
          <li>CAGR is calculated from first to last available comparable values, annualized across the financial-year intervals.</li>
          <li>Year-to-year variation is the standard deviation of valid annual percentage changes; it is descriptive, not a performance score.</li>
        </ul>
        <p>
          Changes in allocations alone do not indicate improved or worsened
          performance, effectiveness, or outcomes.
        </p>

        <h2>Next step</h2>
        <p>
          `lib/budget-data.ts` normalizes these files and exposes the department
          and scheme data-service functions used by pages and charts. The JSON
          structure is the authoritative source currently available in this
          repository; no backend schema or PostgreSQL API is present here.
        </p>
      </article>
    </main>
  );
}
