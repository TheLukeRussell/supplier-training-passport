// How each stamp looks. Shape and ink come from the supplier, so every Zebra
// stamp matches, and the tilt comes from a seed so it looks hand-stamped but
// never jumps around between reloads.

import { SUPPLIERS } from '../config'
import { hashString, unitFor } from './random'

export const STAMP_SHAPES = ['circle', 'rect', 'oval', 'hexagon', 'ticket', 'octagon'] as const
export const STAMP_INKS = 3
export type StampShape = (typeof STAMP_SHAPES)[number]

export interface StampLook {
  shape: StampShape
  ink: 1 | 2 | 3
  rotate: number // degrees
}

const MAX_TILT = 9

// Twelve suppliers, six shapes, three inks. Stepping the ink by one extra for
// the second half of the list means no two suppliers share a shape and ink.
// A supplier we've never heard of still gets a stable look from its name.
export function stampLook(supplier: string, repEmail: string, trainingId: string): StampLook {
  const listed = (SUPPLIERS as readonly string[]).indexOf(supplier)
  const index = listed === -1 ? hashString(supplier) % 12 : listed
  const shape = STAMP_SHAPES[index % STAMP_SHAPES.length]
  const ink = (((index + Math.floor(index / STAMP_SHAPES.length)) % STAMP_INKS) + 1) as StampLook['ink']
  const tilt = unitFor(`${repEmail}|${trainingId}`, 0x5a17) * 2 - 1
  return { shape, ink, rotate: Math.round(tilt * MAX_TILT * 10) / 10 }
}
