import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserData, saveProfile } from '../lib/firestore';
import { Leaf, Mail, Lock, User, AlertCircle } from 'lucide-react';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.082 17.64 11.775 17.64 9.2z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
    <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
  </svg>
);

export default function Auth() {
  const [params]              = useSearchParams();
  const [isSignup, setSignup] = useState(params.get('mode') === 'signup');
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [pass, setPass]       = useState('');
  const [error, setError]     = useState('');
  const [busy, setBusy]       = useState(false);

  const { currentUser, signup, login, loginGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (currentUser) navigate('/dashboard'); }, [currentUser]);

  function cleanErr(msg) {
    return msg.replace('Firebase: ', '').replace(/\s*\(auth\/[^)]*\)\.?/, '').trim();
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      if (isSignup) {
        const { user } = await signup(email, pass);
        await saveProfile(user.uid, { name, email, onboardingComplete: false });
        navigate('/onboarding');
      } else {
        const { user } = await login(email, pass);
        const data = await getUserData(user.uid);
        navigate(data?.profile?.onboardingComplete ? '/dashboard' : '/onboarding');
      }
    } catch (err) { setError(cleanErr(err.message)); }
    setBusy(false);
  }

  async function handleGoogle() {
    setError(''); setBusy(true);
    try {
      const { user } = await loginGoogle();
      const data = await getUserData(user.uid);
      if (!data?.profile?.onboardingComplete) {
        await saveProfile(user.uid, { name: user.displayName || '', email: user.email, onboardingComplete: false });
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch { setError('Google sign-in failed. Please try again.'); }
    setBusy(false);
  }

  const field = 'w-full bg-eco-800 border border-eco-700 text-white placeholder-eco-500 rounded-xl py-3 pl-9 pr-4 text-sm focus:outline-none focus:border-eco-400 transition-colors';

  return (
    <div className="min-h-screen bg-eco-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-white">
            <div className="w-9 h-9 bg-eco-500 rounded-xl flex items-center justify-center">
              <Leaf size={18} />
            </div>
            <span className="font-display font-bold text-xl">EcoTrace</span>
          </Link>
          <p className="text-eco-400 text-sm mt-2">
            {isSignup ? 'Create your free account' : 'Welcome back'}
          </p>
        </div>

        <div className="bg-eco-900 border border-eco-800 rounded-2xl p-7">
          {/* Google */}
          <button onClick={handleGoogle} disabled={busy}
            className="w-full flex items-center justify-center gap-2.5 bg-white text-gray-800 hover:bg-gray-100 py-2.5 px-4 rounded-xl text-sm font-medium transition-all mb-5 disabled:opacity-50">
            <GoogleIcon /> Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-eco-800" />
            <span className="text-eco-600 text-xs">or email</span>
            <div className="flex-1 h-px bg-eco-800" />
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-950/50 border border-red-700 rounded-xl p-3 mb-4 text-red-300 text-xs">
              <AlertCircle size={14} className="mt-0.5 shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {isSignup && (
              <div className="relative">
                <User size={14} className="absolute left-3 top-3.5 text-eco-500" />
                <input type="text" placeholder="Your name" value={name} required
                  onChange={e => setName(e.target.value)} className={field} />
              </div>
            )}
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-3.5 text-eco-500" />
              <input type="email" placeholder="Email" value={email} required
                onChange={e => setEmail(e.target.value)} className={field} />
            </div>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-3.5 text-eco-500" />
              <input type="password" placeholder="Password (min 6 chars)" value={pass} required minLength={6}
                onChange={e => setPass(e.target.value)} className={field} />
            </div>
            <button type="submit" disabled={busy}
              className="w-full bg-eco-600 hover:bg-eco-500 text-white py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 mt-1">
              {busy ? 'Please wait…' : isSignup ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-eco-500 text-xs mt-5">
            {isSignup ? 'Already have an account? ' : "Don't have an account? "}
            <button onClick={() => { setSignup(!isSignup); setError(''); }}
              className="text-eco-400 hover:text-eco-300 font-semibold">
              {isSignup ? 'Sign in' : 'Sign up free'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
