import express from 'express'
import authRouter from './auth'
import rideRouter from './rides'

const router = express.Router()

router.use('/', authRouter)
router.use('/', rideRouter)

export default router