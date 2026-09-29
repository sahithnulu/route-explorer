import { useState } from 'react'
import L from 'leaflet'
import { getRides, getRide } from '../api/rides'
import type { Ride } from '../types'

interface RideHistoryProps {
  mapRef: React.RefObject<L.Map | null>
}

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

const RideHistory = ({ mapRef }: RideHistoryProps) => {
  const [showHistory, setShowHistory] = useState(false)
  const [rides, setRides] = useState<Ride[]>([])
  const [selectedLayer, setSelectedLayer] = useState<L.Polyline | null>(null)

  const loadRides = async () => {
    const data = await getRides()
    if (!Array.isArray(data)) return
    setRides(data)
  }

  const viewRideOnMap = async (rideId: string) => {

    const data = await getRide(rideId)

    if (selectedLayer) {
        mapRef.current?.removeLayer(selectedLayer)
    }

    const coords = data.geoJSON.features.map((f: any) => [
        f.geometry.coordinates[1],  // lat
        f.geometry.coordinates[0]   // lng
    ])

    const layer = L.polyline(coords, { color: 'red' }).addTo(mapRef.current!)
    setSelectedLayer(layer)
    mapRef.current?.fitBounds(layer.getBounds())

  }

  return (
    <>
      {!showHistory && (
        <button
          onClick={() => { setShowHistory(true); loadRides() }}
          style={{
            position: 'absolute', top: 16, right: 16, zIndex: 1000,
            padding: '8px 16px', background: 'rgba(0,0,0,0.7)', color: '#fff',
            border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px'
          }}
        >
          Ride History
        </button>
      )}

      {showHistory && (
        <div style={{
          position: 'absolute', top: 0, right: 0, width: '320px', height: '100%',
          background: '#fff', zIndex: 1001, overflowY: 'auto',
          boxShadow: '-4px 0 12px rgba(0,0,0,0.2)'
        }}>
          <div style={{
            padding: '1rem', borderBottom: '1px solid #eee',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <h3 style={{ margin: 0 }}>Ride History</h3>
            <button
              onClick={() => setShowHistory(false)}
              style={{ border: 'none', background: '#f0f0f0', fontSize: '18px', cursor: 'pointer', padding: '4px 10px', borderRadius: '4px' }}
            >
              ✕
            </button>
          </div>

          {rides.length === 0 ? (
            <p style={{ padding: '1rem', color: '#666' }}>No completed rides yet</p>
          ) : (
            rides.map(ride => (
              <div
                key={ride.id}
                onClick={() => viewRideOnMap(ride.id)}
                style={{
                  padding: '1rem', borderBottom: '1px solid #eee',
                  cursor: 'pointer'
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f9f9f9')}
                onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
              >
                <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                  {new Date(ride.started_at).toLocaleDateString('en-CA', {
                    weekday: 'short', month: 'short', day: 'numeric'
                  })}
                </div>
                <div style={{ fontSize: '13px', color: '#666', display: 'flex', gap: '12px' }}>
                  <span>📍 {ride.distance_meters ? (ride.distance_meters / 1000).toFixed(2) : '0.00'} km</span>
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