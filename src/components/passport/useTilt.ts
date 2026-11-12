// Grab-to-tilt for the passport. Drag it with a mouse, or press and hold
// with a finger and then drag, and the book tilts toward your hand while the
// gold foil catches the light. Let go and it springs back flat.
// Nothing re-renders while you hold it. Each frame sets the stage's own
// transform, and the light (--tilt-x, --tilt-y and --shine, 0 to 1) goes
// only on the foil that's showing. Setting it on the stage made every page
// in the book restyle, the hidden sizer copies too, and the cover stuttered.

import { useEffect, useState, type PointerEvent } from 'react'

// Mouse: drag this far before it counts as a tilt, so a click that drifts a
// little is still a click.
const START_PX = 8
// Touch: hold still this long to pick the book up. Moving further than
// SLOP_PX first means a swipe or a scroll, so the hold is off.
const HOLD_MS = 380
const SLOP_PX = 10
// A finger that picked the book up but never moved is still a tap if it
// lets go before this, counted from touch-down. After it, it's a long press.
const LONG_PRESS_MS = 650
// Drag this far from where you grabbed it for a full tilt.
const REACH_PX = 160
// How fast the foil lights up as the book tilts. It's fully lit about a
// third of the way to a full tilt.
const SHINE_GAIN = 3
// How quickly the book catches up with your hand, as a share per 60fps frame.
const FOLLOW = 0.32
// The spring it settles back on: one small wobble, then flat.
const STIFFNESS = 190
const DAMPING = 16
// The foil on the open pages. The hidden sizer copies and the turning leaf
// are left alone.
const LIT = '.book__slot .foil, .book__slot .cover__mark'
const LIGHT = ['--tilt-x', '--tilt-y', '--shine']

interface Grip {
  id: number
  // Where and when the pointer went down.
  x: number
  y: number
  at: number
  touch: boolean
  held: boolean
  // Moved past the slop while held, so it was a tilt and not a tap.
  moved: boolean
  // The pose when it was picked up, so a book caught mid-wobble stays put.
  bx: number
  by: number
}

export interface Tilt {
  // Goes on the stage. Attaches the touch listeners and tidies up after.
  ref: (node: HTMLElement | null) => (() => void) | undefined
  onPointerDown: (event: PointerEvent) => void
  onPointerMove: (event: PointerEvent) => void
  // True when that pointer was tilting the book, so it wasn't a tap or a swipe.
  onPointerUp: (event: PointerEvent) => boolean
  onPointerCancel: (event: PointerEvent) => void
  onLostPointerCapture: (event: PointerEvent) => void
  setReduced: (reduced: boolean) => void
}

const clamp = (n: number) => Math.max(-1, Math.min(1, n))

export function useTilt(reduced: boolean): Tilt {
  const [tilt] = useState(createTilt)
  useEffect(() => tilt.setReduced(reduced), [tilt, reduced])
  return tilt
}

