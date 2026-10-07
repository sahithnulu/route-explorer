import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '../styles/app.css'
import helmet from '../assets/helmet.png'
import { useRide } from '../hooks/useRide'
import { useCoverage } from '../hooks/useCoverage'
import RideHistory from './RideHistory'
import RoutePlanner from './RoutePlanner'
import { logout } from '../api/apiFetch'

const MapView = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

  const { loadCoverage, hideCoverage } = useCoverage(mapRef)
  const { isRiding, elapsed, distance, gpsError, startRide, stopRide } = useRide(mapRef, loadCoverage)

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    mapRef.current = L.map(mapContainerRef.current).setView([45.4215, -75.6972], 13)
    loadCoverage()

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapRef.current)

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>

      {/* Top bar */}
      <header className="app-topbar">
        <div className="app-logo">
          <img className="app-logo-img" src={helmet} alt="RouteExplorer" />
          <span className="app-logo-text">Route<span>Explorer</span></span>
        </div>
        <button className="app-logout-btn" onClick={logout}>Log out</button>
      </header>

      {/* Map: fills full screen behind the topbar */}
      <div
        ref={mapContainerRef}
        style={{ width: '100%', height: '100%', paddingTop: 0 }}
      />

      {/* Live stats: shown while riding */}
      {isRiding && (
        <div className="ride-stats-bar">
          <span>⏱ {elapsed}</span>
          <span>📍 {(distance / 1000).toFixed(2)} km</span>
        </div>
      )}

      {/* Start / Stop button */}
      <div className="ride-action-wrap">
        {gpsError && <div className="ride-gps-error">{gpsError}</div>}
        <button
          className={`ride-main-btn ${isRiding ? 'stop' : 'start'}`}
          onClick={isRiding ? stopRide : startRide}
        >
          {isRiding ? 'Stop Ride' : 'Start Ride'}
        </button>
      </div>

      {!isRiding && <RideHistory mapRef={mapRef} onViewRide={hideCoverage} onClose={loadCoverage} />}
      {!isRiding && <RoutePlanner mapRef={mapRef} />}

    </div>
  )
}

export default MapView