import {Request, Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken';

// JWT authentication middleware
// Reads the Authorization header, verifies the token, and attaches the decoded
// user to req.user so route handlers can access the authenticated user's ID
// Returns 401 if the token is missing, malformed, or expired
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    // Authorization header format: "Bearer <token>"
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header is missing' });
    }

    if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Invalid authorization header format' });
    }

    // Extract the token after "Bearer "
    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token is missing' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
        // Attach decoded payload (contains userId) to req so route handlers can use it
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}