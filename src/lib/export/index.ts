import { toPng, toSvg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import type { NormalizedTopology } from '../yaml/schema';
import type { ExportFormat } from '@/components/Canvas/Toolbar';

const FILTER_OUT = new Set([
  'react-flow__minimap',
  'react-flow__controls',
  'react-flow__attribution',
  'react-flow__panel',
]);

function filterNode(node: HTMLElement): boolean {
  if (node instanceof Element) {
    for (const cls of FILTER_OUT) if (node.classList?.contains(cls)) return false;
  }
  return true;
}

function fileBase(topology: NormalizedTopology | null) {
  const name = topology?.metadata.name ?? 'netweave-topology';
  return name.replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '');
}

function trigger(blob: Blob | string, filename: string) {
  const url = typeof blob === 'string' ? blob : URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (typeof blob !== 'string') setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function captureViewport(el: HTMLElement, kind: 'png' | 'svg'): Promise<string> {
  const opts = {
    filter: filterNode,
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: getComputedStyle(document.body).getPropertyValue('background-color') || '#ffffff',
  } as const;
  return kind === 'png' ? toPng(el, opts) : toSvg(el, opts);
}

async function exportPng(el: HTMLElement, topology: NormalizedTopology | null) {
  const dataUrl = await captureViewport(el, 'png');
  const blob = await (await fetch(dataUrl)).blob();
  trigger(blob, `${fileBase(topology)}.png`);
}

async function exportSvg(el: HTMLElement, topology: NormalizedTopology | null) {
  const dataUrl = await captureViewport(el, 'svg');
  const res = await fetch(dataUrl);
  const text = await res.text();
  trigger(new Blob([text], { type: 'image/svg+xml' }), `${fileBase(topology)}.svg`);
}

async function exportPdf(el: HTMLElement, topology: NormalizedTopology | null) {
  const dataUrl = await captureViewport(el, 'png');
  const img = new Image();
  img.src = dataUrl;
  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
  });
  const isWide = img.width >= img.height;
  const pdf = new jsPDF({
    orientation: isWide ? 'landscape' : 'portrait',
    unit: 'pt',
    format: 'a4',
  });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 32;
  const metaH = 64;
  const availW = pageW - margin * 2;
  const availH = pageH - margin * 2 - metaH;
  const scale = Math.min(availW / img.width, availH / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  const x = (pageW - w) / 2;
  const y = margin + metaH + (availH - h) / 2;

  pdf.setFontSize(16);
  pdf.text(topology?.metadata.name ?? 'Topology', margin, margin + 14);
  pdf.setFontSize(10);
  const req = topology?.metadata.requester;
  const metaBits: string[] = [];
  if (req?.name) metaBits.push(req.name);
  if (req?.email) metaBits.push(req.email);
  metaBits.push(new Date().toLocaleString());
  pdf.text(metaBits.join('  ·  '), margin, margin + 32);
  pdf.setFontSize(9);
  pdf.text(
    `${topology?.devices.length ?? 0} devices · ${topology?.links.length ?? 0} links · source: ${topology?.source ?? 'unknown'}`,
    margin,
    margin + 46,
  );

  pdf.addImage(dataUrl, 'PNG', x, y, w, h);
  pdf.save(`${fileBase(topology)}.pdf`);
}

async function exportHtml(el: HTMLElement, topology: NormalizedTopology | null) {
  const svgUrl = await captureViewport(el, 'svg');
  const svgText = await (await fetch(svgUrl)).text();

  const name = topology?.metadata.name ?? 'NetWeave topology';
  const req = topology?.metadata.requester;
  const devices = topology?.devices ?? [];
  const links = topology?.links ?? [];

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(name)} · NetWeave</title>
<style>
:root { --fg:#0f172a; --bg:#f8fafc; --muted:#64748b; --border:#e2e8f0; --brand:#357dfb; }
body { margin:0; font-family: ui-sans-serif, system-ui, sans-serif; color: var(--fg); background: var(--bg); }
.wrap { max-width: 1200px; margin: 0 auto; padding: 24px; }
h1 { font-size: 24px; margin: 0 0 4px; }
.meta { color: var(--muted); font-size: 12px; margin-bottom: 16px; }
.card { background: #fff; border: 1px solid var(--border); border-radius: 12px; padding: 12px; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
table { width: 100%; border-collapse: collapse; font-size: 12px; }
th, td { text-align: left; padding: 4px 6px; border-bottom: 1px solid var(--border); }
th { color: var(--muted); font-weight: 600; font-size: 11px; text-transform: uppercase; }
.mono { font-family: ui-monospace, Menlo, monospace; font-size: 11px; }
.svg-host svg { max-width: 100%; height: auto; display: block; }
@media print { body { background: #fff; } .card { border-color: #ccc; } }
</style>
</head>
<body>
<div class="wrap">
  <h1>${escapeHtml(name)}</h1>
  <div class="meta">
    ${req?.name ? `Requester: ${escapeHtml(req.name)}` : ''}
    ${req?.email ? ` · <a href="mailto:${escapeHtml(req.email)}">${escapeHtml(req.email)}</a>` : ''}
    ${req?.name || req?.email ? ' · ' : ''}
    Generated: ${escapeHtml(new Date().toLocaleString())} ·
    Format: ${escapeHtml(topology?.source ?? 'unknown')} ·
    ${devices.length} devices · ${links.length} links
  </div>
  <div class="card svg-host">${svgText}</div>
  <div class="grid">
    <div class="card">
      <h3 style="margin:0 0 8px;font-size:14px;">Devices</h3>
      <table>
        <thead><tr><th>Hostname</th><th>Type</th><th>Role</th></tr></thead>
        <tbody>
${devices.map((d) => `<tr><td class="mono">${escapeHtml(d.hostname)}</td><td>${escapeHtml(d.type)}</td><td>${escapeHtml(d.role ?? '')}</td></tr>`).join('\n')}
        </tbody>
      </table>
    </div>
    <div class="card">
      <h3 style="margin:0 0 8px;font-size:14px;">Links</h3>
      <table>
        <thead><tr><th>A</th><th>B</th><th>Type</th></tr></thead>
        <tbody>
${links.map((l) => `<tr><td class="mono">${escapeHtml(l.a.device)}:${escapeHtml(l.a.interface)}</td><td class="mono">${escapeHtml(l.b.device)}:${escapeHtml(l.b.interface)}</td><td>${escapeHtml(l.type)}</td></tr>`).join('\n')}
        </tbody>
      </table>
    </div>
  </div>
  <p class="meta" style="margin-top:16px;">Generated by NetWeave · <a href="https://melihteke.github.io/netweave.io/">netweave.io</a></p>
</div>
</body>
</html>
`;
  trigger(new Blob([html], { type: 'text/html;charset=utf-8' }), `${fileBase(topology)}.html`);
}

function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;',
  );
}

export async function exportTopology(
  fmt: ExportFormat,
  el: HTMLElement,
  topology: NormalizedTopology | null,
): Promise<void> {
  switch (fmt) {
    case 'png':
      return exportPng(el, topology);
    case 'svg':
      return exportSvg(el, topology);
    case 'pdf':
      return exportPdf(el, topology);
    case 'html':
      return exportHtml(el, topology);
  }
}
