// The rubber stamp that comes down on today's slot when attendance gets
// recorded. It's only on screen for about a second: it drops, presses the
// ink onto the page, and lifts away. Flat shapes in the app's own colours,
// with the rubber pad in the same ink as the stamp it leaves behind.

import './Stamper.css'

interface Props {
  ink: 1 | 2 | 3 | 4
}

export function Stamper({ ink }: Props) {
  return (
    <div className={`stamper stamper--ink-${ink}`} aria-hidden="true">
      <svg className="stamper__tool" viewBox="0 0 96 112">
        {/* Knob, neck, block, rubber. Bottom edge sits on the page. */}
        <circle cx={48} cy={18} r={15} className="stamper__knob" />
        <rect x={40} y={28} width={16} height={34} rx={3} className="stamper__neck" />
        <rect x={10} y={60} width={76} height={34} rx={5} className="stamper__block" />
        <rect x={14} y={94} width={68} height={10} rx={2} className="stamper__pad" />
      </svg>
    </div>
  )
}
