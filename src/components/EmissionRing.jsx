// Animated SVG circular gauge — the hero element of the Dashboard
export default function EmissionRing({ value = 0, max = 12000, size = 200, stroke = 18 }) {
  const r   = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct  = Math.min(value / max, 1);
  const offset = circ * (1 - pct);

  const color =
    pct < 0.25 ? '#16a34a' :
    pct < 0.55 ? '#ca8a04' :
    pct < 0.80 ? '#ea580c' : '#dc2626';

  const tons = (value / 1000).toFixed(2);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" style={{ position: 'absolute' }}>
        {/* Track */}
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
        {/* Value arc */}
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1), stroke 0.6s ease' }}
        />
      </svg>
      <div className="text-center z-10">
        <div className="font-display font-extrabold leading-none" style={{ fontSize: size * 0.17, color }}>{tons}</div>
        <div className="text-gray-400 font-medium" style={{ fontSize: size * 0.072 }}>tons CO₂/yr</div>
      </div>
    </div>
  );
}
