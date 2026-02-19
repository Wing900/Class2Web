/* ============================================
   C2W — Auto Theme Generator
   从一个色相值生成完整的柔和主题
   ============================================ */

/** HSL → Hex 转换 */
function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  const _s = Math.max(0, Math.min(100, s)) / 100;
  const _l = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * _l - 1)) * _s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = _l - c / 2;

  let r = 0, g = 0, b = 0;
  if (h < 60)       { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else              { r = c; b = x; }

  const hex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(b)}`.toUpperCase();
}

export interface ThemeColors {
  '--c2w-bg': string;
  '--c2w-bg-alt': string;
  '--c2w-text': string;
  '--c2w-text-light': string;
  '--c2w-primary': string;
  '--c2w-accent': string;
  '--c2w-frost-light': string;
  '--c2w-frost-dark': string;
  '--c2w-success': string;
  '--c2w-warning': string;
  '--c2w-danger': string;
  '--c2w-info': string;
  '--c2w-polar-night': string;
  '--c2w-polar-night-light': string;
}

/**
 * 根据色相生成浅色主题变量
 * 低饱和度 + 高明度 = 柔和可爱风
 */
function generateLight(hue: number, sf: number, lo: number): ThemeColors {
  const s = (v: number) => v * sf;
  const l = (v: number) => v + lo;
  return {
    '--c2w-bg':                hslToHex(hue, s(10), l(96)),
    '--c2w-bg-alt':            hslToHex(hue, s(14), l(91)),
    '--c2w-text':              hslToHex(hue, s(18), l(20)),
    '--c2w-text-light':        hslToHex(hue, s(14), l(42)),
    '--c2w-primary':           hslToHex(hue, s(34), l(56)),
    '--c2w-accent':            hslToHex(hue + 35, s(30), l(62)),
    '--c2w-frost-light':       hslToHex(hue - 20, s(26), l(64)),
    '--c2w-frost-dark':        hslToHex(hue + 15, s(32), l(50)),
    '--c2w-success':           hslToHex(135, s(28), l(56)),
    '--c2w-warning':           hslToHex(42, s(38), l(64)),
    '--c2w-danger':            hslToHex(355, s(36), l(58)),
    '--c2w-info':              hslToHex(280, s(26), l(62)),
    '--c2w-polar-night':       hslToHex(hue, s(14), l(18)),
    '--c2w-polar-night-light': hslToHex(hue, s(11), l(26)),
  };
}

/**
 * 根据色相生成深色主题变量
 */
function generateDark(hue: number, sf: number, lo: number): ThemeColors {
  const s = (v: number) => v * sf;
  const l = (v: number) => v + lo;
  return {
    '--c2w-bg':                hslToHex(hue, s(14), l(14)),
    '--c2w-bg-alt':            hslToHex(hue, s(11), l(22)),
    '--c2w-text':              hslToHex(hue, s(10), l(93)),
    '--c2w-text-light':        hslToHex(hue, s(12), l(78)),
    '--c2w-primary':           hslToHex(hue, s(36), l(64)),
    '--c2w-accent':            hslToHex(hue + 35, s(32), l(66)),
    '--c2w-frost-light':       hslToHex(hue - 20, s(28), l(66)),
    '--c2w-frost-dark':        hslToHex(hue + 15, s(32), l(56)),
    '--c2w-success':           hslToHex(135, s(28), l(60)),
    '--c2w-warning':           hslToHex(42, s(36), l(68)),
    '--c2w-danger':            hslToHex(355, s(34), l(62)),
    '--c2w-info':              hslToHex(280, s(26), l(64)),
    '--c2w-polar-night':       hslToHex(hue, s(14), l(14)),
    '--c2w-polar-night-light': hslToHex(hue, s(11), l(22)),
  };
}

function varsToCSS(vars: ThemeColors): string {
  return Object.entries(vars)
    .map(([k, v]) => `${k}: ${v};`)
    .join(' ');
}

/**
 * 生成完整的主题 CSS（同时包含浅色和深色变体）
 * 注入到 preview.html 的 <style> 中覆盖 nord.css 变量
 */
export function generateThemeCSS(hue: number, satPercent: number = 100, litOffset: number = 0): string {
  const sf = satPercent / 100;
  const light = varsToCSS(generateLight(hue, sf, litOffset));
  const dark = varsToCSS(generateDark(hue, sf, litOffset));
  return `:root { ${light} }\n[data-theme="nord-dark"] { ${dark} }`;
}
