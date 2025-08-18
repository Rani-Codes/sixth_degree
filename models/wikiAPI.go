package models

type WikiLinksResponse struct {
	Continue struct {
		Plcontinue string `json:"plcontinue"` //Pagination: Token to fetch next batch of links
		Continue   string `json:"continue"`   //Generic pagination token (present if more results)
	} `json:"continue"`
	Query struct {
		Normalized []struct {
			From string `json:"from"`
			To   string `json:"to"` //Normalized wikipedia title (Use this in BFS to avoid duplicate nodes)
		} `json:"normalized"`
		//Pages is a dynamic map. Key: pageid Value: a wiki page
		Pages map[string]struct {
			Pageid int    `json:"pageid"` //Wiki page ID (unique for each page)
			Ns     int    `json:"ns"`     // Namespace ID (always 0 here, kept for completeness)
			Title  string `json:"title"`
			Links  []struct {
				Ns    int    `json:"ns"`
				Title string `json:"title"`
			} `json:"links"`
		} `json:"pages"`
	} `json:"query"`
	Limits struct {
		Links int `json:"links"` //Max links returned per page
	} `json:"limits"`
}
