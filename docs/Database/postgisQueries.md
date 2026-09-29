# PostGIS Queries

Documentation of all PostGIS spatial queries used in Route Explorer and what they do.

---

## ST_MakePoint + ST_SetSRID

```sql
ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
```

Used when inserting a GPS point into the `route_points` table.

`ST_MakePoint(lng, lat)` creates a geometric point from longitude and latitude coordinates. `ST_SetSRID(..., 4326)` assigns the WGS84 coordinate system (the same system used by GPS) to the point. The `::geography` cast tells PostGIS to treat it as a real-world geographic coordinate rather than a flat 2D plane, which ensures accurate distance calculations.

---

## ST_MakeLine + ST_Length

```sql
ST_Length(ST_MakeLine(location::geometry ORDER BY sequence_number)::geography)
```

Used when ending a ride to compute the total distance in meters.

`ST_MakeLine` assembles all the individual GPS points for a ride into a single LineString, ordered by `sequence_number` so the line follows the actual path ridden. `ST_Length` then calculates the geodesic length of that line in meters, accounting for the curvature of the Earth rather than treating coordinates as flat.

---

## ST_AsGeoJSON

```sql
ST_AsGeoJSON(location)::json
```

Used when fetching a ride's route to convert stored PostGIS points into GeoJSON format.

PostGIS stores coordinates in its own internal binary format. `ST_AsGeoJSON` converts them into the GeoJSON standard format that Leaflet and other mapping libraries understand. The `::json` cast returns it as a JSON object rather than a string so it can be included directly in the API response.

---

## ST_Buffer + ST_Union

```sql
ST_Union(ST_Buffer(location::geometry, 0.0001))
```

Used when computing the coverage layer showing all roads a rider has ever ridden.

`ST_Buffer` expands each GPS point into a small circle with a radius of 0.0001 degrees (approximately 10 meters), approximating the width of a road. `ST_Union` then merges all those circles into a single polygon. The result is a coverage shape that fills in the roads the rider has traveled, which is then returned as GeoJSON and rendered as a semi-transparent overlay on the map.