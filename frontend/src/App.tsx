import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SearchBar } from './components/SearchBar';
import { LogViewer } from './components/LogViewer';
import { NetworkVisualization } from './components/NetworkVisualization';
import { useWebSocket } from './hooks/useWebSocket';
import { Person, SearchParams } from './types';
import { Network } from 'lucide-react';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes
    },
  },
});

function AppContent() {
  const [startPerson, setStartPerson] = useState<Person | null>(null);
  const [endPerson, setEndPerson] = useState<Person | null>(null);
  
  const {
    messages,
    isConnected,
    isSearching,
    exploredNodes,
    activePath,
    connectAndSearch,
    disconnect
  } = useWebSocket();

  const handleSearch = () => {
    if (!startPerson || !endPerson) return;

    const searchParams: SearchParams = {
      from: startPerson.name,
      to: endPerson.name
    };

    connectAndSearch(searchParams);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 py-8">
      <div className="max-w-7xl mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex flex-col-reverse gap-4 sm:flex-row sm:gap-0 items-center justify-center space-x-3 mb-4">
            <Network className="w-10 h-10 text-blue-400" />
            <h1 className="text-4xl font-bold text-gray-100">
              Six Degrees of Wikipedia
            </h1>
          </div>
          <p className="text-lg text-gray-400 mb-2">
            Explore the threads that tie us together
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full" />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column - Controls */}
          <div className="lg:col-span-2 space-y-6">
            <SearchBar
              startPerson={startPerson}
              endPerson={endPerson}
              onStartPersonChange={setStartPerson}
              onEndPersonChange={setEndPerson}
              onSearch={handleSearch}
              isSearching={isSearching}
            />
            
            <LogViewer
              messages={messages}
              isConnected={isConnected}
            />
          </div>

          {/* Right Column - Visualization */}
          <div className="lg:col-span-3">
            <NetworkVisualization
              activePath={activePath}
              exploredNodes={exploredNodes}
              startPersonId={startPerson?.name}
              endPersonId={endPerson?.name}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-gray-400 text-sm">
            While watching the film <em>Six Degrees of Separation</em> I came across the idea that any two people are connected by no more than six "friend of a friend" relationships. Curious, I wanted to see if that really held up. I used Wikipedia pages to test connections since all notable people have a page. It works well enough. I created a list of over ten thousand names, a small slice of the world but large enough to build some interesting visualizations. I also built this project to sharpen my Golang skills, working with goroutines, websocket connections, and writing my own BFS algorithm.
          </p>
          <p className="text-gray-400 text-sm">
            Note: A connection exists if one person's Wikipedia page mentions another person from this list. They don't need to have met or interacted for the link to count.
          </p>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;