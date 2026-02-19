import type { PreviewMessage } from '../types/preview';

export function sendToPreview(iframe: HTMLIFrameElement | null, message: PreviewMessage) {
  if (iframe?.contentWindow) {
    iframe.contentWindow.postMessage(message, '*');
  }
}

export function sendSlides(iframe: HTMLIFrameElement | null, html: string) {
  sendToPreview(iframe, { type: 'update-slides', payload: html });
}

export function sendTheme(iframe: HTMLIFrameElement | null, theme: string) {
  sendToPreview(iframe, { type: 'change-theme', payload: theme });
}

export function sendGotoSlide(iframe: HTMLIFrameElement | null, index: number) {
  sendToPreview(iframe, { type: 'goto-slide', payload: String(index) });
}

export function sendFont(iframe: HTMLIFrameElement | null, font: string) {
  sendToPreview(iframe, { type: 'change-font', payload: font });
}

export function sendCustomTheme(iframe: HTMLIFrameElement | null, css: string) {
  sendToPreview(iframe, { type: 'apply-custom-theme', payload: css });
}
