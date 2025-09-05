import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Person } from '../types';

const API_BASE_URL = 'http://localhost:8080';

// API function to fetch people
const fetchPeople = async (query: string = ''): Promise<Person[]> => {
  try {
    const url = new URL(`${API_BASE_URL}/api/people`);
    if (query) {
      url.searchParams.append('q', query);
    }

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const people: Person[] = await response.json();
    return people;
  } catch (error) {
    console.error('Failed to search people:', error);
    throw new Error('Failed to search people from server');
  }
};

// Custom hook with built-in debouncing
export const usePeopleSearch = (query: string, delay: number = 300) => {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, delay);

    return () => clearTimeout(timer);
  }, [query, delay]);

  return useQuery({
    queryKey: ['people', debouncedQuery.toLowerCase().trim()],
    queryFn: () => fetchPeople(debouncedQuery),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

// Export the fetch function in case it's needed elsewhere
export { fetchPeople };
