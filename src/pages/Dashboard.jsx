import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserData } from '../lib/firestore';
import { footprintLevel, INDIA_AVG, GLOBAL_AVG, PARIS_TARGET } from '../lib/emissions';
import EmissionRing from '../components/EmissionRing';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Car, Home, Utensils, ShoppingBag, ArrowRight, Lightbulb, Target, Calculator } from 'lucide-react';

const CATS = [
  { key: 'transport', label: 'Transport',   icon: Car,         border: 'border-blue-200',  bg: 'bg-blue-50',   color: 'text-blue-600',   bar: '#3b82f6' },
  { key: 'home',      label: 'Home Energy', icon: Home,        border: 'border-amber-200', bg: 'bg-amber-50',  color: 'text-amber-600',  bar: '#f59e0b' },
  { key: 'food',      label: 'Food & Diet', icon: Utensils,    border: 'border-green-200', bg: 'bg-green-50',  color: 'text-green-600',  bar: '#22c55e' },
  { key: 'shopping',  label: 'Shopping',    icon: ShoppingBag, border: 'border-pink-200',  bg: 'bg-pink-50',   color: 'text-pink-600',   bar: '#ec4899' },
];

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64" role="status" aria-label="Loading dashboard">
      <div className="w-8 h-8 rounded-full border-4 border-eco-200 border-t-eco-600 animate-spin" aria-hidden="true" />
      <span className="sr-only">Loading your dashboard…</span>
    </div>
  );
}

