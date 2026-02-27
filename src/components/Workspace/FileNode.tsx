import { memo, useEffect, useRef } from 'react';
import type { WorkspaceFile } from '../../types/workspace';
import type { TreeEventHandlers, TreeViewState } from './treeTypes';

interface FileNodeProps {
  file: WorkspaceFile;
  state: TreeViewState;
  handlers: TreeEventHandlers;
}

function FileNodeComponent({ file, state, handlers }: FileNodeProps) {
  const isActive = file.id === state.activeFileId;
  const isRenaming = state.renaming?.id === file.id;
  const isDragging = state.dragItem?.id === file.id;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isRenaming) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [isRenaming]);

  return (
    <li className={`workspace-panel__tree-item ${isDragging ? 'workspace-panel__tree-item--dragging' : ''}`}>
      <button
        className={`workspace-panel__node workspace-panel__node--file ${isActive ? 'workspace-panel__node--active' : ''}`}
        onClick={() => handlers.onItemClick(file.id, 'file')}
        onContextMenu={(e) => handlers.onContextMenu(e, file.id, 'file')}
        draggable={!isRenaming}
        onDragStart={(e) => handlers.onDragStart(e, file.id, 'file')}
        onDragEnd={handlers.onDragEnd}
        title={file.name}
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
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
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
          <span className="workspace-panel__node-label">{file.name}</span>
        )}
      </button>
    </li>
  );
}

export const FileNode = memo(FileNodeComponent);
