package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

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

	// Initialize handlers with the graph
	peopleHandler := handlers.NewPeopleHandler(*g)
	graphHandler := handlers.NewGraphHandler(*g)

	// Register WebSocket handler for /ws endpoint
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		handleWebSocket(w, r, *g)
	})

	// Register GET routes
	http.HandleFunc("/api/people", peopleHandler.HandleGetPeople)
	http.HandleFunc("/api/graph", graphHandler.HandleGetGraph)

	// Show the built website from ./dist. If we can't find a file, show index.html
	// Works in Docker and also if you ran `npm run build` locally
	// For everyday coding, use `npm run dev` on 5173 (fast reloads)
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Advertise client hints so browsers can send reduced-data preference
		w.Header().Set("Accept-CH", "Sec-CH-Prefers-Reduced-Data")
		w.Header().Set("Permissions-Policy", "ch-prefers-reduced-data=(*)")
		w.Header().Set("Critical-CH", "Sec-CH-Prefers-Reduced-Data")
		w.Header().Add("Vary", "Sec-CH-Prefers-Reduced-Data")

		// Let API and WS handlers take priority; this catches everything else
		// Why? Because in Go’s default ServeMux, the most specific pattern wins (/ws before / route)
		requested := r.URL.Path
		if requested == "/" {
			// If user asked for the home page, send the main HTML file
			requested = "/index.html"
		}
		// Clean the path and look for it inside the "dist" folder
		requested = filepath.Clean(requested)
		fullPath := filepath.Join("dist", requested)

		// If the file exists (JS, CSS, images), send it
		if info, err := os.Stat(fullPath); err == nil && !info.IsDir() {
			http.ServeFile(w, r, fullPath)
			return
		}
		// Otherwise send index.html so the front‑end router (React) can handle the page
		http.ServeFile(w, r, filepath.Join("dist", "index.html"))
	})

	// Start HTTP server
	log.Println("Server starting on :8080")
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

	// Auto-close the ws connection after 15 seconds, lowers P95 and P99 levels and doesnt effect users since every new search closes and reopens the ws connection anyways
	closeTimer := time.AfterFunc(15*time.Second, func() {
		_ = conn.WriteControl(websocket.CloseMessage,
			websocket.FormatCloseMessage(websocket.CloseNormalClosure, "closing after 15s"),
			time.Now().Add(1*time.Second))
		_ = conn.Close()
	})
	defer closeTimer.Stop()

	for {
		var request models.WSRequest
		err := conn.ReadJSON(&request)
		if err != nil {
			log.Printf("Error reading message: %v", err)
			break // If client disconnected or sent invalid JSON -> exit for loop
		}

		// Collect per-level nodes and counts; stream one message when a level completes
		levelCounts := make(map[int]int)
		nodeLevel := make(map[string]int)
		currentLevel := 0
		currentBatch := make([]string, 0)
		updateCallBack := func(level int, node string) {
			// If we moved to a new level, flush the previous level's nodes
			if currentLevel != 0 && level != currentLevel && len(currentBatch) > 0 {
				_ = conn.WriteJSON(models.WSResponse{
					Type: "level_explored",
					Data: models.LevelExplored{
						Level: currentLevel,
						Nodes: append([]string(nil), currentBatch...),
					},
				})
				currentBatch = currentBatch[:0]
			}

			currentLevel = level
			currentBatch = append(currentBatch, node)

			// Track counts and the first seen level per node
			levelCounts[level]++
			if _, ok := nodeLevel[node]; !ok {
				nodeLevel[node] = level
			}
		}

		path, err := graph.FindShortestPath(g, request.StartNode, request.EndNode, updateCallBack)

		if err != nil {
			response := models.WSResponse{
				Type: "error",
				Data: err.Error(), // Send error as a string
			}
			conn.WriteJSON(response)
		} else {
			// Flush the last level batch if any
			if currentLevel != 0 && len(currentBatch) > 0 {
				_ = conn.WriteJSON(models.WSResponse{
					Type: "level_explored",
					Data: models.LevelExplored{
						Level: currentLevel,
						Nodes: append([]string(nil), currentBatch...),
					},
				})
			}

			// Send one summary per level in the final path
			for i := 0; i < len(path); i++ {
				node := path[i]
				lvl := i + 1
				// This sets BFS true level once value known
				if recorded, ok := nodeLevel[node]; ok {
					lvl = recorded
				}
				count := levelCounts[lvl]
				_ = conn.WriteJSON(models.WSResponse{
					Type: "node_explored",
					Data: models.NodeExplored{
						Level:                lvl,
						Node:                 node,
						NodesExploredAtLevel: count,
					},
				})
			}
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
