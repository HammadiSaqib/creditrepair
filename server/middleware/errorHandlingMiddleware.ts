import { Request, Response, NextFunction } from 'express';

// Middleware to handle JSON parsing errors
export function jsonErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (err instanceof SyntaxError && 'body' in err) {
    console.error('JSON parsing error:', {
      error: err.message,
      body: err.body,
      url: req.url,
      method: req.method,
      headers: req.headers
    });
    
    return res.status(400).json({
      error: 'Invalid JSON format in request body',
      message: 'Please ensure your request body contains valid JSON',
      details: 'The request body could not be parsed as JSON'
    });
  }
  
  next(err);
}

// General error handler
export function generalErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    error: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack })
  });
}