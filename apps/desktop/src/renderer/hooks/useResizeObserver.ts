/**
 * useResizeObserver Hook
 *
 * Observes element size changes and calls the callback with debouncing.
 * Used by EmbedTerminal to auto-fit xterm.js when the container resizes.
 */

import { useEffect, useRef, type RefObject } from 'react';

/**
 * Observe resize events on an element
 *
 * @param elementRef - Ref to the element to observe
 * @param onResize - Callback fired when element resizes (debounced)
 * @param debounceMs - Debounce interval in milliseconds (default: 100)
 */
export function useResizeObserver(
  elementRef: RefObject<HTMLElement | null>,
  onResize: (entry: ResizeObserverEntry) => void,
  debounceMs = 100
): void {
  const callbackRef = useRef(onResize);
  callbackRef.current = onResize;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const observer = new ResizeObserver((entries) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (entries[0]) {
          callbackRef.current(entries[0]);
        }
      }, debounceMs);
    });

    observer.observe(element);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [elementRef, debounceMs]);
}
