import {Server} from 'socket.io'
import pool from '../db'

export const registerRideSocket = (io: Server) => {
    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`)

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
        console.log(`Client disconnected: ${socket.id}`)
    })
    })

}