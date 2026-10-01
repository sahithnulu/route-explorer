import redis from './redis'
import pool from './db'

export const loadGraph = async () => {
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