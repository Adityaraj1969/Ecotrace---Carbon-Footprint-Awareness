import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Calculator, Lightbulb, CheckSquare, Target, LogOut, Leaf } from 'lucide-react';

const NAV = [
  { to: '/dashboard',  label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/calculator', label: 'Calculator',  icon: Calculator      },
  { to: '/insights',   label: 'AI Insights', icon: Lightbulb       },
  { to: '/habits',     label: 'Habits',      icon: CheckSquare     },
  { to: '/goals',      label: 'Goals',       icon: Target          },
];

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate     = useNavigate();

  async function handleLogout() { await logout(); navigate('/'); }

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-eco-950 flex flex-col z-20 shadow-xl">
      {/* Brand */}
      <div className="px-5 py-6 border-b border-eco-800">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-eco-500 rounded-lg flex items-center justify-center shrink-0">
            {/* ACCESSIBILITY: was area-hidden (typo) — now correctly aria-hidden
                The sr-only span below already provides the accessible label */}
            <Leaf size={16} className="text-white" aria-hidden="true" />
            <span className="sr-only">EcoTrace Logo</span>
          </div>
          <span className="font-display font-bold text-lg text-white tracking-tight">EcoTrace</span>
        </Link>
        <p className="text-eco-500 text-xs mt-2 truncate">{currentUser?.displayName || currentUser?.email}</p>
      </div>

      {/* Nav links */}
      {/* ACCESSIBILITY: role="navigation" with aria-label disambiguates from
          any other nav landmarks on the page */}
      <nav
        className="flex-1 px-3 py-4 space-y-0.5"
        aria-label="Main navigation"
      >
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-eco-500 focus-visible:outline-none ${
                active
                  ? 'bg-eco-600 text-white shadow-sm'
                  : 'text-eco-300 hover:bg-eco-800/70 hover:text-white'
              }`}
            >
              {/* Icons are decorative — label text already describes the link */}
              <Icon size={17} className={active ? 'text-white' : 'text-eco-400'} aria-hidden="true" />
              {label}
              {label === 'AI Insights' && (
                <span
                  className="ml-auto bg-eco-400/20 text-eco-300 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                  aria-label="Powered by AI"
                >
                  AI
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-5 border-t border-eco-800 pt-4">
        {/* ACCESSIBILITY: aria-label added — screen readers now say
            "Sign out, button" instead of just "button" */}
        <button
          onClick={handleLogout}
          aria-label="Sign out of EcoTrace"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-eco-400 hover:bg-eco-800 hover:text-white transition-all"
        >
          <LogOut size={17} aria-hidden="true" /> Sign out
        </button>
      </div>
    </aside>
  );
}