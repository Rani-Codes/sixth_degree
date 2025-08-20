package graph

import (
	"encoding/json"
	"log"
	"os"

	"github.com/Rani-Codes/sixth_degree/models"
)

// Load graph.json into memory
func LoadGraph(filename string) (*models.Graph, error) {
	file, err := os.Open(filename)
	if err != nil {
		// Stops program because if no graph then no BFS and no app
		log.Fatal("Failed to open file to load graph. ", err)
	}
	defer file.Close()

	var graph models.Graph
	if err := json.NewDecoder(file).Decode(&graph); err != nil {
		// No graph then no BFS... have to log.Fatal
		log.Fatal("Failed to decode graph file into graph type, (breaks BFS). ", err)
	}

	return &graph, nil

}
