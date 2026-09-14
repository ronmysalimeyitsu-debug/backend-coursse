const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export async function request(path, { method = 'GET', body, token } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'No se pudo conectar con el backend.');
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = payload?.error ?? payload ?? {};
    throw new ApiError(response.status, error.code ?? 'REQUEST_FAILED', error.message ?? 'La solicitud no pudo completarse.');
  }
  return payload;
}

export const authApi = {
  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  me: (token) => request('/auth/me', { token })
};

export const requestsApi = {
  list: (token, filters = {}) => {
    const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
    return request(`/requests${query.toString() ? `?${query}` : ''}`, { token });
  },
  create: (token, body) => request('/requests', { method: 'POST', body, token }),
  get: (token, id) => request(`/requests/${id}`, { token }),
  update: (token, id, body) => request(`/requests/${id}`, { method: 'PATCH', body, token }),
  history: (token, id) => request(`/requests/${id}/history`, { token })
};
