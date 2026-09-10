/**
 * Thin fetch wrapper for the Netlify Functions API. Same-origin requests
 * already carry the nf_jwt cookie Identity's browser-side login() sets, so
 * no manual Authorization header is needed. Every non-2xx response is turned
 * into a thrown ApiError carrying the server's own message and structured
 * payload (e.g. a duplicate-detection "existing" record), so callers can
 * handle it the same way regardless of which module they're calling.
 */
export class ApiError extends Error {
  constructor(status, message, payload) {
    super(message)
    this.status = status
    this.payload = payload
  }
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  let body = null
  try {
    body = await response.json()
  } catch {
    // A body-less response (e.g. some 405s) is fine — body stays null.
  }

  if (!response.ok) {
    const message = body?.error ?? `Request failed (${response.status}).`
    throw new ApiError(response.status, message, body?.payload)
  }

  return body
}

export const api = {
  get: (path) => request(path, { method: 'GET' }),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
}
