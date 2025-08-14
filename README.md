# Six Degrees of Wikipedia

This project is inspired by the film "Six Degrees of Separation (1993)". 

The concept is that all people on earth are six or fewer social connections away from each other.

Using a Breadth-First Search (BFS) algorithm we will find the shortest path between different people on the seed list I have curated.

### Why build this?
Cuz I thought it was a cool idea after watching the movie and because I am currently learning Go and wanted to practice Go's concurrency features (goroutines and channels) to make multiple API calls at the same time while gathering the wikipedia data.

### Role of Go?
Go will be used extensively in this project. I will create a Go script that uses the Wikipedia API to fetch all the links from the pages of the people on the seed list. Additionally I will write a Go program that starts up and loads the entire JSON graph into memory. Write BFS in Go. Create an API to call the BFS function.

Seed list: A list of well connected individuals sourced from Times 100, and all U.S. presidents. 