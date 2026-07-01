/**
 * API Client for AstroRoute Backend
 * Handles all communication with Flask backend
 */

const API_BASE = ''; // Use empty string to route through Vite proxy

// Types
export interface Node {
  id: string;
  x: number;
  y: number;
  lat?: number;
  lon?: number;
  centrality?: number;
  criticality_level?: 'critical' | 'high' | 'medium' | 'low';
  degree?: number;
}

export interface Edge {
  source: string;
  target: string;
  weight: number;
  length: number;
  healed?: boolean;
  healing_score?: number;
}

export interface Graph {
  nodes: Node[];
  edges: Edge[];
  metadata?: {
    node_count: number;
    edge_count: number;
    is_connected: boolean;
  };
}

export interface GatekeeperNode {
  rank: number;
  node_id: string;
  centrality_score: number;
  position: {
    x: number;
    y: number;
    lat?: number;
    lon?: number;
  };
  degree: number;
  criticality_level: 'critical' | 'high' | 'medium' | 'low';
}

export interface CentralityResult {
  graph: Graph;
  gatekeeper_nodes: GatekeeperNode[];
  stats: {
    mean: number;
    median: number;
    max: number;
    percentile_95: number;
  };
  algorithm: string;
}

export interface AblationIteration {
  iteration: number;
  node_removed: string;
  metrics_after: NetworkMetrics;
  impact: ImpactMetrics;
}

export interface NetworkMetrics {
  node_count: number;
  edge_count: number;
  connected_components: number;
  largest_component_size: number;
  average_shortest_path: number;
  global_efficiency: number;
  connectivity_ratio: number;
}

export interface ImpactMetrics {
  overall_impact_score: number;
  connectivity_ratio_change: number;
  connectivity_ratio_pct_change: number;
  avg_path_increase: number;
}

export interface AblationResult {
  resilience_index: number;
  baseline_metrics: NetworkMetrics;
  final_metrics: NetworkMetrics;
  nodes_removed: string[];
  ablation_results: AblationIteration[];
  summary: {
    nodes_removed: number;
    components_created: number;
    connectivity_degradation: string;
    efficiency_loss: string;
    interpretation: string;
    worst_single_removal?: {
      node: string;
      iteration: number;
      impact_score: number;
    };
  };
}

export interface BengaluruDemo {
  location: string;
  center: {
    lat: number;
    lon: number;
  };
  stats: {
    nodes: number;
    edges: number;
  };
  graph: Graph;
  gatekeeper_nodes: GatekeeperNode[];
  resilience: AblationResult;
  description: string;
}

// API Functions

/**
 * Health check
 */
export async function healthCheck(): Promise<{ status: string; message: string }> {
  const response = await fetch(`${API_BASE}/api/health`);
  if (!response.ok) throw new Error('Health check failed');
  return response.json();
}

/**
 * Segment roads from satellite image
 */
export async function segmentRoad(
  file: File,
  threshold: number = 0.5,
  handleOcclusion: boolean = true
): Promise<Blob> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('threshold', threshold.toString());
  formData.append('handle_occlusion', handleOcclusion.toString());
  formData.append('return_format', 'image');

  const response = await fetch(`${API_BASE}/api/segment`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Segmentation failed');
  }

  return response.blob();
}

/**
 * Extract graph from binary mask
 */
export async function extractGraph(maskFile: Blob, simplify: boolean = true): Promise<Graph> {
  const formData = new FormData();
  formData.append('file', new File([maskFile], 'mask.png'));
  formData.append('simplify', simplify.toString());

  const response = await fetch(`${API_BASE}/api/graph/extract`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Graph extraction failed');
  }

  return response.json();
}

/**
 * Heal broken connections in graph
 */
export async function healGraph(graph: Graph, maxGap?: number): Promise<Graph> {
  const response = await fetch(`${API_BASE}/api/graph/heal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      graph,
      max_gap: maxGap,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Graph healing failed');
  }

  return response.json();
}

/**
 * Compute centrality metrics
 */
export async function computeCentrality(
  graph: Graph,
  algorithm: 'betweenness' | 'closeness' | 'eigenvector' = 'betweenness',
  topN: number = 20
): Promise<CentralityResult> {
  const response = await fetch(`${API_BASE}/api/centrality`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      graph,
      algorithm,
      top_n: topN,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Centrality computation failed');
  }

  return response.json();
}

/**
 * Simulate node ablation
 */
export async function simulateAblation(
  graph: Graph,
  nodesToRemove?: string[],
  iterations: number = 10
): Promise<AblationResult> {
  const response = await fetch(`${API_BASE}/api/ablation/simulate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      graph,
      nodes_to_remove: nodesToRemove,
      iterations,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Ablation simulation failed');
  }

  return response.json();
}

/**
 * Calculate shortest path between two nodes
 */
export async function calculateShortestPath(
  graph: Graph,
  source: string,
  target: string
): Promise<{ path: string[]; distance: number }> {
  const response = await fetch(`${API_BASE}/api/graph/shortest_path`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      graph,
      source,
      target,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to calculate shortest path');
  }

  return response.json();
}

/**
 * Run complete pipeline (all phases)
 */
export async function runFullPipeline(
  file: File,
  threshold: number = 0.5,
  maxGap?: number,
  centralityAlgorithm: 'betweenness' | 'closeness' | 'eigenvector' = 'betweenness'
): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('threshold', threshold.toString());
  if (maxGap) formData.append('max_gap', maxGap.toString());
  formData.append('centrality_algorithm', centralityAlgorithm);

  const response = await fetch(`${API_BASE}/api/pipeline/full`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorMsg = `Pipeline execution failed (Status ${response.status})`;
    try {
      const clonedResponse = response.clone();
      const errorJson = await clonedResponse.json();
      errorMsg = errorJson.error || errorMsg;
    } catch (e) {
      // If it's not JSON (like an HTML error page), grab the text
      const errorText = await response.text();
      errorMsg = `${errorMsg}: ${errorText.substring(0, 100)}...`;
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Load OSM data for a location
 */
export async function loadOSMData(
  location: string,
  networkType: 'drive' | 'walk' | 'bike' | 'all' = 'drive'
): Promise<Graph> {
  const params = new URLSearchParams({
    location,
    network_type: networkType,
  });

  const response = await fetch(`${API_BASE}/api/osm/load?${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'OSM data loading failed');
  }

  return response.json();
}

/**
 * Load pre-analyzed Bengaluru demo
 */
export async function loadBengaluruDemo(): Promise<BengaluruDemo> {
  const response = await fetch(`${API_BASE}/api/demo/bengaluru`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Demo loading failed');
  }

  return response.json();
}

// Utility: Convert blob to base64 for display
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Utility: Download file
export function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
