export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'You must be signed in to do that.') {
    super(401, message)
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'Your role does not have permission to do that.') {
    super(403, message)
  }
}

export class ValidationError extends HttpError {
  constructor(message) {
    super(422, message)
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Record not found.') {
    super(404, message)
  }
}

export class ConflictError extends HttpError {
  constructor(message, payload) {
    super(409, message)
    this.payload = payload
  }
}
