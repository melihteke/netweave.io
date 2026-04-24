import { Header } from '@/components/Layout/Header';

export default function ExportingDoc() {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 overflow-auto px-5 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Exporting diagrams</h1>
        <p className="mt-2 text-sm muted">
          Export to SVG, PNG, PDF and self-contained HTML lands in <strong>Phase 3</strong>.
          The pipeline is already designed — this page exists so the docs layout, navigation and
          link targets are stable before the feature ships.
        </p>

        <h2 className="mt-6 text-lg font-semibold">Planned formats</h2>
        <ul className="mt-2 list-disc pl-5 text-sm muted space-y-1">
          <li>
            <strong>SVG</strong> — via <code>html-to-image</code>. Vector, editable downstream, small file size.
          </li>
          <li>
            <strong>PNG</strong> — same lib, rasterised. Good for Slack, email, tickets.
          </li>
          <li>
            <strong>PDF</strong> — via <code>jsPDF</code> + <code>svg2pdf.js</code>. True vector PDF, not rasterised.
          </li>
          <li>
            <strong>HTML</strong> — a single-file document with the SVG inlined, a metadata
            header (requester, timestamp, hostname table), and printable CSS.
          </li>
        </ul>

        <h2 className="mt-6 text-lg font-semibold">Metadata block</h2>
        <p className="mt-1 text-sm muted">
          Every export will include a small metadata block with the topology <code>metadata.name</code>,{' '}
          the <code>requester</code> (if present in the YAML), the current view (physical /
          logical), and a timestamp.
        </p>
      </main>
    </div>
  );
}
