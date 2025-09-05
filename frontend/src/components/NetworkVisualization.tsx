import React, { useEffect, useMemo, useRef, useState } from 'react';
import Sigma from 'sigma';
import Graph from 'graphology';
import { AdjacencyMap } from '../types';
import { fetchGraph } from '../services/api';

interface NetworkVisualizationProps {
  activePath: string[];
  exploredNodes: string[];
  startPersonId?: string;
  endPersonId?: string;
}

interface HoverState {
  hoveredNode: string | null;
}

export const NetworkVisualization: React.FC<NetworkVisualizationProps> = ({
  activePath,
  exploredNodes,
  startPersonId,
  endPersonId
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const graphRef = useRef<Graph | null>(null);
  const cacheGraph = useRef<AdjacencyMap | null>(null);
  
  // Hover state
  const [hover, setHover] = useState<HoverState>({
    hoveredNode: null
  });

  // Radial-by-level layout helpers
  const levelRadius = useMemo(() => 1, []); // base unit radius; Sigma auto scales camera
  const PATH_STEP_RADIUS = 220; // pixels per step along the path (increase spread)
  const PATH_ANGLE_STEP = 1.1; // radians per step for spiral spacing (more rotation)
  const nodePos = useRef<Map<string, { x: number; y: number }>>(new Map());
  const nodeLevel = useRef<Map<string, number>>(new Map());
  const exploredCount = useMemo(() => {
    const s = new Set<string>();
    exploredNodes.forEach((n) => s.add(n));
    activePath.forEach((n) => s.add(n));
    if (startPersonId) s.add(startPersonId);
    if (endPersonId) s.add(endPersonId);
    return s.size;
  }, [exploredNodes, activePath, startPersonId, endPersonId]);

  const hashAngle = (id: string): number => {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return (h % 360) * (Math.PI / 180);
  };

  const getPosition = (id: string, level: number) => {
    const cached = nodePos.current.get(id);
    if (cached) return cached;
    const angle = hashAngle(id);
    const radius = level * levelRadius;
    const pos = { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
    nodePos.current.set(id, pos);
    nodeLevel.current.set(id, level);
    return pos;
  };

  useEffect(() => {
    let disposed = false;
    const init = async () => {
      // Fetch full adjacency once
      const full = await fetchGraph();
      if (disposed) return;
      cacheGraph.current = full;

      // Init graphology + sigma
      const g = new Graph({ type: 'undirected', multi: false });
      graphRef.current = g;
      if (containerRef.current) {
        const sigma = new Sigma(g, containerRef.current, {
          renderEdgeLabels: false,
          renderLabels: false,
          allowInvalidContainer: false,
        });
        sigmaRef.current = sigma;
        
        // Set up event handlers for hover only
        sigma.on('enterNode', (event) => {
          const { node } = event;
          setHover({ hoveredNode: node });
        });
        
        sigma.on('leaveNode', () => {
          setHover({ hoveredNode: null });
        });
      }

      // Seed start/end nodes for visibility
      const seedNodes = [startPersonId, endPersonId].filter(Boolean) as string[];
      seedNodes.forEach((id, idx) => {
        if (!g.hasNode(id)) {
          const pos = getPosition(id, idx === 0 ? 0 : 1);
          g.addNode(id, {
            x: pos.x,
            y: pos.y,
            size: 8,
            color: idx === 0 ? '#10B981' : '#EF4444',
          });
        }
      });
    };

    init();
    return () => {
      disposed = true;
      if (sigmaRef.current) {
        sigmaRef.current.kill();
        sigmaRef.current = null;
      }
      graphRef.current = null;
      nodePos.current.clear();
      nodeLevel.current.clear();
      setHover({ hoveredNode: null });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear previous visualization when a new search starts (arrays reset)
  useEffect(() => {
    const g = graphRef.current;
    if (!g) return;
    if (exploredNodes.length === 0 && activePath.length === 0) {
      g.clear();
      nodePos.current.clear();
      nodeLevel.current.clear();
      
      // Reseed start/end so the user sees them immediately
      const seeds = [startPersonId, endPersonId].filter(Boolean) as string[];
      seeds.forEach((id, idx) => {
        if (!g.hasNode(id)) {
          const pos = getPosition(id, idx === 0 ? 0 : 1);
          g.addNode(id, {
            x: pos.x,
            y: pos.y,
            size: 8,
            color: idx === 0 ? '#10B981' : '#EF4444',
          });
        }
      });
    }
  }, [exploredNodes.length, activePath.length, startPersonId, endPersonId]);

  // Apply explored nodes incrementally
  useEffect(() => {
    const g = graphRef.current;
    if (!g) return;

    // Only add explored nodes; do not add unexplored
    exploredNodes.forEach((id) => {
      if (!g.hasNode(id)) {
        // Try to read a level if present in the server stream: not provided directly here, so approximate by index
        const level = Math.max(1, exploredNodes.indexOf(id) + 1);
        const pos = getPosition(id, level);
        g.addNode(id, {
          x: pos.x,
          y: pos.y,
          size: 1.5,
          color: '#8B5CF6',
        });
      }
    });
  }, [exploredNodes]);

  // Draw final path as edges and highlight nodes
  useEffect(() => {
    const g = graphRef.current;
    if (!g || activePath.length === 0) return;

    // Ensure path nodes exist, reposition along a spiral, and highlight them
    activePath.forEach((id, idx) => {
      const level = Math.max(0, idx);
      const angle = idx === 0 ? 0 : idx * PATH_ANGLE_STEP;
      const radius = idx === 0 ? 0 : idx * PATH_STEP_RADIUS;
      const pos = { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };

      const isStart = startPersonId && id === startPersonId;
      const isEnd = endPersonId && id === endPersonId;
      
      if (!g.hasNode(id)) {
        g.addNode(id, { 
          x: pos.x, 
          y: pos.y, 
          size: isStart || isEnd ? 8 : 6, 
          color: '#3B82F6' 
        });
      } else {
        g.setNodeAttribute(id, 'x', pos.x);
        g.setNodeAttribute(id, 'y', pos.y);
        
        if (!isStart && !isEnd) {
          g.setNodeAttribute(id, 'color', '#3B82F6');
        }
        g.setNodeAttribute(id, 'size', isStart || isEnd ? 8 : 6);
      }
      nodePos.current.set(id, pos);
      nodeLevel.current.set(id, level);
    });

    // Add edges between consecutive path nodes
    for (let i = 0; i < activePath.length - 1; i++) {
      const a = activePath[i];
      const b = activePath[i + 1];
      const edgeId = `${a}->${b}`;
      if (!g.hasEdge(edgeId) && !g.hasEdge(a, b)) {
        g.addEdgeWithKey(edgeId, a, b, { color: '#60A5FA', size: 1.5 });
      }
    }
  }, [activePath, startPersonId, endPersonId]);

  // Keep start/end styled distinctly on changes
  useEffect(() => {
    const g = graphRef.current;
    if (!g) return;
    if (startPersonId) {
      if (!g.hasNode(startPersonId)) {
        const pos = getPosition(startPersonId, 0);
        g.addNode(startPersonId, { x: pos.x, y: pos.y, size: 6, color: '#10B981' });
      } else {
        g.setNodeAttribute(startPersonId, 'color', '#10B981');
        g.setNodeAttribute(startPersonId, 'size', 6);
      }
    }
    if (endPersonId) {
      if (!g.hasNode(endPersonId)) {
        const pos = getPosition(endPersonId, 1);
        g.addNode(endPersonId, { x: pos.x, y: pos.y, size: 6, color: '#EF4444' });
      } else {
        g.setNodeAttribute(endPersonId, 'color', '#EF4444');
        g.setNodeAttribute(endPersonId, 'size', 6);
      }
    }
  }, [startPersonId, endPersonId]);

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black opacity-50" />
      
      <div className="relative">
        <h2 className="text-xl font-semibold text-gray-100 mb-4 flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <span>Network Visualization</span>
        </h2>
        
        <div ref={containerRef} className="relative w-full h-[600px] bg-black/20 rounded-lg border border-gray-700 overflow-hidden">
          <div className="absolute top-2 right-2 text-xs text-white bg-black/60 rounded px-2 py-1 pointer-events-none z-50">
            Nodes explored: {exploredCount}
          </div>
          
          {/* Hover info in top-left */}
          {hover.hoveredNode && (
            <div className="absolute top-2 left-2 text-xs text-white bg-blue-600/80 rounded px-2 py-1 pointer-events-none z-50">
              {hover.hoveredNode}
            </div>
          )}
          
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