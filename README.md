# Route Explorer

Motorcycle riders who want to explore their city have no good way to track which roads they've already ridden. Apps like Calimoto focus on finding scenic or curvy routes, but none of them answer the question a curious rider actually has: where haven't I been yet?

Route Explorer is a Progressive Web App that lets riders track every route they ride and visualize their cumulative coverage on a map, showing exactly which roads they've explored and which ones they haven't. Individual past rides are visible as distinct routes, and all rides combined form a coverage layer that grows over time as the rider explores more of their city.

The app also helps riders plan their next ride, offering both the fastest route to a destination and an alternative that deliberately avoids roads they've already ridden, using a custom pathfinding algorithm built on real OpenStreetMap road data.

No app install needed. Just open it on your phone, press Start, and ride.

**[Live Demo](https://route-explorer.online/)** —> log in with `demo@routeexplorer.com` / `password123`

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript, Leaflet, Socket.io client |
| Backend | Express + TypeScript, Socket.io |
| Database | PostgreSQL + PostGIS |
| Cache | Redis |
| Infrastructure | AWS (ECS Fargate, RDS, ElastiCache, ALB, S3, CloudFront) |
| IaC | Terraform |
| CI/CD | GitHub Actions |

---

## Local setup

### Prerequisites

- Docker and Docker Compose
- Node.js 20

### Run locally

```bash
git clone https://github.com/sahithnulu/route-explorer
cd route-explorer
docker-compose up -d
cd backend && npm install && npm run dev
cd ../frontend && npm install && npm run dev
```

The backend runs at `http://localhost:3000` and the frontend at `http://localhost:5173`.

### Run tests

```bash
cd backend && npm test
```

---

## Documentation

**Architecture**
- [High-level architecture](docs/Architecture/architecture.md)
- [System design](docs/Architecture/systemDesign.md)
- [Product requirements](docs/Architecture/prd.md)
- [Use case scenarios](docs/Architecture/useCases.md)
- [Real-time GPS data flow](docs/Architecture/dataFlow.md)

**Algorithm**
- [Route planning algorithm](docs/Architecture/algorithm.md)

**Database**
- [Database schema](docs/Database/databaseSchema.md)
- [Entity relationship diagram](docs/Database/erd.md)