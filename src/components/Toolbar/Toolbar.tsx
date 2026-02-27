import type { SlideFont } from '../../types/presentation';
import SettingsDropdown from './SettingsDropdown';
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

      <SettingsDropdown
        theme={theme}
        nightMode={nightMode}
        slideFont={slideFont}
        onThemeChange={onThemeChange}
        onNightModeChange={onNightModeChange}
        onSlideFontChange={onSlideFontChange}
        onToggleInstructions={onToggleInstructions}
      />

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
