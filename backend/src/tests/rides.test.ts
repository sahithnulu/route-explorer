import request from 'supertest';
import app  from '../index'

// Tests for ride CRUD endpoints and coverage
// beforeAll registers a test user and stores the access token
// Each describe block that needs a ride creates one in its own beforeAll
// afterAll deletes all test data (route_points → rides → user) in correct FK order

let accessToken: string

// Register a test user before running the tests and store the access token for use in subsequent requests
beforeAll(async () => {
  const response = await request(app)
    .post('/auth/register')
    .send({ email: 'ridetest@example.com', password: 'password123' })
  
  accessToken = response.body.accessToken
})

describe('POST /rides', () => {
    it('returns with 201 and a rideID while providing a valid token', async () => {
        const createRideResponse = await request(app)
            .post('/rides')
            .set('Authorization', `Bearer ${accessToken}`)
        
        expect(createRideResponse.status).toBe(201);
        expect(createRideResponse.body).toHaveProperty('rideId');
    })

    it('returns with 401 since no token is provided', async () => {
        const createRideResponse = await request(app)
            .post('/rides')
        
        expect(createRideResponse.status).toBe(401);
    })
})

describe ('PATCH /rides/id/end', () => {

    let rideId: string;

    // Create a ride to end before testing
    beforeAll(async () => {
        const createRideResponse = await request(app)
            .post('/rides')
            .set('Authorization', `Bearer ${accessToken}`);
        
        rideId = createRideResponse.body.rideId;
    })

    it('returns with 200 and marks the ride as completed', async () => {
            // End the ride
            const endRideResponse = await request(app)
                .patch(`/rides/${rideId}/end`)
                .set('Authorization', `Bearer ${accessToken}`);
            
            expect(endRideResponse.status).toBe(200);
    })

    it('returns with 404 since ride does not exist', async () => {
        const endRideResponse = await request(app)
            .patch(`/rides/00000000-0000-0000-0000-000000000000/end`)
            .set('Authorization', `Bearer ${accessToken}`);
        
        expect(endRideResponse.status).toBe(404);
    })

    it('returns with 401 since no token is provided', async () => {
        const endRideResponse = await request(app)
            .patch(`/rides/${rideId}/end`)
        
        expect(endRideResponse.status).toBe(401);
    })
})

describe('GET /rides', () => {

    // Create a ride to get before testing
    beforeAll(async () => {
        await request(app)
            .post('/rides')
            .set('Authorization', `Bearer ${accessToken}`);
    })

    it('returns with 200 and a list of rides', async () => {
        const getRidesResponse = await request(app)
            .get('/rides')
            .set('Authorization', `Bearer ${accessToken}`)
        
        expect(getRidesResponse.status).toBe(200);
        expect(Array.isArray(getRidesResponse.body)).toBe(true);
    })

    it('returns with 401 since no token is provided', async () => {
        const getRidesResponse = await request(app)
            .get('/rides')
        
        expect(getRidesResponse.status).toBe(401);
    })
})

describe('GET /rides/:id', () => {

    let rideId : string

    // Create a ride to get before testing
    beforeAll(async () => {
        const createRideResponse = await request(app)
            .post('/rides')
            .set('Authorization', `Bearer ${accessToken}`);
        
        rideId = createRideResponse.body.rideId
        
    })

    it('returns with 200 and the ride details and GeoJSON route', async () => {
        const getRideResponse = await request(app)
            .get(`/rides/${rideId}`)
            .set('Authorization', `Bearer ${accessToken}`)

        expect(getRideResponse.status).toBe(200)
        expect(getRideResponse.body).toHaveProperty('ride')
        expect(getRideResponse.body).toHaveProperty('geoJSON')
    })

    it('returns with 404 since ride does not exist', async () => {
        const getRideResponse = await request(app)
            .get(`/rides/00000000-0000-0000-0000-000000000000`)
            .set('Authorization', `Bearer ${accessToken}`);
        
        expect(getRideResponse.status).toBe(404);
    })

    it('returns with 401 since no token is provided', async () => {
        const getRideResponse = await request(app)
            .get(`/rides/${rideId}`)
        
        expect(getRideResponse.status).toBe(401);
    })
})

describe('GET /coverage', () => {
    it('returns 200 with GeoJSON', async () => {
        const getCoverageResponse = await request(app)
            .get('/coverage')
            .set('Authorization', `Bearer ${accessToken}`)
        
        expect(getCoverageResponse.status).toBe(200)
        expect(getCoverageResponse.body).toHaveProperty('type', 'FeatureCollection')
    })

    it('returns 401 since no valid token is provided', async () =>{
        const getCoverageResponse = await request(app)
            .get('/coverage')

        expect(getCoverageResponse.status).toBe(401);
    })
})

afterAll(async () => {
    const pool = (await import('../db')).default
    
    const user = await pool.query('SELECT id FROM users WHERE email = $1', ['ridetest@example.com'])
    const userId = user.rows[0]?.id
    
    if (userId) {
        // Delete route_points first (foreign key constraint)
        await pool.query('DELETE FROM route_points WHERE ride_id IN (SELECT id FROM rides WHERE user_id = $1)', [userId])
        // Then delete rides
        await pool.query('DELETE FROM rides WHERE user_id = $1', [userId])
        // Then delete the user
        await pool.query('DELETE FROM users WHERE id = $1', [userId])
    }
    
    await pool.end()
    const redis = (await import('../redis')).default
    await redis.disconnect()
    const { httpServer } = await import('../index')
    httpServer.close()
})


