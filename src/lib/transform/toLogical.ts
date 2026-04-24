import type { Edge, Node } from '@xyflow/react';
import type { NormalizedTopology } from '../yaml/schema';
import type { DeviceNodeData, LinkEdgeData, TopologyGraph } from './toGraph';

/**
 * Builds a "logical" graph. Compared to the physical graph:
 *   - parallel links between the same two devices are collapsed into one edge
 *     with a count badge
 *   - only L3-relevant interfaces (l3, svi, loopback, subif) remain visible on
 *     the node body; L2 ports are hidden
 *   - edges attach to generic "north/south/east/west" handles rather than
 *     per-interface handles, since interface-level detail isn't the point
 *     in a logical view
 *   - BGP sessions drawn as dashed overlay edges with AS labels
 */
export function toLogicalGraph(topology: NormalizedTopology): TopologyGraph {
  const nodes: Node<DeviceNodeData>[] = topology.devices.map((d) => {
    const logicalInterfaces = d.interfaces.filter((i) =>
      ['l3', 'svi', 'loopback', 'subif'].includes(i.kind),
    );
    return {
      id: d.hostname,
      type: 'device',
      position: { x: 0, y: 0 },
      data: {
        hostname: d.hostname,
        type: d.type,
        role: d.role,
        interfaces: logicalInterfaces,
        protocols: d.protocols,
        view: 'logical',
      },
    };
  });

  const seenPair = new Map<string, { count: number; type: NormalizedTopology['links'][number]['type'] }>();
  const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

  for (const l of topology.links) {
    const key = pairKey(l.a.device, l.b.device);
    const existing = seenPair.get(key);
    if (existing) existing.count += 1;
    else seenPair.set(key, { count: 1, type: l.type });
  }

  const edges: Edge<LinkEdgeData>[] = [];
  let idx = 0;
  for (const [key, info] of seenPair.entries()) {
    const [src, tgt] = key.split('|');
    edges.push({
      id: `logical-${idx++}-${src}-${tgt}`,
      source: src,
      target: tgt,
      type: 'link',
      data: {
        aInterface: info.count > 1 ? `${info.count}×` : '',
        bInterface: '',
        type: info.type,
      },
    });
  }

  // BGP overlay edges — one per neighbor where the peer IP is an interface of another device.
  const ipToDevice = new Map<string, string>();
  for (const d of topology.devices) {
    for (const i of d.interfaces) {
      if (i.ipv4) ipToDevice.set(i.ipv4.split('/')[0], d.hostname);
    }
  }

  for (const d of topology.devices) {
    const bgp = d.protocols?.bgp;
    if (!bgp?.neighbors) continue;
    for (const n of bgp.neighbors) {
      const peerDev = ipToDevice.get(n.peer);
      if (!peerDev || peerDev === d.hostname) continue;
      edges.push({
        id: `bgp-${d.hostname}-${peerDev}-${n.remote_as}`,
        source: d.hostname,
        target: peerDev,
        type: 'link',
        animated: true,
        style: { strokeDasharray: '6 4' },
        data: {
          aInterface: `AS${bgp.asn}`,
          bInterface: `AS${n.remote_as}`,
          type: 'l3',
          description: 'BGP',
        },
      });
    }
  }

  return { nodes, edges };
}
