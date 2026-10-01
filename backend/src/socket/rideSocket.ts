import {Server} from 'socket.io'
import pool from '../db'

// Registers Socket.io event handlers for real-time GPS tracking
// Called once at server startup with the Socket.io server instance
export const registerRideSocket = (io: Server) => {
    io.on('connection', (socket) => {
        // A new client has connected, usually when a rider presses Start
        console.log(`Client connected: ${socket.id}`)

        // Received a GPS coordinate from the frontend
        // Insert into route_points using PostGIS geography type
        // ST_SetSRID(ST_MakePoint(lng, lat), 4326), note: longitude comes first in PostGIS
        // Emit server:ack back to confirm the point was saved
        socket.on('gps:point', async (data: {
            rideId: string
            lat: number
            lng: number
            timestamp: string
            sequenceNumber: number
        }) => {
                try {
                    await pool.query(
                    `INSERT INTO route_points (ride_id, location, recorded_at, sequence_number)
                    VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography, $4, $5)`,
                    [data.rideId, data.lng, data.lat, data.timestamp, data.sequenceNumber]
                    )
                        socket.emit('server:ack', { sequenceNumber: data.sequenceNumber })
                } catch (error) {
                    console.error('Error saving GPS point:', error)
                    socket.emit('server:error', { message: 'Failed to save GPS point' })
                }
        })

        socket.on('disconnect', () => {
            // Client disconnected, usually when a rider presses Stop
            console.log(`Client disconnected: ${socket.id}`)
        })
    })

}