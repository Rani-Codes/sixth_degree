package fetcher

import (
	"bufio"
	"log"
	"os"
)

func LoadValidNames(filename string) map[string]bool {
	validNames := make(map[string]bool)

	file, err := os.Open(filename)
	if err != nil {
		log.Fatal("Couldn't load data into ValidNames. Failed to open seed file: ", err)
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		validNames[scanner.Text()] = true
	}

	return validNames
}
