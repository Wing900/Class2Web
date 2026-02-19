const CSS_FILES = [
  'c2w-engine/nord.css',
  'c2w-engine/base.css',
  'c2w-engine/layouts.css',
  'c2w-engine/grid.css',
];

const REVEAL_CSS_FILES = [
  'reveal/reset.css',
  'reveal/reveal.css',
  'reveal/plugin/highlight/monokai.css',
];

import { resolveImages } from './imageStore';
import type { SlideFont } from '../types/presentation';

const FONT_MAP: Record<SlideFont, string> = {
  modern: "'Inter', 'Noto Sans SC', 'Microsoft YaHei', sans-serif",
  wenkai: "'LXGW WenKai', 'Microsoft YaHei', sans-serif",
  serif:  "'Noto Serif SC', 'Georgia', 'SimSun', serif",
};

const FONT_CDN_LINKS = `
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/style.css" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Noto+Sans+SC:wght@400;600;700;800&family=Noto+Serif+SC:wght@400;600;700&display=swap">`;

function resolveAssetPath(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const normalizedPath = path.replace(/^\/+/, '');
  return `${normalizedBase}${normalizedPath}`;
}

async function fetchText(path: string): Promise<string> {
  const url = resolveAssetPath(path);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${path} (${res.status})`);
  }
  return res.text();
}

export async function exportHTML(
  sectionsHTML: string,
  theme: string,
  slideFont: SlideFont = 'modern',
  customThemeCSS: string = '',
  transition: string = 'slide',
): Promise<void> {
  // Resolve c2w-img:// → base64 dataURL for offline export
  const resolvedHTML = resolveImages(sectionsHTML);
  let c2wCSS = '';
  let revealCSS = '';
  let revealJS = '';
  let highlightJS = '';

  try {
    // Fetch all CSS and JS in parallel
    [c2wCSS, revealCSS, revealJS, highlightJS] = await Promise.all([
      Promise.all(CSS_FILES.map(fetchText)).then((arr) => arr.join('\n')),
      Promise.all(REVEAL_CSS_FILES.map(fetchText)).then((arr) => arr.join('\n')),
      fetchText('reveal/reveal.js'),
      fetchText('reveal/plugin/highlight/highlight.js'),
    ]);
  } catch (error) {
    console.error('Export failed to load assets.', error);
    window.alert('导出失败：资源加载失败，请刷新页面后重试。');
    return;
  }

  // Extract title from first h1
  const titleMatch = resolvedHTML.match(/<h1[^>]*>(.*?)<\/h1>/);
  const defaultTitle = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : '未命名课件';

  const fileName = window.prompt('导出文件名：', defaultTitle);
  if (!fileName) return; // 用户取消

  const themeAttr = theme === 'nord-dark' ? ' data-theme="nord-dark"' : '';

  const ff = FONT_MAP[slideFont] || FONT_MAP.modern;
  const fontOverrideCSS =
    `.reveal { font-family: ${ff}; }\n` +
    `.reveal h1, .reveal h2, .reveal h3 { font-family: ${ff}; }`;

  const fullHTML = `<!DOCTYPE html>
<html lang="zh-CN"${themeAttr}>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(fileName)}</title>
${FONT_CDN_LINKS}
  <style>
/* Page layout: centered 16:9 box */
html, body {
  width: 100%; height: 100%; margin: 0; padding: 0;
  background: #1a1a2e;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}
.reveal-wrapper {
  width: 92vw;
  max-width: calc(88vh * 16 / 9);
  aspect-ratio: 16 / 9;
  box-shadow: 0 8px 48px rgba(0,0,0,0.5);
  border-radius: 6px;
  overflow: hidden;
  position: relative;
}
/* Fullscreen: keep 16:9 centered, black bars around */
.reveal-wrapper:fullscreen,
.reveal-wrapper:-webkit-full-screen {
  max-width: none;
  width: min(100vw, calc(100vh * 16 / 9));
  height: min(100vh, calc(100vw * 9 / 16));
  margin: auto;
  border-radius: 0; box-shadow: none;
}
.reveal-wrapper::backdrop { background: #000; }
.reveal-wrapper::-webkit-backdrop { background: #000; }
.reveal-wrapper:fullscreen .c2w-fs-btn,
.reveal-wrapper:-webkit-full-screen .c2w-fs-btn { display: none; }
/* Fullscreen button */
.c2w-fs-btn {
  position: absolute; top: 12px; right: 12px; z-index: 100;
  background: rgba(0,0,0,0.45); color: #fff; border: none;
  border-radius: 8px; padding: 6px 14px; font-size: 13px;
  cursor: pointer; opacity: 0; transition: opacity 0.25s;
  backdrop-filter: blur(4px);
}
.reveal-wrapper:hover .c2w-fs-btn { opacity: 1; }
.c2w-fs-btn:hover { background: rgba(0,0,0,0.65); }
/* Reveal container must fill wrapper for embedded mode */
.reveal-wrapper .reveal { width: 100%; height: 100%; }
.reveal .slides section { box-sizing: border-box; overflow: hidden; }
/* Reveal.js */
${revealCSS}
/* C2W Engine */
${c2wCSS}
/* Font override */
${fontOverrideCSS}
/* Custom theme */
${customThemeCSS}
  </style>
</head>
<body>
  <div class="reveal-wrapper" id="revealWrapper">
    <button class="c2w-fs-btn" id="fsBtn" title="全屏 (F)">&#9974; 全屏</button>
    <div class="reveal">
      <div class="slides">
${resolvedHTML}
      </div>
    </div>
  </div>

  <script>
// MathJax 3 configuration
window.MathJax = {
  tex: {
    inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
    displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
  },
  options: {
    skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre'],
  },
  startup: { typeset: true }
};
  </script>
  <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js"><\/script>

  <script>
// Reveal.js (UMD)
${revealJS}
  </script>
  <script>
// Reveal.js Highlight Plugin
${highlightJS}
  </script>
  <script>
var wrapper = document.getElementById('revealWrapper');

Reveal.initialize({
  embedded: true,
  hash: true,
  center: true,
  controls: true,
  progress: true,
  slideNumber: true,
  transition: '${transition}',
  width: 1280,
  height: 720,
  margin: 0.04,
  plugins: [RevealHighlight]
}).then(function() {
  // Auto-focus so keyboard works immediately
  wrapper.querySelector('.reveal').focus();
});

// Fullscreen button
document.getElementById('fsBtn').addEventListener('click', function() {
  if (wrapper.requestFullscreen) wrapper.requestFullscreen();
  else if (wrapper.webkitRequestFullscreen) wrapper.webkitRequestFullscreen();
});

// Press F to toggle fullscreen
document.addEventListener('keydown', function(e) {
  if (e.key === 'f' || e.key === 'F') {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    } else {
      if (wrapper.requestFullscreen) wrapper.requestFullscreen();
      else if (wrapper.webkitRequestFullscreen) wrapper.webkitRequestFullscreen();
    }
  }
});
  </script>
</body>
</html>`;

  // Trigger download
  const blob = new Blob([fullHTML], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName.replace(/[/\\?%*:|"<>]/g, '_')}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeHTML(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
