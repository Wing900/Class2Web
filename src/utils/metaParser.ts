/* ============================================
   C2W — Metadata Parser
   解析 <!-- c2w ... --> 注释块中的元数据
   ============================================ */

export interface C2WMeta {
  colors: Record<string, string>;
  transition: string;
}

const COLOR_KEYS = new Set([
  'bg', 'bg-alt', 'text', 'text-light',
  'primary', 'accent', 'frost-light', 'frost-dark',
  'success', 'warning', 'danger', 'info',
  'polar-night', 'polar-night-light',
]);

const VALID_TRANSITIONS = new Set([
  'none', 'fade', 'slide', 'convex', 'concave', 'zoom',
]);

export function parseC2WMeta(html: string): C2WMeta {
  const meta: C2WMeta = { colors: {}, transition: 'slide' };

  const match = html.match(/<!--\s*c2w\b([\s\S]*?)-->/);
  if (!match) return meta;

  const lines = match[1].split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;

    const key = trimmed.slice(0, colonIdx).trim().toLowerCase();
    const value = trimmed.slice(colonIdx + 1).trim();
    if (!value) continue;

    if (COLOR_KEYS.has(key)) {
      meta.colors[`--c2w-${key}`] = value;
    } else if (key === 'transition' && VALID_TRANSITIONS.has(value)) {
      meta.transition = value;
    }
  }

  return meta;
}

export function metaToCSS(meta: C2WMeta): string {
  const entries = Object.entries(meta.colors);
  if (entries.length === 0) return '';
  const vars = entries.map(([k, v]) => `${k}: ${v};`).join(' ');
  return `:root { ${vars} }\n[data-theme="nord-dark"] { ${vars} }`;
}
