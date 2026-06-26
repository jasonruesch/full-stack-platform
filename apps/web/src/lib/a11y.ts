import { type RefObject, useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

const TITLE_SUFFIX = 'BookmarkVault';

/**
 * Sets `document.title` for the current view (WCAG 2.4.2 Page Titled). The SPA
 * shell ships a static title, so each route announces its own. The previous
 * title is restored on unmount, which keeps nested/overlay cases correct.
 */
export function useDocumentTitle(title: string | undefined) {
  useEffect(() => {
    if (!title) return;
    const previous = document.title;
    document.title = `${title} · ${TITLE_SUFFIX}`;
    return () => {
      document.title = previous;
    };
  }, [title]);
}

/**
 * Restores focus to the main region after a client-side navigation when focus
 * would otherwise be lost (WCAG 2.4.3 Focus Order). It only acts when focus
 * landed on `<body>` — i.e. the activating control unmounted — so it never
 * steals focus that a dialog, menu, or persistent nav link still holds.
 */
export function useFocusMainOnNavigation(ref: RefObject<HTMLElement | null>) {
  const { pathname } = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const active = document.activeElement;
    if (!active || active === document.body) {
      ref.current?.focus();
    }
  }, [pathname, ref]);
}
