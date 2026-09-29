import { useState, useRef, useEffect } from 'react'
import { Socket, io } from 'socket.io-client'
import L from 'leaflet'
import { createRide, endRide } from '../api/rides'

const getToken = () => localStorage.getItem('accessToken')

export const useRide = (mapRef: React.RefObject<L.Map | null>, onRideEnd: () => void) => {
    const [isRiding, setIsRiding] = useState(false)
    const [rideId, setRideId] = useState<string | null>(null)
    const [elapsed, setElapsed] = useState('00:00')
    const [distance, setDistance] = useState(0)

    const socketRef = useRef<Socket | null>(null)
    const polylineRef = useRef<L.Polyline | null>(null)
    const sequenceRef = useRef<number>(0)
    const startTimeRef = useRef<Date | null>(null)
    const simulateRef = useRef<ReturnType<typeof setInterval> | null>(null)

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

    const startRide = async () => {
        const data = await createRide()
        setRideId(data.rideId)

        socketRef.current = io('http://localhost:3000', { auth: { token: getToken() } })

        polylineRef.current =  L.polyline([], { color: 'blue' }).addTo(mapRef.current!)

        sequenceRef.current = 0
        startTimeRef.current = new Date()
        setDistance(0)
        setElapsed('00:00')
        setIsRiding(true)
        simulateGPS(data.rideId, socketRef.current)

    }

    const stopRide = async () => {
        if (simulateRef.current) {
            clearInterval(simulateRef.current)
            simulateRef.current = null
        } 

        socketRef.current?.disconnect()

        if (rideId) await endRide(rideId)

        setIsRiding(false)
        setRideId(null)

        onRideEnd()

    }

    const simulateGPS = (newRideId: string, socket: Socket) => {
    let lat = 45.4215
    let lng = -75.6972

    simulateRef.current = setInterval(() => {
        lat += 0.0001
        lng += 0.0001

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