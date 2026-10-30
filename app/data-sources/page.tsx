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
              <p>{status.invalidRecords} invalid department record(s) were skipped.</p>
            )}
          </div>
        )}
        <h2>Files currently used</h2>
        <p>
          Budget Watch reads these local JSON files directly. The files do not
          provide official source URLs, document titles, or page references.
        </p>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Financial year</th>
                <th scope="col">Filename</th>
                <th className="numeric" scope="col">Department records</th>
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
                  <td>{dataset.availableFields.join(", ")}</td>
                  <td>{dataset.unit}</td>
                </tr>
              ))}
              {datasets.length === 0 && (
                <tr>
                  <td colSpan={5}>No valid financial-year files were found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <h2>Current preview dataset</h2>
        <p>
          The department names, ministry names, totals, financial years, and
          units are loaded from these project JSON files. No PostgreSQL
          connection is required to render the dataset.
        </p>

        <h2>Coverage and limitations</h2>
        <ul>
          <li>The source files cover 2021–22 through 2026–27.</li>
          <li>Each file provides department and ministry totals in ₹ crore; revenue and capital sub-totals are not included.</li>
          <li>Department labels are normalized only for whitespace, trailing punctuation, and two explicit name changes; other differing labels are kept separate.</li>
          <li>No official source URL, document title, publication date, or page metadata is present in the JSON.</li>
        </ul>

        <h2>Methodology</h2>
        <ul>
          <li>All listed amounts are interpreted as ₹ crore, as supplied.</li>
          <li>Total allocation is the sum of listed department amounts.</li>
          <li>Median allocation is the middle value after sorting the listed amounts.</li>
          <li>Department share is its allocation divided by the total of listed allocations.</li>
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
          `lib/budget-data.ts` normalizes these files and exposes a data-service
          interface to the pages and charts. The reader can later be replaced
          with a PostgreSQL/API implementation without putting raw JSON parsing
          in UI components.
        </p>
      </article>
    </main>
  );
}
