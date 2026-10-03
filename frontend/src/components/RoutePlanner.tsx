import { useState, useEffect } from 'react'
import L from 'leaflet'
import { useRoute } from '../hooks/useRoute'

interface RoutePlannerProps {
  mapRef: React.RefObject<L.Map | null>
}

type Location = { lat: number; lng: number; name: string }

// Searches Nominatim (free OSM geocoding) for a place name
const searchNominatim = async (query: string) => {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=ca`,
    { headers: { 'Accept-Language': 'en' } }
  )
  return res.json()
}

const RoutePlanner = ({ mapRef }: RoutePlannerProps) => {
  // Start location state
  const [startQuery, setStartQuery] = useState('')
  const [start, setStart] = useState<Location | null>(null)
  const [startSuggestions, setStartSuggestions] = useState<any[]>([])

  // Destination state
  const [destQuery, setDestQuery] = useState('')
  const [destination, setDestination] = useState<Location | null>(null)
  const [destSuggestions, setDestSuggestions] = useState<any[]>([])

  // clickMode: which pin the next map click will place ('start' or 'destination')
  const [clickMode, setClickMode] = useState<'start' | 'destination' | null>(null)

  const { isLoading, error, routeStats, planRoutes, clearRoutes, setStartMarker, setDestMarker } = useRoute(mapRef)

  // Attaches a one-time map click listener when clickMode is active
  // Changes cursor to crosshair so the user knows they can click
  useEffect(() => {
    if (!mapRef.current || !clickMode) return

    const map = mapRef.current
    map.getContainer().style.cursor = 'crosshair'

    const handleClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng
      const name = `${lat.toFixed(5)}, ${lng.toFixed(5)}`

      if (clickMode === 'start') {
        setStart({ lat, lng, name })
        setStartQuery(name)
        setStartMarker(lat, lng)
      } else {
        setDestination({ lat, lng, name })
        setDestQuery(name)
        setDestMarker(lat, lng)
      }

      setClickMode(null)
      map.getContainer().style.cursor = ''
    }

    map.once('click', handleClick)

    return () => {
      map.off('click', handleClick)
      map.getContainer().style.cursor = ''
    }
  }, [clickMode])

  // Gets the device's GPS location and sets it as the start point
  const useCurrentLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude: lat, longitude: lng } = pos.coords
      const name = 'Current Location'
      setStart({ lat, lng, name })
      setStartQuery(name)
      setStartMarker(lat, lng)
      mapRef.current?.setView([lat, lng], 14)
    })
  }

  const searchStart = async (value: string) => {
    setStartQuery(value)
    if (value.length < 3) { setStartSuggestions([]); return }
    setStartSuggestions(await searchNominatim(value))
  }

  const searchDest = async (value: string) => {
    setDestQuery(value)
    if (value.length < 3) { setDestSuggestions([]); return }
    setDestSuggestions(await searchNominatim(value))
  }

  const selectStart = (place: any) => {
    const loc = { lat: parseFloat(place.lat), lng: parseFloat(place.lon), name: place.display_name }
    setStart(loc)
    setStartQuery(place.display_name)
    setStartSuggestions([])
    setStartMarker(loc.lat, loc.lng)
  }

  const selectDest = (place: any) => {
    const loc = { lat: parseFloat(place.lat), lng: parseFloat(place.lon), name: place.display_name }
    setDestination(loc)
    setDestQuery(place.display_name)
    setDestSuggestions([])
    setDestMarker(loc.lat, loc.lng)
  }

  const handleClear = () => {
    setStartQuery(''); setStart(null); setStartSuggestions([])
    setDestQuery(''); setDestination(null); setDestSuggestions([])
    setClickMode(null)
    clearRoutes()
  }

  const inputStyle: React.CSSProperties = {
    flex: 1, padding: '8px 12px', fontSize: '13px',
    border: 'none', borderRadius: '8px', outline: 'none',
    boxShadow: '0 1px 4px rgba(0,0,0,0.12)'
  }

  const iconBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 8px', borderRadius: '8px', border: 'none',
    cursor: 'pointer', fontSize: '14px',
    background: active ? '#378ADD' : '#f0f0f0',
    color: active ? '#fff' : 'inherit'
  })

  const suggestionStyle: React.CSSProperties = {
    padding: '8px 12px', fontSize: '12px', cursor: 'pointer',
    borderTop: '1px solid #f0f0f0', color: '#333', background: '#fff'
  }

  return (
    <div style={{
      position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
      zIndex: 1000, width: '380px', background: 'rgba(255,255,255,0.95)',
      borderRadius: '14px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px'
    }}>

      {/* Start location row: search, GPS button, map click button */}
      <div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '18px' }}>📍</span>
          <input
            type="text" value={startQuery}
            onChange={e => searchStart(e.target.value)}
            placeholder="Start location..."
            style={inputStyle}
          />
          <button onClick={useCurrentLocation} title="Use current location" style={iconBtnStyle(false)}>🎯</button>
          <button onClick={() => setClickMode('start')} title="Click map to set start" style={iconBtnStyle(clickMode === 'start')}>🗺</button>
        </div>

        {/* Start autocomplete suggestions */}
        {startSuggestions.length > 0 && (
          <div style={{ borderRadius: '8px', overflow: 'hidden', marginTop: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            {startSuggestions.map((p, i) => (
              <div key={i} onClick={() => selectStart(p)} style={suggestionStyle}
                onMouseEnter={e => (e.currentTarget.style.background = '#f9f9f9')}
                onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
              >{p.display_name}</div>
            ))}
          </div>
        )}
      </div>

      {/* Destination row: search and map click button */}
      <div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '18px' }}>🏁</span>
          <input
            type="text" value={destQuery}
            onChange={e => searchDest(e.target.value)}
            placeholder="Search destination..."
            style={inputStyle}
          />
          <button onClick={() => setClickMode('destination')} title="Click map to set destination" style={iconBtnStyle(clickMode === 'destination')}>🗺</button>
        </div>

        {/* Destination autocomplete suggestions */}
        {destSuggestions.length > 0 && (
          <div style={{ borderRadius: '8px', overflow: 'hidden', marginTop: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            {destSuggestions.map((p, i) => (
              <div key={i} onClick={() => selectDest(p)} style={suggestionStyle}
                onMouseEnter={e => (e.currentTarget.style.background = '#f9f9f9')}
                onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
              >{p.display_name}</div>
            ))}
          </div>
        )}
      </div>

      {/* Hint shown while map click mode is active */}
      {clickMode && (
        <div style={{ fontSize: '12px', color: '#378ADD', textAlign: 'center' }}>
          Click anywhere on the map to set {clickMode === 'start' ? 'start' : 'destination'}
        </div>
      )}

      {/* Route buttons: only shown when both start and destination are set */}
      {start && destination && !clickMode && (
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => planRoutes(start, destination, 'fastest')}
            disabled={isLoading}
            style={{
              flex: 1, padding: '9px', fontSize: '13px', fontWeight: 600,
              background: '#378ADD', color: '#fff', border: 'none',
              borderRadius: '8px', cursor: 'pointer', opacity: isLoading ? 0.7 : 1
            }}
          >🔵 Fastest</button>
          <button
            onClick={() => planRoutes(start, destination, 'undiscovered')}
            disabled={isLoading}
            style={{
              flex: 1, padding: '9px', fontSize: '13px', fontWeight: 600,
              background: '#ED8936', color: '#fff', border: 'none',
              borderRadius: '8px', cursor: 'pointer', opacity: isLoading ? 0.7 : 1
            }}
          >🟠 Undiscovered</button>
          <button
            onClick={handleClear}
            style={{
              padding: '9px 12px', fontSize: '13px', background: '#f0f0f0',
              border: 'none', borderRadius: '8px', cursor: 'pointer'
            }}
          >✕</button>
        </div>
      )}

      {/* Route stats: distance and estimated time at 50km/h */}
      {routeStats && (
        <div style={{
          fontSize: '12px', color: '#555', textAlign: 'center',
          padding: '6px 10px', background: '#f9f9f7', borderRadius: '8px'
        }}>
          {routeStats.mode === 'fastest' ? '🔵 Fastest' : '🟠 Undiscovered'} route:
          {' '}<strong>{(routeStats.distance / 1000).toFixed(2)} km</strong>
          {' '}· ~<strong>{Math.round(routeStats.distance / 1000 / 50 * 60)} min</strong>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div style={{ fontSize: '13px', color: '#e53e3e', textAlign: 'center' }}>
          {error}
        </div>
      )}
    </div>
  )
}

export default RoutePlanner