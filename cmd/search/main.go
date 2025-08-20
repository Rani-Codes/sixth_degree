package main

import (
	"log"

	"github.com/Rani-Codes/sixth_degree/internal/graph"
)

// BFS & Websocket server here
func main() {
	g, err := graph.LoadGraph("graph.json")
	if err != nil {
		log.Fatal(err)
	}

	log.Printf("Loaded graph with %d nodes\n", len(*g))
}
