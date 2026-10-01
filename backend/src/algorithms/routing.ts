import { MinHeap } from "./minHeap";

type Graph = {
  [node: string]: { node: string; weight: number }[]
}

type RouteResult = {
  path: string[]
  distance: number
} | null

// Dijkstra's algorithm, finds the shortest path between two nodes
// Time complexity: O((V + E) log V) where V = nodes, E = edges
// Uses a min-heap priority queue to always process the closest unvisited node first
export const findShortestRoute = (graph: Graph, source: string, destination: string): RouteResult => {

    // distanceTo: tracks the shortest known distance from source to each node
    const distanceTo: { [node: string]: number } = {}
    for (const node of Object.keys(graph)) {
        distanceTo[node] = Infinity
    }
    distanceTo[source] = 0

    // prevNode: tracks which node we came from to reconstruct the path
    const prevNode: { [node: string]: string | null } = {}
    for (const node of Object.keys(graph)) {
        prevNode[node] = null
    }

    // min-heap: always dequeues the node with the smallest known distance
    let minHeap = new MinHeap
    minHeap.enqueue({node: source, distance: 0})

    while (!minHeap.isEmpty()) {
        const closestNode = minHeap.dequeue()
        if (!closestNode) break

        // Path reconstruction, walk backwards from destination through prevNode
        if (closestNode.node === destination) {
            const path: string[] = []
            let current: string | null = destination
            while (current) {
                // unshift adds to front of array so path ends up in correct order (source first)
                path.unshift(current)
                current = prevNode[current]
            }
            return { path, distance: distanceTo[destination] }
        } else {
            const neighbours = graph[closestNode.node]

            for (const neighbour of neighbours) {
                const newDistance = closestNode.distance + neighbour.weight

                if (newDistance < distanceTo[neighbour.node]) {
                    prevNode[neighbour.node] = closestNode.node
                    distanceTo[neighbour.node] = newDistance
                    minHeap.enqueue({node: neighbour.node, distance: newDistance})
                }
            
            }
        }
    } 
    return null
}

// Modified Dijkstra with coverage penalty for undiscovered roads
// Roads the user has already ridden get a 10x distance penalty
// This makes the algorithm strongly prefer unridden roads
export const findUndiscoveredRoute= (graph: Graph, source: string, destination: string, riddenEdges: Set<string>): RouteResult => {

    //Intialize array with distance from source to each node
    const distanceTo: { [node: string]: number } = {}

    for (const node of Object.keys(graph)) {
        distanceTo[node] = Infinity
    }
    distanceTo[source] = 0

    // Initializes array which tracks which node we came from
    const prevNode: { [node: string]: string | null } = {}
    for (const node of Object.keys(graph)) {
        prevNode[node] = null
    }

    let minHeap = new MinHeap
    minHeap.enqueue({node: source, distance: 0})

    while (!minHeap.isEmpty()) {
        const closestNode = minHeap.dequeue()
        if (!closestNode) break

        if (closestNode.node === destination) {
            const path: string[] = []
            let current: string | null = destination
            while (current) {
                path.unshift(current)
                current = prevNode[current]
            }
            return { path, distance: distanceTo[destination] }
        } else {
            const neighbours = graph[closestNode.node]

            for (const neighbour of neighbours) {
                const edgeKey = `${closestNode.node}-${neighbour.node}`
                const penalty = riddenEdges.has(edgeKey) ? neighbour.weight * 10 : 0
                const newDistance = closestNode.distance + neighbour.weight + penalty

                if (newDistance < distanceTo[neighbour.node]) {
                    prevNode[neighbour.node] = closestNode.node
                    distanceTo[neighbour.node] = newDistance
                    minHeap.enqueue({node: neighbour.node, distance: newDistance})
                }
            
            }
        }
    } 
    return null
}