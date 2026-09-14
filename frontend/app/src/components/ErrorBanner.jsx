export default function ErrorBanner({ error, onClose }) {
  if (!error) return null;
  const statusLabel = {
    0: 'Sin conexión',
    400: 'Datos no válidos',
    401: 'Sesión no autorizada',
    403: 'Acción prohibida',
    404: 'No encontrado',
    409: 'Conflicto de estado',
    500: 'Error del servidor',
    503: 'Servicio no disponible'
  }[error.status] ?? 'Error de la solicitud';
  return (
    <div className={`error-banner error-${error.status || 'network'}`} role="alert">
      <div>
        <strong>{statusLabel}{error.status ? ` · ${error.status}` : ''}</strong>
        <small>{error.code}</small>
        <p>{error.message}</p>
      </div>
      {onClose && <button className="icon-button" onClick={onClose} aria-label="Cerrar error">×</button>}
    </div>
  );
}
