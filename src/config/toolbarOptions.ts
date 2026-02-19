import type { SlideFont } from '../types/presentation';

export interface FontOption {
  value: SlideFont;
  label: string;
  desc: string;
}

export const DEFAULT_SLIDE_FONT: SlideFont = 'modern';

export const FONT_OPTIONS: FontOption[] = [
  { value: 'modern', label: '现代科技', desc: 'Inter / 思源黑体' },
  { value: 'wenkai', label: '手写文楷', desc: '霞鹜文楷' },
  { value: 'serif', label: '学术衬线', desc: 'Noto Serif SC' },
];
