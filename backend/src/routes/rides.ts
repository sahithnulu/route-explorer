import pool from "../db";
import express from 'express'
import { authenticateToken } from "../middleware/auth";

const rideRouter = express.Router()

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

rideRouter.patch('/rides/:id/end', authenticateToken, async (req, res) => {
    try {
        const rideId = req.params.id
        const userId = req.user.userId

        // Check if this ride exists
        const result = await pool.query('SELECT * FROM rides where id = $1', [rideId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: `Ride with id ${rideId} not found` });
        }

        const updatedResult = await pool.query(
            `UPDATE rides 
            SET status = 'completed',
                ended_at = NOW(),
                duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::integer,
                distance_meters = (
                    SELECT ST_Length(ST_MakeLine(location::geometry ORDER BY sequence_number)::geography)
                    FROM route_points
                    WHERE ride_id = $1
                )
            WHERE id = $1 AND user_id = $2
            RETURNING *`,
            [rideId, userId]
        )

        return res.status(200).json({ message:'Ride ended and updated successfully', ride: updatedResult.rows[0]});

    } catch (error) {
        console.error('Error during ride update', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

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

rideRouter.get('/coverage', authenticateToken, async(req, res) => {
    try {
        const userId = req.user.userId

        const getCoverageResult = await pool.query(
            `SELECT ST_AsGeoJSON(
                ST_Union(
                ST_Buffer(location::geometry, 0.0001)
                )
            )::json AS coverage
            FROM route_points rp
            JOIN rides r ON rp.ride_id = r.id
            WHERE r.user_id = $1`,
            [userId]
        )
        const coverage = getCoverageResult.rows[0].coverage;

        if (!coverage) {
            return res.status(200).json({ type: 'FeatureCollection', features: [] })
        }

        return res.status(200).json({
            type: 'FeatureCollection',
            features: [{
                type: 'Feature',
                geometry: coverage,
                properties: {}
            }]
        })

    } catch (error) {
        console.error('Error while retrieving ride coverage', error);
        return res.status(500).json({ error: 'Internal server error' });      
    }
})

export default rideRouter
