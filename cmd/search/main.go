package main

import (
	"log"
	"strings"

	"github.com/Rani-Codes/sixth_degree/internal/graph"
)

// BFS & Websocket server here
func main() {
	g, err := graph.LoadGraph("graph.json")
	if err != nil {
		log.Fatal(err)
	}

	log.Printf("Loaded graph with %d nodes\n", len(*g))

	// Test a path
	path, err := graph.FindShortestPath(*g, "Albert Einstein", "Neil Armstrong")
	if err != nil {
		log.Printf("Error: %v", err)
	} else {
		log.Printf("Path found: %s (length: %d)", strings.Join(path, " -> "), len(path))
	}
}
