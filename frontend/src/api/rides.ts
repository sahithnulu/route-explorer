import type { Ride, GeoJSONFeatureCollection } from "../types";
import { apiFetch } from "./apiFetch";

export const createRide = async (): Promise<{ rideId: string }> => {
  const res = await apiFetch('/rides', { method: 'POST' })
  return res.json()
}

export const endRide = async (rideId: string): Promise<Ride> => {
  const res = await apiFetch(`/rides/${rideId}/end`, { method: 'PATCH' })
  return res.json()
}

export const getRides = async (): Promise<Ride[]> => {
  const res = await apiFetch('/rides')
  return res.json()
}

export const getRide = async (rideId: string): Promise<{ ride: Ride, geoJSON: GeoJSONFeatureCollection }> => {
  const res = await apiFetch(`/rides/${rideId}`)
  return res.json()
}