import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await (mode === 'login' ? login(form) : register(form));
    } catch (requestError) {
      setError(requestError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-intro">
        <div className="brand-mark large"><span>RD</span><div><strong>Request Desk</strong><small>operaciones de soporte</small></div></div>
        <p className="eyebrow">CLASE 05 · ENTREGA 05A</p>
        <h1>El trabajo importante merece un buen flujo.</h1>
        <p className="intro-copy">Centraliza solicitudes, conserva el contexto y deja que cada rol haga exactamente lo que le corresponde.</p>
        <div className="intro-rule" />
        <p className="muted">Sesiones protegidas con tokens Bearer. Los permisos se deciden en el backend.</p>
      </section>
      <section className="auth-card">
        <div className="auth-card-header"><span className="kicker">{mode === 'login' ? 'Bienvenido de vuelta' : 'Crear acceso'}</span><h2>{mode === 'login' ? 'Inicia sesión' : 'Registra tu cuenta'}</h2></div>
        <ErrorBanner error={error} onClose={() => setError(null)} />
        <form onSubmit={submit}>
          <label>Correo electrónico<input type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="tu@correo.com" /></label>
          <label>Contraseña<input type="password" required minLength={15} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Mínimo 15 caracteres" /></label>
          <button className="button button-primary full" disabled={busy}>{busy ? 'Procesando...' : mode === 'login' ? 'Entrar al escritorio' : 'Crear cuenta'}</button>
        </form>
        <button className="switch-button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}>
          {mode === 'login' ? '¿Aún no tienes cuenta? Regístrate' : 'Ya tengo una cuenta · Iniciar sesión'}
        </button>
      </section>
    </main>
  );
}
