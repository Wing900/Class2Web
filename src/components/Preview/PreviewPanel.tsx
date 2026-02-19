import { useRef, useState, useEffect } from 'react';
import { usePreviewSync } from '../../hooks/usePreviewSync';
import type { SlideFont } from '../../types/presentation';
import './PreviewPanel.css';

interface PreviewPanelProps {
  html: string;
  theme: string;
  currentSlide: number;
  slideFont: SlideFont;
  customThemeCSS: string;
  transition: string;
}

export default function PreviewPanel({ html, theme, currentSlide, slideFont, customThemeCSS, transition }: PreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const slideRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const previewSrc = `${import.meta.env.BASE_URL}preview.html`;
  const { handleLoad } = usePreviewSync({
    iframeRef,
    html,
    theme,
    currentSlide,
    slideFont,
    customThemeCSS,
    transition,
  });

  useEffect(() => {
    const el = slideRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / 1280);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="preview-panel">
      <div className="preview-panel__slide" ref={slideRef}>
        <iframe
          ref={iframeRef}
          className="preview-panel__iframe"
          src={previewSrc}
          title="C2W 预览"
          sandbox="allow-scripts allow-same-origin"
          onLoad={handleLoad}
          style={{ transform: `scale(${scale})` }}
        />
      </div>
    </div>
  );
}
