import express from 'express'
import authRouter from './auth'
import rideRouter from './rides'
import routeRouter from './routes'

const router = express.Router()

router.use('/', authRouter)
router.use('/', rideRouter)
router.use('/', routeRouter)

export default router