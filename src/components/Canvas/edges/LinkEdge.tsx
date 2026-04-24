'use client';

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  type EdgeProps,
} from '@xyflow/react';
import type { LinkEdgeData } from '@/lib/transform/toGraph';
import type { EdgePathType, EdgeColorMode } from '@/lib/canvasSettings';

const TYPE_COLORS: Record<string, string> = {
  l2: '#0f766e',
  l3: '#1f5ee6',
  lacp: '#be123c',
  trunk: '#7c3aed',
  access: '#0ea5e9',
};

export type LinkEdgePathData = LinkEdgeData & {
  pathType?: EdgePathType;
  colorMode?: EdgeColorMode;
  monoColor?: string;
};

function pathFor(type: EdgePathType | undefined, args: Parameters<typeof getBezierPath>[0]) {
  switch (type) {
    case 'straight':
      return getStraightPath(args);
    case 'step':
      return getSmoothStepPath({ ...args, borderRadius: 0 });
    case 'smoothstep':
      return getSmoothStepPath({ ...args, borderRadius: 14 });
    case 'bezier':
    default:
      return getBezierPath(args);
  }
}

export function LinkEdge(props: EdgeProps) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    selected,
    style,
    animated,
  } = props;

  const d = data as LinkEdgePathData | undefined;
  const [edgePath, labelX, labelY] = pathFor(d?.pathType, {
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const colorMode = d?.colorMode ?? 'type';
  const typeColor = d?.type ? TYPE_COLORS[d.type] ?? '#64748b' : '#64748b';
  const stroke = colorMode === 'mono' ? d?.monoColor ?? '#64748b' : typeColor;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke,
          strokeWidth: selected ? 3 : 1.8,
          strokeDasharray: animated ? '6 4' : undefined,
          ...style,
        }}
        interactionWidth={18}
      />
      {(d?.aInterface || d?.bInterface) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'none',
            }}
            className="select-none rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-1.5 py-0.5 text-[10px] font-mono text-[rgb(var(--fg))] shadow-sm"
          >
            {d?.aInterface}
            {d?.aInterface && d?.bInterface ? ' ↔ ' : ''}
            {d?.bInterface}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
