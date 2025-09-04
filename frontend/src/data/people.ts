import { Person } from '../types';

// TODO: Replace this hardcoded data with WebSocket data from Go backend
export const PEOPLE: Person[] = [
  { id: '1', name: 'Alice', x: 400, y: 100, connections: ['2', '3', '5'] },
  { id: '2', name: 'Bob', x: 600, y: 150, connections: ['1', '4', '6'] },
  { id: '3', name: 'Charlie', x: 200, y: 180, connections: ['1', '7', '8'] },
  { id: '4', name: 'David', x: 700, y: 200, connections: ['2', '9', '10'] },
  { id: '5', name: 'Emma', x: 150, y: 300, connections: ['1', '11', '12'] },
  { id: '6', name: 'Frank', x: 650, y: 120, connections: ['2', '13', '14'] },
  { id: '7', name: 'Grace', x: 100, y: 400, connections: ['3', '15', '16'] },
  { id: '8', name: 'Henry', x: 300, y: 350, connections: ['3', '17', '18'] },
  { id: '9', name: 'Ivy', x: 750, y: 300, connections: ['4', '19', '20'] },
  { id: '10', name: 'Jack', x: 680, y: 400, connections: ['4', '11', '13'] },
  { id: '11', name: 'Kate', x: 400, y: 500, connections: ['5', '10', '17'] },
  { id: '12', name: 'Liam', x: 80, y: 250, connections: ['5', '15', '18'] },
  { id: '13', name: 'Maya', x: 720, y: 250, connections: ['6', '10', '19'] },
  { id: '14', name: 'Noah', x: 550, y: 80, connections: ['6', '16', '20'] },
  { id: '15', name: 'Olivia', x: 120, y: 520, connections: ['7', '12', '17'] },
  { id: '16', name: 'Paul', x: 450, y: 120, connections: ['7', '14', '18'] },
  { id: '17', name: 'Quinn', x: 500, y: 450, connections: ['8', '11', '15'] },
  { id: '18', name: 'Ruby', x: 250, y: 480, connections: ['8', '12', '16'] },
  { id: '19', name: 'Sam', x: 780, y: 350, connections: ['9', '13', '20'] },
  { id: '20', name: 'Tina', x: 600, y: 380, connections: ['9', '14', '19'] }
];

// TODO: Replace this hardcoded pathfinding with WebSocket data
export const findPath = (startId: string, endId: string): string[] => {
  // Simple BFS pathfinding for demo purposes
  const queue: { id: string; path: string[] }[] = [{ id: startId, path: [startId] }];
  const visited = new Set<string>();
  
  while (queue.length > 0) {
    const { id, path } = queue.shift()!;
    
    if (id === endId) {
      return path;
    }
    
    if (visited.has(id)) continue;
    visited.add(id);
    
    const person = PEOPLE.find(p => p.id === id);
    if (person) {
      for (const connectionId of person.connections) {
        if (!visited.has(connectionId)) {
          queue.push({ id: connectionId, path: [...path, connectionId] });
        }
      }
    }
  }
  
  return [];
};