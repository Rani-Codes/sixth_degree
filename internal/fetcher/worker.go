package fetcher

import (
	"bufio"
	"encoding/json"
	"log"
	"os"
)

type JobRequest struct {
	Name string
}

type JobResult struct {
	Name        string
	Connections []string
	Error       error
}

type WorkerPool struct {
	numWorkers int
	validNames map[string]bool
	jobs       chan JobRequest
	results    chan JobResult
	done       chan bool
	totalJobs  int
}

// Constructor that initializes WorkerPool struct
func NewWorkerPool(numWorkers int, validNames map[string]bool) *WorkerPool {
	return &WorkerPool{
		numWorkers: numWorkers,
		validNames: validNames,
		jobs:       make(chan JobRequest, 100),
		results:    make(chan JobResult, 100),
		done:       make(chan bool),
		totalJobs:  0,
	}
}

func (wp *WorkerPool) Producer(filename string) {
	file, err := os.Open(filename)
	if err != nil {
		log.Fatal(err)
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)

	// Reads file line by line, scanner. Scan returns True if there's a file left to read
	count := 0
	for scanner.Scan() {
		line := scanner.Text()
		count += 1
		request := JobRequest{Name: line}
		wp.jobs <- request
	}

	wp.totalJobs = count
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
		}

		wp.results <- res
	}
}

// TODO: Add a way to close results channel using sync.WaitGroup

func (wp *WorkerPool) Aggregator() {

	graph := make(map[string][]string)
	processed := 0

	for res := range wp.results {
		graph[res.Name] = res.Connections
		processed++

		log.Printf("%d out of %d results processed", processed, wp.totalJobs)

		if res.Error != nil {
			log.Printf("Error on %s: %v", res.Name, res.Error)
			continue
		}
	}

	data, err := json.MarshalIndent(graph, "", "  ")
	if err != nil {
		log.Fatalf("failed to marshal graph: %v", err)
	}

	err = os.WriteFile("graph.json", data, 0644)
	if err != nil {
		log.Fatalf("failed to write graph.json: %v", err)
	}

	wp.done <- true
}
