'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Header } from '@/components/Layout/Header';
import { YamlEditor } from '@/components/Editor/YamlEditor';
import { TopologyCanvas, type CanvasHandle } from '@/components/Canvas/TopologyCanvas';
import { ViewToggle, type TopologyView } from '@/components/Canvas/ViewToggle';
import { Toolbar, type ExportFormat } from '@/components/Canvas/Toolbar';
import { LinkDetails, type SelectedLink } from '@/components/Canvas/LinkDetails';
import { parseTopologyYaml, type ParseResult } from '@/lib/yaml/parse';
import { DEFAULT_SETTINGS, type CanvasSettings } from '@/lib/canvasSettings';
import { exportTopology } from '@/lib/export';
import { AlertTriangle, CheckCircle2, FileCode2 } from 'lucide-react';
import { STARTER_YAML } from '@/lib/examples/starter';

export default function Page() {
  const [source, setSource] = useState<string>(STARTER_YAML);
  const [view, setView] = useState<TopologyView>('physical');
  const [engine, setEngine] = useState<'elk' | 'dagre'>('elk');
  const [result, setResult] = useState<ParseResult | null>(null);
  const [settings, setSettings] = useState<CanvasSettings>(DEFAULT_SETTINGS);
  const [selectedLink, setSelectedLink] = useState<SelectedLink | null>(null);
  const canvasRef = useRef<CanvasHandle>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const ex = params.get('example');
    if (!ex) return;
    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
    const safe = ex.replace(/[^a-zA-Z0-9._-]/g, '');
    fetch(`${base}/examples/${safe}`)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setSource)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setResult(parseTopologyYaml(source)), 150);
    return () => clearTimeout(t);
  }, [source]);

  const topology = result?.ok ? result.topology : null;
  const statusLine = useMemo(() => describe(result), [result]);

  const handleExport = async (fmt: ExportFormat) => {
    const el = canvasRef.current?.getExportElement();
    if (!el) return;
    try {
      await exportTopology(fmt, el, topology);
    } catch (err) {
      console.error('Export failed', err);
      alert(`Export failed: ${err instanceof Error ? err.message : 'unknown error'}`);
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex items-center justify-between gap-3 border-b border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-4 py-2">
        <div className="flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1 muted">
            <FileCode2 className="h-3.5 w-3.5" />
            {topology?.source === 'containerlab' ? 'ContainerLab' : topology?.source === 'netweave' ? 'NetWeave v1' : 'YAML'}
          </span>
          <StatusPill result={result} />
          <span className="muted">{statusLine}</span>
        </div>
        <div className="flex items-center gap-2">
          <ViewToggle value={view} onChange={setView} />
          <select
            value={engine}
            onChange={(e) => setEngine(e.target.value as 'elk' | 'dagre')}
            className="rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-xs"
            aria-label="Layout engine"
          >
            <option value="elk">ELK layout</option>
            <option value="dagre">Dagre layout</option>
          </select>
        </div>
      </div>
      <Toolbar settings={settings} onChange={setSettings} onExport={handleExport} />
      <div className="grid flex-1 grid-cols-1 md:grid-cols-[minmax(320px,40%)_1fr]">
        <section className="flex min-h-0 flex-col border-r border-[rgb(var(--border))] bg-[rgb(var(--panel))]">
          <div className="flex items-center justify-between border-b border-[rgb(var(--border))] px-3 py-1.5 text-xs">
            <span className="font-semibold">Topology YAML</span>
            <label className="cursor-pointer muted hover:text-[rgb(var(--fg))]">
              <input
                type="file"
                accept=".yaml,.yml,.clab.yaml"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const reader = new FileReader();
                  reader.onload = () => setSource(String(reader.result ?? ''));
                  reader.readAsText(f);
                }}
              />
              Upload file
            </label>
          </div>
          <div className="flex-1 min-h-0">
            <YamlEditor value={source} onChange={setSource} />
          </div>
          {result && !result.ok ? <ErrorPanel result={result} /> : null}
        </section>
        <section className="relative min-h-0 bg-[rgb(var(--bg))]">
          <TopologyCanvas
            ref={canvasRef}
            topology={topology}
            view={view}
            engine={engine}
            settings={settings}
            onLinkSelect={setSelectedLink}
          />
          {selectedLink ? (
            <LinkDetails
              link={selectedLink}
              topology={topology}
              onClose={() => setSelectedLink(null)}
            />
          ) : null}
        </section>
      </div>
    </div>
  );
}

function StatusPill({ result }: { result: ParseResult | null }) {
  if (!result) return null;
  if (result.ok) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 className="h-3 w-3" /> valid
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-700 dark:text-rose-300">
      <AlertTriangle className="h-3 w-3" /> invalid
    </span>
  );
}

function describe(result: ParseResult | null): string {
  if (!result) return '';
  if (!result.ok) return result.error;
  const t = result.topology;
  return `${t.devices.length} device${t.devices.length === 1 ? '' : 's'} · ${t.links.length} link${t.links.length === 1 ? '' : 's'}`;
}

function ErrorPanel({ result }: { result: Extract<ParseResult, { ok: false }> }) {
  return (
    <div className="max-h-40 overflow-auto border-t border-[rgb(var(--border))] bg-rose-500/5 px-3 py-2 text-xs">
      <div className="font-semibold text-rose-700 dark:text-rose-300">{result.error}</div>
      {result.details?.length ? (
        <ul className="mt-1 space-y-0.5 font-mono text-[11px] text-rose-700 dark:text-rose-300">
          {result.details.map((d, i) => (
            <li key={i}>· {d}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
