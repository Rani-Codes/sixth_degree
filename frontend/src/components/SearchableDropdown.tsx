import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Person } from '../types';

interface SearchableDropdownProps {
  label: string;
  options: Person[];
  value: Person | null;
  onChange: (person: Person | null) => void;
  placeholder?: string;
}

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = "Select a person..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handleInputClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleOptionSelect = (person: Person) => {
    onChange(person);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

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
              placeholder={placeholder}
              className="flex-1 outline-none bg-transparent text-gray-100 placeholder-gray-400"
              readOnly={!isOpen}
            />
            <ChevronDown 
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </div>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((person) => (
                <div
                  key={person.id}
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