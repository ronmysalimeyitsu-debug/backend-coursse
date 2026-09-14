import { useAuth } from '../context/AuthContext.jsx';
import Login from '../views/Login.jsx';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Comprobando sesión<span>...</span></div>;
  return user ? children : <Login />;
}
