import express from 'express'
import { authenticateToken } from '../middleware/auth'

const geocodeRouter = express.Router()

geocodeRouter.get('/geocode', authenticateToken, async (req, res) => {
    const { q, lat, lng } = req.query
    if (!q) return res.status(400).json({ error: 'Missing query' })

    let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q as string)}&format=json&limit=5&countrycodes=ca`

    // If user coords provided, bias results to a ~50km box around them
    if (lat && lng) {
        const userLat = parseFloat(lat as string)
        const userLng = parseFloat(lng as string)
        const delta = 0.5 // ~50km
        const viewbox = `${userLng - delta},${userLat + delta},${userLng + delta},${userLat - delta}`
        url += `&viewbox=${viewbox}&bounded=1`
    }

    const response = await fetch(url, {
        headers: { 'User-Agent': 'RouteExplorer/1.0' }
    })
    const data = await response.json()
    return res.json(data)
})

export default geocodeRouter