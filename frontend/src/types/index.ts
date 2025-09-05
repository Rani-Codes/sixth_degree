export interface Person {
    name: string;
  }
  
  export interface SearchParams {
    from: string;
    to: string;
  }
  
  export interface LogMessage {
    id: string;
    timestamp: Date;
    content: string;
    type: 'info' | 'success' | 'error';
  }
  
  // WebSocket message types matching Go backend WSResponse
export interface WebSocketMessage {
  type: 'node_explored' | 'path_found' | 'error';
  data: NodeExploredData | PathFoundData | string;
}

export interface NodeExploredData {
  level: number;
  node: string;
}

export interface PathFoundData {
  path: string[];
  length: number;
}

// WebSocket request to send to Go backend
export interface WebSocketRequest {
  startNode: string;
  endNode: string;
}
  
  export interface Connection {
    from: string;
    to: string;
    isActive?: boolean;
    isPath?: boolean;
  }