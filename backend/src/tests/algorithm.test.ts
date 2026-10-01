import { findShortestRoute, findUndiscoveredRoute} from "../algorithms/routing"
import request from 'supertest';
import app  from '../index'

let accessToken: string

// Register a test user before running the tests and store the access token for use in subsequent requests
beforeAll(async () => {
  const response = await request(app)
    .post('/auth/register')
    .send({ email: 'routetest@example.com', password: 'password123' })
  
  accessToken = response.body.accessToken
})


const graph = {
  A: [{ node: 'B', weight: 10 }, { node: 'D', weight: 15 }],
  B: [{ node: 'A', weight: 10 }, { node: 'C', weight: 5 }],
  C: [{ node: 'B', weight: 5 }, { node: 'E', weight: 8 }],
  D: [{ node: 'A', weight: 15 }, { node: 'E', weight: 12 }],
  E: [{ node: 'D', weight: 12 }, { node: 'C', weight: 8 }],
}

describe('findShortestRoute', () => {
    it('find the shortest path from A to C', () => {
        const result = findShortestRoute(graph, 'A', 'C')
        expect(result?.path).toEqual(['A', 'B', 'C'])
        expect(result?.distance).toBe(15)
    })

    it('return null when no path exists',  () => {
        const result = findShortestRoute(graph, 'A', 'Z')
        expect(result).toBeNull()
    })
})

describe('A*', () => {
    it('find the shortest path from A to C', () => {
        const riddenEdges = new Set(['B-C', 'C-B'])
        const result = findUndiscoveredRoute(graph, 'A', 'C', riddenEdges)
        expect(result?.path).toEqual(['A', 'D', 'E', 'C'])
    })

    it('return null when no path exists',  () => {
        const result = findUndiscoveredRoute(graph, 'A', 'Z', new Set())
        expect(result).toBeNull()
    })
})

describe('POST /routes/fastest', () => {
    it('returns 200 and a valid GeoJSON route with valid start and destinations coords', async () => {
        const createFastestRouteResponse = await request(app)
            .post('/routes/fastest')
            .set('Authorization', `Bearer ${accessToken}`)
            .send( {
                "start": { "lat": 45.4215, "lng": -75.6972 },
                "destination": { "lat": 45.4300, "lng": -75.6800 }
            })
        expect(createFastestRouteResponse.status).toBe(200)
        expect(createFastestRouteResponse.body).toHaveProperty('type', 'FeatureCollection')
        expect(createFastestRouteResponse.body.features).toBeInstanceOf(Array)
        expect(createFastestRouteResponse.body.features.length).toBeGreaterThan(0)
        expect(createFastestRouteResponse.body.features[0]).toHaveProperty('type', 'Feature')
        expect(createFastestRouteResponse.body.features[0].geometry).toHaveProperty('type', 'LineString')
    })

    it('returns with 400 since start coords are missing', async () => {
        const createFastestRouteResponse = await request(app)
            .post('/routes/fastest')
            .set('Authorization', `Bearer ${accessToken}`)
            .send( {
                "destination": { "lat": 45.4300, "lng": -75.6800 }
            })
        expect(createFastestRouteResponse.status).toBe(400)
    })

    it('returns with 400 since destination coords are missing', async () => {
        const createFastestRouteResponse = await request(app)
            .post('/routes/fastest')
            .set('Authorization', `Bearer ${accessToken}`)
            .send( {
                "start": { "lat": 45.4215, "lng": -75.6972 },
            })
        expect(createFastestRouteResponse.status).toBe(400)
    })

    it('returns with 401 since no token was provided', async () => {
        const createFastestRouteResponse = await request(app)
            .post('/routes/fastest')
            .send( {
                "destination": { "lat": 45.4300, "lng": -75.6800 }
            })
        expect(createFastestRouteResponse.status).toBe(401)
    })

    it('returns with 404 since no route could be found between the 2 points', async () => {
        const createFastestRouteResponse = await request(app)
            .post('/routes/fastest')
            .set('Authorization', `Bearer ${accessToken}`)
            .send( {
                "start": { "lat": 45.4215, "lng": -75.6972 },
                destination: { lat: 0, lng: 0 } 
            })
        expect(createFastestRouteResponse.status).toBe(404)
    })   
    
})

describe('POST /routes/undiscovered', () => {
    it('returns 200 and a valid GeoJSON route with valid start and destinations coords', async () => {
        const createUndiscoveredRouteResponse = await request(app)
            .post('/routes/undiscovered')
            .set('Authorization', `Bearer ${accessToken}`)
            .send( {
                "start": { "lat": 45.4215, "lng": -75.6972 },
                "destination": { "lat": 45.4300, "lng": -75.6800 }
            })
        expect(createUndiscoveredRouteResponse.status).toBe(200)
        expect(createUndiscoveredRouteResponse.body).toHaveProperty('type', 'FeatureCollection')
        expect(createUndiscoveredRouteResponse.body.features).toBeInstanceOf(Array)
        expect(createUndiscoveredRouteResponse.body.features.length).toBeGreaterThan(0)
        expect(createUndiscoveredRouteResponse.body.features[0]).toHaveProperty('type', 'Feature')
        expect(createUndiscoveredRouteResponse.body.features[0].geometry).toHaveProperty('type', 'LineString')
    })

    it('returns with 400 since start coords are missing', async () => {
        const createUndiscoveredRouteResponse = await request(app)
            .post('/routes/undiscovered')
            .set('Authorization', `Bearer ${accessToken}`)
            .send( {
                "destination": { "lat": 45.4300, "lng": -75.6800 }
            })
        expect(createUndiscoveredRouteResponse.status).toBe(400)
    })

    it('returns with 400 since destination coords are missing', async () => {
        const createUndiscoveredRouteResponse = await request(app)
            .post('/routes/undiscovered')
            .set('Authorization', `Bearer ${accessToken}`)
            .send( {
                "start": { "lat": 45.4215, "lng": -75.6972 },
            })
        expect(createUndiscoveredRouteResponse.status).toBe(400)
    })

    it('returns with 401 since no token was provided', async () => {
        const createUndiscoveredRouteResponse = await request(app)
            .post('/routes/undiscovered')
            .send( {
                "destination": { "lat": 45.4300, "lng": -75.6800 }
            })
        expect(createUndiscoveredRouteResponse.status).toBe(401)
    })

    it('returns with 404 since no route could be found between the 2 points', async () => {
        const createUndiscoveredRouteResponse = await request(app)
            .post('/routes/undiscovered')
            .set('Authorization', `Bearer ${accessToken}`)
            .send( {
                "start": { "lat": 45.4215, "lng": -75.6972 },
                destination: { lat: 0, lng: 0 } 
            })
        expect(createUndiscoveredRouteResponse.status).toBe(404)
    })   
    
})

afterAll(async () => {
  const pool = (await import('../db')).default
  
  const user = await pool.query('SELECT id FROM users WHERE email = $1', ['routetest@example.com'])
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
})