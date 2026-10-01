import { MinHeap } from "./minHeap";

type Graph = {
  [node: string]: { node: string; weight: number }[]
}

type RouteResult = {
  path: string[]
  distance: number
} | null

export const findShortestRoute = (graph: Graph, source: string, destination: string): RouteResult => {

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