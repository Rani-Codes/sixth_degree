package fetcher

import (
	"bufio"
	"encoding/json"
	"log"
	"os"
	"sync"
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
	wg         sync.WaitGroup
}

// Constructor that initializes WorkerPool struct
func NewWorkerPool(numWorkers int, validNames map[string]bool) *WorkerPool {
	return &WorkerPool{
		numWorkers: numWorkers,
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

	// Reads file line by line, scanner. Scan returns true if there's a file left to read
	for scanner.Scan() {
		line := scanner.Text()
		request := JobRequest{Name: line}
		wp.jobs <- request
	}

	close(wp.jobs)

	if err := scanner.Err(); err != nil {
		log.Fatal(err)
	}

}

func (wp *WorkerPool) Worker() {
	defer wp.wg.Done() //Signals this worker is done

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

func (wp *WorkerPool) Aggregator() {

	graph := make(map[string][]string)
	processed := 0

	// Will wrap up when Run function closes results channel
	for res := range wp.results {
		graph[res.Name] = res.Connections
		processed++

		log.Printf("%d results processed", processed)

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

// Orchestration function, sets up goroutines (starts the metaphorical assembly line)
func (wp *WorkerPool) Run(filename string) {
	go wp.Producer(filename)
	go wp.Aggregator()

	for i := 0; i < wp.numWorkers; i++ {
		wp.wg.Add(1) // Add 1 more to the WaitGroup
		go wp.Worker()
	}

	// Separate goroutine waits for all workers to finish then closes results channel
	go func() {
		wp.wg.Wait()      // Wait until all workers signal done
		close(wp.results) // Once wait done now it's safe to close results channel
	}()

	<-wp.done
}
