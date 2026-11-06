'use client';

import { useEffect, useRef } from 'react';

/**
 * Marks the page as scrolled (html[data-scrolled]) once a small sentinel at
 * the top of the document leaves the viewport. The header uses this to swap
 * the full lockup for the brand mark. IntersectionObserver, no scroll events.
 */
export function HeaderScrollState() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const sentinel = ref.current;
    if (!sentinel) return;
    const root = document.documentElement;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry) return;
      if (entry.isIntersecting) delete root.dataset.scrolled;
      else root.dataset.scrolled = 'true';
    });
    observer.observe(sentinel);
    return () => {
      observer.disconnect();
      delete root.dataset.scrolled;
    };
  }, []);

  return (
    <span
      ref={ref}
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 1,
        height: 48,
        pointerEvents: 'none',
      }}
    />
  );
}
