export default function DataSourcesPage() {
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
        <h2>Current preview dataset</h2>
        <p>
          The department names, ministry names, and amounts shown in this version
          were supplied directly for the Budget Watch prototype. Amounts are
          displayed in crore rupees and summary totals are calculated from those
          rows.
        </p>
        <p>
          This is temporary preview data. It has not been independently checked
          against an official Government of India document or a connected
          PostgreSQL database.
        </p>

        <h2>Coverage and limitations</h2>
        <ul>
          <li>No financial year was supplied, so none is inferred or displayed as fact.</li>
          <li>There is only one allocation per listed department; year-over-year values and trends are unavailable.</li>
          <li>No official source URL, document title, publication date, or source metadata was supplied.</li>
          <li>Department and ministry labels are reproduced as provided and may require review.</li>
        </ul>

        <h2>Methodology</h2>
        <ul>
          <li>All listed amounts are interpreted as ₹ crore, as supplied.</li>
          <li>Total allocation is the sum of listed department amounts.</li>
          <li>Median allocation is the middle value after sorting the listed amounts.</li>
          <li>Department share is its allocation divided by the total of listed allocations.</li>
          <li>Year-over-year change would be (current − previous) ÷ previous × 100; it is not shown when the prior value is missing or zero.</li>
          <li>CAGR requires valid beginning and ending values across multiple labeled years.</li>
          <li>Year-to-year variation would be the population standard deviation of valid successive annual percentage changes.</li>
        </ul>
        <p>
          Changes in allocations alone do not indicate improved or worsened
          performance, effectiveness, or outcomes.
        </p>

        <h2>Next step</h2>
        <p>
          Replace the preview fixture with the verified database/API dataset once
          the database connection and schema are ready. The overview, department
          directory, detail pages, and comparison view are separated from their
          presentation so their data source can be switched without presenting
          invented historical figures.
        </p>
      </article>
    </main>
  );
}
