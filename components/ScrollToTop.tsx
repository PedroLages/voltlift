/**
 * ScrollToTop Component
 *
 * Automatically scrolls to top of page on route change
 * Prevents scroll position from persisting across navigation
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
