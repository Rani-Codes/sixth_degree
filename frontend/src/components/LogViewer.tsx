import React, { useEffect, useRef } from 'react';
import { Activity } from 'lucide-react';
import { LogMessage } from '../types';

interface LogViewerProps {
  messages: LogMessage[];
  isConnected: boolean;
}

export const LogViewer: React.FC<LogViewerProps> = ({ messages, isConnected }) => {
  const logEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getMessageColor = (type: LogMessage['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-700';
    }
  };

  return (
    <div className="bg-gray-900 rounded-xl shadow-xl border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-100 flex items-center space-x-2">
          <Activity className="w-5 h-5 text-blue-400" />
          <span>Search Log</span>
        </h2>
        
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-400">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div
        ref={containerRef}
        className="max-h-96 overflow-y-auto border border-gray-700 rounded-lg bg-black/20 p-4 space-y-2"
      >
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <Activity className="w-12 h-12 mx-auto text-gray-600 mb-2" />
            <p>No search activity yet</p>
            <p className="text-sm">Select start and end persons to begin</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="flex items-start space-x-3 py-1">
              <span className="text-xs text-gray-500 font-mono min-w-0 flex-shrink-0">
                {formatTimestamp(message.timestamp)}
              </span>
              <span className={`font-mono text-sm ${getMessageColor(message.type)}`}>
                {message.content}
              </span>
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
};