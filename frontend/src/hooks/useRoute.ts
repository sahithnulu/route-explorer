import { useState, useRef } from 'react'
import L from 'leaflet'
import { apiFetch } from '../api/apiFetch'
import pinImg from '../assets/Starting.png'
import flagImg from '../assets/destination.png'

// Custom emoji pins with drop shadow for visibility
const startIcon = L.icon({
  iconUrl: pinImg,
  iconSize: [36, 36],
  iconAnchor: [18, 36]
})

const destIcon = L.icon({
  iconUrl: flagImg,
  iconSize: [36, 36],
  iconAnchor: [8, 36]
})

export const useRoute = (mapRef: React.RefObject<L.Map | null>) => {
  // isLoading: true while route requests are in flight
  // error: error message shown if routing fails
  // routeStats: distance and mode of the last planned route for the stats bar
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [routeStats, setRouteStats] = useState<{ distance: number; mode: string } | null>(null)

  // Refs hold Leaflet layers so they persist without causing re-renders
  const fastestLayerRef = useRef<L.Polyline | null>(null)
  const undiscoveredLayerRef = useRef<L.Polyline | null>(null)
  const startMarkerRef = useRef<L.Marker | null>(null)
  const destMarkerRef = useRef<L.Marker | null>(null)

  // Places the green start pin on the map
  const setStartMarker = (lat: number, lng: number) => {
    startMarkerRef.current?.remove()
    startMarkerRef.current = L.marker([lat, lng], { icon: startIcon }).addTo(mapRef.current!)
  }

  // Places the red destination pin on the map
  const setDestMarker = (lat: number, lng: number) => {
    destMarkerRef.current?.remove()
    destMarkerRef.current = L.marker([lat, lng], { icon: destIcon }).addTo(mapRef.current!)
  }

  // Removes all route polylines and pins from the map and resets stats
  const clearRoutes = () => {
    fastestLayerRef.current?.remove()
    fastestLayerRef.current = null
    undiscoveredLayerRef.current?.remove()
    undiscoveredLayerRef.current = null
    startMarkerRef.current?.remove()
    startMarkerRef.current = null
    destMarkerRef.current?.remove()
    destMarkerRef.current = null
    setRouteStats(null)
    setError(null)
  }

  // Calls one route endpoint and returns the polyline layer and distance
  // Returns null if no route was found
  const fetchRoute = async (
    endpoint: string,
    start: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    color: string
  ): Promise<{ layer: L.Polyline; distance: number } | null> => {
    const res = await apiFetch(`/routes/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start, destination })
    })

    if (!res.ok) return null

    const data = await res.json()

    // GeoJSON coordinates are [lng, lat]: Leaflet expects [lat, lng] so we swap
    const coords = data.features[0].geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng] as L.LatLngTuple
    )

    const layer = L.polyline(coords, { color, weight: 4, opacity: 0.8 }).addTo(mapRef.current!)
    const distance = data.features[0].properties.distance

    return { layer, distance }
  }

  // Fetches one route (fastest or undiscovered), draws it on the map, and updates stats
  const planRoutes = async (
    start: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    mode: 'fastest' | 'undiscovered'
  ) => {
    setIsLoading(true)
    setError(null)
    setRouteStats(null)

    // Clear old route polylines but keep the pins
    fastestLayerRef.current?.remove()
    fastestLayerRef.current = null
    undiscoveredLayerRef.current?.remove()
    undiscoveredLayerRef.current = null

    try {
      const color = mode === 'fastest' ? '#378ADD' : '#ED8936'
      const result = await fetchRoute(mode, start, destination, color)

      if (!result) {
        setError('No route found between these two points')
        return
      }

      if (mode === 'fastest') fastestLayerRef.current = result.layer
      else undiscoveredLayerRef.current = result.layer

      // Fit map bounds to show the full route
      mapRef.current?.fitBounds(result.layer.getBounds())

      // Update stats bar with distance and estimated time
      setRouteStats({ distance: result.distance, mode })
    } catch {
      setError('Something went wrong, please try again')
    } finally {
      setIsLoading(false)
    }
  }

  return { isLoading, error, routeStats, planRoutes, clearRoutes, setStartMarker, setDestMarker }
}