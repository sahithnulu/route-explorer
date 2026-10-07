import path from 'path'
import dotenv from 'dotenv'
// Load environment variables before any other imports
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import router from './routes/routeHandler'
import { registerRideSocket } from './socket/rideSocket'
import geocodeRouter from './routes/geocode'

const app = express()
// Create HTTP server wrapping Express so Socket.io can attach to it
const httpServer = createServer(app)
const port = process.env.PORT || 3000

// Socket.io server, allow connections from the frontend
const io = new Server(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
})

app.use(cors({ origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173' }))
// Parse JSON request bodies
app.use(express.json())

// Health check endpoint, used by AWS ECS to verify the container is running
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' })
})

// Register all route handlers (auth, rides)
app.use('/', router)
app.use(geocodeRouter)

// Register Socket.io event handlers for real-time GPS tracking
registerRideSocket(io)

// Don't start the server when running tests, supertest handles that
if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(port, () => {
    console.log(`Server is running on port ${port}`)
  })
}

export { httpServer }
export default app