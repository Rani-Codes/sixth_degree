package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

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
	// Advertise client hints so capable browsers send reduced-data preference
	w.Header().Set("Accept-CH", "Sec-CH-Prefers-Reduced-Data")

	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Detect reduced-data clients or explicit skip flags
	saveData := strings.EqualFold(r.Header.Get("Save-Data"), "on")
	prefersReduced := strings.EqualFold(r.Header.Get("Sec-CH-Prefers-Reduced-Data"), "reduce")
	skipParam := r.URL.Query().Get("skip") == "1" || r.URL.Query().Get("mobileMode") == "1"
	if saveData || prefersReduced || skipParam {
		// Avoid encoding/sending the large adjacency map
		w.WriteHeader(http.StatusNoContent)
		return
	}

	// Stream the adjacency map as-is
	if err := json.NewEncoder(w).Encode(h.graph); err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
}
