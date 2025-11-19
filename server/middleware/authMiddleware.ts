import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV_CONFIG } from '../config/environment.js';
import { verifyTokenHelper } from '../controllers/authController.js';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // Use the same JWT_SECRET as the authController
    const JWT_SECRET = ENV_CONFIG.JWT_SECRET;
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Handle both token structures for backward compatibility
    const user = {
      id: decoded.id || decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
    
    // Validate that we have the required fields
    if (!user.id || !user.email || !user.role) {
      console.error('Invalid token structure:', { decoded, user });
      return res.status(403).json({ error: 'Invalid token structure' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    if ((error as any)?.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Allow admin role to access everything, or check if user role is in allowed roles
    if (req.user.role === 'admin' || roles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({ error: 'Insufficient permissions' });
  };
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = verifyTokenHelper(token);
      req.user = decoded;
    } catch (error) {
      // Token is invalid, but we continue without user info
      req.user = undefined;
    }
  }

  next();
}
