/**
 * MapView Component - Interactive Leaflet Map with Mappls Integration
 * Displays road network with nodes and edges
 */

import React, { useEffect, useRef, useState } from 'react';
import { Graph, CentralityResult, MapState, CriticalityColors } from '../types';

interface MapViewProps {
  graph: Graph;
  centralityResult?: CentralityResult | null;
  mapState: MapState;
  onNodeClick?: (nodeId: string) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  graph,
  centralityResult,
  mapState,
  onNodeClick,
}) => {
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const polylinesRef = useRef<Map<string, any>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initMap = () => {
      const L = (window as any).L;
      if (!L) {
        setError('Leaflet library not loaded. Please refresh the page.');
        console.error('Leaflet not found');
        return;
      }

      try {
        console.log('Initializing map...');
        const map = L.map(containerRef.current, {
          center: mapState.center,
          zoom: mapState.zoom,
          zoomControl: false,
        });
        
        mapRef.current = map;

        // Mappls tile layer with your API key
        const mapplsKey = 'scilthgyttnvubzynvvitmdjhhhjqvlwyprj';
        
        L.tileLayer(`https://apis.mappls.com/advancedmaps/v1/${mapplsKey}/still_map_tiles/{z}/{x}/{y}.png`, {
          attribution: '© <a href="https://www.mappls.com/">Mappls</a>',
          maxZoom: 19,
          minZoom: 4,
        }).addTo(map);

        setMapReady(true);
        console.log('Map initialized with Mappls tiles');
      } catch (err) {
        console.error('Map init error:', err);
        setError('Failed to initialize map');
      }
    };

    if ((window as any).L) {
      initMap();
    } else {
      setTimeout(initMap, 500);
    }

    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {
          console.error('Error removing map:', e);
        }
        mapRef.current = null;
      }
    };
  }, []);

  // Update map view
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    try {
      mapRef.current.setView(mapState.center, mapState.zoom);
    } catch (err) {
      console.error('Error setting view:', err);
    }
  }, [mapState.center, mapState.zoom, mapReady]);

  // Draw edges
  useEffect(() => {
    if (!mapRef.current || !graph || !mapReady) return;

    const L = (window as any).L;
    if (!L) return;

    try {
      polylinesRef.current.forEach((p) => p.remove());
      polylinesRef.current.clear();

      graph.edges.forEach((edge) => {
        const src = graph.nodes.find((n) => n.id === edge.source);
        const tgt = graph.nodes.find((n) => n.id === edge.target);

        if (!src || !tgt || !src.lat || !src.lon || !tgt.lat || !tgt.lon) return;

        const line = L.polyline(
          [[src.lat, src.lon], [tgt.lat, tgt.lon]],
          {
            color: edge.healed ? '#3b82f6' : '#6b7280',
            weight: edge.healed ? 3 : 2,
            opacity: 0.6,
            dashArray: edge.healed ? '5, 5' : undefined,
          }
        ).addTo(mapRef.current);

        line.bindTooltip(`Length: ${edge.length.toFixed(0)}m${edge.healed ? '<br/>Healed' : ''}`);
        polylinesRef.current.set(`${edge.source}-${edge.target}`, line);
      });

      console.log(`Drew ${polylinesRef.current.size} edges`);
    } catch (err) {
      console.error('Error drawing edges:', err);
    }
  }, [graph, mapReady]);

  // Draw nodes
  useEffect(() => {
    if (!mapRef.current || !graph || !mapReady) return;

    const L = (window as any).L;
    if (!L) return;

    try {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();

      const centralityMap = new Map<string, number>();
      const criticalityMap = new Map<string, string>();

      if (centralityResult) {
        centralityResult.graph.nodes.forEach((n) => {
          if (n.centrality !== undefined) centralityMap.set(n.id, n.centrality);
          if (n.criticality_level) criticalityMap.set(n.id, n.criticality_level);
        });
      }

      graph.nodes.forEach((node) => {
        if (!node.lat || !node.lon) return;

        const centrality = centralityMap.get(node.id) || 0;
        const level = criticalityMap.get(node.id) || 'low';
        const color = CriticalityColors[level as keyof typeof CriticalityColors] || '#6b7280';
        const selected = mapState.selectedNode === node.id;
        const radius = selected ? 10 : centrality > 0.1 ? 8 : centrality > 0.05 ? 6 : 4;

        const marker = L.circleMarker([node.lat, node.lon], {
          radius,
          fillColor: color,
          color: selected ? '#000' : '#fff',
          weight: selected ? 3 : 1,
          opacity: 1,
          fillOpacity: 0.8,
        }).addTo(mapRef.current);

        marker.bindTooltip(`Node ${node.id}<br/>Centrality: ${centrality.toFixed(4)}<br/>Level: ${level}`);
        marker.on('click', () => onNodeClick?.(node.id));

        markersRef.current.set(node.id, marker);
      });

      console.log(`Drew ${markersRef.current.size} nodes`);

      // Fit bounds on first load
      if (graph.nodes.length > 0 && !mapState.bounds) {
        const valid = graph.nodes.filter((n) => n.lat && n.lon);
        if (valid.length > 0) {
          const bounds = L.latLngBounds(valid.map((n) => [n.lat!, n.lon!]));
          mapRef.current.fitBounds(bounds, { padding: [50, 50] });
        }
      }
    } catch (err) {
      console.error('Error drawing nodes:', err);
    }
  }, [graph, centralityResult, mapState.selectedNode, mapState.bounds, onNodeClick, mapReady]);

  return (
    <div className="relative w-full h-full" style={{ minHeight: '600px', backgroundColor: '#e5e7eb' }}>
      <div ref={containerRef} className="w-full h-full" style={{ minHeight: '600px' }} />

      {/* Loading */}
      {!mapReady && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100" style={{ zIndex: 1000 }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-700 font-medium">Loading map...</p>
          <p className="text-xs text-gray-500 mt-2">Initializing Mappls tiles</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50" style={{ zIndex: 1000 }}>
          <p className="text-red-600 font-semibold mb-2">Map Error</p>
          <p className="text-red-500 text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      )}

      {/* Legend */}
      {mapReady && (
        <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-4" style={{ zIndex: 1000 }}>
          <h4 className="text-sm font-semibold mb-2 text-gray-900">Criticality</h4>
          <div className="space-y-1 text-xs text-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#ef4444' }} />
              <span>Critical</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#f97316' }} />
              <span>High</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#10b981' }} />
              <span>Low</span>
            </div>
          </div>
        </div>
      )}

      {/* Zoom Controls */}
      {mapReady && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2" style={{ zIndex: 1000 }}>
          <button
            onClick={() => mapRef.current?.zoomIn()}
            className="block w-8 h-8 text-center hover:bg-gray-100 rounded font-bold text-gray-900"
            title="Zoom In"
          >
            +
          </button>
          <div className="h-px bg-gray-200 my-1" />
          <button
            onClick={() => mapRef.current?.zoomOut()}
            className="block w-8 h-8 text-center hover:bg-gray-100 rounded font-bold text-gray-900"
            title="Zoom Out"
          >
            −
          </button>
        </div>
      )}
    </div>
  );
};

export default MapView;
