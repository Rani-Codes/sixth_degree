package fetcher

import (
	"time"
)

type JobRequest struct {
	Name string
	ID   int //Tracks progress
}

type JobResult struct {
	Name        string
	Connections []string
	Error       error
	ID          int
}

type WorkerPool struct {
	numWorkers int
	rateLimit  time.Duration
	validNames map[string]bool
	jobs       chan JobRequest
	results    chan JobResult
	done       chan bool
}

//Producer Goroutine(1)
//Must haves:
// ├── Read unique_names.txt line by line
// ├── Create JobRequest for each name
// ├── Send to jobs channel
// └── Close jobs channel when done

// Constructor that initializes WorkerPool struct
func NewWorkerPool(numWorkers int, rateLimit time.Duration, validNames map[string]bool) *WorkerPool {
	return &WorkerPool{
		numWorkers: numWorkers,
		rateLimit:  rateLimit,
		validNames: validNames,
		jobs:       make(chan JobRequest, 100),
		results:    make(chan JobResult, 100),
		done:       make(chan bool),
	}
}
