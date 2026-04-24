import yaml from 'js-yaml';
import { ZodError } from 'zod';
import {
  ContainerLabTopology,
  NetWeaveTopology,
  type NormalizedTopology,
  type InterfaceKind,
  type LinkType,
  type DeviceType,
} from './schema';
import { detectFormat } from './detect';

export type ParseResult =
  | { ok: true; topology: NormalizedTopology }
  | { ok: false; error: string; details?: string[] };

export function parseTopologyYaml(source: string): ParseResult {
  let doc: unknown;
  try {
    doc = yaml.load(source);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Invalid YAML' };
  }
  if (doc === null || doc === undefined) {
    return { ok: false, error: 'Empty document' };
  }

  const format = detectFormat(doc);
  if (format === 'netweave') {
    const parsed = NetWeaveTopology.safeParse(doc);
    if (!parsed.success) return zodFailure('NetWeave schema validation failed', parsed.error);
    return { ok: true, topology: normalizeNetWeave(parsed.data) };
  }

  if (format === 'containerlab') {
    const parsed = ContainerLabTopology.safeParse(doc);
    if (!parsed.success) return zodFailure('ContainerLab schema validation failed', parsed.error);
    return { ok: true, topology: normalizeContainerLab(parsed.data) };
  }

  return {
    ok: false,
    error: 'Unrecognised topology format — expected `apiVersion: netweave.io/v1` or `topology:` root key.',
  };
}

function zodFailure(summary: string, err: ZodError): ParseResult {
  return {
    ok: false,
    error: summary,
    details: err.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`),
  };
}

function normalizeNetWeave(
  t: ReturnType<typeof NetWeaveTopology.parse>,
): NormalizedTopology {
  return {
    source: 'netweave',
    metadata: t.metadata,
    devices: t.devices.map((d) => ({
      hostname: d.hostname,
      type: d.type,
      role: d.role,
      interfaces: d.interfaces.map((i) => ({
        name: i.name,
        kind: i.kind,
        ipv4: i.ipv4,
        ipv6: i.ipv6,
        members: i.members,
        description: i.description,
        vlan: i.vlan,
      })),
      protocols: d.protocols,
    })),
    links: t.links.map((l) => ({
      a: l.a,
      b: l.b,
      type: l.type,
      description: l.description,
    })),
  };
}

/* -----------------------------------------------------------------------------
 * ContainerLab normalisation
 * -------------------------------------------------------------------------- */

const CLAB_KIND_TO_TYPE: Record<string, DeviceType> = {
  'srl': 'l3-switch',
  'nokia_srlinux': 'l3-switch',
  'ceos': 'l3-switch',
  'arista_ceos': 'l3-switch',
  'crpd': 'router',
  'juniper_crpd': 'router',
  'vr-xrv': 'router',
  'vr-csr': 'router',
  'vr-veos': 'l3-switch',
  'vr-vmx': 'router',
  'vr-vsrx': 'firewall',
  'linux': 'server',
  'host': 'server',
  'bridge': 'l2-switch',
  'ovs-bridge': 'l2-switch',
  'checkpoint_cloudguard': 'firewall',
  'paloalto_panos': 'firewall',
  'f5_tmos': 'load-balancer',
};

function clabKindToType(kind?: string, image?: string): DeviceType {
  if (kind) {
    const k = kind.toLowerCase();
    if (CLAB_KIND_TO_TYPE[k]) return CLAB_KIND_TO_TYPE[k];
  }
  if (image) {
    const img = image.toLowerCase();
    if (img.includes('srlinux')) return 'l3-switch';
    if (img.includes('ceos')) return 'l3-switch';
    if (img.includes('nxos')) return 'l3-switch';
    if (img.includes('vmx') || img.includes('xrv')) return 'router';
    if (img.includes('asa') || img.includes('panos') || img.includes('vsrx')) return 'firewall';
  }
  return 'router';
}

/**
 * ContainerLab link endpoints are "nodeName:interfaceName" strings.
 * We split them and infer a sensible default link type.
 */
function parseClabEndpoint(ep: string): { device: string; interface: string } {
  const idx = ep.indexOf(':');
  if (idx === -1) return { device: ep, interface: 'eth0' };
  return { device: ep.slice(0, idx), interface: ep.slice(idx + 1) };
}

function normalizeContainerLab(
  t: ReturnType<typeof ContainerLabTopology.parse>,
): NormalizedTopology {
  const devices = Object.entries(t.topology.nodes).map(([hostname, n]) => {
    const mgmtInterfaces: NormalizedTopology['devices'][number]['interfaces'] = [];
    if (n.mgmt_ipv4 || n.mgmt_ipv6) {
      mgmtInterfaces.push({
        name: 'mgmt0',
        kind: 'l3' as InterfaceKind,
        ipv4: n.mgmt_ipv4,
        ipv6: n.mgmt_ipv6,
        description: 'management',
      });
    }
    return {
      hostname,
      type: clabKindToType(n.kind, n.image),
      role: n.group,
      interfaces: mgmtInterfaces,
      protocols: undefined,
    };
  });

  // Seed interfaces from link endpoints so the canvas has handles to draw to.
  const seen = new Map<string, Set<string>>();
  const ensureInterface = (dev: string, iface: string) => {
    let s = seen.get(dev);
    if (!s) {
      s = new Set();
      seen.set(dev, s);
    }
    if (s.has(iface)) return;
    s.add(iface);
    const d = devices.find((x) => x.hostname === dev);
    if (d && !d.interfaces.some((i) => i.name === iface)) {
      d.interfaces.push({ name: iface, kind: 'l2' });
    }
  };

  const links = t.topology.links.map((l) => {
    const a = parseClabEndpoint(l.endpoints[0]);
    const b = parseClabEndpoint(l.endpoints[1]);
    ensureInterface(a.device, a.interface);
    ensureInterface(b.device, b.interface);
    return { a, b, type: 'l2' as LinkType };
  });

  return {
    source: 'containerlab',
    metadata: { name: t.name ?? 'containerlab-topology' },
    devices,
    links,
  };
}
