import type { WorkspaceFile, WorkspaceFolder } from '../../types/workspace';

export function collectFolderTreeIds(folders: WorkspaceFolder[], rootId: string): Set<string> {
  const toDelete = new Set<string>();
  const queue: string[] = [rootId];

  for (let i = 0; i < queue.length; i += 1) {
    const currentId = queue[i];
    if (toDelete.has(currentId)) continue;

    toDelete.add(currentId);
    for (const folder of folders) {
      if (folder.parentId === currentId && !toDelete.has(folder.id)) {
        queue.push(folder.id);
      }
    }
  }

  return toDelete;
}

export function resolveNextActiveFileId(files: WorkspaceFile[], preferredId: string): string {
  const hasPreferred = files.some((file) => file.id === preferredId);
  return hasPreferred ? preferredId : files[0].id;
}

export function canMoveFolder(
  folders: WorkspaceFolder[],
  folderId: string,
  targetParentId: string | null,
): boolean {
  if (folderId === targetParentId) return false;

  let current = targetParentId;
  while (current) {
    if (current === folderId) return false;
    const parent = folders.find((folder) => folder.id === current);
    current = parent?.parentId ?? null;
  }

  return true;
}
