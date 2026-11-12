// The little e-passport symbol printed on real passport covers: a rectangle
// cut through the middle with a circle at its centre. Foil, decorative.

export function ChipMark() {
  return (
    <svg className="cover__chip" viewBox="0 0 40 26" aria-hidden="true">
      <rect x={1} y={1} width={38} height={24} rx={2} />
      <circle cx={20} cy={13} r={6} />
      <line x1={1} y1={13} x2={14} y2={13} />
      <line x1={26} y1={13} x2={39} y2={13} />
    </svg>
  )
}
