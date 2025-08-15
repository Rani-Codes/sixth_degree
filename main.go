package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"

	"github.com/Rani-Codes/sixth_degree/models"
)

// Returns: all outbound article links from a Wikipedia page
func fetchAllLinks(pageTitle string) ([]string, error) {
	// `plnamespace=0` = only main articles
	// `pllimit=max` = as many links as possible in one request (up to 500)
	baseURL := "https://en.wikipedia.org/w/api.php?action=query&prop=links&format=json&plnamespace=0&pllimit=max&titles=%s"

	var allLinks []string
	var plcontinue string //Token used for pagination, API sends this when there are more results to fetch

	for {
		//Sprintf used over Printf to return string instead of printing to console
		encodedTitle := url.QueryEscape(pageTitle)
		requestURL := fmt.Sprintf(baseURL, encodedTitle)

		if plcontinue != "" {
			requestURL += "&plcontinue=" + url.QueryEscape(plcontinue)
		}

		res, err := http.Get(requestURL)
		if err != nil {
			return nil, err
		}
		defer res.Body.Close() // Closing body to prevent resource leaks

		// Check HTTP status
		if res.StatusCode != http.StatusOK {
			return nil, fmt.Errorf("unexpected status code: %d", res.StatusCode)
		}

		// Ensure response is JSON
		if !strings.Contains(res.Header.Get("Content-Type"), "application/json") {
			return nil, fmt.Errorf("unexpected content type: %s", res.Header.Get("Content-Type"))
		}

		// Decode JSON into struct
		var result models.WikiLinksResponse
		if err := json.NewDecoder(res.Body).Decode(&result); err != nil {
			return nil, fmt.Errorf("failed to decode JSON: %w", err)
		}

		for _, page := range result.Query.Pages {
			for _, link := range page.Links {
				if link.Ns == 0 { // Should be 0 because of plnamespace param
					allLinks = append(allLinks, link.Title)
				}
			}
		}

		// Break if no more results
		if result.Continue.Plcontinue == "" {
			break
		}

		// Set token for next request
		plcontinue = result.Continue.Plcontinue
	}

	return allLinks, nil
}

func main() {
	// Simple fetchAllLinks test
	pageTitle := "United States"

	links, err := fetchAllLinks(pageTitle)
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
