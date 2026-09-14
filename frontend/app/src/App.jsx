import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Navbar from './components/Navbar.jsx';
import RequesterView from './views/RequesterView.jsx';
import AgentView from './views/AgentView.jsx';
import './styles.css';

function Workspace() {
  const { user } = useAuth();
  if (!user) return <ProtectedRoute />;
  return <><Navbar /><main className="app-shell">{user.role === 'agent' ? <AgentView /> : <RequesterView />}</main></>;
}

export default function App() { return <AuthProvider><Workspace /></AuthProvider>; }
