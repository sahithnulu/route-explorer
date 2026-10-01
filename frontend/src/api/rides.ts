import type { Ride, GeoJSONFeatureCollection } from "../types";

// API functions for rides endpoints
// All functions read the access token from localStorage via getToken()
// BASE_URL points to the backend (update this when deploying)
const BASE_URL = 'http://localhost:3000'

const getToken = () => localStorage.getItem('accessToken');

export const createRide = async (): Promise<{ rideId: string }> => {
  const createRideResponse = await fetch(`${BASE_URL}/rides`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  })
  return createRideResponse.json()
}

export const endRide = async (rideId: string): Promise<Ride> => {
    const endRideResponse = await fetch(`${BASE_URL}/rides/${rideId}/end`, {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${getToken()}`
        }
    })
    return endRideResponse.json()
}

export const getRides = async (): Promise<Ride[]> => {
    const getRidesResponse = await fetch(`${BASE_URL}/rides`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${getToken()}`
        }
    })
    return getRidesResponse.json()
}

export const getRide = async (rideId: string): Promise<{ ride: Ride, geoJSON: GeoJSONFeatureCollection }> => {
    const getRideResponse = await fetch(`${BASE_URL}/rides/${rideId}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${getToken()}`
        }
    })
    return getRideResponse.json()
}