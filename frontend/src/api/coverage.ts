import type { GeoJSONFeatureCollection } from "../types";

// API functions for coverage endpoints
// All functions read the access token from localStorage via getToken()
// BASE_URL points to the backend (update this when deploying)

const BASE_URL = 'http://localhost:3000'

const getToken = () => localStorage.getItem('accessToken');

export const getCoverage = async (): Promise<GeoJSONFeatureCollection> => {
  const res = await fetch(`${BASE_URL}/coverage`, {
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  })
  return res.json()
}