export class AppError extends Error {
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', isOperational: boolean = true) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.isOperational = isOperational;
    
    // Maintain prototype chain
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
  }
}

export class AuthError extends AppError {
  constructor(message: string) {
    super(message, 'AUTH_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resourceName: string, id?: string) {
    super(`${resourceName} not found${id ? `: ${id}` : ''}`, 'NOT_FOUND');
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network request failed') {
    super(message, 'NETWORK_ERROR');
  }
}

export class IndexingError extends AppError {
    constructor(message: string) {
        super(message, 'INDEXING_ERROR');
    }
}
