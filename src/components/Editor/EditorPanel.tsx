import { useRef, useCallback, useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { EditorView } from '@codemirror/view';
import type { ViewUpdate } from '@codemirror/view';
import { sectionHighlight, computeCurrentSection } from '../../utils/sectionHighlight';
import { addImage } from '../../utils/imageStore';
import './EditorPanel.css';

interface EditorPanelProps {
  value: string;
  onChange: (value: string) => void;
  onCursorSectionChange?: (index: number) => void;
  nightMode?: boolean;
}

/** 读取图片文件 → 存入 imageStore → 返回多行 <img> 标签 */
function readImageAndInsert(file: File, view: EditorView, pos: number) {
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result as string;
    const id = addImage(dataUrl);
    const tag = [
      '<img',
      `  src="c2w-img://${id}"`,
      '  alt=""',
      '  style="max-width: 80%;"',
      '>',
    ].join('\n');
    view.dispatch({ changes: { from: pos, insert: tag } });
  };
  reader.readAsDataURL(file);
}

/** 粘贴 / 拖拽图片扩展 */
function pasteImageExtension() {
  return EditorView.domEventHandlers({
    paste(event, view) {
      const items = event.clipboardData?.items;
      if (!items) return false;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          event.preventDefault();
          const file = item.getAsFile();
          if (!file) continue;
          readImageAndInsert(file, view, view.state.selection.main.head);
          return true;
        }
      }
      return false;
    },
    drop(event, view) {
      const files = event.dataTransfer?.files;
      if (!files || files.length === 0) return false;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          event.preventDefault();
          const dropPos = view.posAtCoords({ x: event.clientX, y: event.clientY });
          const pos = dropPos ?? view.state.selection.main.head;
          readImageAndInsert(file, view, pos);
          return true;
        }
      }
      return false;
    },
  });
}

export default function EditorPanel({ value, onChange, onCursorSectionChange, nightMode }: EditorPanelProps) {
  const lastSectionRef = useRef(-1);

  const extensions = useMemo(() => [html(), sectionHighlight(), pasteImageExtension()], []);

  const handleUpdate = useCallback(
    (update: ViewUpdate) => {
      if (!onCursorSectionChange) return;
      if (!update.selectionSet && !update.docChanged) return;

      const pos = update.state.selection.main.head;
      const idx = computeCurrentSection(update.state.doc, pos);

      if (idx !== lastSectionRef.current) {
        lastSectionRef.current = idx;
        onCursorSectionChange(idx);
      }
    },
    [onCursorSectionChange],
  );

  return (
    <div className="editor-panel">
      <CodeMirror
        value={value}
        height="100%"
        theme={nightMode ? 'dark' : 'light'}
        extensions={extensions}
        onChange={onChange}
        onUpdate={handleUpdate}
        style={{ flex: 1, minHeight: 0 }}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          bracketMatching: true,
          autocompletion: true,
          highlightActiveLine: true,
          indentOnInput: true,
        }}
      />
    </div>
  );
}
