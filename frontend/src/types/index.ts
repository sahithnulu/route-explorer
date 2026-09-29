export interface Ride {
    id: string,
    user_id: string,
    started_at: string,
    ended_at: string | null,
    distance_meters: number | null,
    duration_seconds: number | null,
    status: 'active' | 'completed'
}

export interface GPSPoint {
    rideId: string,
    lat: number,
    lng: number, 
    timestamp: string,
    sequenceNumber: number
}

export interface GeoJSONFeatureCollection {
    type: 'FeatureCollection',
    features: any[]
}