import { useEffect, useRef, useState } from 'react';
import { FONT_OPTIONS } from '../../config/toolbarOptions';
import type { SlideFont } from '../../types/presentation';

interface SettingsDropdownProps {
  theme: string;
  nightMode: boolean;
  slideFont: SlideFont;
  onThemeChange: (theme: string) => void;
  onNightModeChange: (on: boolean) => void;
  onSlideFontChange: (font: SlideFont) => void;
  onToggleInstructions: () => void;
}

export default function SettingsDropdown({
  theme,
  nightMode,
  slideFont,
  onThemeChange,
  onNightModeChange,
  onSlideFontChange,
  onToggleInstructions,
}: SettingsDropdownProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (event: MouseEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  return (
    <div className="toolbar__menu-anchor" ref={menuRef}>
      <button
        className={`toolbar__icon ${menuOpen ? 'toolbar__icon--active' : ''}`}
        onClick={() => setMenuOpen((value) => !value)}
        aria-label="设置"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {menuOpen && (
        <div className="toolbar__dropdown">
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

          <div className="toolbar__dropdown-label">课件字体</div>
          <div className="toolbar__dropdown-fonts">
            {FONT_OPTIONS.map((font) => (
              <div
                key={font.value}
                className={`toolbar__font-item ${slideFont === font.value ? 'toolbar__font-item--active' : ''}`}
                onClick={() => onSlideFontChange(font.value)}
              >
                <span className="toolbar__font-name">{font.label}</span>
                <span className="toolbar__font-desc">{font.desc}</span>
              </div>
            ))}
          </div>

          <div className="toolbar__dropdown-divider" />

          <div className="toolbar__dropdown-item" onClick={() => onNightModeChange(!nightMode)}>
            <span>夜间模式</span>
            <span className={`toolbar__toggle ${nightMode ? 'toolbar__toggle--on' : ''}`}>
              <span className="toolbar__toggle-thumb" />
            </span>
          </div>

          <div className="toolbar__dropdown-divider" />

          <div
            className="toolbar__dropdown-item"
            onClick={() => {
              onToggleInstructions();
              setMenuOpen(false);
            }}
          >
            <span>指令集</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
