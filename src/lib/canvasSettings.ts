export type EdgePathType = 'bezier' | 'straight' | 'step' | 'smoothstep';
export type LayoutDir = 'TB' | 'LR';
export type GroupShape = 'rounded' | 'rectangle' | 'circle';
export type EdgeColorMode = 'type' | 'mono';

export interface CanvasSettings {
  edgeType: EdgePathType;
  edgeColorMode: EdgeColorMode;
  edgeMonoColor: string;
  layoutDir: LayoutDir;
  groupShape: GroupShape;
  ospfColor: string;
  bgpColor: string;
}

export const DEFAULT_SETTINGS: CanvasSettings = {
  edgeType: 'smoothstep',
  edgeColorMode: 'type',
  edgeMonoColor: '#64748b',
  layoutDir: 'TB',
  groupShape: 'rounded',
  ospfColor: '#2dd4bf',
  bgpColor: '#f59e0b',
};

export const EDGE_TYPE_LABELS: Record<EdgePathType, string> = {
  bezier: 'Curved',
  straight: 'Straight',
  step: 'Orthogonal',
  smoothstep: 'Rounded orthogonal',
};

export const GROUP_SHAPE_LABELS: Record<GroupShape, string> = {
  rounded: 'Rounded rectangle',
  rectangle: 'Rectangle',
  circle: 'Circle / Ellipse',
};

export const LAYOUT_DIR_LABELS: Record<LayoutDir, string> = {
  TB: 'Vertical (top → bottom)',
  LR: 'Horizontal (left → right)',
};
