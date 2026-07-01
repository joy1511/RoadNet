import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  Search,
  X,
  Layers,
  MapPin,
  Activity,
  Maximize2,
  Minus,
  Plus,
  Radio,
  Eye,
} from 'lucide-react';
import { Graph, CentralityResult, AblationResult } from '../types';
import { SimulationPanel } from './SimulationPanel';

interface InteractiveMapPanelProps {
  graph: Graph;
  centralityResult: CentralityResult | null;
  ablationResult: AblationResult | null;
  shortestPathResult?: { path: string[]; distance: number } | null;
  onSimulate: (nodeIds: string[]) => void;
}

export const InteractiveMapPanel: React.FC<InteractiveMapPanelProps> = ({
  graph,
  centralityResult,
  ablationResult,
  shortestPathResult,
  onSimulate,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layersRef = useRef<any[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [colorByCriticality, setColorByCriticality] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Selection state
  const [selectedNode, setSelectedNode] = useState<string | undefined>(undefined);

  // Filter edges based on search and limit to 1000 for performance
  const filteredEdges = useMemo(() => {
    let edges = graph.edges;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      edges = edges.filter(
        (e) =>
          e.source.toLowerCase().includes(q) ||
          e.target.toLowerCase().includes(q)
      );
    }
    // For very large graphs (like Bengaluru), only take the top 1000 edges to prevent freezing
    return edges.slice(0, 1000);
  }, [graph.edges, searchQuery]);

  // Get involved node IDs based on visible edges
  const visibleNodeIds = useMemo(() => {
    const ids = new Set<string>();
    filteredEdges.forEach((e) => {
      ids.add(e.source);
      ids.add(e.target);
    });
    return ids;
  }, [filteredEdges]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    // Check if we are dealing with a custom image graph (no lat/lon)
    const isCustomImage = graph.nodes.length > 0 && graph.nodes[0].lat === undefined;

    // Use Bengaluru as default center unless graph has valid bounds
    let center: [number, number] = [12.9716, 77.5946];
    let zoom = 12;

    if (isCustomImage) {
      // For custom images, center on a default pixel area
      center = [-500, 500]; // Leaflet CRS.Simple uses [y, x] where down is negative y
      zoom = -1;
    } else if (graph.nodes.length > 0 && graph.nodes[0].lat !== undefined) {
      center = [graph.nodes[0].lat, graph.nodes[0].lon as number];
      zoom = 14;
    }

    mapRef.current = L.map(mapContainerRef.current, {
      zoomControl: false,
      crs: isCustomImage ? L.CRS.Simple : L.CRS.EPSG3857,
    }).setView(center, zoom);

    if (!isCustomImage) {
      // Modern dark theme map tiles (CartoDB Dark Matter)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        maxZoom: 19,
      }).addTo(mapRef.current);
    }

    L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);

    setMapReady(true);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [graph]);

  // Handle map interaction
  const handleNodeClick = useCallback(
    (nodeId: string) => {
      // Pass the node ID down as array of 1 for simulate function
      setSelectedNode(nodeId);
      onSimulate([nodeId]);
    },
    [onSimulate]
  );

  // Draw network on map
  const drawNetwork = useCallback(() => {
    if (!mapReady || !mapRef.current) return;
    const L = (window as any).L;

    // Clear existing layers
    layersRef.current.forEach((layer) => {
      if (mapRef.current) {
        mapRef.current.removeLayer(layer);
      }
    });
    layersRef.current = [];

    const centralityMap = new Map<string, number>();
    const criticalityMap = new Map<string, string>();

    if (centralityResult) {
      // Extract from raw graph data if it's there
      centralityResult.graph.nodes.forEach((n) => {
        if (n.centrality) centralityMap.set(n.id, n.centrality);
      });

      centralityResult.gatekeeper_nodes.forEach((gn) => {
        criticalityMap.set(gn.node_id, gn.criticality_level);
        centralityMap.set(gn.node_id, gn.centrality_score);
      });
    }

    // Shortest path lookup
    const spNodes = new Set<string>();
    const spEdges = new Set<string>();
    if (shortestPathResult && shortestPathResult.path) {
      const path = shortestPathResult.path;
      path.forEach((n) => spNodes.add(n));
      for (let i = 0; i < path.length - 1; i++) {
        spEdges.add(`${path[i]}-${path[i + 1]}`);
        spEdges.add(`${path[i + 1]}-${path[i]}`);
      }
    }

    // Draw edges
    filteredEdges.forEach((edge) => {
      const srcId = typeof edge.source === 'string' ? edge.source : (edge.source as any).id;
      const tgtId = typeof edge.target === 'string' ? edge.target : (edge.target as any).id;

      const src = nodeMap.get(srcId);
      const tgt = nodeMap.get(tgtId);

      const getLatLng = (n: any): [number, number] | null => {
        if (n.lat !== undefined && n.lon !== undefined) return [n.lat, n.lon];
        if (n.y !== undefined && n.x !== undefined) return [-n.y, n.x];
        return null;
      };

      const srcPos = src ? getLatLng(src) : null;
      const tgtPos = tgt ? getLatLng(tgt) : null;

      if (!srcPos || !tgtPos) return;

      const isSpEdge = spEdges.has(`${edge.source}-${edge.target}`);

      let color = edge.healed ? '#10b981' : '#334155';
      let weight = edge.healed ? 2 : 1;
      let opacity = 0.7;
      let zIndexOffset = 0;

      // If coloring by criticality, check if source or target is critical
      if (colorByCriticality && centralityResult && !isSpEdge) {
        const srcC = centralityMap.get(src.id) || 0;
        const tgtC = centralityMap.get(tgt.id) || 0;
        const maxC = Math.max(srcC, tgtC);
        
        if (maxC > 0.1) color = '#ef4444';
        else if (maxC > 0.05) color = '#f97316';
        else if (maxC > 0.01) color = '#f59e0b';
      }

      // Highlight shortest path edges
      if (isSpEdge) {
        color = '#a855f7'; // Purple for shortest path
        weight = 4;
        opacity = 1;
        zIndexOffset = 1000;
      }

      const line = L.polyline([srcPos, tgtPos], {
        color,
        weight,
        opacity,
        dashArray: edge.healed ? '5, 5' : undefined,
      });
      // Add custom Z-index if leaflet supports it, else it will just draw in order
      
      line.addTo(mapRef.current);

      line.bindTooltip(
        `Edge: ${edge.source} -> ${edge.target}<br/>Length: ${edge.length.toFixed(0)}m` +
        (isSpEdge ? '<br/><b>Part of Shortest Path</b>' : '')
      );

      layersRef.current.push(line);
    });

    // Draw nodes
    graph.nodes.forEach((node) => {
      const getLatLng = (n: any): [number, number] | null => {
        if (n.lat !== undefined && n.lon !== undefined) return [n.lat, n.lon];
        if (n.y !== undefined && n.x !== undefined) return [-n.y, n.x];
        return null;
      };

      const pos = getLatLng(node);
      if (!visibleNodeIds.has(node.id) || !pos) return;

      const centrality = centralityMap.get(node.id) || 0;
      const level = criticalityMap.get(node.id) || 'low';
      const isSelected = selectedNode === node.id;
      const isSpNode = spNodes.has(node.id);
      
      let color = '#60a5fa';
      let radius = isSelected ? 8 : 3;

      if (colorByCriticality && !isSpNode) {
        if (level === 'critical') {
          color = '#ef4444';
          radius = isSelected ? 10 : 6;
        } else if (level === 'high') {
          color = '#f97316';
          radius = isSelected ? 8 : 5;
        } else if (level === 'medium') {
          color = '#f59e0b';
          radius = isSelected ? 6 : 4;
        } else {
          color = '#10b981';
          radius = isSelected ? 5 : 3;
        }
      }

      if (isSpNode) {
        color = '#a855f7';
        radius = isSelected ? 10 : 6;
      }

      const marker = L.circleMarker(pos, {
        radius,
        fillColor: color,
        color: isSelected || isSpNode ? '#ffffff' : 'rgba(255,255,255,0.4)',
        weight: isSelected || isSpNode ? 2 : 1,
        fillOpacity: 0.9,
      }).addTo(mapRef.current);

      marker.bindTooltip(
        `<b>${node.id}</b><br/>Centrality: ${centrality.toFixed(4)}<br/>Degree: ${node.degree || '?'}` +
        (isSpNode ? '<br/><b>On Shortest Path</b>' : '')
      );
      
      marker.on('click', () => handleNodeClick(node.id));

      layersRef.current.push(marker);
    });

  }, [graph, filteredEdges, visibleNodeIds, colorByCriticality, mapReady, centralityResult, selectedNode, handleNodeClick, shortestPathResult]);

  useEffect(() => {
    drawNetwork();
  }, [drawNetwork]);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const totalLength = graph.edges.reduce((sum, e) => sum + e.length, 0);

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[800px] rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden shadow-2xl">
      {/* Map Panel */}
      <div className="flex-1 relative border-r border-slate-800 flex flex-col">
        {/* Map Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex justify-between items-center z-10">
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-blue-400" />
            <h2 className="text-white font-medium">Interactive Network Map</h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">
              {filteredEdges.length} roads · {visibleNodeIds.size} intersections in view
            </span>
            <div className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-xs flex items-center gap-1 font-medium">
              <Radio size={12} />
              LIVE
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative bg-black">
          <div ref={mapContainerRef} className="absolute inset-0" />

          {/* Zoom Controls */}
          <div className="absolute right-4 top-4 z-[400] flex flex-col bg-slate-900/90 border border-slate-700 rounded-lg shadow-lg overflow-hidden backdrop-blur">
            <button className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors" onClick={() => mapRef.current?.zoomIn()} title="Zoom In">
              <Plus size={16} />
            </button>
            <div className="h-px bg-slate-700" />
            <button className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors" onClick={() => mapRef.current?.zoomOut()} title="Zoom Out">
              <Minus size={16} />
            </button>
            <div className="h-px bg-slate-700" />
            <button className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors" onClick={toggleFullscreen} title="Fullscreen">
              <Maximize2 size={14} />
            </button>
          </div>

          {!mapReady && (
            <div className="nmp-map-loading">
              <div className="nmp-spinner" />
              <p>Loading map tiles…</p>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <aside className="w-full lg:w-[380px] p-4 flex flex-col gap-4 overflow-y-auto bg-slate-900/80 border-t lg:border-t-0 lg:border-l border-slate-800">
        {/* Search */}
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-3">
            <Search size={16} className="text-blue-400" />
            <h3 className="font-medium text-white">Search Nodes</h3>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              className="w-full bg-slate-900/80 border border-slate-700 text-sm text-white rounded-lg pl-9 pr-8 py-2 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="e.g. node_0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white" onClick={() => setSearchQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-slate-300">Color by criticality</span>
            <button
              className={`w-10 h-5 rounded-full relative transition-colors ${colorByCriticality ? 'bg-blue-500' : 'bg-slate-700'}`}
              onClick={() => setColorByCriticality(!colorByCriticality)}
              role="switch"
              aria-checked={colorByCriticality}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${colorByCriticality ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </div>

        {/* Network Snapshot */}
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-4">
            <Layers size={16} className="text-blue-400" />
            <h3 className="font-medium text-white">Network Snapshot</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/50 flex flex-col">
              <span className="text-xl font-semibold text-white">{graph.nodes.length}</span>
              <span className="text-xs text-slate-400 uppercase tracking-wider">Nodes</span>
            </div>
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/50 flex flex-col">
              <span className="text-xl font-semibold text-white">{graph.edges.length}</span>
              <span className="text-xs text-slate-400 uppercase tracking-wider">Edges</span>
            </div>
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/50 flex flex-col">
              <span className="text-xl font-semibold text-white">
                {graph.edges.filter(e => e.healed).length}
              </span>
              <span className="text-xs text-slate-400 uppercase tracking-wider">Healed Links</span>
            </div>
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/50 flex flex-col">
              <span className="text-xl font-semibold text-white">
                {(totalLength / 1000).toFixed(1)}km
              </span>
              <span className="text-xs text-slate-400 uppercase tracking-wider">Total Length</span>
            </div>
          </div>
        </div>

        {/* Simulation Panel */}
        {centralityResult && (
          <div style={{ marginTop: '1rem' }}>
            <SimulationPanel
              graph={graph}
              centralityResult={centralityResult}
              selectedNode={selectedNode}
              onSimulate={onSimulate}
            />
          </div>
        )}
      </aside>
    </div>
  );
};
