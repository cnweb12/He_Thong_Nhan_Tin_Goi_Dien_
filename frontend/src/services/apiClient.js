const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

function buildApiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

async function request(method, path, body, opts = {}) {
  const url = buildApiUrl(path);
  const headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});

  const resp = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await resp.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    data = text;
  }

  if (!resp.ok) {
    return { ok: false, status: resp.status, error: data?.message || data };
  }

  return { ok: true, status: resp.status, data };
}

export const get = (path, opts) => request('GET', path, null, opts);
export const post = (path, body, opts) => request('POST', path, body, opts);
export const put = (path, body, opts) => request('PUT', path, body, opts);
export const patch = (path, body, opts) => request('PATCH', path, body, opts);
export const del = (path, opts) => request('DELETE', path, null, opts);

export default { get, post, put, patch, del, buildApiUrl };
