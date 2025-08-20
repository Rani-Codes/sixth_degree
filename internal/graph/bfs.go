package graph

import (
	"fmt"

	"github.com/Rani-Codes/sixth_degree/models"
)

// BFS algorithm
func FindShortestPath(graph models.Graph, startNode, endNode string) ([]string, error) {
	queue := []string{startNode}
	parent := make(map[string]string)           // using make to get an empty map (to be filled later)
	visited := map[string]bool{startNode: true} // literal definition since we have default content

	// New concept learned, Go’s comma-ok idiom (useful for safe lookup on maps)
	//	ok returns true if the key exists in the map otherwise exits with error of what went wrong
	if _, ok := graph[startNode]; !ok {
		return nil, fmt.Errorf("start node %q not found in graph", startNode)
	}

	if _, ok := graph[endNode]; !ok {
		return nil, fmt.Errorf("end node %q not found in graph", endNode)
	}

	for len(queue) > 0 {
		current := queue[0]
		queue = queue[1:]

		if current == endNode {
			break
		}

		if !visited[current] {
			visited[current] = true
		}

		for _, neighbor := range graph[current] {
			if !visited[neighbor] {
				visited[neighbor] = true
				parent[neighbor] = current
				queue = append(queue, neighbor)
			}
		}
	}

	// Recreates path from parent map
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
