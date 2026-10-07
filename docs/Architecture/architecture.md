# AWS Infrastructure

```mermaid
graph TB
    User([Rider's browser / phone])

    subgraph DNS
        R53[Route 53<br/>route-explorer.online]
    end

    subgraph CDN
        CF[CloudFront<br/>*.route-explorer.online]
        S3[S3<br/>route-explorer-prod-frontend]
    end

    subgraph VPC
        subgraph Public subnets
            ALB[Application Load Balancer<br/>api.route-explorer.online<br/>HTTPS :443]
        end

        subgraph Private subnets
            ECS[ECS Fargate<br/>route-explorer-prod-backend<br/>Express + Socket.io :3000]
            RDS[RDS PostgreSQL 16<br/>PostGIS 3.4<br/>routeexplorer_prod]
            EC[ElastiCache Redis 7]
        end
    end

    ACM[ACM Certificate<br/>SSL/TLS]

    User -->|route-explorer.online| R53
    User -->|api.route-explorer.online| R53
    R53 -->|frontend| CF
    R53 -->|API + WebSocket| ALB
    CF --> S3
    ALB -->|HTTP :3000| ECS
    ACM -.->|TLS| CF
    ACM -.->|TLS| ALB
    ECS --> RDS
    ECS --> EC
```

## Key decisions

**ALB instead of API Gateway**: API Gateway HTTP APIs do not support WebSocket protocol upgrades. The ALB handles both REST and WebSocket connections natively on the same listener, which is required for real-time GPS streaming.

**ECS Fargate**: serverless containers — no EC2 instances to manage. The backend runs as a Docker image pushed to ECR and deployed as a Fargate task. Scales by increasing desired count.

**RDS in private subnet**: the database is not publicly accessible. Only the ECS task can reach it, from within the same VPC.

**ElastiCache in private subnet**: same isolation as RDS. Only reachable from within the VPC.

**PostGIS on RDS**: the road graph and GPS points use PostGIS geography types for accurate distance calculations on the Earth's surface rather than a flat plane.