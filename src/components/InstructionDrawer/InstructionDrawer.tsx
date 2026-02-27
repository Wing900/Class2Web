import { useState } from 'react';
import { INSTRUCTION_SNIPPETS } from '../../config/instructionSnippets';
import './InstructionDrawer.css';

interface InstructionDrawerProps {
  open: boolean;
  onClose: () => void;
  onInsert: (code: string) => void;
}

export default function InstructionDrawer({ open, onClose, onInsert }: InstructionDrawerProps) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  async function handleCopy(code: string, idx: number) {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      return;
    }
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  }

  return (
    <>
      {open && <div className="instruction-drawer__overlay" onClick={onClose} />}
      <div className={`instruction-drawer ${open ? 'instruction-drawer--open' : ''}`}>
        <div className="instruction-drawer__header">
          <h2>指令集</h2>
          <button className="instruction-drawer__close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="instruction-drawer__body">
          {INSTRUCTION_SNIPPETS.map((inst, idx) => (
            <div key={inst.name} className="instruction-card">
              <div className="instruction-card__name">{inst.name}</div>
              <div className="instruction-card__desc">{inst.desc}</div>
              <div className="instruction-card__code">
                <div className="instruction-card__actions">
                  <button
                    className="instruction-card__copy"
                    onClick={() => handleCopy(inst.code, idx)}
                  >
                    {copiedIdx === idx ? '已复制' : '复制'}
                  </button>
                  <button
                    className="instruction-card__insert"
                    onClick={() => onInsert(inst.code)}
                  >
                    插入
                  </button>
                </div>
                {inst.code}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
