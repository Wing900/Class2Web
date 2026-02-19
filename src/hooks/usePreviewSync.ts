import { useCallback, useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { sendToPreview } from '../utils/previewBridge';
import { isPreviewReadyMessage, type PreviewMessage } from '../types/preview';
import type { SlideFont } from '../types/presentation';

interface UsePreviewSyncParams {
  iframeRef: RefObject<HTMLIFrameElement | null>;
  html: string;
  theme: string;
  currentSlide: number;
  slideFont: SlideFont;
  customThemeCSS: string;
  transition: string;
}

interface UsePreviewSyncResult {
  handleLoad: () => void;
}

export function usePreviewSync({
  iframeRef,
  html,
  theme,
  currentSlide,
  slideFont,
  customThemeCSS,
  transition,
}: UsePreviewSyncParams): UsePreviewSyncResult {
  const readyRef = useRef(false);
  const queueRef = useRef<PreviewMessage[]>([]);

  const flushQueue = useCallback(() => {
    if (!readyRef.current) return;
    const iframe = iframeRef.current;
    if (!iframe) return;

    while (queueRef.current.length > 0) {
      const message = queueRef.current.shift();
      if (message) {
        sendToPreview(iframe, message);
      }
    }
  }, [iframeRef]);

  const enqueueMessage = useCallback((message: PreviewMessage) => {
    queueRef.current.push(message);
    flushQueue();
  }, [flushQueue]);

  const markReady = useCallback(() => {
    if (readyRef.current) return;
    readyRef.current = true;
    flushQueue();
  }, [flushQueue]);

  const handleLoad = useCallback(() => {
    readyRef.current = false;
    enqueueMessage({ type: 'apply-custom-theme', payload: customThemeCSS });
    enqueueMessage({ type: 'change-transition', payload: transition });
    enqueueMessage({ type: 'update-slides', payload: html });
    enqueueMessage({ type: 'change-theme', payload: theme });
    enqueueMessage({ type: 'change-font', payload: slideFont });
    enqueueMessage({ type: 'goto-slide', payload: String(currentSlide) });
  }, [currentSlide, customThemeCSS, transition, enqueueMessage, html, slideFont, theme]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (!isPreviewReadyMessage(event.data)) return;
      const expectedSource = iframeRef.current?.contentWindow;
      if (expectedSource && event.source !== expectedSource) return;
      markReady();
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [iframeRef, markReady]);

  useEffect(() => {
    enqueueMessage({ type: 'apply-custom-theme', payload: customThemeCSS });
  }, [customThemeCSS, enqueueMessage]);

  useEffect(() => {
    enqueueMessage({ type: 'change-transition', payload: transition });
  }, [transition, enqueueMessage]);

  useEffect(() => {
    enqueueMessage({ type: 'update-slides', payload: html });
  }, [html, enqueueMessage]);

  useEffect(() => {
    enqueueMessage({ type: 'change-theme', payload: theme });
  }, [theme, enqueueMessage]);

  useEffect(() => {
    enqueueMessage({ type: 'change-font', payload: slideFont });
  }, [slideFont, enqueueMessage]);

  useEffect(() => {
    enqueueMessage({ type: 'goto-slide', payload: String(currentSlide) });
  }, [currentSlide, enqueueMessage]);

  return { handleLoad };
}
