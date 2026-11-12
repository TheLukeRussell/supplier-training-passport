// Tiny seeded randomness, so the sample data, the stamp tilt and the demo's
// "who showed up today" come out the same on every machine and every reload.

// Turn any string into a 32-bit number. FNV-1a, nothing fancy.
export function hashString(text: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

// mulberry32: a small fast generator. Give it a seed, get back a function
// that returns numbers in [0, 1). Same seed always gives the same sequence.
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// One stable number in [0, 1) for a given key. Handy when you need a single
// coin flip or tilt per rep and training without carrying a generator around.
export function unitFor(key: string, seed = 0): number {
  return seededRandom(hashString(key) ^ seed)()
}

// Shuffle a copy of a list with a seeded generator (Fisher-Yates).
export function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
