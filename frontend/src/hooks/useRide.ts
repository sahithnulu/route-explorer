import { useState, useRef, useEffect } from 'react'
import { Socket, io } from 'socket.io-client'
import L from 'leaflet'
import { createRide, endRide } from '../api/rides'

const getToken = () => localStorage.getItem('accessToken')

// Custom hook that manages all ride tracking state and logic
export const useRide = (mapRef: React.RefObject<L.Map | null>, onRideEnd: () => void) => {
    // isRiding: whether a ride is currently active
    // rideId: the database ID of the current ride
    // elapsed: formatted timer string "MM:SS"
    // distance: total distance in metres
    const [isRiding, setIsRiding] = useState(false)
    const [rideId, setRideId] = useState<string | null>(null)
    const [elapsed, setElapsed] = useState('00:00')
    const [distance, setDistance] = useState(0)
    const [gpsError, setGpsError] = useState<string | null>(null)

    // socketRef: Socket.io connection (persists without re-renders)
    // polylineRef: Leaflet polyline being drawn on the map
    // sequenceRef: GPS point counter (ensures correct ordering in database)
    // startTimeRef: when the ride started (for elapsed time calculation)
    // watchIdRef: ID returned by watchPosition so we can clear it on stop
    // lastLatLngRef: previous GPS position for distance accumulation
    const socketRef = useRef<Socket | null>(null)
    const polylineRef = useRef<L.Polyline | null>(null)
    const sequenceRef = useRef<number>(0)
    const startTimeRef = useRef<Date | null>(null)
    const watchIdRef = useRef<number | null>(null)
    const lastLatLngRef = useRef<L.LatLng | null>(null)

    // Timer effect: updates elapsed every second while isRiding is true
    useEffect(() => {
        if (!isRiding) return
        const interval = setInterval(() => {
            if (!startTimeRef.current) return
            const diff = Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000)
            const mins = String(Math.floor(diff / 60)).padStart(2, '0')
            const secs = String(diff % 60).padStart(2, '0')
            setElapsed(`${mins}:${secs}`)
        }, 1000)
        return () => clearInterval(interval)
    }, [isRiding])

    // startRide: creates ride in DB, connects socket, starts real GPS tracking
    const startRide = async () => {
        if (!navigator.geolocation) {
            setGpsError('GPS is not available on this device')
            return
        }

        setGpsError(null)
        const data = await createRide()
        setRideId(data.rideId)

        socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
            auth: { token: getToken() }
        })

        polylineRef.current = L.polyline([], { color: '#378ADD', weight: 5, opacity: 0.9 }).addTo(mapRef.current!)

        sequenceRef.current = 0
        startTimeRef.current = new Date()
        lastLatLngRef.current = null
        setDistance(0)
        setElapsed('00:00')
        setIsRiding(true)

        // Start watching real GPS position once socket is connected
        socketRef.current.on('connect', () => {
            watchIdRef.current = navigator.geolocation.watchPosition(
                (pos) => handleGpsPoint(data.rideId, socketRef.current!, pos),
                (err) => setGpsError(`GPS error: ${err.message}`),
                {
                    enableHighAccuracy: true, // use GPS chip rather than wifi/cell
                    maximumAge: 0,            // always use fresh position
                    timeout: 10000
                }
            )
        })
    }

    // Handles each incoming GPS position: updates map, distance, and sends to backend
    const handleGpsPoint = (
        currentRideId: string,
        socket: Socket,
        pos: GeolocationPosition
    ) => {
        const { latitude: lat, longitude: lng } = pos.coords
        const point: L.LatLngTuple = [lat, lng]

        polylineRef.current?.addLatLng(point)
        mapRef.current?.setView(point, mapRef.current.getZoom())

        // Accumulate distance from the previous point
        const curr = L.latLng(lat, lng)
        if (lastLatLngRef.current) {
            setDistance(d => d + curr.distanceTo(lastLatLngRef.current!))
        }
        lastLatLngRef.current = curr

        socket.emit('gps:point', {
            rideId: currentRideId,
            lat,
            lng,
            timestamp: new Date(pos.timestamp).toISOString(),
            sequenceNumber: sequenceRef.current++
        })
    }

    // stopRide: stops GPS watch, disconnects socket, removes polyline, ends ride in DB
    const stopRide = async () => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current)
            watchIdRef.current = null
        }

        socketRef.current?.disconnect()

        polylineRef.current?.remove()
        polylineRef.current = null
        lastLatLngRef.current = null

        if (rideId) await endRide(rideId)

        setIsRiding(false)
        setRideId(null)

        onRideEnd()
    }

    return { isRiding, elapsed, distance, gpsError, startRide, stopRide }
}