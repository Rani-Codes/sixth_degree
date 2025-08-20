package graph_test

import (
	"testing"

	"github.com/Rani-Codes/sixth_degree/internal/graph"
	"github.com/Rani-Codes/sixth_degree/models"
)

func TestFindShortestPath(t *testing.T) {
	// Simple graph: A -- B -- C
	//               \       /
	//                 -- D
	testGraph := models.Graph{
		"A": {"B", "D"},
		"B": {"A", "C"},
		"C": {"B", "D"},
		"D": {"A", "C"},
	}

	// Case 1: Path exists
	path, err := graph.FindShortestPath(testGraph, "A", "C")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	expectedLen := 2 // shortest path: A -> B -> C
	if len(path)-1 != expectedLen {
		t.Errorf("expected path length %d, got %d; path: %v", expectedLen, len(path)-1, path)
	}

	// Case 2: Start = End
	path, err = graph.FindShortestPath(testGraph, "A", "A")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(path) != 1 || path[0] != "A" {
		t.Errorf("expected [A], got %v", path)
	}

	// Case 3: No path (node doesn’t exist)
	path, err = graph.FindShortestPath(testGraph, "A", "Z")
	if err == nil {
		t.Errorf("expected error for missing node, got path %v", path)
	}
}
