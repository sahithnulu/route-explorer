# Route Explorer

Motorcycle riders who want to explore their city have no good way to track which roads they've already ridden. Apps like Calimoto focus on finding scenic or curvy routes, but none of them answer the question a curious rider actually has: where haven't I been yet?

Route Explorer is a Progressive Web App that lets riders track every route they ride and visualize their cumulative coverage on a map, showing exactly which roads they've explored and which ones they haven't. Individual past rides are visible as distinct routes, and all rides combined form a coverage layer that grows over time as the rider explores more of their city.

The app also helps riders plan their next ride — offering both the fastest route to a destination and an alternative that deliberately avoids roads they've already ridden, using a custom pathfinding algorithm built on real OpenStreetMap road data.

No app install needed. Just open it on your phone, press Start, and ride.

# Architecture Documentation

[Product Requirements Document](docs/Architecture/prd.md)

[Use Case Scenarios](docs/Architecture/useCases.md)

[Data Flow](docs/Architecture/dataFlow.md)

# Database Documentation

[Entity Relationship Diagram](docs/Database/erd.md)

[Database Schema](docs/Database/databaseSchema.md)

[PostGIS Queries](docs/Database/postgisQueries.md)
 