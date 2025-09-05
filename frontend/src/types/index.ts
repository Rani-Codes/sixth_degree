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
  
  export interface WebSocketMessage {
    type: string;
    data?: any;
    node_name?: string;
    path?: string[];
  }
  
  export interface Connection {
    from: string;
    to: string;
    isActive?: boolean;
    isPath?: boolean;
  }