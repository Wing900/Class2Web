import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  loadWorkspace,
  saveWorkspace,
  createFolder as createWorkspaceFolder,
  createCourseware,
  duplicateCourseware,
} from '../utils/workspaceStore';
import { syncImageStoreWithHTMLDocuments } from '../utils/imageStore';
import type { WorkspaceFile, WorkspaceState } from '../types/workspace';

const SAVE_DEBOUNCE_MS = 250;

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
  const [workspace, setWorkspace] = useState<WorkspaceState>(() => loadWorkspace());
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  const activeFile = useMemo(
    () => workspace.files.find((file) => file.id === workspace.activeFileId) ?? workspace.files[0],
    [workspace.activeFileId, workspace.files],
  );

  const code = activeFile?.content ?? '';

  useEffect(() => {
    const timer = setTimeout(() => {
      saveWorkspace(workspace);
      syncImageStoreWithHTMLDocuments(workspace.files.map((file) => file.content));
      setLastSavedAt(Date.now());
    }, SAVE_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [workspace]);

  const updateActiveFileContent = useCallback((content: string) => {
    setWorkspace((prev) => {
      const fileIndex = prev.files.findIndex((file) => file.id === prev.activeFileId);
      if (fileIndex < 0) return prev;

      const current = prev.files[fileIndex];
      if (current.content === content) return prev;

      const nextFiles = prev.files.slice();
      nextFiles[fileIndex] = {
        ...current,
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
      files: prev.files.map((f) =>
        f.id === fileId ? { ...f, name, updatedAt: Date.now() } : f,
      ),
    }));
  }, []);

  const renameFolder = useCallback((folderId: string, name: string) => {
    setWorkspace((prev) => ({
      ...prev,
      folders: prev.folders.map((f) =>
        f.id === folderId ? { ...f, name } : f,
      ),
    }));
  }, []);

  const deleteFile = useCallback((fileId: string) => {
    setWorkspace((prev) => {
      const nextFiles = prev.files.filter((f) => f.id !== fileId);
      if (nextFiles.length === 0) return prev;
      const nextActiveId = prev.activeFileId === fileId
        ? nextFiles[0].id
        : prev.activeFileId;
      return { ...prev, files: nextFiles, activeFileId: nextActiveId };
    });
  }, []);

  const deleteFolder = useCallback((folderId: string) => {
    setWorkspace((prev) => {
      const toDelete = new Set<string>();
      const queue = [folderId];
      while (queue.length > 0) {
        const id = queue.shift()!;
        toDelete.add(id);
        for (const f of prev.folders) {
          if (f.parentId === id && !toDelete.has(f.id)) {
            queue.push(f.id);
          }
        }
      }

      const nextFolders = prev.folders.filter((f) => !toDelete.has(f.id));
      const nextFiles = prev.files.filter(
        (f) => !f.folderId || !toDelete.has(f.folderId),
      );
      if (nextFiles.length === 0) return prev;
      const nextActiveId = nextFiles.some((f) => f.id === prev.activeFileId)
        ? prev.activeFileId
        : nextFiles[0].id;
      return { ...prev, folders: nextFolders, files: nextFiles, activeFileId: nextActiveId };
    });
  }, []);

  const duplicateFile = useCallback((fileId: string) => {
    setWorkspace((prev) => {
      const source = prev.files.find((f) => f.id === fileId);
      if (!source) return prev;
      const copy = duplicateCourseware(source);
      return { ...prev, files: [...prev.files, copy], activeFileId: copy.id };
    });
  }, []);

  const moveFile = useCallback((fileId: string, targetFolderId: string | null) => {
    setWorkspace((prev) => ({
      ...prev,
      files: prev.files.map((f) =>
        f.id === fileId ? { ...f, folderId: targetFolderId, updatedAt: Date.now() } : f,
      ),
    }));
  }, []);

  const moveFolder = useCallback((folderId: string, targetParentId: string | null) => {
    setWorkspace((prev) => {
      if (folderId === targetParentId) return prev;
      // Prevent moving into own descendant
      let cur: string | null = targetParentId;
      while (cur) {
        if (cur === folderId) return prev;
        const parent = prev.folders.find((f) => f.id === cur);
        cur = parent?.parentId ?? null;
      }
      return {
        ...prev,
        folders: prev.folders.map((f) =>
          f.id === folderId ? { ...f, parentId: targetParentId } : f,
        ),
      };
    });
  }, []);

  return {
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
  };
}
