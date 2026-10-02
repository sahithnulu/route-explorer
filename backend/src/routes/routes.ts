import express from 'express'
import pool from '../db'
import { authenticateToken } from '../middleware/auth'
import { loadGraph } from '../graph/graphLoader'
import { findShortestRoute, findUndiscoveredRoute } from '../algorithms/routing'

// Calculates the great-circle distance in metres between two GPS coordinates
// Accounts for Earth's curvature — more accurate than simple Euclidean subtraction
// Used to find the nearest road graph node to a given coordinate
const haversine = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const MAX_SNAP_DISTANCE = 50000 // 50km — if nearest node is further than this, coords are out of range

const findNearestNode = (graph: { [nodeId: string]: { node: string; weight: number }[] }, lat: number, lng: number): string | null => {
  let nearestNode: string | null = null
  let minDistance = Infinity
  
  for (const nodeId in graph) {
    const [nodeLng, nodeLat] = nodeId.split(',').map(Number)
    const distance = haversine(lat, lng, nodeLat, nodeLng)
    if (distance < minDistance) {
      minDistance = distance
      nearestNode = nodeId
    }
  }
  
  // If nearest node is too far away, coordinates are out of the road network area
  if (minDistance > MAX_SNAP_DISTANCE) return null
  
  return nearestNode
}

const routeRouter = express.Router()

routeRouter.post('/routes/fastest', authenticateToken, async (req, res) => {
    try {
        const { start, destination } = req.body

        if (!start || !destination) {
            return res.status(400).json({ error: 'Missing required parameters' })
        }

        const graph = await loadGraph()
        if (!graph) return res.status(500).json({ error: 'Failed to load road graph' })

        const startNode = findNearestNode(graph, start.lat, start.lng)
        const destinationNode = findNearestNode(graph, destination.lat, destination.lng)

        if (!startNode || !destinationNode) {
            return res.status(404).json({ error: 'Could not find nearest nodes for the provided coordinates' })
        }

        const route = findShortestRoute(graph, startNode, destinationNode)

        if (!route) {
            return res.status(404).json({ error: 'No route found between the specified points' })
        }

        const coordinates = route.path.map(nodeId => {
            const [lng, lat] = nodeId.split(',').map(Number)
            return [lng, lat]
        })

        return res.status(200).json({
        type: 'FeatureCollection',
        features: [{
            type: 'Feature',
            geometry: { type: 'LineString', coordinates },
            properties: { distance: route.distance }
        }]
        })

    } catch (error) {
        res.status(500).json({ error: 'Internal server error' })
    }
})

routeRouter.post('/routes/undiscovered', authenticateToken, async (req, res) => {
    try {
        const { start, destination } = req.body
        
        if (!start || !destination) {
            return res.status(400).json({ error: 'Missing required parameters' })
        }

        const graph = await loadGraph()
        if (!graph) return res.status(500).json({ error: 'Failed to load road graph' })
            
        const startNode = findNearestNode(graph, start.lat, start.lng)
        const destinationNode = findNearestNode(graph, destination.lat, destination.lng)

        if (!startNode || !destinationNode) {
            return res.status(404).json({ error: 'Could not find nearest nodes for the provided coordinates' })
        }

        const userId = req.user.userId

        const riddenRoadsResult = await pool.query(
        `SELECT 
            ST_AsGeoJSON(geometry)::json as geojson
        FROM road_graph rg
        WHERE ST_Intersects(
            rg.geometry,
            (SELECT ST_Union(ST_Buffer(location::geometry, 0.0001))
            FROM route_points rp
            JOIN rides r ON rp.ride_id = r.id
            WHERE r.user_id = $1)
        )`, [userId])

        const riddenEdges = new Set<string>()
        for (const row of riddenRoadsResult.rows) {
            const coords = row.geojson.coordinates
            const startNode = `${coords[0][0]},${coords[0][1]}`
            const endNode = `${coords[coords.length - 1][0]},${coords[coords.length - 1][1]}`
            riddenEdges.add(`${startNode}-${endNode}`)
            riddenEdges.add(`${endNode}-${startNode}`)
        }

        const route = findUndiscoveredRoute(graph, startNode, destinationNode, riddenEdges)

        if (!route) {
            return res.status(404).json({ error: 'No undiscovered route found between the specified points' })
        }

        const coordinates = route.path.map(nodeId => {
            const [lng, lat] = nodeId.split(',').map(Number)
            return [lng, lat]
        })
        
        return res.status(200).json({
            type: 'FeatureCollection',
            features: [{
                type: 'Feature',
                geometry: { type: 'LineString', coordinates },
                properties: { distance: route.distance }
            }]
        })
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' })
    }
})

export default routeRouter