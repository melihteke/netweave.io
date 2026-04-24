'use client';

import { X, Link2 } from 'lucide-react';
import type { NormalizedTopology } from '@/lib/yaml/schema';

export type SelectedLink = {
  a: { device: string; interface: string };
  b: { device: string; interface: string };
  type: string;
  description?: string;
};

export function LinkDetails({
  link,
  topology,
  onClose,
}: {
  link: SelectedLink;
  topology: NormalizedTopology | null;
  onClose: () => void;
}) {
  const devA = topology?.devices.find((d) => d.hostname === link.a.device);
  const devB = topology?.devices.find((d) => d.hostname === link.b.device);
  const ifA = devA?.interfaces.find((i) => i.name === link.a.interface);
  const ifB = devB?.interfaces.find((i) => i.name === link.b.interface);

  return (
    <aside className="absolute right-3 top-3 z-20 w-[320px] max-w-[calc(100%-24px)] rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] shadow-card">
      <div className="flex items-center justify-between border-b border-[rgb(var(--border))] px-3 py-2">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Link2 className="h-3.5 w-3.5 accent" />
          Link details
          <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium uppercase text-brand-800 dark:bg-brand-900/40 dark:text-brand-100">
            {link.type}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-md p-1 muted hover:bg-[rgb(var(--border))]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 divide-x divide-[rgb(var(--border))] text-xs">
        <EndpointPane
          title="A-side"
          device={link.a.device}
          iface={link.a.interface}
          ipv4={ifA?.ipv4}
          ipv6={ifA?.ipv6}
          kind={ifA?.kind}
          members={ifA?.members}
          description={ifA?.description}
          deviceType={devA?.type}
          deviceRole={devA?.role}
        />
        <EndpointPane
          title="B-side"
          device={link.b.device}
          iface={link.b.interface}
          ipv4={ifB?.ipv4}
          ipv6={ifB?.ipv6}
          kind={ifB?.kind}
          members={ifB?.members}
          description={ifB?.description}
          deviceType={devB?.type}
          deviceRole={devB?.role}
        />
      </div>

      {link.description ? (
        <div className="border-t border-[rgb(var(--border))] px-3 py-2 text-xs">
          <div className="muted">Description</div>
          <div>{link.description}</div>
        </div>
      ) : null}
    </aside>
  );
}

function EndpointPane(props: {
  title: string;
  device: string;
  iface: string;
  ipv4?: string;
  ipv6?: string;
  kind?: string;
  members?: string[];
  description?: string;
  deviceType?: string;
  deviceRole?: string;
}) {
  return (
    <div className="px-3 py-2 space-y-1">
      <div className="muted uppercase text-[10px] tracking-wide">{props.title}</div>
      <div className="font-semibold text-sm truncate" title={props.device}>
        {props.device}
      </div>
      <div className="muted text-[11px]">
        {props.deviceType}
        {props.deviceRole ? ` · ${props.deviceRole}` : ''}
      </div>
      <Row label="Interface" value={props.iface} mono />
      {props.kind ? <Row label="Kind" value={props.kind} /> : null}
      {props.ipv4 ? <Row label="IPv4" value={props.ipv4} mono /> : null}
      {props.ipv6 ? <Row label="IPv6" value={props.ipv6} mono /> : null}
      {props.members?.length ? (
        <Row label="Members" value={props.members.join(', ')} mono />
      ) : null}
      {props.description ? <Row label="Desc" value={props.description} /> : null}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="muted">{label}</span>
      <span
        className={[
          'text-right break-all',
          mono ? 'font-mono text-[11px]' : '',
        ].join(' ')}
      >
        {value}
      </span>
    </div>
  );
}
