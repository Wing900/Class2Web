import { memo, useEffect, useMemo, useRef } from 'react';
import type { WorkspaceFolder } from '../../types/workspace';
import { FileNode } from './FileNode';
import type { FolderChildren, TreeEntry, TreeEventHandlers, TreeViewState } from './treeTypes';

interface FolderNodeProps {
  folder: WorkspaceFolder;
  childMap: Map<string | null, FolderChildren>;
  depth: number;
  maxDepth: number;
  state: TreeViewState;
  handlers: TreeEventHandlers;
}

function FolderNodeComponent({ folder, childMap, depth, maxDepth, state, handlers }: FolderNodeProps) {
  const isSelected = state.selectedFolderId === folder.id;
  const isRenaming = state.renaming?.id === folder.id;
  const isDragging = state.dragItem?.id === folder.id;
  const isDropOver = state.dropTarget === folder.id;
  const inputRef = useRef<HTMLInputElement>(null);

  const childEntries = useMemo<TreeEntry[]>(() => {
    const children = childMap.get(folder.id);
    if (!children) return [];
    return [
      ...children.folders.map((childFolder) => ({ type: 'folder', folder: childFolder } as const)),
      ...children.files.map((file) => ({ type: 'file', file } as const)),
    ];
  }, [childMap, folder.id]);

  useEffect(() => {
    if (!isRenaming) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [isRenaming]);

  return (
    <li className={`workspace-panel__tree-item ${isDragging ? 'workspace-panel__tree-item--dragging' : ''}`}>
      <button
        className={`workspace-panel__node workspace-panel__node--folder ${isSelected ? 'workspace-panel__node--selected' : ''} ${isDropOver ? 'workspace-panel__node--drop-target' : ''}`}
        onClick={() => handlers.onItemClick(folder.id, 'folder')}
        onContextMenu={(e) => handlers.onContextMenu(e, folder.id, 'folder')}
        draggable={!isRenaming}
        onDragStart={(e) => handlers.onDragStart(e, folder.id, 'folder')}
        onDragOver={(e) => handlers.onFolderDragOver(e, folder.id)}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handlers.onDrop(folder.id);
        }}
        onDragEnd={handlers.onDragEnd}
        title={folder.name}
      >
        <svg
          className="workspace-panel__icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
        </svg>

        {isRenaming ? (
          <input
            ref={inputRef}
            className="workspace-panel__rename-input"
            value={state.renaming?.value ?? ''}
            onChange={(e) => handlers.onRenameValueChange(e.target.value)}
            onBlur={handlers.onRenameCommit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handlers.onRenameCommit();
              if (e.key === 'Escape') handlers.onRenameCancel();
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="workspace-panel__node-label">{folder.name}</span>
        )}
      </button>

      {depth < maxDepth && childEntries.length > 0 && (
        <ul className="workspace-panel__tree-list">
          {childEntries.map((entry) =>
            entry.type === 'folder' ? (
              <FolderNode
                key={entry.folder.id}
                folder={entry.folder}
                childMap={childMap}
                depth={depth + 1}
                maxDepth={maxDepth}
                state={state}
                handlers={handlers}
              />
            ) : (
              <FileNode key={entry.file.id} file={entry.file} state={state} handlers={handlers} />
            ),
          )}
        </ul>
      )}
    </li>
  );
}

export const FolderNode = memo(FolderNodeComponent);
