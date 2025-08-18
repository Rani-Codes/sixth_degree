# Six Degrees of Wikipedia

This project is inspired by the film "Six Degrees of Separation (1993)". 

The concept is that all people on earth are six or fewer social connections away from each other.

Using a Breadth-First Search (BFS) algorithm we will find the shortest path between different people on the seed list I have curated.

**Graph Architecture**: The system builds a directed graph reflecting Wikipedia's actual link structure, where connections are asymmetric (Person A may link to Person B, but B doesn't necessarily link back to A). This preserves the authentic navigation patterns of Wikipedia while enabling accurate pathfinding analysis.

### Why build this?
Cuz I thought it was a cool idea after watching the movie and because I am currently learning Go and wanted to practice Go's concurrency features (goroutines and channels) to make multiple API calls at the same time while gathering the wikipedia data.

**Performance**: The concurrent data fetcher processes 10,000+ Wikipedia pages in just 3.4 minutes using optimized HTTP clients, connection pooling, and a 10-worker goroutine pool.

### Role of Go?
Go will be used extensively in this project. I will create a Go script that uses the Wikipedia API to fetch all the links from the pages of the people on the seed list. Additionally I will write a Go program that starts up and loads the entire JSON graph into memory. Write BFS in Go. Create an API to call the BFS function.

## Dataset: +10k Influential Figures

A comprehensive collection spanning Nobel laureates, Forbes billionaires, Olympic medalists, Academy Award winners, world leaders, Supreme Court Justices, and Hall of Fame inductees. This diverse dataset ensures robust connectivity patterns across domains—from ancient philosophers to modern tech entrepreneurs—creating an ideal foundation for pathfinding analysis.

## Usage
1. `go run cmd/fetcher/main.go` - Generates graph.json from Wikipedia data (~3.4 minutes)
<!-- 2. `go run search.go` - Run BFS searches on the generated graph -->

## Engineering Challenges and Thoughts
- Right now the graph.json file is 10MB which is small so it's manageable in memory but if I want to scale it up by a lot (100x) in the future I will need to implement a new way of loading the data.


## New features??
- add features like "pause exploration" or "explore different paths"