function createTilt(): Tilt {
  let el: HTMLElement | null = null
  let grip: Grip | null = null
  let goal = { x: 0, y: 0 }
  const pose = { x: 0, y: 0, vx: 0, vy: 0, lift: 0 }
  let holdTimer = 0
  let frame = 0
  let last = 0
  let reduced = false

  const foil = () => (el ? Array.from(el.querySelectorAll<HTMLElement>(LIT)) : [])

  const write = () => {
    if (!el) return
    const { x, y, lift } = pose
    // Reduced motion: the book stays flat and only the light moves.
    if (reduced) el.style.removeProperty('transform')
    else
      el.style.transform = `perspective(var(--tilt-depth)) rotateX(calc(var(--tilt-reach-x) * ${(-y).toFixed(4)})) rotateY(calc(var(--tilt-reach-y) * ${x.toFixed(4)})) scale(${(1 + lift * 0.015).toFixed(4)})`
    const shine = Math.min(1, Math.hypot(x, y) * SHINE_GAIN).toFixed(3)
    for (const node of foil()) {
      node.style.setProperty('--tilt-x', x.toFixed(4))
      node.style.setProperty('--tilt-y', y.toFixed(4))
      node.style.setProperty('--shine', shine)
    }
  }

  // Back to flat and still, with nothing left on the stage or the foil.
  const rest = () => {
    cancelAnimationFrame(frame)
    frame = 0
    Object.assign(pose, { x: 0, y: 0, vx: 0, vy: 0, lift: 0 })
    goal = { x: 0, y: 0 }
    if (!el) return
    el.classList.remove('is-lit', 'is-held')
    el.style.removeProperty('transform')
    for (const node of foil()) for (const name of LIGHT) node.style.removeProperty(name)
  }

  // One loop for both phases. Held, the pose eases toward your hand. Let go,
  // it rides a spring back to zero and stops once it's there.
  const step = (now: number) => {
    if (!el) {
      frame = 0
      return
    }
    // The first frame has no previous one to measure from, and a frame's
    // timestamp can land a touch before the input that started the loop.
    const dt = last ? Math.min(0.034, Math.max(0, (now - last) / 1000)) : 1 / 60
    last = now
    if (grip?.held) {
      const k = 1 - Math.pow(1 - FOLLOW, dt * 60)
      pose.x += (goal.x - pose.x) * k
      pose.y += (goal.y - pose.y) * k
      pose.lift += (1 - pose.lift) * k
      pose.vx = 0
      pose.vy = 0
    } else {
      pose.vx += (-STIFFNESS * pose.x - DAMPING * pose.vx) * dt
      pose.vy += (-STIFFNESS * pose.y - DAMPING * pose.vy) * dt
      pose.x += pose.vx * dt
      pose.y += pose.vy * dt
      pose.lift += (0 - pose.lift) * Math.min(1, dt * 12)
      const still = Math.abs(pose.x) + Math.abs(pose.y) < 0.002 && Math.abs(pose.vx) + Math.abs(pose.vy) < 0.02
      if (still && pose.lift < 0.01) {
        rest()
        return
      }
    }
    write()
    frame = requestAnimationFrame(step)
  }

  const run = () => {
    if (frame) return
    last = 0
    frame = requestAnimationFrame(step)
  }

  const pickUp = () => {
    if (!el || !grip) return
    grip.held = true
    grip.bx = pose.x
    grip.by = pose.y
    goal = { x: pose.x, y: pose.y }
    el.classList.add('is-lit', 'is-held')
    if (!grip.touch) {
      // A mouse drag can start selecting text before it counts as a tilt.
      const selection = document.getSelection()
      if (selection && !selection.isCollapsed && selection.anchorNode && el.contains(selection.anchorNode)) selection.removeAllRanges()
      // Keep the moves coming when the mouse leaves the book. A finger
      // already keeps its own, and taking it over makes Safari drop the hold.
      try {
        el.setPointerCapture(grip.id)
      } catch {
        // The pointer may already be gone. The next up or cancel tidies up.
      }
    }
    run()
  }

  // Returns true when the gesture was a tilt, so its click gets swallowed.
  const letGo = () => {
    window.clearTimeout(holdTimer)
    const g = grip
    grip = null
    if (!g?.held || !el) return false
    goal = { x: 0, y: 0 }
    el.classList.remove('is-held')
    if (reduced) rest()
    else run()
    // A mouse only picks up once it has dragged. A finger that never moved
    // is still a tap, unless it held on long enough to be a long press.
    return !g.touch || g.moved || performance.now() - g.at >= LONG_PRESS_MS
  }

  const onTouchMove = (event: TouchEvent) => {
    // While the book is held, a finger dragging up or down tilts it instead
    // of scrolling the page. React's touch listeners are passive, so this
    // one is added by hand.
    if (grip?.held) event.preventDefault()
  }
  const onContextMenu = (event: Event) => {
    // A long press picks the book up instead of opening the menu.
    if (grip?.touch) event.preventDefault()
  }

  return {
    ref(node) {
      if (!node) return undefined
      el = node
      node.addEventListener('touchmove', onTouchMove, { passive: false })
      node.addEventListener('contextmenu', onContextMenu)
      return () => {
        node.removeEventListener('touchmove', onTouchMove)
        node.removeEventListener('contextmenu', onContextMenu)
        window.clearTimeout(holdTimer)
        grip = null
        rest()
        if (el === node) el = null
      }
    },
    onPointerDown(event) {
      if (!event.isPrimary) {
        // A second finger means a pinch. Let the browser have it.
        if (grip?.touch) letGo()
        return
      }
      if (grip?.held) return
      if (event.pointerType === 'mouse' && event.button !== 0) return
      const target = event.target as Element
      // Only the book picks up, not the empty half beside a closed one.
      if (!target.closest('.book__slot .page')) return
      // Under reduced motion the book stays flat, so only a cover, where
      // the light moving across the foil shows, is worth picking up.
      if (reduced && !target.closest('.cover')) return
      const touch = event.pointerType !== 'mouse'
      grip = { id: event.pointerId, x: event.clientX, y: event.clientY, at: performance.now(), touch, held: false, moved: false, bx: 0, by: 0 }
      window.clearTimeout(holdTimer)
      if (touch) holdTimer = window.setTimeout(pickUp, HOLD_MS)
    },
    onPointerMove(event) {
      const g = grip
      if (!g || g.id !== event.pointerId) return
      const dx = event.clientX - g.x
      const dy = event.clientY - g.y
      const far = Math.hypot(dx, dy)
      if (!g.held) {
        if (g.touch) {
          if (far > SLOP_PX) {
            window.clearTimeout(holdTimer)
            grip = null
          }
          return
        }
        if ((event.buttons & 1) === 0) {
          grip = null
          return
        }
        if (far < START_PX) return
        pickUp()
      }
      if (far > SLOP_PX) g.moved = true
      goal = { x: clamp(g.bx + dx / REACH_PX), y: clamp(g.by + dy / REACH_PX) }
    },
    onPointerUp(event) {
      if (grip && grip.id !== event.pointerId) return false
      return letGo()
    },
    onPointerCancel(event) {
      if (grip && grip.id !== event.pointerId) return
      letGo()
    },
    onLostPointerCapture(event) {
      // Only the stage losing its own capture counts. Safari also sends one
      // up from the element a finger first touched, and that's not a let-go.
      if (event.target !== event.currentTarget) return
      if (grip?.held && grip.id === event.pointerId) letGo()
    },
    setReduced(value) {
      reduced = value
      if (value) el?.style.removeProperty('transform')
    },
  }
}
