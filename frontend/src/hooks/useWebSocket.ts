import { useState, useRef, useCallback } from 'react';
import { LogMessage, SearchParams, WebSocketMessage, WebSocketRequest, NodeExploredData, PathFoundData } from '../types';

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
      case 'node_explored':
        const nodeData = data.data as NodeExploredData;
        if (nodeData.node) {
          addLogMessage(`Level ${nodeData.level}: Explored ${nodeData.node}`, 'info');
          setExploredNodes(prev => [...prev, nodeData.node]);
        }
        break;
      case 'path_found':
        const pathData = data.data as PathFoundData;
        if (pathData.path && Array.isArray(pathData.path)) {
          addLogMessage(`Path found: ${pathData.path.join(' → ')} (${pathData.length} steps)`, 'success');
          setActivePath(pathData.path);
        }
        setIsSearching(false);
        break;
      case 'error':
        const errorMessage = data.data as string;
        addLogMessage(`Error: ${errorMessage}`, 'error');
        setIsSearching(false);
        break;
      default:
        addLogMessage(`Unknown message type: ${data.type}`, 'error');
    }
  }, [addLogMessage]);

  const connectAndSearch = useCallback((searchParams: SearchParams) => {
    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
    }

    // Reset state
    setExploredNodes([]);
    setActivePath([]);
    setMessages([]);
    setIsSearching(true);

    try {
      const ws = new WebSocket('ws://localhost:8080/ws');
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        addLogMessage('Connected to pathfinding server', 'success');
        
        // Send search request to Go backend
        const request: WebSocketRequest = {
          startNode: searchParams.from,
          endNode: searchParams.to
        };
        ws.send(JSON.stringify(request));
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
        setIsConnected(false);
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
      setIsConnected(false);
    }
  }, [addLogMessage, handleWebSocketMessage]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000);
      wsRef.current = null;
    }
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