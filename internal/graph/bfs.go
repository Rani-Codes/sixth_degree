package graph

import (
	"fmt"

	"github.com/Rani-Codes/sixth_degree/models"
)

// BFS algorithm
func FindShortestPath(graph models.Graph, startNode, endNode string, updateCallback func(level int, node string)) ([]string, error) {
	queue := []string{startNode}
	parent := make(map[string]string)           // using make to get an empty map (to be filled later)
	visited := map[string]bool{startNode: true} // literal definition since we have default content
	level := 1

	// New concept learned, Go’s comma-ok idiom (useful for safe lookup on maps)
	//	ok returns true if the key exists in the map otherwise exits with error of what went wrong
	if _, ok := graph[startNode]; !ok {
		return nil, fmt.Errorf("start node %q not found in graph", startNode)
	}

	if _, ok := graph[endNode]; !ok {
		return nil, fmt.Errorf("end node %q not found in graph", endNode)
	}

	// BFS loop
	for len(queue) > 0 {
		levelSize := len(queue)
		for i := 0; i < levelSize; i++ {
			current := queue[0]
			queue = queue[1:]

			if updateCallback != nil {
				updateCallback(level, current)
			}

			if current == endNode {
				// Recreates path
				path := []string{} // creates an empty slice that is not nil (var path []string would create nil till append)
				for at := endNode; at != ""; at = parent[at] {
					path = append([]string{at}, path...) // prepends name to path
					if at == startNode {
						break
					}
				}
				if len(path) == 0 || path[0] != startNode {
					return nil, fmt.Errorf("no path from %s node to %s", startNode, endNode)
				}
				return path, nil
			}
			for _, neighbor := range graph[current] {
				if !visited[neighbor] {
					visited[neighbor] = true
					parent[neighbor] = current
					queue = append(queue, neighbor)
				}
			}

		}
		level++
	}
	return nil, fmt.Errorf("no path from %s to %s", startNode, endNode)
}
