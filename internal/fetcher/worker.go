package fetcher

import (
	"bufio"
	"fmt"
	"log"
	"os"
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

func (wp *WorkerPool) Producer(filename string) {
	file, err := os.Open(filename)
	if err != nil {
		log.Fatal(err)
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	fmt.Println("---- Names from seed file ----")

	// Reads file line by line, scanner. Scan returns True if there's a file left to read
	count := 0
	for scanner.Scan() {
		line := scanner.Text()
		count += 1
		request := JobRequest{Name: line, ID: count}
		wp.jobs <- request
	}

	close(wp.jobs)

	if err := scanner.Err(); err != nil {
		log.Fatal(err)
	}

}

func (wp *WorkerPool) Worker() {
	// Loop ends automatically when Producer closes job channel
	for job := range wp.jobs {
		links, err := FetchAllLinks(job.Name)

		var validConnections []string
		for _, link := range links {
			if wp.validNames[link] {
				validConnections = append(validConnections, link)
			}
		}

		res := JobResult{
			Name:        job.Name,
			Connections: validConnections,
			Error:       err,
			ID:          job.ID,
		}

		time.Sleep(wp.rateLimit)
		wp.results <- res
	}
}

// TODO: Add a way to close results channel using sync.WaitGroup
