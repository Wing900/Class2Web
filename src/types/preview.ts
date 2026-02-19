export type PreviewMessageType =
  | 'update-slides'
  | 'change-theme'
  | 'goto-slide'
  | 'change-font'
  | 'apply-custom-theme'
  | 'change-transition';

export interface PreviewMessage {
  type: PreviewMessageType;
  payload: string;
}

export interface PreviewReadyMessage {
  type: 'preview-ready';
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isPreviewReadyMessage(value: unknown): value is PreviewReadyMessage {
  if (!isObjectRecord(value)) return false;
  return value.type === 'preview-ready';
}
