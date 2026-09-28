import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server } from 'socket.io'
import router from './routes/routeHandler'
import { registerRideSocket } from './socket/rideSocket'

dotenv.config()

const app = express()
const httpServer = createServer(app)
const port = process.env.PORT || 3000

const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
})

app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' })
})

app.use('/', router)

registerRideSocket(io)

if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(port, () => {
    console.log(`Server is running on port ${port}`)
  })
}

export default app