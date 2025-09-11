package models

// graph data structure models and type alias
type Graph map[string][]string

/*
Datapipeline between BFS and Websocket connection
Client sends:
{"startNode": "Einstein", "endNode": "Newton"}

Server streams back:
{"type": "node_explored", "data": {"level": 1, "node": "Tesla"}}
{"type": "path_found", "data": {"path": ["Einstein", "Tesla", "Newton"], "length": 3}}
*/

// Websocket communication
type WSRequest struct {
	StartNode string `json:"startNode"`
	EndNode   string `json:"endNode"`
}

type WSResponse struct {
	Type string `json:"type"` // Type field lets us know what kind of response is in data

	// Using interface here cuz then each message can have different payload structure
	Data interface{} `json:"data"` // Data interface can receive NodeExplored, PathFound, or Error responses
	// This lets us use one response struct for all message types instead of separate structs
}

// Use to fill out search log w nodes explored at said level and final node chosen for path
type NodeExplored struct {
	Level                int    `json:"level"`
	Node                 string `json:"node"`
	NodesExploredAtLevel int    `json:"nodesExploredAtLevel,omitempty"`
}

type PathFound struct {
	Path   []string `json:"path"`
	Length int      `json:"length"`
}

// Use to create network vis by returning all nodes explored at certain level
type LevelExplored struct {
	Level int      `json:"level"`
	Nodes []string `json:"nodes"`
}

type Person struct {
	Name string `json:"name"`
}
