import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute   from './components/ProtectedRoute';
import Layout           from './components/Layout';
import Landing          from './pages/Landing';
import Auth             from './pages/Auth';
import Onboarding       from './pages/Onboarding';
import Dashboard        from './pages/Dashboard';
import Calculator       from './pages/Calculator';
import Insights         from './pages/Insights';
import Habits           from './pages/Habits';
import Goals            from './pages/Goals';
import ErrorBoundary    from './components/ErrorBoundary';

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <ErrorBoundary>
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
        </ErrorBoundary>
      </AuthProvider>
    </HashRouter>
  );
}
