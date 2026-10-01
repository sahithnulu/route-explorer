import { findShortestRoute, findUndiscoveredRoute} from "../algorithms/routing"

const graph = {
  A: [{ node: 'B', weight: 10 }, { node: 'D', weight: 15 }],
  B: [{ node: 'A', weight: 10 }, { node: 'C', weight: 5 }],
  C: [{ node: 'B', weight: 5 }, { node: 'E', weight: 8 }],
  D: [{ node: 'A', weight: 15 }, { node: 'E', weight: 12 }],
  E: [{ node: 'D', weight: 12 }, { node: 'C', weight: 8 }],
}

describe('findShortestRoute', () => {
    it('find the shortest path from A to C', () => {
        const result = findShortestRoute(graph, 'A', 'C')
        expect(result?.path).toEqual(['A', 'B', 'C'])
        expect(result?.distance).toBe(15)
    })

    it('return null when no path exists',  () => {
        const result = findShortestRoute(graph, 'A', 'Z')
        expect(result).toBeNull()
    })
})

describe('A*', () => {
    it('find the shortest path from A to C', () => {
        const riddenEdges = new Set(['B-C', 'C-B'])
        const result = findUndiscoveredRoute(graph, 'A', 'C', riddenEdges)
        expect(result?.path).toEqual(['A', 'D', 'E', 'C'])
    })

    it('return null when no path exists',  () => {
        const result = findUndiscoveredRoute(graph, 'A', 'Z', new Set())
        expect(result).toBeNull()
    })
})