const CustomBar = (props) => {
  const { x, y, width, height, fill } = props;
  return <rect x={x} y={y} width={width} height={height} fill={fill} rx={6} />;
};

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (currentUser) {
        const data = await getUserData(currentUser.uid);
        if (!cancelled) setUser(data);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [currentUser]);

  // EFFICIENCY: All derived values memoised.
  // Previously these recomputed on every render (e.g. when loading toggles).
  // Now they only recompute when user data actually changes.
  const hasData  = useMemo(() => (user?.totalCO2 || 0) > 0,        [user]);
  const total    = useMemo(() => user?.totalCO2 || 0,               [user]);
  const cats     = useMemo(() => user?.categoryCO2 || { transport: 0, home: 0, food: 0, shopping: 0 }, [user]);
  const name     = useMemo(() => user?.profile?.name || currentUser?.displayName || 'there', [user, currentUser]);
  const level    = useMemo(() => footprintLevel(total),             [total]);
  const goalPct  = useMemo(() => {
    const goal = user?.goal;
    return goal
      ? Math.min(Math.round(((goal.startCO2 - total) / (goal.startCO2 - goal.targetKg)) * 100), 100)
      : 0;
  }, [user, total]);

  const barData  = useMemo(() => [
    { name: 'You',       value: total,        fill: level.ring  },
    { name: 'India Avg', value: INDIA_AVG,    fill: '#16a34a'   },
    { name: 'Global',    value: GLOBAL_AVG,   fill: '#dc2626'   },
    { name: 'Paris',     value: PARIS_TARGET, fill: '#7c3aed'   },
  ], [total, level.ring]);

  if (loading) return <Spinner />;

  const goal = user?.goal;

  return (
    <div className="max-w-5xl animate-fade-in">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Hello, {name} 👋</h1>
          <p className="text-gray-400 text-sm mt-0.5">Here's your carbon footprint overview</p>
        </div>
        <Link
          to="/calculator"
          className="flex items-center gap-1.5 text-sm font-medium text-eco-600 hover:text-eco-500 border border-eco-200 hover:border-eco-400 px-4 py-2 rounded-xl transition-all"
        >
          <Calculator size={15} aria-hidden="true" /> Update data
        </Link>
      </div>

      {!hasData ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-14 text-center">
          <div className="text-5xl mb-4" aria-hidden="true">🌱</div>
          <h2 className="font-display font-bold text-lg text-gray-900 mb-2">Calculate your carbon footprint</h2>
          <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
            Answer a few questions about your lifestyle to see your personalised results.
          </p>
          <Link
            to="/calculator"
            className="inline-flex items-center gap-2 bg-eco-600 hover:bg-eco-500 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all"
          >
            <Calculator size={16} aria-hidden="true" /> Open Calculator
          </Link>
        </div>
      ) : (
        <>
          {/* Row 1: Ring + Chart */}
          <div className="grid grid-cols-3 gap-5 mb-5">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-3">
              {/* EmissionRing is already accessible via its own role="img" + title + desc */}
              <EmissionRing value={total} />
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${level.color} ${level.bg}`}>
                {level.label} Footprint
              </span>
              <p className="text-xs text-gray-400 text-center">
                {total < INDIA_AVG
                  ? `🏆 ${(INDIA_AVG - total).toLocaleString()} kg below India average`
                  : `⚠️ ${(total - INDIA_AVG).toLocaleString()} kg above India average`}
              </p>
            </div>

            {/* ACCESSIBILITY: Chart wrapped in figure with figcaption */}
            <figure className="col-span-2 bg-white border border-gray-200 rounded-2xl p-6 m-0">
              <figcaption>
                <h3 className="font-semibold text-gray-800 text-sm mb-1">How you compare</h3>
                <p className="text-xs text-gray-400 mb-4">
                  Annual kg CO₂ per person — Your {total.toLocaleString()} kg vs India avg {INDIA_AVG.toLocaleString()} kg,
                  global avg {GLOBAL_AVG.toLocaleString()} kg, Paris target {PARIS_TARGET.toLocaleString()} kg
                </p>
              </figcaption>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={barData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,.06)' }}
                    formatter={v => [`${v.toLocaleString()} kg CO₂`, 'Annual']}
                    labelStyle={{ fontWeight: 600, color: '#111' }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} shape={<CustomBar />}>
                    {barData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </figure>
          </div>

          {/* Row 2: Category cards */}
          <div className="grid grid-cols-4 gap-4 mb-5">
            {CATS.map(({ key, label, icon: Icon, border, bg, color }) => {
              const val = cats[key] || 0;
              const pct = total > 0 ? Math.round((val / total) * 100) : 0;
              return (
                <div key={key} className={`bg-white border ${border} rounded-2xl p-5 hover:shadow-sm transition-shadow`}>
                  <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                    <Icon size={17} className={color} aria-hidden="true" />
                  </div>
                  <div className="font-display font-bold text-xl text-gray-900">{val.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">kg CO₂/yr</div>
                  <div className="text-xs font-medium text-gray-500 mt-2">{label}</div>
                  <div className={`text-xs font-bold mt-0.5 ${color}`}>{pct}% of total</div>
                  {/* ACCESSIBILITY: Progress bar with role=progressbar */}
                  <div
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${label} is ${pct}% of your total footprint`}
                    className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden"
                  >
                    <div
                      className={`h-full rounded-full`}
                      style={{ width: `${pct}%`, background: `currentColor` }}
                      aria-hidden="true"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Row 3: Goal + AI CTA */}
          <div className="grid grid-cols-3 gap-4">
            {goal ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Target size={16} className="text-eco-600" aria-hidden="true" />
                  <span className="font-semibold text-sm text-gray-800">Your Goal</span>
                </div>
                <div className="text-xs text-gray-400 mb-2">
                  Reducing to <strong className="text-gray-700">{goal.targetKg.toLocaleString()} kg</strong>/yr
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={goalPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Goal progress: ${goalPct}% complete`}
                  className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1"
                >
                  <div
                    className="h-full bg-eco-500 rounded-full transition-all"
                    style={{ width: `${goalPct}%` }}
                    aria-hidden="true"
                  />
                </div>
                <p className="text-xs text-eco-600 font-medium">{goalPct}% progress</p>
              </div>
            ) : (
              <Link
                to="/goals"
                className="bg-white border border-dashed border-gray-300 rounded-2xl p-5 hover:border-eco-400 transition-all group flex flex-col justify-between"
                aria-label="Set a CO₂ reduction goal"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Target size={16} className="text-gray-400" aria-hidden="true" />
                  <span className="font-semibold text-sm text-gray-500">Set a goal</span>
                </div>
                <p className="text-xs text-gray-400">Commit to a CO₂ reduction target</p>
                <ArrowRight size={14} className="text-gray-300 group-hover:text-eco-500 mt-3 transition-colors" aria-hidden="true" />
              </Link>
            )}

            <Link
              to="/insights"
              className="col-span-2 bg-eco-950 rounded-2xl p-6 hover:bg-eco-900 transition-all flex items-center justify-between group"
              aria-label="Get personalised AI insights powered by Gemini"
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb size={18} className="text-eco-400" aria-hidden="true" />
                  <span className="font-semibold text-white text-sm">Get AI Insights</span>
                  <span className="bg-eco-400/20 text-eco-300 text-[10px] font-bold px-2 py-0.5 rounded-full" aria-hidden="true">GEMINI</span>
                </div>
                <p className="text-eco-400 text-xs max-w-xs">
                  Personalised action plan — we analyse your top emission sources and tell you exactly what to cut first.
                </p>
              </div>
              <ArrowRight size={20} className="text-eco-500 group-hover:translate-x-1.5 transition-transform shrink-0 ml-4" aria-hidden="true" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}