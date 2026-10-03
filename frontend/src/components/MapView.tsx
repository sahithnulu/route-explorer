import { useEffect, useRef, useState } from "react";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useRide } from "../hooks/useRide";
import { useCoverage } from "../hooks/useCoverage";
import RideHistory from "./RideHistory";
import RoutePlanner from './RoutePlanner'

const MapView = () => {
  // mapContainerRef: reference to the <div> DOM element that Leaflet attaches to
  // mapRef: holds the Leaflet map instance across re-renders without triggering them
  // Used to add/remove layers (polylines, coverage, GeoJSON) during and after rides
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

  const { loadCoverage, hideCoverage } = useCoverage(mapRef)
  const { isRiding, elapsed, distance, startRide, stopRide } = useRide(mapRef, loadCoverage)

  // Runs once after first render: initializes the Leaflet map
  // Loads coverage layer and adds OpenStreetMap tile layer
  // Cleanup function destroys the map when the component unmounts
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

      {/* Leaflet map container: fills the full screen */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* Live stats bar: only visible while a ride is active */}
      {isRiding && (
        <div style={{
          position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '8px 20px',
          borderRadius: '20px', display: 'flex', gap: '24px', zIndex: 1000, fontSize: '14px'
        }}>
          <span>⏱ {elapsed}</span>
          <span>📍 {(distance / 1000).toFixed(2)} km</span>
        </div>
      )}

      {/* Start/Stop button: toggles ride tracking */}
      <div style={{
        position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', zIndex: 1000
      }}>
        <button
          onClick={isRiding ? stopRide : startRide}
          style={{
            padding: '14px 40px', fontSize: '16px', fontWeight: 600,
            background: isRiding ? '#e53e3e' : '#378ADD',
            color: '#fff', border: 'none', borderRadius: '30px', cursor: 'pointer'
          }}
        >
          {isRiding ? 'Stop Ride' : 'Start Ride'}
        </button>
      </div>

      {/* Ride history panel and route planner: hidden while riding to reduce clutter */}
      {!isRiding && <RideHistory mapRef={mapRef} onViewRide={hideCoverage} onClose={loadCoverage} />}
      {!isRiding && <RoutePlanner mapRef={mapRef} />}

    </div>
  )
}

export default MapView;