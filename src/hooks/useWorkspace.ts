import type { WorkspaceFile, WorkspaceState } from '../types/workspace';
import { useWorkspaceCRUD } from './workspace/useWorkspaceCRUD';
import { useWorkspaceSync } from './workspace/useWorkspaceSync';

interface UseWorkspaceResult {
  workspace: WorkspaceState;
  activeFile: WorkspaceFile | undefined;
  code: string;
  lastSavedAt: number | null;
  updateActiveFileContent: (content: string) => void;
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

export function useWorkspace(): UseWorkspaceResult {
  const crud = useWorkspaceCRUD();
  const { lastSavedAt } = useWorkspaceSync(crud.workspace);

  return {
    ...crud,
    lastSavedAt,
  };
}
