import { memo } from 'react';
import { FileNode } from './FileNode';
import { FolderNode } from './FolderNode';
import type { FolderChildren, TreeEntry, TreeEventHandlers, TreeViewState } from './treeTypes';

interface FileTreeProps {
  entries: TreeEntry[];
  childMap: Map<string | null, FolderChildren>;
  maxDepth: number;
  state: TreeViewState;
  handlers: TreeEventHandlers;
}

function FileTreeComponent({ entries, childMap, maxDepth, state, handlers }: FileTreeProps) {
  return (
    <ul className="workspace-panel__tree-list workspace-panel__tree-root">
      {entries.map((entry) =>
        entry.type === 'folder' ? (
          <FolderNode
            key={entry.folder.id}
            folder={entry.folder}
            childMap={childMap}
            depth={0}
            maxDepth={maxDepth}
            state={state}
            handlers={handlers}
          />
        ) : (
          <FileNode key={entry.file.id} file={entry.file} state={state} handlers={handlers} />
        ),
      )}
    </ul>
  );
}

export const FileTree = memo(FileTreeComponent);
