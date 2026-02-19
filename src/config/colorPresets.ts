import type { ColorPreset } from '../types/theme';

export const COLOR_PRESETS: ColorPreset[] = [
  { name: '奶油黄', hue: 40, display: '#E8D5A8' },
  { name: '樱花粉', hue: 350, display: '#E8B4BC' },
  { name: '薄荷绿', hue: 155, display: '#A0D8BE' },
  { name: '天空蓝', hue: 210, display: '#A8C4E4' },
  { name: '薰衣紫', hue: 275, display: '#C8B0E0' },
  { name: '蜜桃橘', hue: 22, display: '#E8C4A4' },
];

export function getColorPresetName(hue: number | null): string {
  if (hue === null) return 'Nord';
  return COLOR_PRESETS.find((preset) => preset.hue === hue)?.name ?? '自定';
}
