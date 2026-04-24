'use client';

import { Download, Waypoints, Palette, Shapes } from 'lucide-react';
import {
  EDGE_TYPE_LABELS,
  GROUP_SHAPE_LABELS,
  LAYOUT_DIR_LABELS,
  type CanvasSettings,
  type EdgePathType,
  type GroupShape,
  type LayoutDir,
  type EdgeColorMode,
} from '@/lib/canvasSettings';

export type ExportFormat = 'png' | 'svg' | 'pdf' | 'html';

export function Toolbar({
  settings,
  onChange,
  onExport,
}: {
  settings: CanvasSettings;
  onChange: (next: CanvasSettings) => void;
  onExport: (fmt: ExportFormat) => void;
}) {
  const set = <K extends keyof CanvasSettings>(key: K, value: CanvasSettings[K]) =>
    onChange({ ...settings, [key]: value });

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-4 py-2 text-xs">
      <Group icon={<Waypoints className="h-3.5 w-3.5" />} label="Links">
        <Select
          value={settings.edgeType}
          onChange={(v) => set('edgeType', v as EdgePathType)}
          options={Object.entries(EDGE_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))}
        />
        <Select
          value={settings.layoutDir}
          onChange={(v) => set('layoutDir', v as LayoutDir)}
          options={Object.entries(LAYOUT_DIR_LABELS).map(([v, l]) => ({ value: v, label: l }))}
        />
      </Group>

      <Group icon={<Palette className="h-3.5 w-3.5" />} label="Colour">
        <Select
          value={settings.edgeColorMode}
          onChange={(v) => set('edgeColorMode', v as EdgeColorMode)}
          options={[
            { value: 'type', label: 'By link type' },
            { value: 'mono', label: 'Single colour' },
          ]}
        />
        {settings.edgeColorMode === 'mono' ? (
          <input
            type="color"
            value={settings.edgeMonoColor}
            onChange={(e) => set('edgeMonoColor', e.target.value)}
            className="h-6 w-7 cursor-pointer rounded border border-[rgb(var(--border))] bg-transparent"
            aria-label="Edge colour"
          />
        ) : null}
      </Group>

      <Group icon={<Shapes className="h-3.5 w-3.5" />} label="Groups">
        <Select
          value={settings.groupShape}
          onChange={(v) => set('groupShape', v as GroupShape)}
          options={Object.entries(GROUP_SHAPE_LABELS).map(([v, l]) => ({ value: v, label: l }))}
        />
        <label className="flex items-center gap-1">
          <span className="muted text-[10px]">OSPF</span>
          <input
            type="color"
            value={settings.ospfColor}
            onChange={(e) => set('ospfColor', e.target.value)}
            className="h-5 w-6 cursor-pointer rounded border border-[rgb(var(--border))] bg-transparent"
            aria-label="OSPF area colour"
          />
        </label>
        <label className="flex items-center gap-1">
          <span className="muted text-[10px]">BGP</span>
          <input
            type="color"
            value={settings.bgpColor}
            onChange={(e) => set('bgpColor', e.target.value)}
            className="h-5 w-6 cursor-pointer rounded border border-[rgb(var(--border))] bg-transparent"
            aria-label="BGP AS colour"
          />
        </label>
      </Group>

      <div className="ml-auto flex items-center gap-1">
        <span className="muted inline-flex items-center gap-1">
          <Download className="h-3.5 w-3.5" /> Export
        </span>
        <ExportBtn onClick={() => onExport('png')}>PNG</ExportBtn>
        <ExportBtn onClick={() => onExport('svg')}>SVG</ExportBtn>
        <ExportBtn onClick={() => onExport('pdf')}>PDF</ExportBtn>
        <ExportBtn onClick={() => onExport('html')}>HTML</ExportBtn>
      </div>
    </div>
  );
}

function Group({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-1">
      <span className="inline-flex items-center gap-1 muted">
        {icon}
        <span>{label}</span>
      </span>
      <span className="h-4 w-px bg-[rgb(var(--border))]" />
      {children}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-1.5 py-0.5 text-[11px]"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function ExportBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-0.5 text-[11px] font-medium hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-900/40 dark:hover:text-brand-100"
    >
      {children}
    </button>
  );
}
