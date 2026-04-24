# src/components/Canvas — React Flow Canvas

## What's here

- `TopologyCanvas.tsx` — wraps `ReactFlow` with `ReactFlowProvider`, owns
  layout application and loading state. Exposes `{ topology, view, engine }`.
- `ViewToggle.tsx` — segmented control for Physical vs Logical.
- `nodes/DeviceNode.tsx` — custom node: stencil + hostname + interface list +
  multi-handle ports for physical view, generic handles for logical view.
- `edges/LinkEdge.tsx` — custom edge: bezier path + per-link-type colour +
  inline label renderer showing `"aInterface ↔ bInterface"`.

## How a YAML becomes pixels

```
YAML
  → parseTopologyYaml            (src/lib/yaml/parse.ts)
  → NormalizedTopology
  → toPhysicalGraph / toLogicalGraph   (src/lib/transform/*)
  → { nodes, edges }             (positions still 0,0)
  → applyElkLayout / applyDagreLayout  (src/lib/layout/*)
  → positioned nodes
  → ReactFlow with nodeTypes={device} edgeTypes={link}
```

## Adding a node type

Today `nodeTypes` only maps `'device'`. If you need something different
(e.g. a grouping box for OSPF areas or a legend node):

1. Create `nodes/<Name>.tsx`, export a memoised component.
2. Register it in `TopologyCanvas.tsx`'s `nodeTypes`.
3. Teach the relevant transform (`toPhysicalGraph` or `toLogicalGraph`) to
   emit nodes with that `type`.

## Adding an edge variant

Edge type is a single key today (`'link'`). If you need a visually distinct
overlay (e.g. BGP sessions drawn differently), prefer:

1. Continue emitting `type: 'link'` but pass a discriminator in `data`
   (e.g. `data.kind: 'bgp'`).
2. Branch on that in `LinkEdge.tsx` to pick stroke, dash, colour.

Only add a new `edgeTypes` entry if the component truly needs a different
component shape — not just different styling.

## Handles

- **Physical view** — each interface on the node renders a hidden handle on
  the left (target) and right (source) edges, positioned by index. Edges
  reference them by id `if-<interface-name>`.
- **Logical view** — only generic top/bottom handles are used. Edges attach
  there and ELK/dagre layout picks clean routes.

## Layout engines

- `applyElkLayout` is async and runs in a web worker internally. It's the
  default because it produces nicer layered results for fabrics.
- `applyDagreLayout` is synchronous and much faster for very large graphs.
- `TopologyCanvas` falls back to dagre automatically if ELK throws.

## Don'ts

- Don't mutate `graph.nodes` or `graph.edges` from the canvas — they come
  from YAML via the transform. Treat them as read-only.
- Don't fetch at render time. Keep the canvas a pure function of
  `{ topology, view, engine }`.
