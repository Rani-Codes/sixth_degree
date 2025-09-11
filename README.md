<p align="center">
  <img src="Demo.gif" alt="Demo" width="100%" />
</p>
   
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
***To use locally***  
Make sure you first have docker installed and it is running on your computer.
1. `docker build -t sixth-degree . ` - Generates the docker image.
2. `docker run --rm -p 8080:8080 sixth-degree` - Runs the image locally on a docker container

***Other helpful commands***  
You may want to use if you run this yourself outside of a docker container.
1. `go run ./cmd/fetcher/main.go` - Generates graph.json from Wikipedia data (~3.4 minutes)
2. `go run ./cmd/search/main.go` - Run BFS searches on the generated graph
3. `cd frontend && npm install && npm run dev` - Runs the frontend
    - After the first run, you can skip install: `cd frontend && npm run dev`

## Engineering Challenges and Thoughts
- Right now the graph.json file is 10MB which is small so it's manageable in memory but if I want to scale it up by a lot (100x) in the future I will need to implement a new way of loading the data.
- When choosing the websocket determination I chose to go with the Gorilla Websocket approach over the standard library for a few reasons.
    1. The standard library seemed very complex for websockets causing me to focus on protocal setup over understanding websocket concepts.
    2. In the Golang community Gorilla is the industry standard when it comes to implementing websockets.
- Creating a way to visualize the BFS algorithm on the frontend proved to be kinda challenging. At first I was rendering all 10 thousand plus nodes and creating a spiderweb to connect all of them but quickly I realized this was insane because it would take forever to load and be really laggy. Then I moved on to only rendering the nodes explored using React Konva. Idk if it was my lack of skill or just a bad tool for the job but this was also very laggy. Finally I switched to using graphology to handle graph data modeling and sigma.js to handle graph rendering & interactions. This worked pretty well so I stuck with it.
    1. An issue I ran into was having the final path not really visible amidst the thousdands of explored nodes. To solve this I made the nodes bigger, changed their colors, and I also artificially spaced them apart to demonstrate the path even when the user is zoomed out.
    2. A bug that drove me crazy was the nodes explored value in the top right. Sometimes this would disappear randomly and would not come back when a new request was made. The only way I found I could get it to return was through refreshing the page. I've already wasted too much time on this, this bug stays in the code for now.
- Docker discovery!
    - When using docker with Go you must serve the built frontend (SPA) using a route with root directory. While this works for both local and prod it should only ever be used with prod. When locally developing on Vite, if you use this mode you lose key features like hot‑reload and fast DX. Serving the built SPA via Go is “prod mode” (no HMR). This is fine but slower to iterate.
    - So in dev mode run 2 terminals and have 1 for backend and another for frontend. On prod you can run 1 since the docker image includes everything and that is what is going to be used for prod anyways.
- CI/CD
    - This was my first time setting up a CI/CD pipeline. The Continuous Integration (CI) part wasn't too bad. I should've just stopped there... The Continuous Deployment (CD) part killed me! Having to deal with Google cloud's permissions and CLI made me lose my mind. I spent so much time debugging trying to fix Workload Identity Federation errors. In the end I got it to work but it cost me 6 hours of hitting my head on a wall. Lowkey scared me from doing CD in the future but I'm sure I'll do better next time.   

## Post-deployment Engineering Challenges  
- HUGE BOTTLENECK P95 & P99 > 5 min (Post deployment)
    - I posted on LinkedIn and my post went viral giving me over 500 users in less than 24 hours. This was perfect because it allowed me to stress test my application and see how it would due under serious load. A few hours in I noticed a huge issue in my Google Cloud analytics. It showed network latencies at P50 = 6ms P95 = 5 min P99 = 5.10 min. This basically meant that for at least 5 percent of the users on my site the site was unusable. At first I thought it was because I was using a min container of 0 leading to cold starts being the issue. But then even after I upped it to 1 I was still running into this issue. Then I went to the logs of my cloud run server and filtered by ``` httpRequest.latency>=300s ```. I know that after 300s (5 min) Cloud Run requests would timeout so I was checking for timeouts. Now I could have just upped the limit to greater than 300s but that wouldnt fix the issue. 
    - The solution? Refactor the websocket data pipeline to now display node found and count of nodes explored per level to the user through the search log and then send an additional message with all of the nodes explored at each level to the network vis.
    - Result? Took the ws messages from thousands to a maximum of 20. Resolved the httpRequest taking > 300s EVEN on slow wifi. Made frontend network visualization display after an average of 1 second compared to the 3 seconds average it was doing prior. And most importantly it lowered P95 to 20 seconds and P99 to 70 seconds.
- Smaller bottleneck P99 > 1 min
    - After resolving the ws issue I still wasnt satisfied with the P99 of the site so I did some more digging. Apparently on low and mid network connections the api/graph call was the bottleneck taking up to 1 minute to load.
    - Thanks to my previous ws fix I had already created a solution for this. Basically on slower devices I just completely omit the api/graph endpoint from being sent and instead load the network visualization using the responses gathered from ws when it returned all of the nodes exlored at a certain level. This fix reduced the P95 to 15 seconds and P99 to 15 seconds.
