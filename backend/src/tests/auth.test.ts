import request from 'supertest';
import app  from '../index'

// Tests for authentication endpoints
// beforeAll in login/refresh describe blocks registers a test user
// afterAll cleans up all test users from the database

describe('POST /auth/register', () => {
    it('returns with 201 and a valid JWT token', async () => {
        const response = await request(app)
            .post('/auth/register')
            .send({ email: 'authtest1@example.com', password: 'password'})
        
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('accessToken');
    })

    it('returns with 400 since email already exists', async () => {
        const response = await request(app)
            .post('/auth/register')
            .send({ email: 'authtest2@example.com', password: 'password'})
        
        const response2 = await request(app)
            .post('/auth/register')
            .send({ email: 'authtest2@example.com', password: 'password'})
        
        expect(response2.status).toBe(400);
    })

    it('returns with 400 since email is missing', async () => {
        const response = await request(app)
            .post('/auth/register')
            .send({ email: '', password: 'password' })
        
        expect(response.status).toBe(400);
    })

    it('returns with 400 since password is missing', async () => {
        const response = await request(app)
            .post('/auth/register')
            .send({ email: 'authtest3@example.com', password: '' })
        
        expect(response.status).toBe(400);
    })

    it('returns with 400 since email is invalid', async () => {
        const response = await request(app)
            .post('/auth/register')
            .send({ email: 'authinvalid-email', password: 'password' })
        
        expect(response.status).toBe(400);
    })
})

describe('POST /auth/login', () => {
    beforeAll(async () => {
        // Register a user for login tests
        await request(app)
            .post('/auth/register')
            .send({ email: 'logintest@example.com', password: 'password' });
    })

    it('returns with 200 and a valid JWT token', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({ email: 'logintest@example.com', password: 'password' })

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('accessToken');
    })

    it('returns with 400 since email does not exist', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({ email: 'doesnotexist@example.com', password: 'password' })

        expect(response.status).toBe(400);
    })

    it('returns with 400 since password is incorrect', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({ email: 'logintest@example.com', password: 'wrongpassword' })
        
        expect(response.status).toBe(400);
    })
})

describe('POST /auth/refresh', () => {
    beforeAll(async () => {
        // Register a user for refresh token tests
        await request(app)
            .post('/auth/register')
            .send({ email: 'logintest2@example.com', password: 'password' });
    })
    
    it('returns with 200 and a valid JWT token', async () => {
        const loginResponse = await request(app)
            .post('/auth/login')
            .send({ email: 'logintest2@example.com', password: 'password' })
        
        const refreshResponse = await request(app)
            .post('/auth/refresh')
            .send({ refreshToken: loginResponse.body.refreshToken })
        
        expect(refreshResponse.status).toBe(200);
        expect(refreshResponse.body).toHaveProperty('accessToken');
    })
})

afterAll(async () => {
    const pool = (await import('../db')).default
    // Delete rides first (foreign key constraint)
    await pool.query(`
        DELETE FROM route_points WHERE ride_id IN (
            SELECT id FROM rides WHERE user_id IN (
                SELECT id FROM users WHERE email LIKE $1
            )
        )
    `, ['%@example.com'])
    await pool.query(`
        DELETE FROM rides WHERE user_id IN (
            SELECT id FROM users WHERE email LIKE $1
        )
    `, ['%@example.com'])
    await pool.query('DELETE FROM users WHERE email LIKE $1', ['%@example.com'])
    await pool.end()
    const redis = (await import('../redis')).default
    await redis.disconnect()
    const { httpServer } = await import('../index')
    httpServer.close()
})


