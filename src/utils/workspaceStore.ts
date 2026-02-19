import starterHTML from '../templates/starter.html?raw';
import type { WorkspaceFile, WorkspaceFolder, WorkspaceState } from '../types/workspace';

export const WORKSPACE_STORAGE_KEY = 'c2w.workspace.v1';

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createDefaultWorkspace(): WorkspaceState {
  const now = Date.now();
  const folderId = createId('folder');
  const fileId = createId('file');

  return {
    version: 1,
    folders: [
      {
        id: folderId,
        name: '默认文件夹',
        parentId: null,
        createdAt: now,
      },
    ],
    files: [
      {
        id: fileId,
        folderId,
        name: '未命名课件',
        content: starterHTML,
        updatedAt: now,
      },
    ],
    activeFileId: fileId,
  };
}

function isWorkspaceState(value: unknown): value is WorkspaceState {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<WorkspaceState>;
  return (
    candidate.version === 1 &&
    Array.isArray(candidate.folders) &&
    Array.isArray(candidate.files) &&
    typeof candidate.activeFileId === 'string'
  );
}

export function loadWorkspace(): WorkspaceState {
  if (typeof window === 'undefined') {
    return createDefaultWorkspace();
  }

  try {
    const raw = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (!raw) return createDefaultWorkspace();

    const parsed = JSON.parse(raw);
    if (!isWorkspaceState(parsed)) return createDefaultWorkspace();
    if (parsed.files.length === 0) return createDefaultWorkspace();
    if (!parsed.files.some((file) => file.id === parsed.activeFileId)) {
      return { ...parsed, activeFileId: parsed.files[0].id };
    }

    return parsed;
  } catch {
    return createDefaultWorkspace();
  }
}

export function saveWorkspace(workspace: WorkspaceState): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(workspace));
}

export function createFolder(name: string, parentId: string | null): WorkspaceFolder {
  return {
    id: createId('folder'),
    name,
    parentId,
    createdAt: Date.now(),
  };
}

export function createCourseware(name: string, folderId: string | null): WorkspaceFile {
  return {
    id: createId('file'),
    folderId,
    name,
    content: starterHTML,
    updatedAt: Date.now(),
  };
}

export function duplicateCourseware(source: WorkspaceFile): WorkspaceFile {
  return {
    id: createId('file'),
    folderId: source.folderId,
    name: `${source.name} 副本`,
    content: source.content,
    updatedAt: Date.now(),
  };
}
