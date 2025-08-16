package main

import (
	"fmt"
	"log"

	"github.com/Rani-Codes/sixth_degree/internal/fetcher"
)

func main() {
	// Simple fetchAllLinks test
	pageTitle := "United States"

	links, err := fetcher.FetchAllLinks(pageTitle)
	if err != nil {
		log.Fatal("Error fetching links:", err)
	}

	fmt.Printf("Found %d links for page %q:\n", len(links), pageTitle)

	for i, link := range links {
		if i >= 10 {
			break
		}
		fmt.Println(link)
	}
}
