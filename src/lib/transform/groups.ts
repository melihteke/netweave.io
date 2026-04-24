import type { NormalizedTopology } from '../yaml/schema';

export type GroupDef = {
  id: string;
  kind: 'ospf' | 'bgp';
  label: string;
  sublabel?: string;
  members: string[];
};

/**
 * Compute group sets for logical view overlays.
 *   - OSPF: one group per (process, area.id) across devices that list that area.
 *   - BGP: one group per unique ASN across devices.
 * Groups with a single member are still included so the visual remains stable.
 */
export function computeGroups(topology: NormalizedTopology): GroupDef[] {
  const groups: GroupDef[] = [];

  // OSPF areas
  const ospfAreaMap = new Map<string, { area: string | number; members: Set<string> }>();
  for (const d of topology.devices) {
    const ospf = d.protocols?.ospf;
    if (!ospf?.areas?.length) continue;
    for (const a of ospf.areas) {
      const key = `ospf-area-${a.id}`;
      const entry = ospfAreaMap.get(key) ?? { area: a.id, members: new Set<string>() };
      entry.members.add(d.hostname);
      ospfAreaMap.set(key, entry);
    }
  }
  for (const [id, { area, members }] of ospfAreaMap) {
    groups.push({
      id,
      kind: 'ospf',
      label: `OSPF Area ${area}`,
      sublabel: `${members.size} device${members.size === 1 ? '' : 's'}`,
      members: [...members],
    });
  }

  // IS-IS (fallback: group by level)
  const isisMap = new Map<string, Set<string>>();
  for (const d of topology.devices) {
    const level = d.protocols?.isis?.level;
    if (!level) continue;
    const key = `isis-L${level}`;
    const set = isisMap.get(key) ?? new Set<string>();
    set.add(d.hostname);
    isisMap.set(key, set);
  }
  for (const [id, members] of isisMap) {
    groups.push({
      id,
      kind: 'ospf',
      label: `IS-IS Level ${id.slice(-1)}`,
      sublabel: `${members.size} device${members.size === 1 ? '' : 's'}`,
      members: [...members],
    });
  }

  // BGP ASNs
  const bgpAsMap = new Map<number, Set<string>>();
  for (const d of topology.devices) {
    const asn = d.protocols?.bgp?.asn;
    if (!asn) continue;
    const set = bgpAsMap.get(asn) ?? new Set<string>();
    set.add(d.hostname);
    bgpAsMap.set(asn, set);
  }
  for (const [asn, members] of bgpAsMap) {
    groups.push({
      id: `bgp-as-${asn}`,
      kind: 'bgp',
      label: `AS ${asn}`,
      sublabel: `${members.size} device${members.size === 1 ? '' : 's'}`,
      members: [...members],
    });
  }

  return groups;
}
