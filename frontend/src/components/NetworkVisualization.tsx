import React, { useState, useEffect } from 'react';
import { Person, Connection } from '../types';
import { PEOPLE } from '../data/people';

interface NetworkVisualizationProps {
  activePath: string[];
  exploredNodes: string[];
  startPersonId?: string;
  endPersonId?: string;
}

export const NetworkVisualization: React.FC<NetworkVisualizationProps> = ({
  activePath,
  exploredNodes,
  startPersonId,
  endPersonId
}) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);

  useEffect(() => {
    // Generate all connections from the people data
    const allConnections: Connection[] = [];
    PEOPLE.forEach(person => {
      person.connections.forEach(connectionId => {
        // Avoid duplicate connections
        const exists = allConnections.some(conn => 
          (conn.from === person.id && conn.to === connectionId) ||
          (conn.from === connectionId && conn.to === person.id)
        );
        if (!exists) {
          allConnections.push({
            from: person.id,
            to: connectionId,
            isActive: exploredNodes.includes(person.id) && exploredNodes.includes(connectionId),
            isPath: activePath.includes(person.id) && activePath.includes(connectionId)
          });
        }
      });
    });
    setConnections(allConnections);
  }, [activePath, exploredNodes]);

  const getPersonById = (id: string) => PEOPLE.find(p => p.id === id);

  const getNodeClass = (personId: string) => {
    const baseClass = "absolute w-12 h-12 rounded-full border-2 flex items-center justify-center text-xs font-semibold transition-all duration-300 cursor-pointer";
    
    if (personId === startPersonId) {
      return `${baseClass} bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/50 transform scale-105`;
    }
    if (personId === endPersonId) {
      return `${baseClass} bg-red-500 border-red-400 text-white shadow-lg shadow-red-500/50 transform scale-105`;
    }
    if (activePath.includes(personId)) {
      return `${baseClass} bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/50 transform scale-105`;
    }
    if (exploredNodes.includes(personId)) {
      return `${baseClass} bg-purple-500 border-purple-400 text-white shadow-md shadow-purple-500/30`;
    }
    if (hoveredNode === personId) {
      return `${baseClass} bg-gray-600 border-gray-500 text-white shadow-lg transform scale-102`;
    }
    
    return `${baseClass} bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600 hover:transform hover:scale-102`;
  };

  const getConnectionClass = (connection: Connection) => {
    if (connection.isPath) {
      return "stroke-blue-400 stroke-2 drop-shadow-lg";
    }
    if (connection.isActive) {
      return "stroke-purple-400 stroke-1";
    }
    return "stroke-gray-600 stroke-1 opacity-60";
  };

  const renderConnection = (connection: Connection, index: number) => {
    const fromPerson = getPersonById(connection.from);
    const toPerson = getPersonById(connection.to);
    
    if (!fromPerson || !toPerson) return null;

    return (
      <line
        key={index}
        x1={fromPerson.x + 24}
        y1={fromPerson.y + 24}
        x2={toPerson.x + 24}
        y2={toPerson.y + 24}
        className={`${getConnectionClass(connection)} transition-all duration-500`}
      />
    );
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black opacity-50" />
      
      <div className="relative">
        <h2 className="text-xl font-semibold text-gray-100 mb-4 flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <span>Network Visualization</span>
        </h2>
        
        <div className="relative w-full h-[600px] bg-black/20 rounded-lg border border-gray-700 overflow-hidden">
          {/* SVG for connections */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet">
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {connections.map((connection, index) => renderConnection(connection, index))}
          </svg>
          
          {/* Nodes */}
          {PEOPLE.map((person) => (
            <div
              key={person.id}
              className={getNodeClass(person.id)}
              style={{
                left: `${(person.x / 800) * 100}%`,
                top: `${(person.y / 600) * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
              onMouseEnter={() => setHoveredNode(person.id)}
              onMouseLeave={() => setHoveredNode(null)}
              title={person.name}
            >
              {person.name.slice(0, 2)}
            </div>
          ))}
          
          {/* Floating particles for ambiance */}
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-20 animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 3}s`
                }}
              />
            ))}
          </div>
        </div>
        
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50" />
            <span className="text-gray-300">Start Node</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full shadow-lg shadow-red-500/50" />
            <span className="text-gray-300">End Node</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50" />
            <span className="text-gray-300">Path</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full shadow-md shadow-purple-500/30" />
            <span className="text-gray-300">Explored</span>
          </div>
        </div>
      </div>
    </div>
  );
};