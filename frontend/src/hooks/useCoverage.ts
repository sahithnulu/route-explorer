import { useRef } from 'react'
import L from 'leaflet'
import { getCoverage } from '../api/coverage'

// Custom hook for the coverage layer, all roads the user has ever ridden
// merged into a single semi-transparent blue polygon
export const useCoverage = (mapRef: React.RefObject<L.Map | null>) => {
    const coverageLayerRef = useRef<L.GeoJSON | null>(null)

    // loadCoverage fetches coverage GeoJSON from API, removes old layer, renders new one
    // Called on map load and after each ride ends
    const loadCoverage = async () => {
        const data = await getCoverage()

        if (!data || !data.features) return
        
        if (coverageLayerRef.current) {
            mapRef.current?.removeLayer(coverageLayerRef.current)
            coverageLayerRef.current = null
        }

        if (data.features.length > 0) {
            coverageLayerRef.current = L.geoJSON(data, {
                style: {
                    color: 'red',
                    weight: 4,
                    opacity: 0.6
                }
            }).addTo(mapRef.current!)
        }
    }

    // hideCoverage removes the coverage layer from the map
    // Called when user clicks a ride in history (to reduce visual noise)
    // Coverage is restored when the history panel closes
    const hideCoverage = () => {
    if (coverageLayerRef.current) {
        mapRef.current?.removeLayer(coverageLayerRef.current)
        coverageLayerRef.current = null
    }
    }

    return { loadCoverage, hideCoverage }
}