package main

import (
	"log"
	"net/http"

	"github.com/Rani-Codes/sixth_degree/internal/graph"
	"github.com/Rani-Codes/sixth_degree/internal/handlers"
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

	// Initialize people handler with the graph
	peopleHandler := handlers.NewPeopleHandler(*g)

	// Register WebSocket handler for /ws endpoint
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		handleWebSocket(w, r, *g)
	})

	// Register GET route for available people
	http.HandleFunc("/api/people", peopleHandler.HandleGetPeople)

	// Start HTTP server
	log.Println("WebSocket server starting on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allowing all origins for now (change in prod)
	},
}

func handleWebSocket(w http.ResponseWriter, r *http.Request, g models.Graph) {
	// Upgrades the HTTP server connection to the WebSocket protocol.
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return
	}
	defer conn.Close()

	for {
		var request models.WSRequest
		err := conn.ReadJSON(&request)
		if err != nil {
			log.Printf("Error reading message: %v", err)
			break // If client disconnected or sent invalid JSON -> exit for loop
		}

		// This sends updates via WebSocket as the BFS algo runs
		updateCallBack := func(level int, node string) {
			response := models.WSResponse{
				Type: "node_explored",
				Data: models.NodeExplored{
					Level: level,
					Node:  node,
				},
			}
			conn.WriteJSON(response)
		}

		path, err := graph.FindShortestPath(g, request.StartNode, request.EndNode, updateCallBack)

		if err != nil {
			response := models.WSResponse{
				Type: "error",
				Data: err.Error(), // Send error as a string
			}
			conn.WriteJSON(response)
		} else {
			response := models.WSResponse{
				Type: "path_found",
				Data: models.PathFound{
					Path:   path,
					Length: len(path),
				},
			}
			conn.WriteJSON(response)
		}
	}
}
