import { Link } from 'react-router-dom';
import { Leaf, BarChart2, Brain, CheckCircle2, ArrowRight, TrendingDown, Shield } from 'lucide-react';

const FEATURES = [
  { icon: BarChart2,    title: 'Precise Tracking',     desc: 'Transport, home energy, food, and shopping — calculated using official India emission factors from CEA & IPCC.' },
  { icon: Brain,        title: 'Gemini AI Advisor',    desc: 'Our AI analyses your lifestyle and builds a personalised weekly action plan to cut your carbon output.' },
  { icon: CheckCircle2, title: 'Daily Habit Streaks',  desc: 'Log eco-habits, earn badges, and build streaks that make sustainable living feel like a game you actually want to win.' },
];

const STATS = [
  { value: '2 tons',   label: 'India avg CO₂/person/year' },
  { value: '4.8 tons', label: 'Global avg CO₂/person/year' },
  { value: '1.5 tons', label: 'Paris Agreement target' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-eco-950 text-white font-sans">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-eco-800/60 sticky top-0 bg-eco-950/95 backdrop-blur z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-eco-500 rounded-lg flex items-center justify-center">
            <Leaf size={16} />
          </div>
          <span className="font-display font-bold text-lg">EcoTrace</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/auth" className="text-eco-300 hover:text-white text-sm font-medium transition-colors px-3 py-1.5">
            Sign in
          </Link>
          <Link to="/auth?mode=signup"
            className="bg-eco-500 hover:bg-eco-400 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-eco-900/50">
            Get Started Free
          </Link>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-8 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-eco-900 border border-eco-700 rounded-full px-4 py-1.5 text-eco-300 text-xs font-medium mb-8">
          <TrendingDown size={13} />
          Powered by Gemini AI &amp; India emission data
        </div>
        <h1 className="font-display font-extrabold text-5xl sm:text-6xl leading-[1.1] mb-6 tracking-tight">
          Know your carbon.<br />
          <span className="text-eco-400">Own your impact.</span>
        </h1>
        <p className="text-eco-300 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
          EcoTrace measures your personal carbon footprint with India-specific data, then gives you a personalised AI-driven plan to reduce it — step by step.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link to="/auth?mode=signup"
            className="inline-flex items-center gap-2 bg-eco-500 hover:bg-eco-400 text-white px-8 py-4 rounded-2xl font-semibold transition-all shadow-xl shadow-eco-950">
            Calculate mine free <ArrowRight size={18} />
          </Link>
          <Link to="/auth"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold border border-eco-700 hover:border-eco-500 text-eco-300 hover:text-white transition-all">
            Sign in
          </Link>
        </div>
        <p className="text-eco-600 text-sm mt-5">No credit card. No ads. Free forever.</p>
      </section>

      {/* ── Stats bar ──────────────────────────────────────────── */}
      <div className="bg-eco-900/60 border-y border-eco-800 py-8">
        <div className="max-w-3xl mx-auto px-8 grid grid-cols-3 gap-6 text-center">
          {STATS.map(({ value, label }) => (
            <div key={label}>
              <div className="font-display font-bold text-3xl text-eco-400 mb-1">{value}</div>
              <div className="text-eco-500 text-sm">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ───────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-8 py-24">
        <h2 className="font-display font-bold text-3xl text-center mb-14">Everything you need to go green</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-eco-900 border border-eco-800 rounded-2xl p-6 hover:border-eco-600 transition-all">
              <div className="w-10 h-10 bg-eco-800 rounded-xl flex items-center justify-center mb-5">
                <Icon size={20} className="text-eco-400" />
              </div>
              <h3 className="font-display font-bold text-base mb-2">{title}</h3>
              <p className="text-eco-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <section className="text-center pb-24 px-8">
        <div className="max-w-xl mx-auto bg-eco-900 border border-eco-700 rounded-3xl p-10">
          <div className="flex items-center justify-center gap-2 text-eco-400 mb-4">
            <Shield size={18} /> <span className="text-sm font-medium">Free &amp; Private. Your data stays yours.</span>
          </div>
          <h2 className="font-display font-bold text-3xl mb-3">Start in 3 minutes.</h2>
          <p className="text-eco-400 text-sm mb-7">Answer a few lifestyle questions and instantly see your carbon footprint.</p>
          <Link to="/auth?mode=signup"
            className="inline-flex items-center gap-2 bg-eco-500 hover:bg-eco-400 text-white px-8 py-4 rounded-2xl font-semibold transition-all">
            Create free account <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-eco-900 text-center py-6 text-eco-700 text-xs">
        © 2026 EcoTrace — Built with Gemini AI &amp; Google Antigravity
      </footer>
    </div>
  );
}
