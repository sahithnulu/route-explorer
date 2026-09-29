import { readFileSync } from 'fs'
import path from 'path'
import dotenv from 'dotenv'
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })
import pool from '../db'

const importRoads = async () => {
  const rawData = readFileSync('./data/ottawa-roads.json', 'utf-8')
  const parsedData = JSON.parse(rawData)
  
  let count = 0
  
  for (const element of parsedData.elements) {
    if (element.geometry.length >= 2) {
        const coords = element.geometry
        .map((point: { lat: number, lon: number }) => `${point.lon} ${point.lat}`)
        .join(', ')

        const lineString = `LINESTRING(${coords})`

        await pool.query(
            `INSERT INTO road_graph (osm_id, name, geometry, length_meters)
            VALUES ($1, $2, ST_GeomFromText($3, 4326)::geography, ST_Length(ST_GeomFromText($3, 4326)::geography))`,
            [element.id.toString(), element.tags?.name || null, lineString]
        )

        count++
        if (count % 100 === 0) {
            console.log(`Imported ${count} roads...`)
        }
    }
  }
  
  await pool.end()
  console.log(`Done — imported ${count} roads`)
}

importRoads()