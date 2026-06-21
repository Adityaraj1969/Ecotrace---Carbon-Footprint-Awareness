import { memo } from 'react';

// EFFICIENCY: Wrapped in React.memo.
// The ring only re-renders when value/max/size/stroke props actually change.
// Without memo, every Dashboard state update (e.g. loading flag) triggered a
// full SVG re-render including the CSS transition animation.

function EmissionRing({ value = 0, max = 12000, size = 200, stroke = 18 }) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct  = Math.min(value / max, 1);
  const offset = circ * (1 - pct);

  const color =
    pct < 0.25 ? '#16a34a' :
    pct < 0.55 ? '#ca8a04' :
    pct < 0.80 ? '#ea580c' : '#dc2626';

  const tons = (value / 1000).toFixed(2);

  // ACCESSIBILITY : Derive human-readable comparison text for screen readers
  const INDIA_AVG = 2000;
  const comparison =
    value < INDIA_AVG
      ? `${(INDIA_AVG - value).toLocaleString()} kg below the India average`
      : `${(value - INDIA_AVG).toLocaleString()} kg above the India average`;

  // Unique IDs for aria-labelledby — safe for single-page use
  const titleId = 'emission-ring-title';
  const descId  = 'emission-ring-desc';

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* ACCESSIBILITY:
          - role="img" tells screen readers this SVG is a meaningful image
          - aria-labelledby links to <title> and <desc> inside the SVG
          - <title> gives a short name (read first)
          - <desc> gives the full data context
          - aria-hidden="true" on decorative circles prevents redundant announcements
          - The SVG rotation is visual only; screen readers use the text, not geometry */}
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        style={{ position: 'absolute' }}
        role="img"
        aria-labelledby={`${titleId} ${descId}`}
      >
        <title id={titleId}>Carbon Footprint Ring</title>
        <desc id={descId}>
          Your annual carbon footprint is {tons} tonnes of CO₂, which is {comparison}.
        </desc>

        {/* Track — decorative, screen readers skip it */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="#e5e7eb" strokeWidth={stroke}
          aria-hidden="true"
        />
        {/* Value arc — decorative, data is in <desc> above */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          aria-hidden="true"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1), stroke 0.6s ease' }}
        />
      </svg>

      {/* Centre text — aria-hidden because the SVG <desc> already conveys this */}
      <div className="text-center z-10" aria-hidden="true">
        <div
          className="font-display font-extrabold leading-none"
          style={{ fontSize: size * 0.17, color }}
        >
          {tons}
        </div>
        <div className="text-gray-400 font-medium" style={{ fontSize: size * 0.072 }}>
          tons CO₂/yr
        </div>
      </div>
    </div>
  );
}

// EFFICIENCY: memo export
export default memo(EmissionRing);