// Min-heap priority queue used by Dijkstra and A* algorithms
// Always returns the element with the smallest distance value
// Insert and extract-min are both O(log n) which is more efficient than a sorted array O(n log n)
export class MinHeap {
    private heap: { node: string; distance: number }[] = []

    private swap(i: number, j: number): void {
    let temp = this.heap[i]
    this.heap[i] = this.heap[j]
    this.heap[j] = temp
    }

    // Adds a new element to the heap and restores the heap property
    public enqueue(item: { node: string; distance: number }): void {
        this.heap.push(item)
        this.bubbleUp(this.heap.length - 1)
    }

    // Removes and returns the element with the smallest distance and restores the heap property
    public dequeue(): { node: string; distance: number } | null {
        if (this.isEmpty()) {
            return null
        }
        
        this.swap(0, this.heap.length - 1)
        const min = this.heap.pop()!
        this.bubbleDown(0)
        return min
    }

    public isEmpty(): boolean {
        return this.heap.length === 0
    }

    // Restores heap property upward after an insert
    // Keeps swapping with parent while current node is smaller than its parent
    private bubbleUp(i: number): void {
        while (i > 0) {
            let parentIndex = this.parentIndex(i)
            let parentNode = this.heap[parentIndex]
            if (this.heap[i].distance < parentNode.distance) {
                this.swap(i, parentIndex)
                i = parentIndex
            } else {
                return
            }

        }

    }

    // Restores heap property downward after a removal
    // Keeps swapping with the smaller child while current node is larger than its children
    private bubbleDown(i: number): void {
    while (true) {
        let leftChildIndex = this.leftChildIndex(i)
        let rightChildIndex = this.rightChildIndex(i)
        let leftChild = this.heap[leftChildIndex]
        let rightChild = this.heap[rightChildIndex]

        if (!leftChild) {
            return
        }

        let minChildIndex
        if (!rightChild || leftChild.distance <= rightChild.distance) {
            minChildIndex = leftChildIndex
        } else {
            minChildIndex = rightChildIndex
        }

        if (this.heap[i].distance > this.heap[minChildIndex].distance) {
            this.swap(i, minChildIndex)
            i = minChildIndex
        } else {
            return
        }
    }
    }

    private parentIndex(i: number): number {
    return Math.floor((i - 1) / 2)
    }

    private leftChildIndex(i: number): number {
    return 2 * i + 1
    }

    private rightChildIndex(i: number): number {
    return 2 * i + 2
    }
}