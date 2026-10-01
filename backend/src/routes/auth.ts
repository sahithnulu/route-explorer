import pool from '../db';
import bcrypt from 'bcrypt';
import { createAccessToken, createRefreshToken } from '../utils/token';
import express from 'express';
import jwt from 'jsonwebtoken';

const authRouter = express.Router();

// Creates a new user account, hashes the password with bcrypt,
// and returns both an access token and refresh token
authRouter.post('/auth/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        // if email is missing, return 
        // a 400 error
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // if password is missing, return a 400 error
        if (!password) {
            return res.status(400).json({ error: 'Password is required' });
        }

        // If email has invalid format, return a 400 error
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Check if the user already exists
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        // Insert the new user into the database
        const insertResult = await pool.query('INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id', [email, hashedPassword]);
        const userId = insertResult.rows[0].id

        // Generate access and refresh tokens
        const accessToken = createAccessToken(userId);
        const refreshToken = createRefreshToken(userId);

        return res.status(201).json({ message: 'User created successfully', accessToken, refreshToken });

    } catch (error) {
        console.error('Error during registration:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }

});

// Verifies email and password, returns both tokens if credentials are correct
authRouter.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // if email is missing, return a 400 error
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // if password is missing, return a 400 error
        if (!password) {
            return res.status(400).json({ error: 'Password is required' });
        }

        // Check if the user exists
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'User with this email does not exist' });
        }

        // Check if the password matches
        const doesPasswordMatch = await bcrypt.compare(password, result.rows[0].password_hash)
        if (!doesPasswordMatch) {
            return res.status(400).json({ error: 'Incorrect password' });
        }

        // Generate access and refresh tokens
        const accessToken = createAccessToken(result.rows[0].id);
        const refreshToken = createRefreshToken(result.rows[0].id);
        
        return res.status(200).json({ message: 'Login successful', accessToken, refreshToken });

    } catch (error) {
        console.error('Error during login:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Verifies the refresh token and returns a new short-lived access token
// Called automatically by the frontend when the access token expires
authRouter.post('/auth/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        // if refresh token is missing, return a 400 error
        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token is missing' });
        }

        // Verify the refresh token
        jwt.verify(refreshToken, process.env.JWT_SECRET || 'default_secret', (err: any, decoded: any) => {
            if (err) {
                return res.status(401).json({ error: 'Invalid refresh token' });
            }
            const userId = (decoded as any).userId;
            const newAccessToken = createAccessToken(userId);
            return res.status(200).json({ accessToken: newAccessToken });
        })

    } catch (error) {
        console.error('Error during token refresh:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default authRouter;