const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const TOKEN_KEY = 'nova.token';

export const tokenStore = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(t) {
    try {
      t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage unavailable (private mode): session just won't persist */
    }
  },
};

export class ApiError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => (onUnauthorized = fn);

async function request(method, path, { body, query, signal, form } = {}) {
  const url = new URL(`${BASE}${path}`, window.location.origin);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '' && v !== false) url.searchParams.set(k, v);
    }
  }
  const headers = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !form) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(url, { method, headers, body: form ?? (body ? JSON.stringify(body) : undefined), signal });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError('Cannot reach the server. Check your connection and try again.', 0);
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized();
    throw new ApiError(data?.message || `Request failed (${res.status})`, res.status, data?.errors);
  }
  return data;
}

export const api = {
  get: (path, query, signal) => request('GET', path, { query, signal }),
  post: (path, body) => request('POST', path, { body }),
  put: (path, body) => request('PUT', path, { body }),
  patch: (path, body) => request('PATCH', path, { body }),
  del: (path, body) => request('DELETE', path, { body }),
  upload: (path, formData) => request('POST', path, { form: formData }),
};
