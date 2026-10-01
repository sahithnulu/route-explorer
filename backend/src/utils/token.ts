import jwt, { SignOptions } from 'jsonwebtoken';

// Creates a short-lived access token (15 minutes)
// Sent with every API request in the Authorization header
export function createAccessToken(userId:string){
    const payload = { userId };
    const secret = process.env.JWT_SECRET || 'default_secret';
    const options: SignOptions = { expiresIn: '15m' }; // Access token expires in 15 minutes
    
    return jwt.sign(payload, secret, options);
}

// Creates a long-lived refresh token (7 days)
// Only used to get a new access token when the old one expires
// Sent to POST /auth/refresh
export function createRefreshToken(userId:string){
    const payload = { userId };
    const secret = process.env.JWT_SECRET || 'default_secret';
    const options: SignOptions = { expiresIn: '7d' }; // Refresh token expires in 7 days
    
    return jwt.sign(payload, secret, options); 
}

