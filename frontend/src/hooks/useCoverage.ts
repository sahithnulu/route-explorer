import { useRef } from 'react'
import L from 'leaflet'
import { getCoverage } from '../api/coverage'

export const useCoverage = (mapRef: React.RefObject<L.Map | null>) => {
    const coverageLayerRef = useRef<L.GeoJSON | null>(null)

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
                    color: '#378ADD',
                    fillColor: '#378ADD',
                    fillOpacity: 0.2,
                    weight: 1
                }
            }).addTo(mapRef.current!)
        }
    }

    return { loadCoverage }
}