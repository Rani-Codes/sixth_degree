package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"sort"
	"strings"

	"github.com/Rani-Codes/sixth_degree/models"
)

// PeopleHandler handles the GET /api/people endpoint
type PeopleHandler struct {
	sortedNames []string
}

// NewPeopleHandler creates a new people handler and sorts the names from the graph
func NewPeopleHandler(graph models.Graph) *PeopleHandler {
	// Extract and sort names from the graph
	var names []string
	for name := range graph {
		names = append(names, name)
	}
	sort.Strings(names)

	return &PeopleHandler{
		sortedNames: names,
	}
}

// HandleGetPeople handles GET /api/people requests
func (h *PeopleHandler) HandleGetPeople(w http.ResponseWriter, r *http.Request) {
	// Enable CORS for frontend
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")

	// Only allow GET requests
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get search query parameter
	query := r.URL.Query().Get("q")

	var limit int
	if query == "" {
		limit = 500 // Show more options when browsing all names
	} else {
		limit = 50 // Limit for faster filtering when typing
	}

	// Initialize with empty slice to ensure JSON returns [] instead of null
	people := make([]models.Person, 0)
	count := 0

	// Filter based on query using pre-sorted names
	queryLower := strings.ToLower(query)
	for _, name := range h.sortedNames {
		if count >= limit {
			break
		}

		// Empty query shows all names, otherwise filter by query
		if query == "" {
			people = append(people, models.Person{
				Name: name,
			})
			count++
		} else if strings.Contains(strings.ToLower(name), queryLower) {
			people = append(people, models.Person{
				Name: name,
			})
			count++
		}
	}

	// Send JSON response
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(people); err != nil {
		log.Printf("Error encoding people response: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
	}
}
