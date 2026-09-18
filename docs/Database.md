Database Schema

# users

| Column | Type | Description |
|---|---|---|
| id | uuid | unique identifier for the user |
| email | varchar(255) | user's email address (used for register/login) |
| password_hash | varchar(255) | bcrypt hashed password |
| created_at | timestamp | timestamp of when account was created |

# rides

| Column | Type | Description |
|---|---|---|
| id | uuid | unique identifier for the ride |
| user_id | uuid | links the ride to the user who recorded it |
| started_at | timestamp | timestamp of when the ride started |
| ended_at | timestamp | timestamp of when the ride ended |
| distance_meters | float | total distance of ride in metres (Computed using PostGIS) |
| duration_seconds | integer | total duration of the ride in seconds |
| status | varchar(20) | current status of the ride (either active or completed) |

# route_points

| Column | Type | Description |
|---|---|---|
| id | uuid | unique identifier for the GPS point |
| ride_id | uuid | links the GPS point to the ride it belongs to |
| location | geography(POINT, 4326) | GPS coordinate stored as a PostGIS GEOGRAPHY(POINT) type |
| recorded_at | timestamp | timestamp of when the GPS ping was captured |
| sequence_number | integer | preserves order of points so route can be reconstructed correctly |

# road_graph

| Column | Type | Description |
|---|---|---|
| id | uuid | unique identifier for the road segment |
| osm_id | varchar(255) | original OpenStreetMap identifier for the road |
| name | varchar(255) | road name (nullable since not all roads have names) |
| geometry | geography(LINESTRING, 4326) | road segment stored as a PostGIS GEOGRAPHY(LINESTRING) type|
| length_meters | float | length of the road segment in metres (pathfinding algorithm) |