// Whether the page is pinched in right now. While it is, a sideways drag on
// the book should pan the zoomed view across a stamp, not turn the page.

import { useSyncExternalStore } from 'react'

// A hair over 1, since some phones settle a pinch back out at 1.0001.
export const isPinchZoomed = () => (window.visualViewport?.scale ?? 1) > 1.01

function subscribe(onChange: () => void) {
  const view = window.visualViewport
  if (!view) return () => {}
  view.addEventListener('resize', onChange)
  return () => view.removeEventListener('resize', onChange)
}

export const usePinchZoom = () => useSyncExternalStore(subscribe, isPinchZoomed, () => false)
