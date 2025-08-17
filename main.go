package main

import (
	"github.com/Rani-Codes/sixth_degree/internal/fetcher"
)

func main() {
	validNames := fetcher.LoadValidNames("seed_names.txt")
	pool := fetcher.NewWorkerPool(10, validNames)
	pool.Run("seed_names.txt")

}
