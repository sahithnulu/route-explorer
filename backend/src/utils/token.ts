import jwt, { SignOptions } from 'jsonwebtoken';

export function createAccessToken(userId:string){
    const payload = { userId };
    const secret = process.env.JWT_SECRET || 'default_secret';
    const options: SignOptions = { expiresIn: '15m' }; // Access token expires in 15 minutes
    
    return jwt.sign(payload, secret, options);
}

export function createRefreshToken(userId:string){
    const payload = { userId };
    const secret = process.env.JWT_SECRET || 'default_secret';
    const options: SignOptions = { expiresIn: '7d' }; // Refresh token expires in 7 days
    
    return jwt.sign(payload, secret, options); 
}

