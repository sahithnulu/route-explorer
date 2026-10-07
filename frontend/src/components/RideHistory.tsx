import { useState } from 'react'
import L from 'leaflet'
import { getRides, getRide } from '../api/rides'
import type { Ride } from '../types'

interface RideHistoryProps {
  mapRef: React.RefObject<L.Map | null>
  onViewRide: () => void
  onClose: () => void
}

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

const RideHistory = ({ mapRef, onViewRide, onClose }: RideHistoryProps) => {
  const [showHistory, setShowHistory] = useState(false)
  const [rides, setRides]             = useState<Ride[]>([])
  const [selectedLayer, setSelectedLayer] = useState<L.Polyline | null>(null)

  // Fetches all completed rides from the API and updates state
  const loadRides = async () => {
    const data = await getRides()
    if (!Array.isArray(data)) return
    setRides(data)
  }

  // Cleans up the selected route layer and reloads coverage when the panel closes
  const handleClose = () => {
    if (selectedLayer) {
      mapRef.current?.removeLayer(selectedLayer)
      setSelectedLayer(null)
    }
    setShowHistory(false)
    onClose()
  }

  // Fetches a specific ride's GPS points and draws the route on the map in red.
  // Hides coverage layer first (via onViewRide) to reduce visual clutter.
  // Fits map bounds to show the full route.
  const viewRideOnMap = async (rideId: string) => {
    onViewRide()
    const data = await getRide(rideId)

    if (selectedLayer) mapRef.current?.removeLayer(selectedLayer)

    const coords = data.geoJSON.features.map((f: any) => [
      f.geometry.coordinates[1], // lat
      f.geometry.coordinates[0]  // lng
    ])

    const layer = L.polyline(coords, { color: '#f87171', weight: 3 }).addTo(mapRef.current!)
    setSelectedLayer(layer)
    mapRef.current?.fitBounds(layer.getBounds())
  }

  return (
    <>
      {!showHistory && (
        <button
          className="rh-trigger-btn"
          onClick={() => { setShowHistory(true); loadRides() }}
        >
          Ride History
        </button>
      )}

      {showHistory && (
        <div className="rh-panel">
          <div className="rh-panel-header">
            <h3>Ride History</h3>
            <button className="rh-close-btn" onClick={handleClose}>✕</button>
          </div>

          {rides.length === 0 ? (
            <p className="rh-empty">No completed rides yet.</p>
          ) : (
            rides.map(ride => (
              <div
                key={ride.id}
                className="rh-ride-item"
                onClick={() => viewRideOnMap(ride.id)}
              >
                <div className="rh-ride-date">
                  {new Date(ride.started_at).toLocaleDateString('en-CA', {
                    weekday: 'short', month: 'short', day: 'numeric'
                  })}
                </div>
                <div className="rh-ride-meta">
                  <span>📍 {ride.distance_metres ? (ride.distance_metres / 1000).toFixed(2) : '0.00'} km</span>
                  <span>⏱ {ride.duration_seconds ? formatDuration(ride.duration_seconds) : '00:00'}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </>
  )
}

export default RideHistory