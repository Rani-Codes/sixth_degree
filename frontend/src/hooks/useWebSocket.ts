import { useState, useRef, useCallback } from 'react';
import { LogMessage, SearchParams, WebSocketMessage } from '../types';
import { findPath, PEOPLE } from '../data/people';

export const useWebSocket = () => {
  const [messages, setMessages] = useState<LogMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [exploredNodes, setExploredNodes] = useState<string[]>([]);
  const [activePath, setActivePath] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const addLogMessage = useCallback((content: string, type: LogMessage['type'] = 'info') => {
    const newMessage: LogMessage = {
      id: Math.random().toString(36).substring(2) + Date.now().toString(36),
      timestamp: new Date(),
      content,
      type
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  const handleWebSocketMessage = useCallback((data: WebSocketMessage) => {
    switch (data.type) {
      case 'NODE_EXPLORED':
        if (data.node_name) {
          addLogMessage(`Explored: ${data.node_name}`, 'info');
        }
        break;
      case 'PATH_FOUND':
        if (data.path && Array.isArray(data.path)) {
          addLogMessage(`Path found: ${data.path.join(' → ')}`, 'success');
        }
        setIsSearching(false);
        break;
      default:
        addLogMessage(`Unknown message type: ${data.type}`, 'error');
    }
  }, [addLogMessage]);

  const connectAndSearch = useCallback((searchParams: SearchParams) => {
    // TODO: Remove this hardcoded simulation and replace with actual WebSocket connection
    // This is temporary demo code that simulates the pathfinding process
    
    const startPerson = PEOPLE.find(p => p.name === searchParams.from);
    const endPerson = PEOPLE.find(p => p.name === searchParams.to);
    
    if (!startPerson || !endPerson) {
      addLogMessage('Invalid start or end person', 'error');
      return;
    }

    // Close existing connection if any
    setExploredNodes([]);
    setActivePath([]);
    setMessages([]);
    setIsSearching(true);
    setIsConnected(true);

    addLogMessage('Connected to pathfinding server', 'success');
    addLogMessage(`Searching path from ${searchParams.from} to ${searchParams.to}...`, 'info');

    // Simulate pathfinding with delays
    const path = findPath(startPerson.id, endPerson.id);
    const allExplored: string[] = [];
    
    // Simulate exploration
    const simulateExploration = (nodeIndex: number) => {
      if (nodeIndex >= path.length) {
        // Show final path
        setActivePath(path);
        const pathNames = path.map(id => PEOPLE.find(p => p.id === id)?.name).filter(Boolean);
        addLogMessage(`Path found: ${pathNames.join(' → ')}`, 'success');
        setIsSearching(false);
        return;
      }
      
      const nodeId = path[nodeIndex];
      const nodeName = PEOPLE.find(p => p.id === nodeId)?.name;
      
      allExplored.push(nodeId);
      setExploredNodes([...allExplored]);
      addLogMessage(`Explored: ${nodeName}`, 'info');
      
      setTimeout(() => simulateExploration(nodeIndex + 1), 800);
    };
    
    setTimeout(() => simulateExploration(0), 500);

    /* TODO: Replace the above simulation with actual WebSocket code:

    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      const ws = new WebSocket('ws://localhost:8080/ws');
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        addLogMessage('Connected to pathfinding server', 'success');
        
        // Send search payload immediately on connection open
        const payload = {
          from: searchParams.from,
          to: searchParams.to
        };
        ws.send(JSON.stringify(payload));
        addLogMessage(`Searching path from ${searchParams.from} to ${searchParams.to}...`, 'info');
      };

      ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
          addLogMessage('Failed to parse server message', 'error');
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        addLogMessage('Connection error occurred', 'error');
        setIsSearching(false);
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        if (event.code !== 1000) {
          console.error('WebSocket closed unexpectedly:', event);
          addLogMessage('Connection closed unexpectedly', 'error');
        } else {
          addLogMessage('Connection closed', 'info');
        }
        setIsSearching(false);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      addLogMessage('Failed to connect to server', 'error');
      setIsSearching(false);
    }
    */
  }, [addLogMessage]);

  const disconnect = useCallback(() => {
    // TODO: Uncomment when using real WebSocket
    /*
    if (wsRef.current) {
      wsRef.current.close(1000);
      wsRef.current = null;
    }
    */
    setIsConnected(false);
    setIsSearching(false);
    setExploredNodes([]);
    setActivePath([]);
  }, []);

  return {
    messages,
    isConnected,
    isSearching,
    exploredNodes,
    activePath,
    connectAndSearch,
    disconnect
  };
};