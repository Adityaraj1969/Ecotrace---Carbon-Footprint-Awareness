import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserData, logHabits, getHabitLog, updateStreak } from '../lib/firestore';
import { Flame, Award } from 'lucide-react';

const today = () => new Date().toISOString().split('T')[0];

const HABITS = [
  { id: 'public_transport', emoji: '🚌', title: 'Used public transport',    desc: 'Bus, metro, or train instead of car',       co2: 2.5 },
  { id: 'walked_cycled',    emoji: '🚲', title: 'Walked or cycled',          desc: 'For short trips under 5 km',               co2: 1.8 },
  { id: 'vegetarian',       emoji: '🥗', title: 'Ate vegetarian all day',    desc: 'Zero meat or fish today',                   co2: 1.8 },
  { id: 'reduced_ac',       emoji: '🌡️', title: 'Reduced AC/heater usage',  desc: 'Used fan or dressed for weather instead',   co2: 0.8 },
  { id: 'no_plastic',       emoji: '🛍️', title: 'Avoided single-use plastic',desc: 'Brought reusable bags and bottles',        co2: 0.2 },
  { id: 'recycled',         emoji: '♻️', title: 'Segregated waste',          desc: 'Separated dry, wet, and e-waste',           co2: 0.4 },
  { id: 'short_shower',     emoji: '🚿', title: 'Short shower (< 5 min)',    desc: 'Saved water and water-heating energy',      co2: 0.3 },
  { id: 'unplugged',        emoji: '🔌', title: 'Unplugged idle devices',    desc: 'Switched off chargers and appliances',      co2: 0.2 },
  { id: 'local_food',       emoji: '🌿', title: 'Bought local produce',      desc: 'From a nearby market or kirana store',      co2: 0.5 },
  { id: 'no_order',         emoji: '📦', title: 'Skipped online delivery',   desc: 'No food or shopping deliveries today',      co2: 0.5 },
  { id: 'composted',        emoji: '🌱', title: 'Composted food scraps',     desc: 'Kitchen waste went into a compost bin',     co2: 0.3 },
  { id: 'carpool',          emoji: '🚗', title: 'Carpooled or shared ride',  desc: 'Shared a vehicle with at least one person', co2: 1.2 },
];

const BADGES = [
  { id: 'first_day',    emoji: '🌱', label: 'First Step',       req: 1,   desc: 'Logged habits for the first time'     },
  { id: 'week',         emoji: '🔥', label: 'Week Warrior',     req: 7,   desc: '7-day streak'                         },
  { id: 'month',        emoji: '🏆', label: 'Eco Champion',     req: 30,  desc: '30-day streak'                        },
  { id: 'fifty',        emoji: '💎', label: 'Green 50',         req: 50,  desc: '50-day streak'                        },
  { id: 'hundred',      emoji: '🌍', label: 'Earth Guardian',   req: 100, desc: '100-day streak'                       },
];

function getBadges(streak) {
  return BADGES.filter(b => streak >= b.req).map(b => b.id);
}

export default function Habits() {
  const { currentUser } = useAuth();
  const [checked, setChecked]   = useState(new Set());
  const [streak, setStreak]     = useState(0);
  const [badges, setBadges]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    (async () => {
      const data = await getUserData(currentUser.uid);
      const log  = await getHabitLog(currentUser.uid, today());
      if (log?.habits) setChecked(new Set(log.habits));
      setStreak(data?.habits?.streak || 0);
      setBadges(data?.habits?.badges || []);
      setLoading(false);
    })();
  }, [currentUser]);

  async function toggle(id) {
    if (saving) return;
    setSaving(true);
    const next = new Set(checked);
    next.has(id) ? next.delete(id) : next.add(id);
    setChecked(next);

    const habitArr = [...next];
    const co2Saved = HABITS.filter(h => next.has(h.id)).reduce((s, h) => s + h.co2, 0);
    await logHabits(currentUser.uid, today(), habitArr, Math.round(co2Saved * 10) / 10);

    // Update streak if any habit ticked today
    if (next.size > 0) {
      const newStreak = streak + 1; // simplified — production would check date continuity
      const newBadges = getBadges(newStreak);
      setStreak(s => Math.max(s, newStreak));
      setBadges(newBadges);
      await updateStreak(currentUser.uid, Math.max(streak, newStreak), newBadges, today());
    }
    setSaving(false);
  }

  const co2Today = HABITS.filter(h => checked.has(h.id)).reduce((s, h) => s + h.co2, 0);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-4 border-eco-200 border-t-eco-600 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-3xl animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Daily Habits</h1>
          <p className="text-gray-400 text-sm mt-0.5">Tick off what you did today — resets at midnight</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 px-3 py-2 rounded-xl">
            <Flame size={18} className="text-orange-500" />
            <span className="font-display font-bold text-lg text-orange-600">{streak}</span>
            <span className="text-xs text-orange-400 font-medium">day streak</span>
          </div>
          <div className="text-right">
            <div className="font-display font-bold text-lg text-eco-600">{co2Today.toFixed(1)} kg</div>
            <div className="text-xs text-gray-400">CO₂ saved today</div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-5 flex items-center gap-4">
        <span className="text-sm font-medium text-gray-600">{checked.size} / {HABITS.length} today</span>
        <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-eco-400 to-eco-600 rounded-full transition-all duration-500"
            style={{ width: `${(checked.size / HABITS.length) * 100}%` }} />
        </div>
        <span className="text-sm font-semibold text-eco-600">{Math.round((checked.size / HABITS.length) * 100)}%</span>
      </div>

      {/* Habit grid */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {HABITS.map(h => {
          const done = checked.has(h.id);
          return (
            <button key={h.id} onClick={() => toggle(h.id)}
              className={`text-left p-4 rounded-2xl border-2 transition-all hover:scale-[1.01] active:scale-[0.99] ${
                done ? 'border-eco-400 bg-eco-50' : 'border-gray-200 bg-white hover:border-eco-200'
              }`}>
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl">{h.emoji}</span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  done ? 'border-eco-500 bg-eco-500' : 'border-gray-300'
                }`}>
                  {done && <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L4 7L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>}
                </div>
              </div>
              <p className={`text-sm font-semibold mb-0.5 ${done ? 'text-eco-800' : 'text-gray-800'}`}>{h.title}</p>
              <p className="text-xs text-gray-400 leading-relaxed">{h.desc}</p>
              <p className={`text-xs font-bold mt-2 ${done ? 'text-eco-600' : 'text-gray-300'}`}>
                💚 Save {h.co2} kg CO₂
              </p>
            </button>
          );
        })}
      </div>

      {/* Badges */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Award size={18} className="text-amber-500" />
          <h2 className="font-display font-bold text-base text-gray-900">Badges</h2>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {BADGES.map(b => {
            const earned = badges.includes(b.id);
            return (
              <div key={b.id} title={b.desc}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                  earned ? 'border-amber-200 bg-amber-50' : 'border-gray-100 bg-gray-50 opacity-40 grayscale'
                }`}>
                <span className="text-2xl">{b.emoji}</span>
                <span className={`text-[10px] font-bold ${earned ? 'text-amber-700' : 'text-gray-400'}`}>{b.label}</span>
                <span className="text-[9px] text-gray-400">{b.req} days</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
