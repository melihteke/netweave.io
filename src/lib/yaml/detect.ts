/**
 * Detects whether a parsed YAML document represents a native NetWeave topology
 * or a ContainerLab topology. The discriminator is the presence of a
 * `topology:` root key (ContainerLab) versus `apiVersion: netweave.io/v*`
 * (NetWeave).
 */
export type DetectedFormat = 'netweave' | 'containerlab' | 'unknown';

export function detectFormat(doc: unknown): DetectedFormat {
  if (!doc || typeof doc !== 'object') return 'unknown';
  const d = doc as Record<string, unknown>;
  if (typeof d.apiVersion === 'string' && d.apiVersion.startsWith('netweave.io/')) {
    return 'netweave';
  }
  if (d.topology && typeof d.topology === 'object') {
    return 'containerlab';
  }
  return 'unknown';
}
