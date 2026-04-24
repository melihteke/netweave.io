'use client';

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { DeviceNode } from './nodes/DeviceNode';
import { GroupOverlayNode, type GroupOverlayData } from './nodes/GroupOverlayNode';
import { LinkEdge } from './edges/LinkEdge';
import { toPhysicalGraph } from '@/lib/transform/toGraph';
import { toLogicalGraph } from '@/lib/transform/toLogical';
import { computeGroups, type GroupDef } from '@/lib/transform/groups';
import { applyElkLayout } from '@/lib/layout/elk';
import { applyDagreLayout } from '@/lib/layout/dagre';
import type { NormalizedTopology } from '@/lib/yaml/schema';
import type { TopologyView } from './ViewToggle';
import type { CanvasSettings } from '@/lib/canvasSettings';
import type { SelectedLink } from './LinkDetails';

const nodeTypes = { device: DeviceNode, groupOverlay: GroupOverlayNode };
const edgeTypes = { link: LinkEdge };

const GROUP_PADDING = 36;

export type CanvasHandle = {
  getExportElement: () => HTMLElement | null;
};

type Props = {
  topology: NormalizedTopology | null;
  view: TopologyView;
  engine?: 'elk' | 'dagre';
  settings: CanvasSettings;
  onLinkSelect: (link: SelectedLink | null) => void;
};

export const TopologyCanvas = forwardRef<CanvasHandle, Props>(function TopologyCanvas(props, ref) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} forwardedRef={ref} />
    </ReactFlowProvider>
  );
});

function CanvasInner({
  topology,
  view,
  engine = 'elk',
  settings,
  onLinkSelect,
  forwardedRef,
}: Props & { forwardedRef: React.Ref<CanvasHandle> }) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  useImperativeHandle(forwardedRef, () => ({
    getExportElement: () =>
      (wrapperRef.current?.querySelector('.react-flow__viewport') as HTMLElement | null) ??
      wrapperRef.current,
  }));

  const baseGraph = useMemo(() => {
    if (!topology) return { nodes: [] as Node[], edges: [] as Edge[] };
    const g = view === 'physical' ? toPhysicalGraph(topology) : toLogicalGraph(topology);
    // Stamp edge path/color preferences into data so LinkEdge can render them.
    const edges = g.edges.map((e) => ({
      ...e,
      data: {
        ...(e.data ?? {}),
        pathType: settings.edgeType,
        colorMode: settings.edgeColorMode,
        monoColor: settings.edgeMonoColor,
      },
    }));
    return { nodes: g.nodes as Node[], edges: edges as Edge[] };
  }, [topology, view, settings.edgeType, settings.edgeColorMode, settings.edgeMonoColor]);

  const [nodes, setNodes, onNodesChange] = useNodesState(baseGraph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(baseGraph.edges);
  const [laying, setLaying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function layout() {
      setLaying(true);
      try {
        const laidDevices =
          engine === 'elk'
            ? await applyElkLayout(baseGraph.nodes, baseGraph.edges, settings.layoutDir)
            : applyDagreLayout(baseGraph.nodes, baseGraph.edges, settings.layoutDir);

        if (cancelled) return;

        const groupNodes: Node[] =
          view === 'logical' && topology
            ? buildGroupOverlayNodes(computeGroups(topology), laidDevices, settings)
            : [];

        const devicesWithZ = laidDevices.map((n) => ({ ...n, zIndex: 10 }));

        setNodes([...groupNodes, ...devicesWithZ]);
        setEdges(baseGraph.edges);
      } catch {
        if (cancelled) return;
        const fallback = applyDagreLayout(baseGraph.nodes, baseGraph.edges, settings.layoutDir);
        setNodes(fallback);
        setEdges(baseGraph.edges);
      } finally {
        if (!cancelled) setLaying(false);
      }
    }
    layout();
    return () => {
      cancelled = true;
    };
  }, [baseGraph, engine, settings.layoutDir, settings.groupShape, settings.ospfColor, settings.bgpColor, topology, view, setNodes, setEdges]);

  if (!topology) {
    return (
      <div ref={wrapperRef} className="flex h-full items-center justify-center p-6 text-center">
        <div className="max-w-sm">
          <div className="mb-1 text-sm font-semibold">No topology loaded</div>
          <p className="text-xs muted">
            Paste a NetWeave or ContainerLab YAML in the editor, or pick one from the{' '}
            <a className="accent underline" href="examples/">
              examples gallery
            </a>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        onEdgeClick={(_, edge) => {
          const d = edge.data as Record<string, unknown> | undefined;
          if (!d) return;
          onLinkSelect({
            a: { device: String(edge.source), interface: String(d.aInterface ?? '') },
            b: { device: String(edge.target), interface: String(d.bInterface ?? '') },
            type: String(d.type ?? 'l3'),
            description: d.description ? String(d.description) : undefined,
          });
        }}
        onPaneClick={() => onLinkSelect(null)}
      >
        <Background gap={24} size={1} />
        <Controls position="bottom-right" showInteractive={false} />
        <MiniMap position="bottom-left" pannable zoomable />
      </ReactFlow>
      {laying ? (
        <div className="pointer-events-none absolute left-3 top-3 rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1 text-[11px] muted shadow-sm">
          laying out…
        </div>
      ) : null}
    </div>
  );
}

const DEVICE_W = 220;
const DEVICE_H = 160;

function buildGroupOverlayNodes(groups: GroupDef[], deviceNodes: Node[], s: CanvasSettings): Node[] {
  const byId = new Map(deviceNodes.map((n) => [n.id, n]));
  return groups
    .map((g, idx) => {
      const pts = g.members
        .map((m) => byId.get(m))
        .filter((n): n is Node => !!n)
        .map((n) => ({
          x: n.position.x,
          y: n.position.y,
          w: (n.width as number | undefined) ?? DEVICE_W,
          h: (n.height as number | undefined) ?? DEVICE_H,
        }));
      if (!pts.length) return null;
      const minX = Math.min(...pts.map((p) => p.x)) - GROUP_PADDING;
      const minY = Math.min(...pts.map((p) => p.y)) - GROUP_PADDING - 12;
      const maxX = Math.max(...pts.map((p) => p.x + p.w)) + GROUP_PADDING;
      const maxY = Math.max(...pts.map((p) => p.y + p.h)) + GROUP_PADDING;
      const width = maxX - minX;
      const height = maxY - minY;
      const color = g.kind === 'bgp' ? s.bgpColor : s.ospfColor;

      const data: GroupOverlayData = {
        kind: g.kind,
        label: g.label,
        sublabel: g.sublabel,
        shape: s.groupShape,
        color,
        width,
        height,
      };

      return {
        id: `grp-${g.id}-${idx}`,
        type: 'groupOverlay',
        position: { x: minX, y: minY },
        data: data as unknown as Record<string, unknown>,
        draggable: false,
        selectable: false,
        focusable: false,
        zIndex: 0,
        style: { width, height, pointerEvents: 'none' },
      } as Node;
    })
    .filter((n): n is Node => !!n);
}
