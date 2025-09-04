import React from 'react';
import { Search } from 'lucide-react';
import { SearchableDropdown } from './SearchableDropdown';
import { Person } from '../types';

interface SearchBarProps {
  people: Person[];
  startPerson: Person | null;
  endPerson: Person | null;
  onStartPersonChange: (person: Person | null) => void;
  onEndPersonChange: (person: Person | null) => void;
  onSearch: () => void;
  isSearching: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  people,
  startPerson,
  endPerson,
  onStartPersonChange,
  onEndPersonChange,
  onSearch,
  isSearching
}) => {
  const isSearchEnabled = startPerson && endPerson && !isSearching;

  return (
    <div className="bg-gray-900 rounded-xl shadow-xl border border-gray-800 p-6">
      <h2 className="text-xl font-semibold text-gray-100 mb-6">
        Pathfinding Search
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <SearchableDropdown
          label="Start Person"
          options={people}
          value={startPerson}
          onChange={onStartPersonChange}
          placeholder="Select start..."
        />
        
        <SearchableDropdown
          label="End Person"
          options={people}
          value={endPerson}
          onChange={onEndPersonChange}
          placeholder="Select end..."
        />
      </div>

      <button
        onClick={onSearch}
        disabled={!isSearchEnabled}
        className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
          isSearchEnabled
            ? 'bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 text-white shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900'
            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
        }`}
      >
        <Search className="w-5 h-5" />
        <span>{isSearching ? 'Searching...' : 'Start Search'}</span>
      </button>
    </div>
  );
};