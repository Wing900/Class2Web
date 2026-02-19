import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import type { WorkspaceFile, WorkspaceFolder } from '../../types/workspace';
import './WorkspacePanel.css';

interface WorkspacePanelProps {
  folders: WorkspaceFolder[];
  files: WorkspaceFile[];
  activeFileId: string;
  onSelectFile: (fileId: string) => void;
  onCreateFolder: (name: string, parentId: string | null) => void;
  onCreateFile: (name: string, folderId: string | null) => void;
  onRenameFile: (fileId: string, name: string) => void;
  onRenameFolder: (folderId: string, name: string) => void;
  onDeleteFile: (fileId: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onDuplicateFile: (fileId: string) => void;
  onMoveFile: (fileId: string, targetFolderId: string | null) => void;
  onMoveFolder: (folderId: string, targetParentId: string | null) => void;
  onClose: () => void;
}

interface FolderChildren {
  folders: WorkspaceFolder[];
  files: WorkspaceFile[];
}

interface FolderEntry { type: 'folder'; folder: WorkspaceFolder }
interface FileEntry { type: 'file'; file: WorkspaceFile }
type TreeEntry = FolderEntry | FileEntry;

interface CtxMenu { x: number; y: number; id: string; kind: 'file' | 'folder' }
interface DragInfo { id: string; kind: 'file' | 'folder' }

const MAX_RENDER_DEPTH = 12;
const DBL_CLICK_MS = 300;

export default function WorkspacePanel({
  folders, files, activeFileId,
  onSelectFile, onCreateFolder, onCreateFile,
  onRenameFile, onRenameFolder, onDeleteFile, onDeleteFolder,
  onDuplicateFile, onMoveFile, onMoveFolder,
  onClose,
}: WorkspacePanelProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingValue, setRenamingValue] = useState('');
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);
  const [dragItem, setDragItem] = useState<DragInfo | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null); // folder id, or 'root'

  const pendingClickId = useRef<string | null>(null);
  const pendingClickTimer = useRef<number | null>(null);
  const ctxRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // ── child map ──
  const childMap = useMemo(() => {
    const map = new Map<string | null, FolderChildren>();
    const ensure = (key: string | null) => {
      if (!map.has(key)) map.set(key, { folders: [], files: [] });
      return map.get(key)!;
    };
    folders.slice().sort((a, b) => a.createdAt - b.createdAt)
      .forEach((f) => ensure(f.parentId).folders.push(f));
    files.slice().sort((a, b) => a.updatedAt - b.updatedAt)
      .forEach((f) => ensure(f.folderId).files.push(f));
    return map;
  }, [folders, files]);

  // ── keep selectedFolderId valid ──
  useEffect(() => {
    if (!selectedFolderId) return;
    if (!folders.some((f) => f.id === selectedFolderId)) setSelectedFolderId(null);
  }, [folders, selectedFolderId]);

  useEffect(() => {
    if (selectedFolderId) return;
    const af = files.find((f) => f.id === activeFileId);
    if (af?.folderId) setSelectedFolderId(af.folderId);
  }, [activeFileId, files, selectedFolderId]);

  const rootEntries = useMemo<TreeEntry[]>(() => {
    const root = childMap.get(null);
    return [
      ...(root?.folders ?? []).map((folder) => ({ type: 'folder', folder } as const)),
      ...(root?.files ?? []).map((file) => ({ type: 'file', file } as const)),
    ];
  }, [childMap]);

  // ── close context menu on outside click ──
  useEffect(() => {
    if (!ctxMenu) return;
    const handle = (e: MouseEvent) => {
      if (ctxRef.current?.contains(e.target as Node)) return;
      setCtxMenu(null);
    };
    const id = requestAnimationFrame(() => {
      document.addEventListener('mousedown', handle);
    });
    return () => { cancelAnimationFrame(id); document.removeEventListener('mousedown', handle); };
  }, [ctxMenu]);

  // ── auto-focus rename input ──
  useEffect(() => {
    if (!renamingId) return;
    requestAnimationFrame(() => {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    });
  }, [renamingId]);

  // ── clean up pending click timer ──
  useEffect(() => () => {
    if (pendingClickTimer.current !== null) clearTimeout(pendingClickTimer.current);
  }, []);

  // ── single / double click ──
  const handleItemClick = (id: string, kind: 'file' | 'folder') => {
    if (renamingId) return;
    if (pendingClickId.current === id) {
      clearTimeout(pendingClickTimer.current!);
      pendingClickId.current = null;
      pendingClickTimer.current = null;
      startRename(id, kind);
      return;
    }
    if (pendingClickTimer.current !== null) clearTimeout(pendingClickTimer.current);
    pendingClickId.current = id;
    pendingClickTimer.current = window.setTimeout(() => {
      pendingClickId.current = null;
      pendingClickTimer.current = null;
      if (kind === 'file') { onSelectFile(id); onClose(); }
      else setSelectedFolderId(id);
    }, DBL_CLICK_MS);
  };

  // ── rename ──
  const startRename = (id: string, kind: 'file' | 'folder') => {
    const name = kind === 'file'
      ? files.find((f) => f.id === id)?.name ?? ''
      : folders.find((f) => f.id === id)?.name ?? '';
    setRenamingId(id);
    setRenamingValue(name);
  };

  const commitRename = () => {
    if (!renamingId) return;
    const trimmed = renamingValue.trim();
    if (trimmed) {
      if (files.some((f) => f.id === renamingId)) onRenameFile(renamingId, trimmed);
      else onRenameFolder(renamingId, trimmed);
    }
    setRenamingId(null);
  };

  // ── context menu ──
  const handleContextMenu = (e: React.MouseEvent, id: string, kind: 'file' | 'folder') => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({ x: e.clientX, y: e.clientY, id, kind });
  };

  const ctxAction = (action: 'rename' | 'delete' | 'duplicate') => {
    if (!ctxMenu) return;
    const { id, kind } = ctxMenu;
    setCtxMenu(null);

    if (action === 'rename') { startRename(id, kind); return; }

    if (action === 'duplicate') { onDuplicateFile(id); return; }

    const name = kind === 'file'
      ? files.find((f) => f.id === id)?.name
      : folders.find((f) => f.id === id)?.name;
    if (window.confirm(`确定删除「${name ?? ''}」？此操作不可撤回。`)) {
      if (kind === 'file') onDeleteFile(id);
      else onDeleteFolder(id);
    }
  };

  // ── drag & drop ──
  const isDescendant = useCallback((folderId: string, targetId: string | null): boolean => {
    let cur = targetId;
    while (cur) {
      if (cur === folderId) return true;
      const f = folders.find((x) => x.id === cur);
      cur = f?.parentId ?? null;
    }
    return false;
  }, [folders]);

  const handleDragStart = (e: React.DragEvent, id: string, kind: 'file' | 'folder') => {
    setDragItem({ id, kind });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleFolderDragOver = (e: React.DragEvent, folderId: string) => {
    if (!dragItem) return;
    if (dragItem.kind === 'folder' && (dragItem.id === folderId || isDescendant(dragItem.id, folderId))) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(folderId);
  };

  const handleDrop = (targetFolderId: string | null) => {
    if (!dragItem) return;
    if (dragItem.kind === 'file') onMoveFile(dragItem.id, targetFolderId);
    else onMoveFolder(dragItem.id, targetFolderId);
    setDragItem(null);
    setDropTarget(null);
  };

  const handleDragEnd = () => {
    setDragItem(null);
    setDropTarget(null);
  };

  // ── create ──
  const handleCreateFolder = () => {
    const name = window.prompt('输入文件夹名称');
    if (!name?.trim()) return;
    onCreateFolder(name.trim(), selectedFolderId);
  };

  const handleCreateFile = () => {
    const name = window.prompt('输入课件名称');
    if (!name?.trim()) return;
    onCreateFile(name.trim(), selectedFolderId);
  };

  // ── renderers ──
  const renderRenameInput = () => (
    <input
      ref={renameInputRef}
      className="workspace-panel__rename-input"
      value={renamingValue}
      onChange={(e) => setRenamingValue(e.target.value)}
      onBlur={commitRename}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commitRename();
        if (e.key === 'Escape') setRenamingId(null);
      }}
      onClick={(e) => e.stopPropagation()}
    />
  );

  const renderFolder = (folder: WorkspaceFolder, depth: number): ReactElement => {
    const children = childMap.get(folder.id);
    const isSelected = selectedFolderId === folder.id;
    const isRenaming = renamingId === folder.id;
    const isDragging = dragItem?.id === folder.id;
    const isDropOver = dropTarget === folder.id;
    const childEntries: TreeEntry[] = [
      ...(children?.folders.map((c) => ({ type: 'folder', folder: c } as const)) ?? []),
      ...(children?.files.map((f) => ({ type: 'file', file: f } as const)) ?? []),
    ];

    return (
      <li className={`workspace-panel__tree-item ${isDragging ? 'workspace-panel__tree-item--dragging' : ''}`} key={folder.id}>
        <button
          className={`workspace-panel__node workspace-panel__node--folder ${isSelected ? 'workspace-panel__node--selected' : ''} ${isDropOver ? 'workspace-panel__node--drop-target' : ''}`}
          onClick={() => handleItemClick(folder.id, 'folder')}
          onContextMenu={(e) => handleContextMenu(e, folder.id, 'folder')}
          draggable={!isRenaming}
          onDragStart={(e) => handleDragStart(e, folder.id, 'folder')}
          onDragOver={(e) => handleFolderDragOver(e, folder.id)}
          onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleDrop(folder.id); }}
          onDragEnd={handleDragEnd}
          title={folder.name}
        >
          <svg className="workspace-panel__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
          </svg>
          {isRenaming ? renderRenameInput() : (
            <span className="workspace-panel__node-label">{folder.name}</span>
          )}
        </button>

        {depth < MAX_RENDER_DEPTH && childEntries.length > 0 && (
          <ul className="workspace-panel__tree-list">
            {childEntries.map((entry) => renderEntry(entry, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  const renderFile = (file: WorkspaceFile): ReactElement => {
    const isActive = file.id === activeFileId;
    const isRenaming = renamingId === file.id;
    const isDragging = dragItem?.id === file.id;

    return (
      <li className={`workspace-panel__tree-item ${isDragging ? 'workspace-panel__tree-item--dragging' : ''}`} key={file.id}>
        <button
          className={`workspace-panel__node workspace-panel__node--file ${isActive ? 'workspace-panel__node--active' : ''}`}
          onClick={() => handleItemClick(file.id, 'file')}
          onContextMenu={(e) => handleContextMenu(e, file.id, 'file')}
          draggable={!isRenaming}
          onDragStart={(e) => handleDragStart(e, file.id, 'file')}
          onDragEnd={handleDragEnd}
          title={file.name}
        >
          <svg className="workspace-panel__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          {isRenaming ? renderRenameInput() : (
            <span className="workspace-panel__node-label">{file.name}</span>
          )}
        </button>
      </li>
    );
  };

  const renderEntry = (entry: TreeEntry, depth: number): ReactElement => {
    if (entry.type === 'folder') return renderFolder(entry.folder, depth);
    return renderFile(entry.file);
  };

  const hasItems = rootEntries.length > 0;
  const selectedFolderName = selectedFolderId === null
    ? '根目录'
    : folders.find((f) => f.id === selectedFolderId)?.name ?? '根目录';

  return (
    <div className="workspace-panel" onContextMenu={(e) => e.preventDefault()}>
      <div className="workspace-panel__header">
        <div className="workspace-panel__title">课件工作区</div>
        <div className="workspace-panel__actions">
          <button
            className={`workspace-panel__btn ${dropTarget === 'root' ? 'workspace-panel__btn--drop' : ''}`}
            onClick={() => setSelectedFolderId(null)}
            onDragOver={(e) => { if (dragItem) { e.preventDefault(); setDropTarget('root'); } }}
            onDrop={(e) => { e.preventDefault(); handleDrop(null); }}
          >
            根目录
          </button>
          <button className="workspace-panel__btn workspace-panel__btn--accent" onClick={handleCreateFolder}>
            + 文件夹
          </button>
          <button className="workspace-panel__btn workspace-panel__btn--accent" onClick={handleCreateFile}>
            + 课件
          </button>
        </div>
        <div className="workspace-panel__hint">
          {dragItem ? '拖到文件夹或「根目录」按钮上松手' : `创建位置: ${selectedFolderName}`}
        </div>
      </div>

      <div
        className="workspace-panel__content"
        onDragOver={(e) => { if (dragItem) { e.preventDefault(); setDropTarget('root'); } }}
        onDrop={(e) => { e.preventDefault(); handleDrop(null); }}
      >
        {!hasItems && <div className="workspace-panel__empty">还没有课件，点击「+ 课件」新建一个</div>}

        {hasItems && (
          <ul className="workspace-panel__tree-list workspace-panel__tree-root">
            {rootEntries.map((entry) => renderEntry(entry, 0))}
          </ul>
        )}
      </div>

      {/* ── Context menu ── */}
      {ctxMenu && (
        <div ref={ctxRef} className="workspace-panel__ctx" style={{ top: ctxMenu.y, left: ctxMenu.x }}>
          <button className="workspace-panel__ctx-item" onClick={() => ctxAction('rename')}>
            重命名
          </button>
          {ctxMenu.kind === 'file' && (
            <button className="workspace-panel__ctx-item" onClick={() => ctxAction('duplicate')}>
              复制
            </button>
          )}
          <div className="workspace-panel__ctx-divider" />
          <button className="workspace-panel__ctx-item workspace-panel__ctx-item--danger" onClick={() => ctxAction('delete')}>
            删除
          </button>
        </div>
      )}
    </div>
  );
}
