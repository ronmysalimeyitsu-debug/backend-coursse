import { useEffect, useState } from 'react';
import { requestsApi } from '../api/httpClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';

const emptyForm = { title: '', description: '', priority: 'medium' };

function statusLabel(status) {
  return { open: 'Abierta', in_progress: 'En progreso', resolved: 'Resuelta', closed: 'Cerrada', cancelled: 'Cancelada' }[status] ?? status;
}

export default function RequesterView() {
  const { token } = useAuth();
  const [requests, setRequests] = useState([]);
  const [filters, setFilters] = useState({ status: '', priority: '' });
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try { setRequests(await requestsApi.list(token, filters)); setError(null); } catch (requestError) { setError(requestError); } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [token, filters.status, filters.priority]);

  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(null);
    try {
      if (editingId) await requestsApi.update(token, editingId, { title: form.title, description: form.description });
      else await requestsApi.create(token, form);
      setForm(emptyForm); setEditingId(null); setSuccess(editingId ? 'Solicitud actualizada correctamente.' : 'Solicitud creada correctamente.'); await load();
    } catch (requestError) { setError(requestError); } finally { setBusy(false); }
  }

  function edit(request) { setEditingId(request.id); setForm({ title: request.title, description: request.description ?? '', priority: request.priority }); window.scrollTo({ top: 0, behavior: 'smooth' }); }

  async function inspect(request) {
    try { setSelected(await requestsApi.get(token, request.id)); setHistory(await requestsApi.history(token, request.id)); setError(null); }
    catch (requestError) { setError(requestError); }
  }

  return <div className="workspace-grid">
    <section className="content-column">
      <div className="page-heading"><div><p className="eyebrow">MI ESPACIO</p><h1>Mis solicitudes</h1><p className="muted">Crea una solicitud y sigue su recorrido hasta la resolución.</p></div><span className="count-badge">{requests.length} activas</span></div>
      <ErrorBanner error={error} onClose={() => setError(null)} />
      {success && <div className="success-banner" role="status">✓ {success}<button className="icon-button" onClick={() => setSuccess('')} aria-label="Cerrar confirmación">×</button></div>}
      <form className="request-form panel" onSubmit={submit}>
        <div className="panel-heading"><div><span className="kicker">{editingId ? 'Editar solicitud' : 'Nueva solicitud'}</span><h2>{editingId ? `Solicitud #${editingId}` : '¿Qué necesitas resolver?'}</h2></div>{editingId && <button type="button" className="button button-quiet" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancelar</button>}</div>
        <label>Título<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Ej. No puedo acceder a la VPN" /></label>
        <label>Descripción<textarea rows="4" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Añade el contexto necesario..." /></label>
        {!editingId && <label>Prioridad<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option value="low">Baja</option><option value="medium">Media</option><option value="high">Alta</option></select></label>}
        <button className="button button-primary" disabled={busy}>{busy ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear solicitud'}</button>
      </form>
      <div className="toolbar"><div><span className="kicker">BANDEJA</span><h2>Historial reciente</h2></div><div className="filters"><select aria-label="Filtrar por estado" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">Todos los estados</option><option value="open">Abierta</option><option value="in_progress">En progreso</option><option value="resolved">Resuelta</option><option value="closed">Cerrada</option><option value="cancelled">Cancelada</option></select><select aria-label="Filtrar por prioridad" value={filters.priority} onChange={(event) => setFilters({ ...filters, priority: event.target.value })}><option value="">Prioridad</option><option value="low">Baja</option><option value="medium">Media</option><option value="high">Alta</option></select></div></div>
      {loading ? <div className="loading-state">Cargando tus solicitudes...</div> : <div className="request-list">{requests.length === 0 ? <div className="empty-state">No hay solicitudes con estos filtros.</div> : requests.map((request) => <article className="request-card" key={request.id}><div className="request-card-top"><span className={`status status-${request.status}`}>{statusLabel(request.status)}</span><span className={`priority priority-${request.priority}`}>{request.priority}</span></div><h3>{request.title}</h3><p>{request.description || 'Sin descripción'}</p><div className="request-card-bottom"><small>Solicitud #{request.id}</small><div className="card-actions"><button className="text-button" onClick={() => inspect(request)}>Detalles + historial</button>{request.status === 'open' && <button className="text-button" onClick={() => edit(request)}>Editar →</button>}</div></div></article>)}</div>}
      {selected && <aside className="detail-panel panel"><div className="panel-heading"><div><span className="kicker">DETALLE · SOLICITUD #{selected.id}</span><h2>{selected.title}</h2></div><button className="button button-quiet" onClick={() => setSelected(null)}>Cerrar</button></div><p className="muted">{selected.description || 'Sin descripción'}</p><div className="detail-meta"><span className={`status status-${selected.status}`}>{statusLabel(selected.status)}</span><span className={`priority priority-${selected.priority}`}>Prioridad {selected.priority}</span></div><h3 className="history-title">Historial</h3>{history.length ? <div className="history-list">{history.map((event, index) => <div className="history-item" key={`${event.changedAt}-${index}`}><span className="history-dot" /><div><strong>{event.previousStatus ? `${statusLabel(event.previousStatus)} → ` : ''}{statusLabel(event.newStatus)}</strong><small>{new Date(event.changedAt).toLocaleString()}</small></div></div>)}</div> : <div className="empty-state">No hay eventos de historial.</div>}</aside>}
    </section>
  </div>;
}
