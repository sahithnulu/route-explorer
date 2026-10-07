# Route Planning Algorithm

RouteExplorer needs to answer two questions given a start and destination coordinate:

1. **Fastest route**: what is the shortest path through Ottawa's road network?
2. **Undiscovered route**: what is a path that prioritizes roads the rider hasn't been on yet?

Both problems are solved using graph search algorithms and minheaps on a pre-built road graph loaded from OpenStreetMap data.

---

## The road graph

The road network is represented as a **weighted directed graph**, a collection of nodes (points) connected by edges (road segments) that have weights (distances).

- **Nodes**: road endpoints, stored as `"lng,lat"` strings e.g. `"-75.6972,45.4215"`
- **Edges**: road segments connecting two nodes, weighted by `length_metres`
- **Adjacency list format**: each node maps to an array of its neighbours and edge weights:

```json
{
  "-75.6972,45.4215": [
    { "node": "-75.6971,45.4216", "weight": 15.3 },
    { "node": "-75.6973,45.4214", "weight": 22.1 }
  ]
}
```

The graph contains **18,187 road segments** covering approximately **3,360 km** of roads across Ottawa and Gatineau.

Two road segments that share an endpoint will have the same `"lng,lat"` node ID. This automatically connects them in the graph without any extra logic.

The bounding box query covers:

- North: 45.61°: past Gatineau into Cantley/Wakefield area
- South: 45.21°: past Manotick, down to Kars/North Gower
- East: -75.15°: past Orleans, out to Cumberland/Navan
- West: -76.48°: past Gatineau into the Outaouais region

---

## Dijkstra: fastest route

Dijkstra's algorithm finds the shortest path between two nodes in a weighted graph. It always processes the node with the smallest known distance first, guaranteeing the optimal solution.

**Steps:**

1. Initialize `distanceTo` -> set all nodes to `Infinity`, set source node to `0`
2. Initialize `prevNode` -> set all nodes to `null` (used to reconstruct the path)
3. Enqueue the source node with distance `0` into the min-heap
4. While the heap is not empty:
   - Dequeue the node with the smallest distance
   - If it's the destination —> reconstruct and return the path
   - For each neighbour —> calculate `newDistance = currentDistance + edgeWeight`
   - If `newDistance` is less than the known distance -> update `distanceTo`, update `prevNode`, enqueue the neighbour
5. If the destination is never reached -> return `null`

**Time complexity:** O((V + E) log V) where V = number of nodes and E = number of edges. The log V factor comes from the min-heap insert and extract operations.

---

## Modified Dijkstra: undiscovered route

The undiscovered route uses the same algorithm as Dijkstra but adds a **coverage penalty** to roads the user has already ridden. This makes the algorithm strongly prefer unridden roads without preventing it from using ridden roads when no alternative exists.

- `penalty = weight * 10` : a multiplier rather than a fixed value so longer ridden roads get a proportionally larger penalty than short ones. A fixed penalty of 1000m would be insignificant for a 2km ridden road

**Effect:** A ridden road costing 200m gets an effective cost of 200 + 2000 = 2200m. The algorithm will go up to 2000m out of its way to find an unridden alternative. If no unridden alternative exists within that threshold, it takes the ridden road.