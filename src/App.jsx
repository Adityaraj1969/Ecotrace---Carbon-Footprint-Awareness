import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute   from './components/ProtectedRoute';
import Layout           from './components/Layout';
import ErrorBoundary    from './components/ErrorBoundary';

// Each page is now a separate JS chunk — only downloaded when the user
// navigates to that route, not on initial app load.
const Landing    = lazy(() => import('./pages/Landing'));
const Auth       = lazy(() => import('./pages/Auth'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Dashboard  = lazy(() => import('./pages/Dashboard'));
const Calculator = lazy(() => import('./pages/Calculator'));
const Insights   = lazy(() => import('./pages/Insights'));
const Habits     = lazy(() => import('./pages/Habits'));
const Goals      = lazy(() => import('./pages/Goals'));

// Minimal loading fallback shown while a lazy chunk downloads
function PageLoader() {
  return (
    <div
      role="status"
      aria-label="Loading page"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: '4px solid #d1fae5',
          borderTopColor: '#16a34a',
          animation: 'spin 0.7s linear infinite',
        }}
      />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <ErrorBoundary>
          {/* Suspense catches lazy chunk loading — shows PageLoader until ready */}
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/"     element={<Landing />} />
              <Route path="/auth" element={<Auth />} />

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/onboarding" element={<Onboarding />} />
                <Route element={<Layout />}>
                  <Route path="/dashboard"  element={<Dashboard />}  />
                  <Route path="/calculator" element={<Calculator />} />
                  <Route path="/insights"   element={<Insights />}   />
                  <Route path="/habits"     element={<Habits />}     />
                  <Route path="/goals"      element={<Goals />}      />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </AuthProvider>
    </HashRouter>
  );
}