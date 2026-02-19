/* ============================================
   C2W — Image Store
   支持本地持久化 + 引用同步清理
   ============================================ */

const IMAGE_STORAGE_KEY = 'c2w.images.v1';
const IMAGE_REF_REGEX = /c2w-img:\/\/(\d+)/g;

function loadStore(): Map<string, string> {
  if (typeof window === 'undefined') return new Map<string, string>();

  try {
    const raw = window.localStorage.getItem(IMAGE_STORAGE_KEY);
    if (!raw) return new Map<string, string>();

    const parsed = JSON.parse(raw) as Record<string, string>;
    if (!parsed || typeof parsed !== 'object') return new Map<string, string>();

    const entries = Object.entries(parsed).filter(([, value]) => typeof value === 'string');
    return new Map(entries);
  } catch {
    return new Map<string, string>();
  }
}

function persistStore(): void {
  if (typeof window === 'undefined') return;
  const serializable = Object.fromEntries(store.entries());
  window.localStorage.setItem(IMAGE_STORAGE_KEY, JSON.stringify(serializable));
}

function getInitialCounter(imageStore: Map<string, string>): number {
  let max = 0;
  imageStore.forEach((_, id) => {
    const num = Number.parseInt(id, 10);
    if (Number.isFinite(num)) {
      max = Math.max(max, num);
    }
  });
  return max;
}

const store = loadStore(); // id -> dataURL
let counter = getInitialCounter(store);

/** 存入图片，返回短 ID */
export function addImage(dataUrl: string): string {
  counter++;
  const id = String(counter).padStart(3, '0');
  store.set(id, dataUrl);
  persistStore();
  return id;
}

/** 将 HTML 中的 c2w-img://xxx 替换为真实 dataURL */
export function resolveImages(html: string): string {
  IMAGE_REF_REGEX.lastIndex = 0;
  return html.replace(IMAGE_REF_REGEX, (match, id) => store.get(id) || match);
}

/** 提取 HTML 中引用的图片 ID */
export function collectImageRefs(html: string): Set<string> {
  const refs = new Set<string>();
  IMAGE_REF_REGEX.lastIndex = 0;
  const matches = html.matchAll(IMAGE_REF_REGEX);
  for (const match of matches) {
    if (match[1]) refs.add(match[1]);
  }
  return refs;
}

/**
 * 同步清理：保留 documents 中被引用的图片，删除其余图片
 * 返回删除数量
 */
export function syncImageStoreWithHTMLDocuments(documents: string[]): number {
  const usedRefs = new Set<string>();
  for (const html of documents) {
    collectImageRefs(html).forEach((id) => usedRefs.add(id));
  }

  let removed = 0;
  for (const id of Array.from(store.keys())) {
    if (!usedRefs.has(id)) {
      store.delete(id);
      removed++;
    }
  }

  if (removed > 0) persistStore();
  return removed;
}

/** 获取某张图片的 dataURL（调试用） */
export function getImage(id: string): string | undefined {
  return store.get(id);
}

/** 当前图片数量 */
export function imageCount(): number {
  return store.size;
}
