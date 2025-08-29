package main

import (
	"log"
	"net/http"
	"strings"

	"github.com/Rani-Codes/sixth_degree/internal/graph"
	"github.com/Rani-Codes/sixth_degree/models"
	"github.com/gorilla/websocket"
)

// BFS & Websocket server here
func main() {
	g, err := graph.LoadGraph("graph.json")
	if err != nil {
		log.Fatal(err)
	}

	log.Printf("Loaded graph with %d nodes\n", len(*g))

	// Test a path
	path, err := graph.FindShortestPath(*g, "Jesus", "Cristiano Ronaldo", nil)
	if err != nil {
		log.Printf("Error: %v", err)
	} else {
		log.Printf("Path found: %s (length: %d)", strings.Join(path, " -> "), len(path))
	}

	// Register WebSocket handler for /ws endpoint
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		handleWebSocket(w, r, *g)
	})

	// Start HTTP server
	log.Println("WebSocket server starting on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allowing all origins for now (change in prod)
	},
}

func handleWebSocket(w http.ResponseWriter, r *http.Request, graph models.Graph) {
	// Upgrades the HTTP server connection to the WebSocket protocol.
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return
	}
	defer conn.Close()

	for {

	}
}
