/**
 * Map Utility Functions
 * Helper functions for map operations
 */

import { Graph, Node, Edge } from '../types';

/**
 * Calculate bounds from graph nodes
 */
export function calculateBounds(
  nodes: Node[]
): [[number, number], [number, number]] | null {
  const validNodes = nodes.filter((n) => n.lat && n.lon);

  if (validNodes.length === 0) return null;

  const lats = validNodes.map((n) => n.lat!);
  const lons = validNodes.map((n) => n.lon!);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  return [
    [minLat, minLon],
    [maxLat, maxLon],
  ];
}

/**
 * Calculate center point from graph
 */
export function calculateCenter(nodes: Node[]): [number, number] {
  const validNodes = nodes.filter((n) => n.lat && n.lon);

  if (validNodes.length === 0) return [0, 0];

  const avgLat = validNodes.reduce((sum, n) => sum + n.lat!, 0) / validNodes.length;
  const avgLon = validNodes.reduce((sum, n) => sum + n.lon!, 0) / validNodes.length;

  return [avgLat, avgLon];
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Find nearest node to a coordinate
 */
export function findNearestNode(
  lat: number,
  lon: number,
  nodes: Node[]
): Node | null {
  const validNodes = nodes.filter((n) => n.lat && n.lon);

  if (validNodes.length === 0) return null;

  let nearest = validNodes[0];
  let minDistance = calculateDistance(lat, lon, nearest.lat!, nearest.lon!);

  validNodes.forEach((node) => {
    const distance = calculateDistance(lat, lon, node.lat!, node.lon!);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = node;
    }
  });

  return nearest;
}

/**
 * Get edges connected to a node
 */
export function getConnectedEdges(nodeId: string, edges: Edge[]): Edge[] {
  return edges.filter((e) => e.source === nodeId || e.target === nodeId);
}

/**
 * Get neighbor nodes
 */
export function getNeighborNodes(nodeId: string, graph: Graph): Node[] {
  const connectedEdges = getConnectedEdges(nodeId, graph.edges);

  const neighborIds = new Set<string>();
  connectedEdges.forEach((edge) => {
    if (edge.source === nodeId) {
      neighborIds.add(edge.target);
    } else {
      neighborIds.add(edge.source);
    }
  });

  return graph.nodes.filter((n) => neighborIds.has(n.id));
}

/**
 * Convert pixel coordinates to lat/lon (requires image bounds)
 */
export function pixelToLatLon(
  x: number,
  y: number,
  imageWidth: number,
  imageHeight: number,
  bounds: [[number, number], [number, number]]
): [number, number] {
  const [[minLat, minLon], [maxLat, maxLon]] = bounds;

  const lat = maxLat - (y / imageHeight) * (maxLat - minLat);
  const lon = minLon + (x / imageWidth) * (maxLon - minLon);

  return [lat, lon];
}

/**
 * Convert lat/lon to pixel coordinates (requires image bounds)
 */
export function latLonToPixel(
  lat: number,
  lon: number,
  imageWidth: number,
  imageHeight: number,
  bounds: [[number, number], [number, number]]
): [number, number] {
  const [[minLat, minLon], [maxLat, maxLon]] = bounds;

  const x = ((lon - minLon) / (maxLon - minLon)) * imageWidth;
  const y = ((maxLat - lat) / (maxLat - minLat)) * imageHeight;

  return [x, y];
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(lat: number, lon: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';

  return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lon).toFixed(4)}°${lonDir}`;
}

/**
 * Get color for centrality value
 */
export function getCentralityColor(centrality: number): string {
  if (centrality > 0.1) return '#ef4444'; // Critical - red
  if (centrality > 0.05) return '#f97316'; // High - orange
  if (centrality > 0.01) return '#f59e0b'; // Medium - yellow
  return '#10b981'; // Low - green
}

/**
 * Get criticality level from centrality value
 */
export function getCriticalityLevel(
  centrality: number
): 'critical' | 'high' | 'medium' | 'low' {
  if (centrality > 0.1) return 'critical';
  if (centrality > 0.05) return 'high';
  if (centrality > 0.01) return 'medium';
  return 'low';
}

/**
 * Calculate graph density
 */
export function calculateGraphDensity(graph: Graph): number {
  const n = graph.nodes.length;
  const m = graph.edges.length;

  if (n <= 1) return 0;

  // For undirected graph: density = 2m / (n * (n-1))
  return (2 * m) / (n * (n - 1));
}

/**
 * Calculate clustering coefficient (simplified)
 */
export function calculateClusteringCoefficient(graph: Graph): number {
  let totalCoefficient = 0;
  let validNodes = 0;

  graph.nodes.forEach((node) => {
    const neighbors = getNeighborNodes(node.id, graph);
    const k = neighbors.length;

    if (k < 2) return; // Need at least 2 neighbors

    // Count edges between neighbors
    let edgesBetweenNeighbors = 0;
    for (let i = 0; i < neighbors.length; i++) {
      for (let j = i + 1; j < neighbors.length; j++) {
        const edge = graph.edges.find(
          (e) =>
            (e.source === neighbors[i].id && e.target === neighbors[j].id) ||
            (e.source === neighbors[j].id && e.target === neighbors[i].id)
        );
        if (edge) edgesBetweenNeighbors++;
      }
    }

    const coefficient = (2 * edgesBetweenNeighbors) / (k * (k - 1));
    totalCoefficient += coefficient;
    validNodes++;
  });

  return validNodes > 0 ? totalCoefficient / validNodes : 0;
}

export default {
  calculateBounds,
  calculateCenter,
  calculateDistance,
  findNearestNode,
  getConnectedEdges,
  getNeighborNodes,
  pixelToLatLon,
  latLonToPixel,
  formatCoordinates,
  getCentralityColor,
  getCriticalityLevel,
  calculateGraphDensity,
  calculateClusteringCoefficient,
};
