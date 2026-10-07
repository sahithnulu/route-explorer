import pool from "../db";
import express from 'express'
import { authenticateToken } from "../middleware/auth";

const rideRouter = express.Router()

// Create a new active ride for the authenticated user
rideRouter.post('/rides', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId

        // Creating a ride
        const insertResult = await pool.query('INSERT INTO rides (user_id, status, started_at) VALUES ($1, $2, NOW()) RETURNING id', [userId, 'active']);
        const rideId = insertResult.rows[0].id;
        
        return res.status(201).json({ message: 'Ride created successfully', rideId});
        
    } catch (error) {
        console.error('Error during ride creation', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
})

// Marks ride as completed, computes:
// - distance_metres using PostGIS ST_Length(ST_MakeLine(route_points))
// - duration_seconds as difference between started_at and NOW()
rideRouter.patch('/rides/:id/end', authenticateToken, async (req, res) => {
    try {
        const rideId = req.params.id
        const userId = req.user.userId

        const updatedResult = await pool.query(
            `UPDATE rides 
            SET status = 'completed',
                ended_at = NOW(),
                duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::integer,
                distance_metres = (
                    SELECT ST_Length(ST_MakeLine(location::geometry ORDER BY sequence_number)::geography)
                    FROM route_points
                    WHERE ride_id = $1
                )
            WHERE id = $1 AND user_id = $2
            RETURNING *`,
            [rideId, userId]
        )

        if (updatedResult.rows.length === 0) {
            return res.status(404).json({ error: `Ride with id ${rideId} not found` })
        }

        return res.status(200).json({ message:'Ride ended and updated successfully', ride: updatedResult.rows[0]});

    } catch (error) {
        console.error('Error during ride update', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Returns all rides for the authenticated user, newest first
rideRouter.get('/rides', authenticateToken, async(req, res) => {
    try {
        const userId = req.user.userId

        const getResult = await pool.query('SELECT * FROM rides WHERE user_id = $1 ORDER BY started_at DESC', [userId]);
        const userRides = getResult.rows;

        return res.status(200).json(userRides);

    } catch (error) {
        console.error('Error while retrieving rides', error);
        return res.status(500).json({ error: 'Internal server error' });      
    }
});

// Returns all GPS points for all rides merged into a single GeoJSON FeatureCollection
// One LineString feature per ride, grouped by ride id to avoid connecting separate rides
// Must be defined before /rides/:id so Express doesn't treat "coverage" as an id param
rideRouter.get('/rides/coverage', authenticateToken, async(req, res) => {
    try {
        const userId = req.user.userId

        const getCoverageResult = await pool.query(
            `SELECT ST_AsGeoJSON(
                ST_MakeLine(location::geometry ORDER BY rp.sequence_number)
            )::json AS coverage
            FROM route_points rp
            JOIN rides r ON rp.ride_id = r.id
            WHERE r.user_id = $1
            GROUP BY r.id`,
            [userId]
        )
        const features = getCoverageResult.rows
            .filter(row => row.coverage)
            .map(row => ({
                type: 'Feature',
                geometry: row.coverage,
                properties: {}
            }))

        return res.status(200).json({ type: 'FeatureCollection', features })

    } catch (error) {
        console.error('Error while retrieving ride coverage', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
})

// Returns ride details + all GPS points as a GeoJSON FeatureCollection
// Used by RideHistory to draw a past route on the map
rideRouter.get('/rides/:id', authenticateToken, async(req, res) => {
    try {
        const userId = req.user.userId
        const rideId = req.params.id

        const getRidesResult = await pool.query('SELECT * FROM rides WHERE user_id = $1 AND id = $2', [userId, rideId]);
        if (getRidesResult.rows.length === 0) {
            return res.status(404).json({ error: `Ride with id ${rideId} not found` });
        }
        const userRides = getRidesResult.rows[0];

        const getRoutePointsResult = await pool.query('SELECT ST_AsGeoJSON(location)::json AS geometry, recorded_at, sequence_number FROM route_points WHERE ride_id = $1 ORDER BY sequence_number ASC', [rideId]);

        return res.status(200).json({ 
            message: `Ride with id ${rideId} retrieved successfully`, 
            ride: userRides, 
            geoJSON: {
                type: 'FeatureCollection',
                features: getRoutePointsResult.rows.map((row: any) => ({
                type: 'Feature',
                geometry: row.geometry,
                properties: {
                    recorded_at: row.recorded_at,
                    sequence_number: row.sequence_number
                }
                }))
            } 
        });

    } catch (error) {
        console.error('Error while retrieving rides', error);
        return res.status(500).json({ error: 'Internal server error' });      
    }
});

// Deletes a ride and its route_points (cascade), removing it from coverage
rideRouter.delete('/rides/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId
        const rideId = req.params.id

        // Verify ownership first
        const check = await pool.query(
            'SELECT id FROM rides WHERE id = $1 AND user_id = $2',
            [rideId, userId]
        )
        if (check.rows.length === 0) {
            return res.status(404).json({ error: `Ride with id ${rideId} not found` })
        }

        // Delete route_points first (no cascade), then the ride
        await pool.query('DELETE FROM route_points WHERE ride_id = $1', [rideId])
        await pool.query('DELETE FROM rides WHERE id = $1', [rideId])

        return res.status(200).json({ message: 'Ride deleted successfully' })

    } catch (error) {
        console.error('Error deleting ride', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
})

export default rideRouter