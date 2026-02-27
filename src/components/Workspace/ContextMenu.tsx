import type { RefObject } from 'react';
import type { ContextMenuState } from './treeTypes';

interface ContextMenuProps {
  menu: ContextMenuState;
  menuRef: RefObject<HTMLDivElement | null>;
  onAction: (action: 'rename' | 'delete' | 'duplicate') => void;
}

export function ContextMenu({ menu, menuRef, onAction }: ContextMenuProps) {
  return (
    <div ref={menuRef} className="workspace-panel__ctx" style={{ top: menu.y, left: menu.x }}>
      <button className="workspace-panel__ctx-item" onClick={() => onAction('rename')}>
        重命名
      </button>

      {menu.kind === 'file' && (
        <button className="workspace-panel__ctx-item" onClick={() => onAction('duplicate')}>
          复制
        </button>
      )}

      <div className="workspace-panel__ctx-divider" />
      <button className="workspace-panel__ctx-item workspace-panel__ctx-item--danger" onClick={() => onAction('delete')}>
        删除
      </button>
    </div>
  );
}
