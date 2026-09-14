import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <header className="topbar">
      <div className="brand-mark"><span>RD</span><div><strong>Request Desk</strong><small>operaciones de soporte</small></div></div>
      <div className="account-area">
        <div className="identity"><span className="status-dot" /> <span>{user?.email}</span><b>{user?.role}</b></div>
        <button className="button button-quiet" onClick={logout}>Salir</button>
      </div>
    </header>
  );
}
