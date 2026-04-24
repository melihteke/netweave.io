'use client';

import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import type { GroupShape } from '@/lib/canvasSettings';

export type GroupOverlayData = {
  kind: 'ospf' | 'bgp';
  label: string;
  sublabel?: string;
  shape: GroupShape;
  color: string;
  width: number;
  height: number;
};

function GroupOverlayInner({ data }: NodeProps) {
  const d = data as unknown as GroupOverlayData;
  const isCircle = d.shape === 'circle';
  const radius = d.shape === 'rectangle' ? 0 : d.shape === 'rounded' ? 24 : 0;

  return (
    <div
      className="pointer-events-none relative"
      style={{ width: d.width, height: d.height }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: isCircle ? '50%' : radius,
          background: `${d.color}1f`,
          border: `1.5px dashed ${d.color}`,
        }}
      />
      <div
        className="absolute left-3 top-2 flex items-center gap-2 rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-tight"
        style={{ background: d.color, color: '#ffffff' }}
      >
        <span>{d.label}</span>
        {d.sublabel ? (
          <span className="text-[10px] opacity-80 font-normal">· {d.sublabel}</span>
        ) : null}
      </div>
    </div>
  );
}

export const GroupOverlayNode = memo(GroupOverlayInner);
