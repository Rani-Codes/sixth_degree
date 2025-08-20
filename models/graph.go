package models

// graph data structure models and type alias
type Graph map[string][]string

type PathRequest struct {
	StartNode string `json:"startNode"`
	EndNode   string `json:"endNode"`
}

type PathResponse struct {
	Path      []string `json:"path,omitempty"` // the actual path
	Length    int      `json:"length"`         // path length (0 if no path)
	Found     bool     `json:"found"`
	StartNode string   `json:"startNode"`
	EndNode   string   `json:"endNode"`
	Error     string   `json:"error,omitempty"`
}
