import { useState } from 'react';
import './InstructionDrawer.css';

interface InstructionDrawerProps {
  open: boolean;
  onClose: () => void;
  onInsert: (code: string) => void;
}

interface Instruction {
  name: string;
  desc: string;
  code: string;
}

const instructions: Instruction[] = [
  {
    name: 'c2w 元数据',
    desc: '放在文件最顶部，设置全局配色和转场。颜色变量：bg / bg-alt / text / text-light / primary / accent / frost-light / frost-dark / success / warning / danger / info / polar-night / polar-night-light',
    code: `<!-- c2w
primary: #5E81AC
accent: #88C0D0
bg: #ECEFF4
text: #2E3440
transition: slide
-->`,
  },
  {
    name: 'c2w-cover',
    desc: '封面页 — 大标题 + 副标题 + 作者 + 单位，垂直居中',
    code: `<section class="c2w-cover">
  <h1>课件标题</h1>
  <p class="subtitle">副标题说明</p>
  <p class="author">作者姓名</p>
  <p class="affiliation">所属单位</p>
</section>`,
  },
  {
    name: 'c2w-chapter',
    desc: '章节页 — 全屏主色背景，超大章号，白色标题',
    code: `<section class="c2w-chapter">
  <span class="chapter-num">01</span>
  <h2>章节标题</h2>
  <p>章节简要描述</p>
</section>`,
  },
  {
    name: 'c2w-summary',
    desc: '总结页 — 带下划线标题和要点列表',
    code: `<section class="c2w-summary">
  <h2>本节总结</h2>
  <ul>
    <li>要点一</li>
    <li>要点二</li>
    <li>要点三</li>
  </ul>
</section>`,
  },
  {
    name: 'c2w-dual',
    desc: '左右对比页 — 50/50 双栏布局，适合对比展示',
    code: `<section class="c2w-dual">
  <h2>对比标题</h2>
  <div class="dual-container">
    <div class="dual-left">
      <h3>左侧</h3>
      <p>左侧内容</p>
    </div>
    <div class="dual-right">
      <h3>右侧</h3>
      <p>右侧内容</p>
    </div>
  </div>
</section>`,
  },
  {
    name: 'c2w-statement',
    desc: '强调结论页 — 单句全屏居中，大号加粗文字',
    code: `<section class="c2w-statement">
  <p>"这里是需要强调的核心结论"</p>
  <span class="source">— 来源</span>
</section>`,
  },
  {
    name: 'c2w-code',
    desc: '代码展示页 — 适合展示代码片段',
    code: `<section class="c2w-code">
  <h2>代码示例</h2>
  <pre><code class="language-javascript">
function hello() {
  console.log("Hello, C2W!");
}
  </code></pre>
</section>`,
  },
  {
    name: 'c2w-grid + c2w-col-*',
    desc: '12 栅格布局 — 自由组合列宽（c2w-col-1 ~ c2w-col-12）',
    code: `<div class="c2w-grid">
  <div class="c2w-col-6">
    <h3>左半</h3>
    <p>占 6/12 列</p>
  </div>
  <div class="c2w-col-6">
    <h3>右半</h3>
    <p>占 6/12 列</p>
  </div>
</div>`,
  },
  {
    name: '转场动画（全局）',
    desc: '在 c2w 元数据中设置 transition 字段，可选值：none / fade / slide / convex / concave / zoom',
    code: `<!-- c2w
transition: fade
-->`,
  },
  {
    name: '转场动画（单页）',
    desc: '在 section 上用 data-transition 覆盖全局设置，支持 in/out 分别设置',
    code: `<section data-transition="zoom">
  <h2>这页使用 zoom 转场</h2>
</section>

<section data-transition="fade-in slide-out">
  <h2>淡入 + 滑出</h2>
</section>`,
  },
  {
    name: 'fragment',
    desc: '分步显示 — Reveal.js 原生动画，点击逐步出现',
    code: `<ul>
  <li>立即显示</li>
  <li class="fragment">点击后显示 1</li>
  <li class="fragment">点击后显示 2</li>
</ul>`,
  },
  {
    name: '数学公式',
    desc: '行内用 $...$ ，独立行用 $$...$$，基于 MathJax 3 渲染',
    code: `<p>行内公式：$E = mc^2$</p>
<p>独立公式：</p>
$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$`,
  },
];

export default function InstructionDrawer({ open, onClose, onInsert }: InstructionDrawerProps) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  function handleCopy(code: string, idx: number) {
    navigator.clipboard.writeText(code);
    onInsert(code);
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
          {instructions.map((inst, idx) => (
            <div key={inst.name} className="instruction-card">
              <div className="instruction-card__name">{inst.name}</div>
              <div className="instruction-card__desc">{inst.desc}</div>
              <div className="instruction-card__code">
                <button
                  className="instruction-card__copy"
                  onClick={() => handleCopy(inst.code, idx)}
                >
                  {copiedIdx === idx ? '已复制' : '复制'}
                </button>
                {inst.code}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
