import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PropTypes from 'prop-types';

export default function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  
  if (!currentUser) return <Navigate to="/auth" replace />;
  return children ? children : <Outlet />;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node
};