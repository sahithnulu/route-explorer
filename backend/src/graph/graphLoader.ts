import redis from '../redis'
import pool from '../db'

// Loads the Ottawa road graph, checks Redis cache first, falls back to PostgreSQL
// The graph is an adjacency list: { nodeId: [{ node, weight }, ...] }
// Node IDs are "lng,lat" strings, road endpoints that share coordinates are automatically connected
// The graph is cached in Redis so it only needs to be built from PostgreSQL once
export const loadGraph = async () => {
  // Check if the graph is already cached in Redis
  // If yes, parse and return it (fast path, microseconds)
  // If no, query road_graph table, build adjacency list, cache in Redis, return
  try {
    const graphData = await redis.get('road_graph')
    if (graphData) {
      return JSON.parse(graphData)
    } else {
        const result = await pool.query(`
            SELECT 
            id,
            length_metres,
            ST_AsGeoJSON(geometry)::json as geojson
            FROM road_graph
        `)

        const graph: { [nodeId: string]: { node: string; weight: number }[] } = {}
        
        // For each road segment: extract first and last coordinates of the LineString
        // These become the two nodes. Add edges in both directions (roads are bidirectional)
        // Weight = length_metres of the road segment
        for (const row of result.rows) {
            const coords = row.geojson.coordinates
            const startNode = `${coords[0][0]},${coords[0][1]}`  // "lng,lat"
            const endNode = `${coords[coords.length - 1][0]},${coords[coords.length - 1][1]}`

            if (!graph[startNode]) {
                graph[startNode] = []
            }
            if (!graph[endNode]) {
                graph[endNode] = []
            }
     
            graph[startNode].push({ node: endNode, weight: row.length_metres })
            graph[endNode].push({ node: startNode, weight: row.length_metres })

        }

        await redis.set('road_graph', JSON.stringify(graph))
        return graph
    }
  } catch (error) {
    console.error('Error loading graph data from Redis:', error)
    return null
  }
}