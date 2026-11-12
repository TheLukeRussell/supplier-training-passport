// Small hooks for media queries: phone vs two-page spread, and whether the
// person asked for reduced motion.

import { useSyncExternalStore } from 'react'

// One subscribe function per query, so React doesn't resubscribe every render.
const subscribers = new Map<string, (onChange: () => void) => () => void>()

function subscribeTo(query: string) {
  let subscribe = subscribers.get(query)
  if (!subscribe) {
    subscribe = (onChange: () => void) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    }
    subscribers.set(query, subscribe)
  }
  return subscribe
}

export function useMedia(query: string): boolean {
  return useSyncExternalStore(
    subscribeTo(query),
    () => window.matchMedia(query).matches,
    () => false,
  )
}

// The book opens to a two-page spread once there's room for two pages side by side.
export const SPREAD_QUERY = '(min-width: 60rem)'
export const useSpread = () => useMedia(SPREAD_QUERY)
export const useReducedMotion = () => useMedia('(prefers-reduced-motion: reduce)')
