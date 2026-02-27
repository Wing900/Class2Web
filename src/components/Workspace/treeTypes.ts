import type { DragEvent, MouseEvent } from 'react';
import type { WorkspaceFile, WorkspaceFolder } from '../../types/workspace';

export interface FolderChildren {
  folders: WorkspaceFolder[];
  files: WorkspaceFile[];
}

export interface FolderEntry {
  type: 'folder';
  folder: WorkspaceFolder;
}

export interface FileEntry {
  type: 'file';
  file: WorkspaceFile;
}

export type TreeEntry = FolderEntry | FileEntry;
export type TreeNodeKind = 'file' | 'folder';

export interface RenameState {
  id: string;
  kind: TreeNodeKind;
  value: string;
}

export interface ContextMenuState {
  x: number;
  y: number;
  id: string;
  kind: TreeNodeKind;
}

export interface DragItem {
  id: string;
  kind: TreeNodeKind;
}

export interface TreeViewState {
  activeFileId: string;
  selectedFolderId: string | null;
  renaming: RenameState | null;
  dragItem: DragItem | null;
  dropTarget: string | null;
}

export interface TreeEventHandlers {
  onItemClick: (id: string, kind: TreeNodeKind) => void;
  onContextMenu: (event: MouseEvent, id: string, kind: TreeNodeKind) => void;
  onRenameValueChange: (value: string) => void;
  onRenameCommit: () => void;
  onRenameCancel: () => void;
  onDragStart: (event: DragEvent, id: string, kind: TreeNodeKind) => void;
  onFolderDragOver: (event: DragEvent, folderId: string) => void;
  onDrop: (targetFolderId: string | null) => void;
  onDragEnd: () => void;
}
