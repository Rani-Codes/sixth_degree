import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { Person } from '../types';
import { usePeopleSearch } from '../services/api';

interface SearchableDropdownProps {
  label: string;
  value: Person | null;
  onChange: (person: Person | null) => void;
  placeholder?: string;
}

// using server-side search
export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  label,
  value,
  onChange,
  placeholder = "Select a person..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(50);

  const { data: options = [], isLoading, error } = usePeopleSearch(searchTerm);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset pagination when results or query change
  useEffect(() => {
    setVisibleCount(50);
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [options, searchTerm]);

  const handleInputClick = () => {
    // Only open on click; don't toggle. Prevents double‑click from immediately closing.
    if (!isOpen) {
      setIsOpen(true);
      // Focus immediately so mobile keyboards appear reliably
      inputRef.current?.focus();
    }
  };

  const handleOptionSelect = (person: Person) => {
    onChange(person);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    if (!isOpen) setIsOpen(true);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 16;
    if (nearBottom && visibleCount < options.length) {
      setVisibleCount((prev) => Math.min(prev + 50, options.length));
    }
  };

  const visibleOptions = useMemo(() => options.slice(0, visibleCount), [options, visibleCount]);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>
      
      <div className="relative">
        <div
          className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-800 cursor-pointer hover:border-gray-500 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all duration-200"
          onClick={handleInputClick}
        >
          <div className="flex items-center justify-between">
            <input
              ref={inputRef}
              type="text"
              value={isOpen ? searchTerm : (value?.name || '')}
              onChange={handleInputChange}
              onFocus={() => setIsOpen(true)}
              placeholder={placeholder}
              className="flex-1 outline-none bg-transparent text-gray-100 placeholder-gray-400"
            />
            <ChevronDown 
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </div>

        {isOpen && (
          <div
            ref={listRef}
            onScroll={handleScroll}
            className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto"
          >
            {isLoading ? (
              <div className="px-4 py-3 text-gray-400 text-center">
                Searching...
              </div>
            ) : error ? (
              <div className="px-4 py-3 text-red-400 text-center">
                Error loading results
              </div>
            ) : options.length > 0 ? (
              visibleOptions.map((person, index) => (
                <div
                  key={person.name + index}
                  onClick={() => handleOptionSelect(person)}
                  className="px-4 py-3 hover:bg-gray-700 cursor-pointer transition-colors duration-150 border-b border-gray-700 last:border-b-0"
                >
                  <span className="text-gray-100">{person.name}</span>
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-gray-400 text-center">
                No results found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};