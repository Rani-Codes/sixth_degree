import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Person, AdjacencyMap } from '../types';

// Prefer same-origin in prod; fall back to localhost:8080 when running Vite dev on 5173
const DEFAULT_DEV_API_BASE = typeof window !== 'undefined' && window.location.port === '5173'
  ? 'http://localhost:8080'
  : '';
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL?.trim?.() || DEFAULT_DEV_API_BASE;

// API function to fetch people
const fetchPeople = async (query: string = ''): Promise<Person[]> => {
  try {
    let finalUrl: string;
    if (API_BASE_URL) {
      const url = new URL('/api/people', API_BASE_URL);
      if (query) url.searchParams.append('q', query);
      finalUrl = url.toString();
    } else {
      // same-origin
      finalUrl = `/api/people${query ? `?q=${encodeURIComponent(query)}` : ''}`;
    }

    const response = await fetch(finalUrl);
    
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

// API function to fetch full graph adjacency map
export const fetchGraph = async (): Promise<AdjacencyMap> => {
  try {
    let url: string;
    if (API_BASE_URL) {
      const u = new URL('/api/graph', API_BASE_URL);
      // Append reduced-data hint so backend can 204 early (occurs if low/medium data signal sent from client)
      const navAny = typeof navigator !== 'undefined' ? (navigator as any) : undefined;
      const conn = navAny?.connection;
      const saveData = conn?.saveData === true;
      const effType: string | undefined = conn?.effectiveType;
      const slowConn = !!effType && ['slow-2g', '2g', '3g'].includes(effType);
      const deviceMemory: number | undefined = navAny?.deviceMemory;
      const lowMemory = typeof deviceMemory === 'number' && deviceMemory < 4;
      const hw = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 0 : 0;
      const lowCPU = hw > 0 && hw < 4;
      if (saveData || slowConn || lowMemory || lowCPU) {
        u.searchParams.set('mobileMode', '1');
      }
      url = u.toString();
    } else {
      // same-origin
      const navAny = typeof navigator !== 'undefined' ? (navigator as any) : undefined;
      const conn = navAny?.connection;
      const saveData = conn?.saveData === true;
      const effType: string | undefined = conn?.effectiveType;
      const slowConn = !!effType && ['slow-2g', '2g', '3g'].includes(effType);
      const deviceMemory: number | undefined = navAny?.deviceMemory;
      const lowMemory = typeof deviceMemory === 'number' && deviceMemory < 4;
      const hw = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 0 : 0;
      const lowCPU = hw > 0 && hw < 4;
      const qs = (saveData || slowConn || lowMemory || lowCPU) ? '?mobileMode=1' : '';
      url = `/api/graph${qs}`;
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const graph: AdjacencyMap = await response.json();
    return graph;
  } catch (error) {
    console.error('Failed to fetch graph:', error);
    throw new Error('Failed to fetch graph from server');
  }
};
