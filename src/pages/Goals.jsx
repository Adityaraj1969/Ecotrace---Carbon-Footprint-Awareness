import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserData, saveGoal } from '../lib/firestore';
import { INDIA_AVG, PARIS_TARGET, footprintLevel } from '../lib/emissions';
import { Target, TrendingDown, CheckCircle, AlertCircle, Calculator } from 'lucide-react';
import { Link } from 'react-router-dom';

const PRESETS = [
  { label: 'India Average',  value: 2000, emoji: '🇮🇳', desc: 'Match the Indian national average' },
  { label: 'Paris Target',   value: 2300, emoji: '🌍', desc: 'Align with the Paris Agreement goal' },
  { label: 'Cut by 25%',     value: null, emoji: '✂️',  desc: 'Reduce your current footprint by 25%', pct: 0.75 },
  { label: 'Cut by 50%',     value: null, emoji: '🌿',  desc: 'Halve your annual emissions',          pct: 0.50 },
];

function ProgressRing({ pct, size = 120, stroke = 12 }) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const off  = circ * (1 - Math.min(pct / 100, 1));
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#16a34a" strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)' }} />
    </svg>
  );
}

export default function Goals() {
  const { currentUser } = useAuth();
  const [userData, setData] = useState(null);
  const [target, setTarget] = useState('');
  const [busy, setBusy]     = useState(false);
  const [saved, setSaved]   = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const d = await getUserData(currentUser.uid);
      setData(d);
      if (d?.goal?.targetKg) setTarget(d.goal.targetKg.toString());
      setLoading(false);
    })();
  }, [currentUser]);

  const current   = userData?.totalCO2 || 0;
  const goal      = userData?.goal;
  const targetKg  = goal?.targetKg || 0;
  const startCO2  = goal?.startCO2 || current;
  const level     = footprintLevel(current);

  const reduction = startCO2 - current;
  const needed    = startCO2 - targetKg;
  const pct       = needed > 0 ? Math.max(0, Math.min(Math.round((reduction / needed) * 100), 100)) : 0;

  const reductionNeeded = current - (parseInt(target) || 0);
  const monthsToGoal    = reductionNeeded > 0 ? Math.ceil(reductionNeeded / (reductionNeeded * 0.05)) : null;

  async function handleSave() {
    if (!target || isNaN(+target)) return;
    setBusy(true);
    await saveGoal(currentUser.uid, +target, current);
    const d = await getUserData(currentUser.uid);
    setData(d);
    setSaved(true); setBusy(false);
    setTimeout(() => setSaved(false), 3000);
  }

  function applyPreset(p) {
    const val = p.value ?? Math.round(current * (p.pct || 1));
    setTarget(val.toString());
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-4 border-eco-200 border-t-eco-600 animate-spin" />
    </div>
  );

  const hasData = current > 0;

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-gray-900">Your Carbon Goal</h1>
        <p className="text-gray-400 text-sm mt-0.5">Set a target and track your progress</p>
      </div>

      {!hasData ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center">
          <div className="text-4xl mb-4">🎯</div>
          <p className="font-semibold text-gray-700 mb-2">No footprint data yet</p>
          <p className="text-gray-400 text-sm mb-5">Complete the calculator first to set a meaningful goal.</p>
          <Link to="/calculator" className="inline-flex items-center gap-2 bg-eco-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-eco-500 transition-all">
            <Calculator size={15} /> Open Calculator
          </Link>
        </div>
      ) : (
        <>
          {/* Current status */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-5 flex items-center gap-6">
            <div className="shrink-0">
              <div className="relative inline-flex items-center justify-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex flex-col items-center justify-center border-4 border-gray-200">
                  <span className="font-display font-bold text-xl" style={{ color: level.ring }}>
                    {(current / 1000).toFixed(1)}
                  </span>
                  <span className="text-[9px] text-gray-400 font-medium">t CO₂/yr</span>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 mb-1">Current annual footprint</p>
              <p className="font-display font-bold text-2xl text-gray-900">{current.toLocaleString()} kg CO₂/year</p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${level.color} ${level.bg}`}>{level.label}</span>
                {current > INDIA_AVG
                  ? <span className="text-xs text-gray-400">⚠️ {(current - INDIA_AVG).toLocaleString()} kg above India avg</span>
                  : <span className="text-xs text-gray-400">✅ {(INDIA_AVG - current).toLocaleString()} kg below India avg</span>}
              </div>
            </div>
          </div>

          {/* Active goal progress */}
          {goal && (
            <div className="bg-eco-50 border border-eco-200 rounded-2xl p-6 mb-5">
              <div className="flex items-center gap-4">
                <div className="relative inline-flex items-center justify-center shrink-0">
                  <ProgressRing pct={pct} />
                  <div className="absolute text-center">
                    <div className="font-display font-bold text-xl text-eco-700">{pct}%</div>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-eco-800 mb-1">Goal in progress</p>
                  <p className="text-sm text-eco-700">
                    Reducing from <strong>{startCO2.toLocaleString()}</strong> → <strong>{targetKg.toLocaleString()} kg</strong>
                  </p>
                  {reduction > 0
                    ? <p className="text-xs text-eco-600 mt-1.5 flex items-center gap-1"><CheckCircle size={13} /> Reduced by {reduction.toLocaleString()} kg so far</p>
                    : <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1"><AlertCircle size={13} /> Update your calculator to track progress</p>}
                  <div className="mt-3 h-2 bg-eco-200 rounded-full overflow-hidden">
                    <div className="h-full bg-eco-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-eco-600 mt-1.5">{pct}% of the way there</p>
                </div>
              </div>
            </div>
          )}

          {/* Set / update goal */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Target size={18} className="text-eco-600" />
              <h2 className="font-display font-bold text-base text-gray-900">{goal ? 'Update your goal' : 'Set your goal'}</h2>
            </div>

            {/* Presets */}
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick presets</p>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {PRESETS.map(p => {
                const val = p.value ?? Math.round(current * (p.pct || 1));
                return (
                  <button key={p.label} onClick={() => applyPreset(p)}
                    className={`text-left p-3 rounded-xl border-2 transition-all ${
                      target === val.toString() ? 'border-eco-500 bg-eco-50' : 'border-gray-200 hover:border-eco-300'
                    }`}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span>{p.emoji}</span>
                      <span className="font-semibold text-sm text-gray-900">{p.label}</span>
                    </div>
                    <p className="text-xs text-gray-400">{p.desc}</p>
                    <p className="text-xs font-bold text-eco-600 mt-1">{val.toLocaleString()} kg/yr</p>
                  </button>
                );
              })}
            </div>

            {/* Custom input */}
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Or enter a custom target</p>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input type="number" min={100} max={current} value={target}
                  onChange={e => { setTarget(e.target.value); setSaved(false); }}
                  placeholder="e.g. 2000"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-eco-500 transition-colors" />
                <span className="absolute right-4 top-3.5 text-xs text-gray-400">kg CO₂/yr</span>
              </div>
              <button onClick={handleSave} disabled={!target || busy}
                className="flex items-center gap-2 bg-eco-600 hover:bg-eco-500 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50">
                {saved ? <><CheckCircle size={15} /> Saved!</> : busy ? 'Saving…' : <><TrendingDown size={15} /> Set Goal</>}
              </button>
            </div>

            {target && !isNaN(+target) && +target < current && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-700 font-medium">
                  Reduction needed: <strong className="text-eco-700">{(current - +target).toLocaleString()} kg</strong>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  That's {((1 - +target / current) * 100).toFixed(0)}% below your current footprint
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
