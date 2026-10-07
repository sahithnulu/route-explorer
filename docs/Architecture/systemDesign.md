# System Design

## Problem

Motorcycle riders who want to explore their city have no way to track which roads they've already ridden. Route Explorer solves this by tracking every ride in real time, building a cumulative coverage map, and using that coverage data to suggest routes that prioritize roads the rider hasn't been on yet.

---

## Architecture overview

The system has three main parts: a React PWA served from S3/CloudFront, an Express + Socket.io backend running on ECS Fargate, and a PostgreSQL + PostGIS database on RDS. A Redis cache on ElastiCache stores the road graph adjacency list so it doesn't have to be rebuilt from SQL on every route request.

See [architecture diagram](architecture.md) and [infrastructure diagram](infrastructure.md).

---

## Tech stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | React + Vite + TypeScript | Fast builds, PWA support via vite-plugin-pwa |
| Map | Leaflet | Lightweight, open source, works well with OpenStreetMap tiles |
| Backend | Express + TypeScript | Simple, well-understood, good ecosystem |
| Real-time | Socket.io | Handles WebSocket with fallback, works through ALB |
| Database | PostgreSQL + PostGIS | Native geographic types, ST_Length and ST_MakeLine for distance |
| Cache | Redis (ElastiCache) | Keeps road graph in memory, shared across ECS instances |
| Infrastructure | Terraform | All AWS resources defined as code |
| Deployment | ECS Fargate + ECR | Containerized, no servers to manage |
| CDN | CloudFront + S3 | Global edge caching for the static frontend |
| CI/CD | GitHub Actions | Test on PR, deploy on push to main |

---

## Data flow: real-time GPS tracking

1. Rider presses Start — frontend calls `POST /rides` to create a ride record, then opens a Socket.io WebSocket connection
2. Browser's `navigator.geolocation.watchPosition` fires every 3–5 seconds
3. Each GPS point is emitted over WebSocket as `gps:point { rideId, lat, lng, timestamp, sequenceNumber }`
4. Backend inserts the point into `route_points` using `ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography`
5. Backend emits `server:ack { sequenceNumber }` to confirm the save
6. Frontend appends the coordinate to the Leaflet polyline — route draws in real time

See [data flow diagram](dataFlow.md) for a sequence diagram.

---

## Data flow: route planning

1. Rider enters a destination — frontend geocodes it using the Nominatim API
2. Frontend calls `POST /routes/fastest` or `POST /routes/undiscovered` with start and destination coordinates
3. Backend loads the road graph from Redis (or falls back to PostgreSQL if cache is cold)
4. Backend snaps the start and destination coordinates to the nearest graph nodes using Euclidean distance
5. For fastest route: Dijkstra's algorithm finds the shortest path
6. For undiscovered route: modified Dijkstra applies a 10x penalty to roads already ridden, then finds the path
7. Backend reconstructs the path and returns it as a GeoJSON FeatureCollection
8. Frontend renders the routes on the map — fastest in blue, undiscovered in red

---

## Road graph

The road network is stored as a weighted directed graph loaded from OpenStreetMap data. Nodes are road endpoints stored as `"lng,lat"` coordinate strings. Edges are road segments weighted by `length_metres`.

The graph covers Ottawa and Gatineau: 18,187 road segments, approximately 3,360 km of roads. It is stored in the `road_graph` PostgreSQL table and cached in Redis as a JSON adjacency list on first load.

See [algorithm documentation](algorithm.md) for how Dijkstra and the undiscovered route algorithm work.

---

## Key design decisions

**WebSocket via ALB instead of API Gateway**: API Gateway HTTP APIs don't support WebSocket protocol upgrades. The ALB handles both REST and WebSocket on the same HTTPS listener, which is required for real-time GPS point streaming.

**Road graph cached in Redis**: the adjacency list for 18,000+ nodes is expensive to rebuild from SQL joins on every request. Redis keeps it in memory and shares it across all ECS instances. The cache is invalidated manually when road data is reimported.

**PostGIS geography type**: GPS points and road segments are stored as PostGIS `geography` types rather than plain floats. This lets the database compute geodesic distances (accounting for Earth's curvature) using `ST_Length` and `ST_MakeLine` rather than requiring application-level math.

**Penalty-based undiscovered routing**: instead of a separate algorithm, the undiscovered route uses the same Dijkstra implementation with a 10x weight multiplier on ridden edges. A proportional penalty rather than a fixed one means longer ridden roads are penalized more than short ones, which produces more natural route deviations.

---

## Known limitations

- **No turn restrictions**: OSM encodes one-way streets and turn restrictions but the current implementation treats all roads as bidirectional
- **Static road graph**: the graph is a snapshot of OSM data. New roads aren't reflected until the import script is re-run manually
- **Single ECS instance**: desired count is set to 1. Scaling to multiple instances works without code changes since the road graph is shared via Redis, but has not been tested
- **Socket.io auth**: the WebSocket connection does not verify the JWT on connection — any client can emit GPS points to any ride ID