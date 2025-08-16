package fetcher

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/Rani-Codes/sixth_degree/models"
)

// HTTP client with optimized configuration for Wikipedia API
var httpClient = &http.Client{
	Timeout: 30 * time.Second, // Prevent hanging requests
	Transport: &http.Transport{
		MaxIdleConns:        100,              // Connection pool size
		MaxIdleConnsPerHost: 10,               // Connections per host
		IdleConnTimeout:     90 * time.Second, // Keep connections alive
	},
}

// FetchAllLinks gets all outbound article links from a Wikipedia page with retry logic
func FetchAllLinks(pageTitle string) ([]string, error) {
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

		res, err := makeRequestWithRetry(requestURL)
		if err != nil {
			return nil, err
		}
		defer res.Body.Close() // Closing body to prevent resource leaks

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

// makeRequestWithRetry handles HTTP requests with exponential backoff retry logic
func makeRequestWithRetry(url string) (*http.Response, error) {
	maxRetries := 3
	baseDelay := 1 * time.Second

	for attempt := 0; attempt < maxRetries; attempt++ {
		req, err := http.NewRequest("GET", url, nil)
		if err != nil {
			return nil, fmt.Errorf("failed to create request: %w", err)
		}

		// Setting User-Agent to be respectful to Wikipedia
		req.Header.Set("User-Agent", "SixDegreeBot/1.0 (Educational Project)")

		res, err := httpClient.Do(req)
		if err != nil {
			if attempt == maxRetries-1 {
				return nil, fmt.Errorf("request failed after %d attempts: %w", maxRetries, err)
			}
			// Wait before retrying (exponential backoff)
			delay := baseDelay * time.Duration(1<<attempt) // 1s, 2s, 4s
			time.Sleep(delay)
			continue
		}

		// Check for specific HTTP errors that warrant retry
		if res.StatusCode == http.StatusTooManyRequests || // 429 Rate Limited
			res.StatusCode >= 500 { // 5xx Server Errors
			res.Body.Close() // Close before retry

			if attempt == maxRetries-1 {
				return nil, fmt.Errorf("request failed with status %d after %d attempts", res.StatusCode, maxRetries)
			}

			// For rate limiting, wait longer
			delay := baseDelay * time.Duration(1<<attempt)
			if res.StatusCode == http.StatusTooManyRequests {
				delay *= 2 // Double delay for rate limits
			}
			time.Sleep(delay)
			continue
		}

		// Check for non-200 status codes that shouldn't be retried
		if res.StatusCode != http.StatusOK {
			res.Body.Close()
			return nil, fmt.Errorf("unexpected status code: %d", res.StatusCode)
		}

		return res, nil
	}

	return nil, fmt.Errorf("unexpected: reached end of retry loop")
}
