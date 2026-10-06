import { apiFetch } from "./apiFetch";
import type { GeoJSONFeatureCollection } from "../types";

export const getCoverage = async (): Promise<GeoJSONFeatureCollection> => {
  const res = await apiFetch('/rides/coverage')
  return res.json()
}