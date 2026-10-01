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

    // socketRef: Socket.io connection (persists without re-renders)
    // polylineRef: Leaflet polyline being drawn on the map
    // sequenceRef: GPS point counter (ensures correct ordering in database)
    // startTimeRef: when the ride started (for elapsed time calculation)
    // simulateRef: interval reference for the GPS simulation
    const socketRef = useRef<Socket | null>(null)
    const polylineRef = useRef<L.Polyline | null>(null)
    const sequenceRef = useRef<number>(0)
    const startTimeRef = useRef<Date | null>(null)
    const simulateRef = useRef<ReturnType<typeof setInterval> | null>(null)

    // Timer effect, updates elapsed every second while isRiding is true
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

    // startRide, creates ride in DB, connects socket, starts GPS simulation
    // Waits for socket 'connect' event before starting simulation
    // (socket connection is async, starting before connect causes rideId to be null on backend)
    const startRide = async () => {
    const data = await createRide()
    setRideId(data.rideId)

    socketRef.current = io('http://localhost:3000', { auth: { token: getToken() } })

    polylineRef.current = L.polyline([], { color: 'blue' }).addTo(mapRef.current!)

    sequenceRef.current = 0
    startTimeRef.current = new Date()
    setDistance(0)
    setElapsed('00:00')
    setIsRiding(true)

    // Wait for socket to connect before starting GPS simulation
    socketRef.current.on('connect', () => {
        simulateGPS(data.rideId, socketRef.current!)
    })
}

    // stopRide, clears simulation, disconnects socket, removes polyline, ends ride in DB
    const stopRide = async () => {
    if (simulateRef.current) {
        clearInterval(simulateRef.current)
        simulateRef.current = null
    }

    socketRef.current?.disconnect()

    polylineRef.current?.remove()
    polylineRef.current = null

    if (rideId) await endRide(rideId)

    setIsRiding(false)
    setRideId(null)

    onRideEnd()
    }

    // simulateGPS — simulates GPS movement by incrementing coordinates
    // In production this would use navigator.geolocation.watchPosition()
    // Randomly changes direction every ~10 seconds for a more realistic path
    const simulateGPS = (newRideId: string, socket: Socket) => {
    let lat = 45.4215
    let lng = -75.6972

    const directions = [
        { lat: 0.0001, lng: 0 },
        { lat: -0.0001, lng: 0 },
        { lat: 0, lng: 0.0001 },
        { lat: 0, lng: -0.0001 },
        { lat: 0.0001, lng: 0.0001 },
        { lat: 0.0001, lng: -0.0001 },
    ]

    let dirIndex = 0

    simulateRef.current = setInterval(() => {
        if (Math.random() < 0.1) {
        dirIndex = Math.floor(Math.random() * directions.length)
        }
        lat += directions[dirIndex].lat
        lng += directions[dirIndex].lng

        const point: L.LatLngTuple = [lat, lng]
        polylineRef.current?.addLatLng(point)
        mapRef.current?.setView(point, mapRef.current.getZoom())

        const latlngs = polylineRef.current?.getLatLngs() as L.LatLng[]
        if (latlngs.length > 1) {
        const prev = latlngs[latlngs.length - 2]
        const curr = latlngs[latlngs.length - 1] as L.LatLng
        setDistance(d => d + curr.distanceTo(prev))
        }

        socket.emit('gps:point', {
        rideId: newRideId,
        lat,
        lng,
        timestamp: new Date().toISOString(),
        sequenceNumber: sequenceRef.current++
        })
    }, 1000)
    }

    return { isRiding, elapsed, distance, startRide, stopRide }

}