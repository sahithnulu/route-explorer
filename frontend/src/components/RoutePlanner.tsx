import { useState, useEffect, useRef } from 'react'
import L from 'leaflet'
import { useRoute } from '../hooks/useRoute'
import { apiFetch } from '../api/apiFetch'
import pinImg from '../assets/Starting.png'
import flagImg from '../assets/destination.png'

interface RoutePlannerProps {
  mapRef: React.RefObject<L.Map | null>
}

type Location = { lat: number; lng: number; name: string }

// Searches via backend proxy to avoid CORS issues with Nominatim.
// Passes user coords when available to bias results to their area.
const searchNominatim = async (query: string, userCoords: { lat: number; lng: number } | null) => {
  let path = `/geocode?q=${encodeURIComponent(query)}`
  if (userCoords) path += `&lat=${userCoords.lat}&lng=${userCoords.lng}`
  const res = await apiFetch(path)
  return res.json()
}

const RoutePlanner = ({ mapRef }: RoutePlannerProps) => {
  const [startQuery, setStartQuery]           = useState('')
  const [start, setStart]                     = useState<Location | null>(null)
  const [startSuggestions, setStartSuggestions] = useState<any[]>([])

  const [destQuery, setDestQuery]             = useState('')
  const [destination, setDestination]         = useState<Location | null>(null)
  const [destSuggestions, setDestSuggestions] = useState<any[]>([])

  // clickMode: which pin the next map click will place
  const [clickMode, setClickMode]             = useState<'start' | 'destination' | null>(null)
  const [userCoords, setUserCoords]           = useState<{ lat: number; lng: number } | null>(null)

  // Debounce timer: prevents firing a search request on every keystroke
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { isLoading, error, routeStats, planRoutes, clearRoutes, setStartMarker, setDestMarker } = useRoute(mapRef)

  // Silently get user location on mount to bias search results
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {} // fail silently: search still works, just unbiased
    )
  }, [])

  // Attaches a one-time map click listener when clickMode is active.
  // Changes cursor to crosshair so the user knows they can click.
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

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude: lat, longitude: lng } = pos.coords
      const name = 'Current Location'
      setStart({ lat, lng, name })
      setStartQuery(name)
      setStartMarker(lat, lng)
      setUserCoords({ lat, lng })
      mapRef.current?.setView([lat, lng], 14)
    })
  }

  const debouncedSearch = (fn: () => void) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(fn, 300)
  }

  const searchStart = (value: string) => {
    setStartQuery(value)
    if (value.length < 3) { setStartSuggestions([]); return }
    debouncedSearch(async () => setStartSuggestions(await searchNominatim(value, userCoords)))
  }

  const searchDest = (value: string) => {
    setDestQuery(value)
    if (value.length < 3) { setDestSuggestions([]); return }
    debouncedSearch(async () => setDestSuggestions(await searchNominatim(value, userCoords)))
  }

  const selectStart = (place: any) => {
    const loc = { lat: parseFloat(place.lat), lng: parseFloat(place.lon), name: place.display_name }
    setStart(loc); setStartQuery(place.display_name); setStartSuggestions([])
    setStartMarker(loc.lat, loc.lng)
  }

  const selectDest = (place: any) => {
    const loc = { lat: parseFloat(place.lat), lng: parseFloat(place.lon), name: place.display_name }
    setDestination(loc); setDestQuery(place.display_name); setDestSuggestions([])
    setDestMarker(loc.lat, loc.lng)
  }

  const handleClear = () => {
    setStartQuery(''); setStart(null); setStartSuggestions([])
    setDestQuery(''); setDestination(null); setDestSuggestions([])
    setClickMode(null)
    clearRoutes()
  }

  return (
    <div className="app-card rp-card">

      {/* Start location row */}
      <div>
        <div className="rp-row">
          <img src={pinImg} style={{ width: 24, height: 24 }} />  
          <input
            className="app-input"
            type="text"
            value={startQuery}
            onChange={e => searchStart(e.target.value)}
            placeholder="Start location..."
          />
          <div className="rp-actions">
            <button className="app-icon-btn" onClick={useCurrentLocation}>My location</button>
            <button
              className={`app-icon-btn ${clickMode === 'start' ? 'active' : ''}`}
              onClick={() => setClickMode(prev => prev === 'start' ? null : 'start')}
            >Pin on map</button>
          </div>
        </div>

        {startSuggestions.length > 0 && (
          <div className="app-suggestions">
            {startSuggestions.map((p, i) => (
              <div key={i} className="app-suggestion-item" onClick={() => selectStart(p)}>
                {p.display_name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Destination row */}
      <div>
        <div className="rp-row">
          <img src={flagImg} style={{ width: 24, height: 24, filter: 'invert(1)' }} />
          <input
            className="app-input"
            type="text"
            value={destQuery}
            onChange={e => searchDest(e.target.value)}
            placeholder="Search destination..."
          />
          <div className="rp-actions">
            <button
              className={`app-icon-btn ${clickMode === 'destination' ? 'active' : ''}`}
              onClick={() => setClickMode(prev => prev === 'destination' ? null : 'destination')}
            >Pin on map</button>
          </div>
        </div>

        {destSuggestions.length > 0 && (
          <div className="app-suggestions">
            {destSuggestions.map((p, i) => (
              <div key={i} className="app-suggestion-item" onClick={() => selectDest(p)}>
                {p.display_name}
              </div>
            ))}
          </div>
        )}
      </div>

      {clickMode && (
        <div className="app-hint">
          Click anywhere on the map to set {clickMode === 'start' ? 'start' : 'destination'}
        </div>
      )}

      {start && destination && !clickMode && (
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className="app-btn app-btn-blue"
            onClick={() => planRoutes(start, destination, 'fastest')}
            disabled={isLoading}
          >🔵 Fastest</button>
          <button
            className="app-btn app-btn-orange"
            onClick={() => planRoutes(start, destination, 'undiscovered')}
            disabled={isLoading}
          >🟠 Undiscovered</button>
          <button className="app-btn app-btn-ghost" style={{ flex: 'none', padding: '9px 14px' }} onClick={handleClear}>✕</button>
        </div>
      )}

      {routeStats && (
        <div className="app-route-stats">
          {routeStats.mode === 'fastest' ? '🔵 Fastest' : '🟠 Undiscovered'} route:{' '}
          <strong>{(routeStats.distance / 1000).toFixed(2)} km</strong>
          {' '}·{' '}
          ~<strong>{Math.round(routeStats.distance / 1000 / 50 * 60)} min</strong>
        </div>
      )}

      {error && <div className="app-error-text">{error}</div>}
    </div>
  )
}

export default RoutePlanner