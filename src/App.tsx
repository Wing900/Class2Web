import { lazy, Suspense, useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Toolbar from './components/Toolbar/Toolbar';
import PreviewPanel from './components/Preview/PreviewPanel';
import WorkspacePanel from './components/Workspace/WorkspacePanel';
import { parseC2WMeta, metaToCSS } from './utils/metaParser';
import { resolveImages } from './utils/imageStore';
import { useDebouncedValue } from './hooks/useDebouncedValue';
import { useWorkspace } from './hooks/useWorkspace';
import { DEFAULT_SLIDE_FONT } from './config/toolbarOptions';
import type { SlideFont } from './types/presentation';

const EditorPanel = lazy(() => import('./components/Editor/EditorPanel'));
const InstructionDrawer = lazy(() => import('./components/InstructionDrawer/InstructionDrawer'));

function countSections(html: string): number {
  const matches = html.match(/<section[\s>]/g);
  return matches ? matches.length : 0;
}

export default function App() {
  const {
    workspace,
    activeFile,
    code,
    lastSavedAt,
    updateActiveFileContent,
    selectFile,
    createFolder,
    createFile,
    renameFile,
    renameFolder,
    deleteFile,
    deleteFolder,
    duplicateFile,
    moveFile,
    moveFolder,
  } = useWorkspace();
  const [theme, _setTheme] = useState(() => localStorage.getItem('c2w-theme') || 'nord-light');
  const [nightMode, _setNightMode] = useState(() => localStorage.getItem('c2w-night') === 'true');
  const [slideFont, _setSlideFont] = useState<SlideFont>(() => {
    const v = localStorage.getItem('c2w-font');
    return (v === 'modern' || v === 'wenkai' || v === 'serif') ? v : DEFAULT_SLIDE_FONT;
  });

  const setTheme = useCallback((v: string) => { _setTheme(v); localStorage.setItem('c2w-theme', v); }, []);
  const setNightMode = useCallback((v: boolean) => { _setNightMode(v); localStorage.setItem('c2w-night', String(v)); }, []);
  const setSlideFont = useCallback((v: SlideFont) => { _setSlideFont(v); localStorage.setItem('c2w-font', v); }, []);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [leftWidth, setLeftWidth] = useState(50);
  const [currentSlide, setCurrentSlide] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedCode = useDebouncedValue(code, 300);

  // Parse metadata from code
  const meta = useMemo(() => parseC2WMeta(debouncedCode), [debouncedCode]);
  const customThemeCSS = useMemo(() => metaToCSS(meta), [meta]);

  // Resolve c2w-img:// references to real dataURLs for preview
  const previewHTML = useMemo(() => resolveImages(debouncedCode), [debouncedCode]);

  useEffect(() => {
    setCurrentSlide(0);
  }, [activeFile?.id]);

  useEffect(() => {
    if (!workspaceOpen) return;
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setWorkspaceOpen(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [workspaceOpen]);

  const handleCodeChange = useCallback((value: string) => {
    updateActiveFileContent(value);
  }, [updateActiveFileContent]);

  const handleMouseDown = useCallback(() => {
    setDragging(true);
  }, []);

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftWidth(Math.max(20, Math.min(80, pct)));
    };

    const handleMouseUp = () => {
      setDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [dragging]);

  const handleExport = useCallback(async () => {
    const { exportHTML } = await import('./utils/exporter');
    await exportHTML(code, theme, slideFont, customThemeCSS, meta.transition);
  }, [code, theme, slideFont, customThemeCSS, meta.transition]);

  const handleInsert = useCallback((_snippet: string) => {}, []);

  const slideCount = countSections(debouncedCode);

  // ── Global keyboard shortcuts ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;

      switch (e.key) {
        case 's':
        case 'S':
          e.preventDefault();
          break;
        case 'e':
        case 'E':
          e.preventDefault();
          handleExport();
          break;
        case 'b':
        case 'B':
          e.preventDefault();
          setWorkspaceOpen((v) => !v);
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          setCurrentSlide((v) => Math.min(v + 1, Math.max(slideCount - 1, 0)));
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          setCurrentSlide((v) => Math.max(v - 1, 0));
          break;
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleExport, slideCount]);

  const themeLabel = theme === 'nord-dark' ? '深色' : '浅色';
  const savedLabel = lastSavedAt
    ? `本地已保存 ${new Date(lastSavedAt).toLocaleTimeString([], { hour12: false })}`
    : '本地自动保存开启';

  return (
    <div className={`app ${nightMode ? 'app--night' : ''}`}>
      <Toolbar
        theme={theme}
        nightMode={nightMode}
        slideFont={slideFont}
        workspaceOpen={workspaceOpen}
        onThemeChange={setTheme}
        onNightModeChange={setNightMode}
        onSlideFontChange={setSlideFont}
        onToggleInstructions={() => setDrawerOpen((v) => !v)}
        onToggleWorkspace={() => setWorkspaceOpen((v) => !v)}
        onExport={handleExport}
      />

      <div className="app__main" ref={containerRef}>
        <div className="app__editor" style={{ width: `${leftWidth}%` }}>
          <div className="app__code">
            <Suspense fallback={<div className="app__panel-loading">编辑器加载中...</div>}>
              <EditorPanel
                value={code}
                onChange={handleCodeChange}
                onCursorSectionChange={setCurrentSlide}
                nightMode={nightMode}
              />
            </Suspense>
          </div>
        </div>

        <div
          className={`app__divider ${dragging ? 'app__divider--dragging' : ''}`}
          onMouseDown={handleMouseDown}
        />

        <div className="app__preview" style={{ width: `${100 - leftWidth}%` }}>
          <PreviewPanel
            html={previewHTML}
            theme={theme}
            currentSlide={currentSlide}
            slideFont={slideFont}
            customThemeCSS={customThemeCSS}
            transition={meta.transition}
          />
        </div>
      </div>

      <div
        className={`app__workspace-overlay ${workspaceOpen ? 'app__workspace-overlay--open' : ''}`}
        role="dialog"
        aria-modal={workspaceOpen || undefined}
        aria-label="文件树"
        aria-hidden={!workspaceOpen}
      >
        <button
          className="app__workspace-close"
          onClick={() => setWorkspaceOpen(false)}
          aria-label="关闭文件树"
          tabIndex={workspaceOpen ? 0 : -1}
        >
          关闭
        </button>
        <div className="app__workspace-layer">
          <WorkspacePanel
            folders={workspace.folders}
            files={workspace.files}
            activeFileId={workspace.activeFileId}
            onSelectFile={selectFile}
            onCreateFolder={createFolder}
            onCreateFile={createFile}
            onRenameFile={renameFile}
            onRenameFolder={renameFolder}
            onDeleteFile={deleteFile}
            onDeleteFolder={deleteFolder}
            onDuplicateFile={duplicateFile}
            onMoveFile={moveFile}
            onMoveFolder={moveFolder}
            onClose={() => setWorkspaceOpen(false)}
          />
        </div>
      </div>

      <div className="app__statusbar">
        <span>当前课件 {activeFile?.name ?? '未命名课件'}</span>
        <span>幻灯片 {slideCount}</span>
        <span>{savedLabel}</span>
        <span>{themeLabel}</span>
        <span>C2W v1.0</span>
      </div>

      {drawerOpen && (
        <Suspense fallback={<div className="app__drawer-loading">指令集加载中...</div>}>
          <InstructionDrawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            onInsert={handleInsert}
          />
        </Suspense>
      )}
    </div>
  );
}
