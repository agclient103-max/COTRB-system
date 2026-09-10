import { HttpError } from './errors.js'

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Converts any thrown error into a proper HTTP response. HttpError subclasses
 * (auth failures, validation failures, etc.) carry their own status and a
 * message that's safe to show the caller. Anything else is logged server-side
 * and reduced to a generic 500 — never leaks internal error details to the
 * client, matching the "visible but safe" error-handling pattern used
 * throughout the frontend.
 */
export function errorResponse(err) {
  if (err instanceof HttpError) {
    const body = { error: err.message }
    if (err.payload) body.payload = err.payload
    return jsonResponse(body, err.status)
  }
  console.error('Unhandled error in function:', err)
  return jsonResponse({ error: 'Something went wrong. Please try again.' }, 500)
}
