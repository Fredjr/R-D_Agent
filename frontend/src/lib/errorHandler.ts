/**
 * Standardized Error Handling System
 * Provides consistent error response formats and handling across the application
 */

export interface StandardError {
  error: string;
  message: string;
  status: number;
  timestamp: string;
  requestId?: string;
  details?: any;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
  status: number;
  timestamp: string;
  path?: string;
  details?: any;
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: string,
  message: string,
  status: number = 500,
  details?: any,
  path?: string
): ApiErrorResponse {
  return {
    error,
    message,
    status,
    timestamp: new Date().toISOString(),
    path,
    details
  };
}

/**
 * Handle backend errors and standardize the response
 */
export async function handleBackendError(
  response: Response,
  context: string = 'API call'
): Promise<ApiErrorResponse> {
  let errorData: any;
  
  try {
    const text = await response.text();
    try {
      errorData = JSON.parse(text);
    } catch {
      errorData = { message: text };
    }
  } catch {
    errorData = { message: 'Failed to read error response' };
  }

  // Standardize different backend error formats
  let message = 'Unknown error occurred';
  let details = undefined;

  if (errorData.detail) {
    // FastAPI format
    message = errorData.detail;
  } else if (errorData.message) {
    message = errorData.message;
    details = errorData.details || errorData.error;
  } else if (errorData.error) {
    message = errorData.error;
    details = errorData.details;
  } else if (typeof errorData === 'string') {
    message = errorData;
  }

  console.error(`❌ ${context} failed:`, {
    status: response.status,
    message,
    url: response.url,
    details
  });

  return createErrorResponse(
    `${context} failed`,
    message,
    response.status,
    details,
    response.url
  );
}

/**
 * Handle network and other errors
 */
export function handleNetworkError(
  error: any,
  context: string = 'Network request'
): ApiErrorResponse {
  let message = 'Network error occurred';
  let details = undefined;

  if (error instanceof Error) {
    message = error.message;
    details = {
      name: error.name,
      stack: error.stack?.split('\n').slice(0, 3) // First 3 lines of stack
    };
  } else if (typeof error === 'string') {
    message = error;
  }

  // Handle specific error types
  if (message.includes('AbortError') || message.includes('timeout')) {
    message = 'Request timed out. Please try again.';
  } else if (message.includes('NetworkError') || message.includes('fetch')) {
    message = 'Network connection failed. Please check your internet connection.';
  } else if (message.includes('CORS')) {
    message = 'Cross-origin request blocked. Please contact support.';
  }

  console.error(`❌ ${context} error:`, { message, details });

  return createErrorResponse(
    `${context} error`,
    message,
    500,
    details
  );
}

/**
 * Create a standardized Next.js Response with error
 */
export function createErrorNextResponse(
  error: string,
  message: string,
  status: number = 500,
  details?: any,
  path?: string
): Response {
  const errorResponse = createErrorResponse(error, message, status, details, path);
  
  return new Response(JSON.stringify(errorResponse), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

/**
 * Proxy error handler for consistent error responses
 */
export async function handleProxyError(
  response: Response,
  context: string,
  backendUrl?: string
): Promise<Response> {
  const errorData = await handleBackendError(response, context);
  
  // Add backend URL to details for debugging
  if (backendUrl) {
    errorData.details = {
      ...errorData.details,
      backend_url: backendUrl
    };
  }

  return new Response(JSON.stringify(errorData), {
    status: response.status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

/**
 * Catch-all error handler for proxy routes
 */
export function handleProxyException(
  error: any,
  context: string,
  backendUrl?: string
): Response {
  const errorData = handleNetworkError(error, context);
  
  // Add backend URL to details for debugging
  if (backendUrl) {
    errorData.details = {
      ...errorData.details,
      backend_url: backendUrl
    };
  }

  return new Response(JSON.stringify(errorData), {
    status: 500,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

/**
 * Validation error helper
 */
export function createValidationError(
  field: string,
  message: string,
  value?: any
): ApiErrorResponse {
  return createErrorResponse(
    'Validation error',
    `${field}: ${message}`,
    400,
    { field, value }
  );
}

/**
 * Authentication error helper
 */
export function createAuthError(message: string = 'Authentication required'): ApiErrorResponse {
  return createErrorResponse(
    'Authentication error',
    message,
    401
  );
}

/**
 * Authorization error helper
 */
export function createAuthorizationError(message: string = 'Access denied'): ApiErrorResponse {
  return createErrorResponse(
    'Authorization error',
    message,
    403
  );
}

/**
 * Not found error helper
 */
export function createNotFoundError(resource: string): ApiErrorResponse {
  return createErrorResponse(
    'Resource not found',
    `${resource} not found`,
    404
  );
}

/**
 * Rate limit error helper
 */
export function createRateLimitError(message: string = 'Too many requests'): ApiErrorResponse {
  return createErrorResponse(
    'Rate limit exceeded',
    message,
    429
  );
}

/**
 * Server error helper
 */
export function createServerError(message: string = 'Internal server error'): ApiErrorResponse {
  return createErrorResponse(
    'Server error',
    message,
    500
  );
}
