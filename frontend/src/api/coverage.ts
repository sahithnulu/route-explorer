import type { GeoJSONFeatureCollection } from "../types";

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