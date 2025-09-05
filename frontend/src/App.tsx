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
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Network className="w-10 h-10 text-blue-400" />
            <h1 className="text-4xl font-bold text-gray-100">
              Web Pathfinder
            </h1>
          </div>
          <p className="text-lg text-gray-400 mb-2">
            Navigate the interconnected web of relationships
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full" />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Controls */}
          <div className="lg:col-span-1 space-y-6">
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
          <div className="lg:col-span-2">
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
          <p className="text-gray-500 text-sm">
            Real-time pathfinding algorithm visualization
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