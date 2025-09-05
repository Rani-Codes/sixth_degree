package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/Rani-Codes/sixth_degree/models"
)

// GraphHandler serves the GET /api/graph endpoint
type GraphHandler struct {
	graph models.Graph
}

func NewGraphHandler(graph models.Graph) *GraphHandler {
	return &GraphHandler{graph: graph}
}

// HandleGetGraph returns the full adjacency map of the graph
func (h *GraphHandler) HandleGetGraph(w http.ResponseWriter, r *http.Request) {
	// CORS + JSON headers
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")

	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Stream the adjacency map as-is
	if err := json.NewEncoder(w).Encode(h.graph); err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
}
