import {
  ViewPlugin,
  Decoration,
  EditorView,
  WidgetType,
} from '@codemirror/view';
import type { DecorationSet, ViewUpdate } from '@codemirror/view';
import type { Extension, Text } from '@codemirror/state';

const SECTION_COLORS = [
  '#5e81ac',
  '#81a1c1',
  '#88c0d0',
  '#8fbcbb',
  '#a3be8c',
  '#d08770',
];
const OPEN_SECTION_RE = /<section(?:\s[^<>]*)?>/gi;
const CLOSE_SECTION_RE = /<\/section\s*>/gi;

function countTagMatches(text: string, pattern: RegExp): number {
  pattern.lastIndex = 0;
  let count = 0;
  while (pattern.exec(text)) {
    count++;
  }
  return count;
}

class SectionBadge extends WidgetType {
  constructor(
    readonly index: number,
    readonly color: string,
  ) {
    super();
  }

  toDOM() {
    const span = document.createElement('span');
    span.className = 'cm-section-badge';
    span.textContent = `\u00A7${this.index + 1}`;
    span.style.color = this.color;
    span.style.borderColor = this.color;
    return span;
  }

  ignoreEvent() {
    return true;
  }
}

interface SectionInfo {
  startLine: number;
  endLine: number;
  index: number;
}

function findSections(doc: Text): SectionInfo[] {
  const sections: SectionInfo[] = [];
  let depth = 0;
  let startLine = -1;
  let idx = 0;

  for (let i = 1; i <= doc.lines; i++) {
    const text = doc.line(i).text;
    const opens = countTagMatches(text, OPEN_SECTION_RE);
    const closes = countTagMatches(text, CLOSE_SECTION_RE);

    for (let j = 0; j < opens; j++) {
      if (depth === 0) startLine = i;
      depth++;
    }
    for (let j = 0; j < closes; j++) {
      depth = Math.max(0, depth - 1);
      if (depth === 0 && startLine >= 0) {
        sections.push({ startLine, endLine: i, index: idx++ });
        startLine = -1;
      }
    }
  }

  if (depth > 0 && startLine >= 0) {
    sections.push({ startLine, endLine: doc.lines, index: idx });
  }

  return sections;
}

function buildDecorations(view: EditorView): DecorationSet {
  const sections = findSections(view.state.doc);
  const decos: ReturnType<Decoration['range']>[] = [];

  for (const sec of sections) {
    const colorIdx = sec.index % SECTION_COLORS.length;
    const color = SECTION_COLORS[colorIdx];

    // Badge widget at section start
    const startLine = view.state.doc.line(sec.startLine);
    decos.push(
      Decoration.widget({
        widget: new SectionBadge(sec.index, color),
        side: -1,
      }).range(startLine.from),
    );

    // Line decorations for the whole section
    for (let i = sec.startLine; i <= sec.endLine; i++) {
      const line = view.state.doc.line(i);
      decos.push(
        Decoration.line({
          attributes: { class: `cm-section-line cm-section-color-${colorIdx}` },
        }).range(line.from),
      );
    }
  }

  return Decoration.set(decos, true);
}

export function sectionHighlight(): Extension {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = buildDecorations(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = buildDecorations(update.view);
        }
      }
    },
    { decorations: (v) => v.decorations },
  );
}

/**
 * Given a CodeMirror doc and cursor position, return the 0-based index
 * of the top-level <section> the cursor is inside (or nearest to).
 */
export function computeCurrentSection(doc: Text, cursorPos: number): number {
  let depth = 0;
  let sectionIndex = -1;

  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i);
    if (line.from > cursorPos) break;

    const text = line.text;
    const opens = countTagMatches(text, OPEN_SECTION_RE);
    const closes = countTagMatches(text, CLOSE_SECTION_RE);

    for (let j = 0; j < opens; j++) {
      if (depth === 0) sectionIndex++;
      depth++;
    }
    for (let j = 0; j < closes; j++) {
      depth = Math.max(0, depth - 1);
    }
  }

  return Math.max(0, sectionIndex);
}
