type Graph = {
  [node: string]: { node: string; weight: number }[]
}

type RouteResult = {
  path: string[]
  distance: number
} | null

export const dijkstra = (graph: Graph, source: string, destination: string): RouteResult => {
  return null
}

export const aStar = (graph: Graph, source: string, destination: string, riddenEdges: Set<string>): RouteResult => {
  return null
}