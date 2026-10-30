import Link from "next/link";

const navigation = [
  { href: "/", label: "Overview" },
  { href: "/departments", label: "Departments" },
  { href: "/compare", label: "Compare" },
  { href: "/trends", label: "Trends" },
  { href: "/explore", label: "Data explorer" },
  { href: "/data-sources", label: "Data sources" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" href="/" aria-label="Budget Watch overview">
          <span className="brand-mark" aria-hidden="true">BW</span>
          <span>Budget Watch</span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <Link className="nav-link" href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <span className="preview-chip">
          <span className="status-dot" aria-hidden="true" />
          Preview dataset
        </span>
      </div>
    </header>
  );
}
