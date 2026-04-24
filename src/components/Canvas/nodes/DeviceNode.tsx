'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { STENCILS, stencilUrl } from '@/lib/stencils/manifest';
import type { DeviceNodeData } from '@/lib/transform/toGraph';

function DeviceNodeInner({ data, selected }: NodeProps) {
  // React Flow's `NodeProps` uses `Record<string, unknown>` for data; coerce.
  const d = data as unknown as DeviceNodeData;
  const stencil = STENCILS[d.type];

  return (
    <div
      className={[
        'w-[220px] rounded-xl panel shadow-card px-3 pt-3 pb-2 select-none',
        selected ? 'ring-2 ring-brand-500' : '',
      ].join(' ')}
    >
      <div className="flex items-start gap-2">
        <img
          src={stencilUrl(d.type)}
          alt={stencil.label}
          className="h-12 w-12 shrink-0"
          draggable={false}
        />
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate" title={d.hostname}>
            {d.hostname}
          </div>
          <div className="text-[11px] muted">{stencil.label}</div>
          {d.role ? (
            <div className="text-[11px] muted truncate" title={d.role}>
              {d.role}
            </div>
          ) : null}
        </div>
      </div>

      {d.interfaces.length > 0 ? (
        <ul className="mt-2 space-y-0.5 text-[11px] font-mono leading-tight">
          {d.interfaces.slice(0, 6).map((i) => (
            <li key={i.name} className="flex justify-between gap-2">
              <span className="truncate" title={i.name}>
                {i.name}
              </span>
              <span className="muted truncate">{i.ipv4 ?? i.ipv6 ?? i.kind}</span>
            </li>
          ))}
          {d.interfaces.length > 6 ? (
            <li className="muted">+{d.interfaces.length - 6} more</li>
          ) : null}
        </ul>
      ) : null}

      {d.protocols?.bgp?.asn ? (
        <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-800 dark:bg-brand-900/40 dark:text-brand-100">
          AS{d.protocols.bgp.asn}
        </div>
      ) : null}

      {/* Per-interface handles (physical view) */}
      {d.view === 'physical'
        ? d.interfaces.map((i, idx) => {
            const total = d.interfaces.length || 1;
            const top = ((idx + 0.5) / total) * 100;
            return (
              <Handle
                key={`src-${i.name}`}
                id={`if-${i.name}`}
                type="source"
                position={Position.Right}
                style={{ top: `${top}%`, background: 'transparent', border: 'none', width: 6, height: 6 }}
              />
            );
          })
        : null}
      {d.view === 'physical'
        ? d.interfaces.map((i, idx) => {
            const total = d.interfaces.length || 1;
            const top = ((idx + 0.5) / total) * 100;
            return (
              <Handle
                key={`tgt-${i.name}`}
                id={`if-${i.name}`}
                type="target"
                position={Position.Left}
                style={{ top: `${top}%`, background: 'transparent', border: 'none', width: 6, height: 6 }}
              />
            );
          })
        : null}

      {/* Generic handles for logical view / fallback */}
      <Handle type="source" position={Position.Bottom} id="g-s" style={{ background: 'transparent', border: 'none' }} />
      <Handle type="target" position={Position.Top} id="g-t" style={{ background: 'transparent', border: 'none' }} />
    </div>
  );
}

export const DeviceNode = memo(DeviceNodeInner);
