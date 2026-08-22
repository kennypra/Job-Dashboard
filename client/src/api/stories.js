const BASE = '/api/stories';

async function handle(res) {
  if (!res.ok) {
    let details;
    try {
      details = await res.json();
    } catch {
      // response wasn't JSON (e.g. server unreachable/crashed) — fall through
    }
    const message = details?.error || `Request failed with status ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.fieldErrors = details?.details;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

function withJsonErrorHandling(promise) {
  return promise.catch((err) => {
    if (err instanceof TypeError) {
      throw new Error('Could not reach the server. Is it running?');
    }
    throw err;
  });
}

export const storiesApi = {
  list: () => withJsonErrorHandling(fetch(BASE).then(handle)),
  get: (id) => withJsonErrorHandling(fetch(`${BASE}/${id}`).then(handle)),
  create: (data) =>
    withJsonErrorHandling(
      fetch(BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handle)
    ),
  update: (id, data) =>
    withJsonErrorHandling(
      fetch(`${BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handle)
    ),
  remove: (id) =>
    withJsonErrorHandling(fetch(`${BASE}/${id}`, { method: 'DELETE' }).then(handle)),
};
