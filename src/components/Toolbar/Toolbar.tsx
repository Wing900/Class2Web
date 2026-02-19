import { useState, useRef, useEffect } from 'react';
import { FONT_OPTIONS } from '../../config/toolbarOptions';
import type { SlideFont } from '../../types/presentation';
import './Toolbar.css';

interface ToolbarProps {
  theme: string;
  nightMode: boolean;
  slideFont: SlideFont;
  workspaceOpen: boolean;
  onThemeChange: (theme: string) => void;
  onNightModeChange: (on: boolean) => void;
  onSlideFontChange: (font: SlideFont) => void;
  onToggleInstructions: () => void;
  onToggleWorkspace: () => void;
  onExport: () => void;
}

export default function Toolbar({
  theme,
  nightMode,
  slideFont,
  workspaceOpen,
  onThemeChange,
  onNightModeChange,
  onSlideFontChange,
  onToggleInstructions,
  onToggleWorkspace,
  onExport,
}: ToolbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  return (
    <div className="toolbar">
      <div className="toolbar__logo">Class2Web</div>
      <div className="toolbar__spacer" />

      <button
        className={`toolbar__icon ${workspaceOpen ? 'toolbar__icon--active' : ''}`}
        onClick={onToggleWorkspace}
        aria-label="文件树"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v2H3V6z" />
          <path d="M3 10h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8z" />
          <path d="M7 14h10" />
        </svg>
      </button>

      {/* Settings */}
      <div className="toolbar__menu-anchor" ref={menuRef}>
        <button
          className={`toolbar__icon ${menuOpen ? 'toolbar__icon--active' : ''}`}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="设置"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        {menuOpen && (
          <div className="toolbar__dropdown">
            {/* Theme */}
            <div className="toolbar__dropdown-label">明暗模式</div>
            <div className="toolbar__dropdown-row">
              <button
                className={`toolbar__chip ${theme === 'nord-light' ? 'toolbar__chip--active' : ''}`}
                onClick={() => onThemeChange('nord-light')}
              >
                浅色
              </button>
              <button
                className={`toolbar__chip ${theme === 'nord-dark' ? 'toolbar__chip--active' : ''}`}
                onClick={() => onThemeChange('nord-dark')}
              >
                深色
              </button>
            </div>

            <div className="toolbar__dropdown-divider" />

            {/* Slide font */}
            <div className="toolbar__dropdown-label">课件字体</div>
            <div className="toolbar__dropdown-fonts">
              {FONT_OPTIONS.map((f) => (
                <div
                  key={f.value}
                  className={`toolbar__font-item ${slideFont === f.value ? 'toolbar__font-item--active' : ''}`}
                  onClick={() => onSlideFontChange(f.value)}
                >
                  <span className="toolbar__font-name">{f.label}</span>
                  <span className="toolbar__font-desc">{f.desc}</span>
                </div>
              ))}
            </div>

            <div className="toolbar__dropdown-divider" />

            {/* Night mode */}
            <div
              className="toolbar__dropdown-item"
              onClick={() => onNightModeChange(!nightMode)}
            >
              <span>夜间模式</span>
              <span className={`toolbar__toggle ${nightMode ? 'toolbar__toggle--on' : ''}`}>
                <span className="toolbar__toggle-thumb" />
              </span>
            </div>

            <div className="toolbar__dropdown-divider" />

            {/* Instructions */}
            <div
              className="toolbar__dropdown-item"
              onClick={() => { onToggleInstructions(); setMenuOpen(false); }}
            >
              <span>指令集</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Export */}
      <button className="toolbar__icon" onClick={onExport} aria-label="导出">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </button>
    </div>
  );
}
