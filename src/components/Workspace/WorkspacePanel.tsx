import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { WorkspaceFile, WorkspaceFolder } from '../../types/workspace';
import { ContextMenu } from './ContextMenu';
import { FileTree } from './FileTree';
import type {
  ContextMenuState,
  DragItem,
  FolderChildren,
  TreeEntry,
  TreeEventHandlers,
  TreeNodeKind,
  TreeViewState,
  RenameState,
} from './treeTypes';
import './WorkspacePanel.css';

export interface WorkspacePanelActions {
  selectFile: (fileId: string) => void;
  createFolder: (name: string, parentId: string | null) => void;
  createFile: (name: string, folderId: string | null) => void;
  renameFile: (fileId: string, name: string) => void;
  renameFolder: (folderId: string, name: string) => void;
  deleteFile: (fileId: string) => void;
  deleteFolder: (folderId: string) => void;
  duplicateFile: (fileId: string) => void;
  moveFile: (fileId: string, targetFolderId: string | null) => void;
  moveFolder: (folderId: string, targetParentId: string | null) => void;
}

interface WorkspacePanelProps {
  folders: WorkspaceFolder[];
  files: WorkspaceFile[];
  activeFileId: string;
  actions: WorkspacePanelActions;
  onClose: () => void;
}

const MAX_RENDER_DEPTH = 12;
const DBL_CLICK_MS = 300;

export default function WorkspacePanel({
  folders,
  files,
  activeFileId,
  actions,
  onClose,
}: WorkspacePanelProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<RenameState | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [dragItem, setDragItem] = useState<DragItem | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const pendingClickId = useRef<string | null>(null);
  const pendingClickTimer = useRef<number | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!contextMenu) return;
    const handle = (e: MouseEvent) => {
      if (contextMenuRef.current?.contains(e.target as Node)) return;
      setContextMenu(null);
    };
    const id = requestAnimationFrame(() => {
      document.addEventListener('mousedown', handle);
    });
    return () => { cancelAnimationFrame(id); document.removeEventListener('mousedown', handle); };
  }, [contextMenu]);

  useEffect(() => () => {
    if (pendingClickTimer.current !== null) clearTimeout(pendingClickTimer.current);
  }, []);

  const startRename = useCallback((id: string, kind: TreeNodeKind) => {
    const value = kind === 'file'
      ? files.find((file) => file.id === id)?.name ?? ''
      : folders.find((folder) => folder.id === id)?.name ?? '';
    setRenaming({ id, kind, value });
  }, [files, folders]);

  const handleItemClick = useCallback((id: string, kind: TreeNodeKind) => {
    if (renaming) return;

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

      if (kind === 'file') {
        actions.selectFile(id);
        onClose();
      }
      else setSelectedFolderId(id);
    }, DBL_CLICK_MS);
  }, [actions, onClose, renaming, startRename]);

  const handleRenameCommit = useCallback(() => {
    setRenaming((current) => {
      if (!current) return current;
      const nextName = current.value.trim();

      if (nextName) {
        if (current.kind === 'file') actions.renameFile(current.id, nextName);
        else actions.renameFolder(current.id, nextName);
      }

      return null;
    });
  }, [actions]);

  const handleRenameValueChange = useCallback((value: string) => {
    setRenaming((current) => {
      if (!current) return current;
      return { ...current, value };
    });
  }, []);

  const handleContextMenu = useCallback((event: React.MouseEvent, id: string, kind: TreeNodeKind) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({ x: event.clientX, y: event.clientY, id, kind });
  }, []);

  const handleContextAction = useCallback((action: 'rename' | 'delete' | 'duplicate') => {
    if (!contextMenu) return;
    const { id, kind } = contextMenu;
    setContextMenu(null);

    if (action === 'rename') {
      startRename(id, kind);
      return;
    }

    if (action === 'duplicate') {
      if (kind === 'file') actions.duplicateFile(id);
      return;
    }

    const name = kind === 'file'
      ? files.find((f) => f.id === id)?.name
      : folders.find((f) => f.id === id)?.name;

    if (window.confirm(`确定删除「${name ?? ''}」？此操作不可撤回。`)) {
      if (kind === 'file') actions.deleteFile(id);
      else actions.deleteFolder(id);
    }
  }, [actions, contextMenu, files, folders, startRename]);

  const isDescendant = useCallback((folderId: string, targetId: string | null): boolean => {
    let cur = targetId;
    while (cur) {
      if (cur === folderId) return true;
      const f = folders.find((x) => x.id === cur);
      cur = f?.parentId ?? null;
    }
    return false;
  }, [folders]);

  const handleDragStart = useCallback((e: React.DragEvent, id: string, kind: TreeNodeKind) => {
    setDragItem({ id, kind });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  }, []);

  const handleFolderDragOver = useCallback((e: React.DragEvent, folderId: string) => {
    if (!dragItem) return;
    if (dragItem.kind === 'folder' && (dragItem.id === folderId || isDescendant(dragItem.id, folderId))) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(folderId);
  }, [dragItem, isDescendant]);

  const handleDrop = useCallback((targetFolderId: string | null) => {
    if (!dragItem) return;

    if (dragItem.kind === 'folder' && (dragItem.id === targetFolderId || isDescendant(dragItem.id, targetFolderId))) {
      setDragItem(null);
      setDropTarget(null);
      return;
    }

    if (dragItem.kind === 'file') actions.moveFile(dragItem.id, targetFolderId);
    else actions.moveFolder(dragItem.id, targetFolderId);

    setDragItem(null);
    setDropTarget(null);
  }, [actions, dragItem, isDescendant]);

  const handleDragEnd = useCallback(() => {
    setDragItem(null);
    setDropTarget(null);
  }, []);

  const handleCreateFolder = useCallback(() => {
    const name = window.prompt('输入文件夹名称');
    if (!name?.trim()) return;
    actions.createFolder(name.trim(), selectedFolderId);
  }, [actions, selectedFolderId]);

  const handleCreateFile = useCallback(() => {
    const name = window.prompt('输入课件名称');
    if (!name?.trim()) return;
    actions.createFile(name.trim(), selectedFolderId);
  }, [actions, selectedFolderId]);

  const treeState = useMemo<TreeViewState>(() => ({
    activeFileId,
    selectedFolderId,
    renaming,
    dragItem,
    dropTarget,
  }), [activeFileId, dragItem, dropTarget, renaming, selectedFolderId]);

  const treeHandlers = useMemo<TreeEventHandlers>(() => ({
    onItemClick: handleItemClick,
    onContextMenu: handleContextMenu,
    onRenameValueChange: handleRenameValueChange,
    onRenameCommit: handleRenameCommit,
    onRenameCancel: () => setRenaming(null),
    onDragStart: handleDragStart,
    onFolderDragOver: handleFolderDragOver,
    onDrop: handleDrop,
    onDragEnd: handleDragEnd,
  }), [
    handleContextMenu,
    handleDragEnd,
    handleDragStart,
    handleDrop,
    handleFolderDragOver,
    handleItemClick,
    handleRenameCommit,
    handleRenameValueChange,
  ]);

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
            onDragOver={(e) => {
              if (!dragItem) return;
              e.preventDefault();
              setDropTarget('root');
            }}
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
          <FileTree entries={rootEntries} childMap={childMap} maxDepth={MAX_RENDER_DEPTH} state={treeState} handlers={treeHandlers} />
        )}
      </div>

      {contextMenu && (
        <ContextMenu menu={contextMenu} menuRef={contextMenuRef} onAction={handleContextAction} />
      )}
    </div>
  );
}
