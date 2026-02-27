import { useCallback, useMemo, useState } from 'react';
import {
  createCourseware,
  createFolder as createWorkspaceFolder,
  duplicateCourseware,
  loadWorkspace,
} from '../../utils/workspaceStore';
import type { WorkspaceFile, WorkspaceState } from '../../types/workspace';
import { canMoveFolder, collectFolderTreeIds, resolveNextActiveFileId } from './workspaceCrudUtils';

export interface UseWorkspaceCRUDResult {
  workspace: WorkspaceState;
  activeFile: WorkspaceFile | undefined;
  code: string;
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

export function useWorkspaceCRUD(): UseWorkspaceCRUDResult {
  const [workspace, setWorkspace] = useState<WorkspaceState>(() => loadWorkspace());

  const activeFile = useMemo(
    () => workspace.files.find((file) => file.id === workspace.activeFileId) ?? workspace.files[0],
    [workspace.activeFileId, workspace.files],
  );

  const code = activeFile?.content ?? '';

  const updateActiveFileContent = useCallback((content: string) => {
    setWorkspace((prev) => {
      const fileIndex = prev.files.findIndex((file) => file.id === prev.activeFileId);
      if (fileIndex < 0) return prev;

      const currentFile = prev.files[fileIndex];
      if (currentFile.content === content) return prev;

      const nextFiles = prev.files.slice();
      nextFiles[fileIndex] = {
        ...currentFile,
        content,
        updatedAt: Date.now(),
      };

      return { ...prev, files: nextFiles };
    });
  }, []);

  const selectFile = useCallback((fileId: string) => {
    setWorkspace((prev) => {
      if (prev.activeFileId === fileId) return prev;
      if (!prev.files.some((file) => file.id === fileId)) return prev;
      return { ...prev, activeFileId: fileId };
    });
  }, []);

  const createFolder = useCallback((name: string, parentId: string | null) => {
    const nextFolder = createWorkspaceFolder(name, parentId);
    setWorkspace((prev) => ({
      ...prev,
      folders: [...prev.folders, nextFolder],
    }));
  }, []);

  const createFile = useCallback((name: string, folderId: string | null) => {
    const nextFile = createCourseware(name, folderId);
    setWorkspace((prev) => ({
      ...prev,
      files: [...prev.files, nextFile],
      activeFileId: nextFile.id,
    }));
  }, []);

  const renameFile = useCallback((fileId: string, name: string) => {
    setWorkspace((prev) => ({
      ...prev,
      files: prev.files.map((file) =>
        file.id === fileId ? { ...file, name, updatedAt: Date.now() } : file,
      ),
    }));
  }, []);

  const renameFolder = useCallback((folderId: string, name: string) => {
    setWorkspace((prev) => ({
      ...prev,
      folders: prev.folders.map((folder) =>
        folder.id === folderId ? { ...folder, name } : folder,
      ),
    }));
  }, []);

  const deleteFile = useCallback((fileId: string) => {
    setWorkspace((prev) => {
      const nextFiles = prev.files.filter((file) => file.id !== fileId);
      if (nextFiles.length === 0) return prev;
      return {
        ...prev,
        files: nextFiles,
        activeFileId: resolveNextActiveFileId(nextFiles, prev.activeFileId),
      };
    });
  }, []);

  const deleteFolder = useCallback((folderId: string) => {
    setWorkspace((prev) => {
      const folderTreeIds = collectFolderTreeIds(prev.folders, folderId);
      const nextFolders = prev.folders.filter((folder) => !folderTreeIds.has(folder.id));
      const nextFiles = prev.files.filter((file) => !file.folderId || !folderTreeIds.has(file.folderId));

      if (nextFiles.length === 0) return prev;

      return {
        ...prev,
        folders: nextFolders,
        files: nextFiles,
        activeFileId: resolveNextActiveFileId(nextFiles, prev.activeFileId),
      };
    });
  }, []);

  const duplicateFile = useCallback((fileId: string) => {
    setWorkspace((prev) => {
      const sourceFile = prev.files.find((file) => file.id === fileId);
      if (!sourceFile) return prev;
      const nextFile = duplicateCourseware(sourceFile);
      return {
        ...prev,
        files: [...prev.files, nextFile],
        activeFileId: nextFile.id,
      };
    });
  }, []);

  const moveFile = useCallback((fileId: string, targetFolderId: string | null) => {
    setWorkspace((prev) => ({
      ...prev,
      files: prev.files.map((file) =>
        file.id === fileId ? { ...file, folderId: targetFolderId, updatedAt: Date.now() } : file,
      ),
    }));
  }, []);

  const moveFolder = useCallback((folderId: string, targetParentId: string | null) => {
    setWorkspace((prev) => {
      if (!canMoveFolder(prev.folders, folderId, targetParentId)) return prev;

      return {
        ...prev,
        folders: prev.folders.map((folder) =>
          folder.id === folderId ? { ...folder, parentId: targetParentId } : folder,
        ),
      };
    });
  }, []);

  return {
    workspace,
    activeFile,
    code,
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
  };
}
