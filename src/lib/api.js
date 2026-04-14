const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

function resolveApiPath(path) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  return `${API_BASE_URL}${path}`;
}

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

export async function apiRequest(path, options = {}, token) {
  const headers = new Headers(options.headers || {});
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (isFormData) {
    // Иначе boundary не подставится и прокси/браузер может отправить text/plain → 415 на бэке
    headers.delete('Content-Type');
  } else if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(resolveApiPath(path), {
    ...options,
    headers,
    cache: 'no-store',
    credentials: 'same-origin',
    redirect: 'error',
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => '');

  if (!response.ok) {
    const message = typeof payload === 'string'
      ? payload
      : payload?.message
        || payload?.detail
        || (typeof payload?.error === 'string' && payload?.error !== 'Bad Request'
          ? payload.error
          : null)
        || payload?.error
        || `HTTP ${response.status}`;
    throw new ApiError(message, response.status, payload);
  }

  return payload;
}

export function isUnauthorizedError(error) {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

export function getDisplayErrorMessage(error, fallbackMessage) {
  if (!error) {
    return fallbackMessage;
  }
  if (error instanceof ApiError && error.status >= 500) {
    return fallbackMessage;
  }
  return error.message || fallbackMessage;
}

export function encodeBasicAuth(email, password) {
  return window.btoa(`${email}:${password}`);
}
