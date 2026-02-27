import { useEffect, useState } from 'react';
import type { WorkspaceState } from '../../types/workspace';
import { syncImageStoreWithHTMLDocuments } from '../../utils/imageStore';
import { saveWorkspace } from '../../utils/workspaceStore';

const SAVE_DEBOUNCE_MS = 250;

interface UseWorkspaceSyncResult {
  lastSavedAt: number | null;
}

export function useWorkspaceSync(workspace: WorkspaceState): UseWorkspaceSyncResult {
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      saveWorkspace(workspace);
      syncImageStoreWithHTMLDocuments(workspace.files.map((file) => file.content));
      setLastSavedAt(Date.now());
    }, SAVE_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [workspace]);

  return { lastSavedAt };
}
