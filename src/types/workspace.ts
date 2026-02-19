export interface WorkspaceFolder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: number;
}

export interface WorkspaceFile {
  id: string;
  folderId: string | null;
  name: string;
  content: string;
  updatedAt: number;
}

export interface WorkspaceState {
  version: 1;
  folders: WorkspaceFolder[];
  files: WorkspaceFile[];
  activeFileId: string;
}
