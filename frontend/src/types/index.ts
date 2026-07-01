/**
 * TypeScript Type Definitions for AstroRoute
 */

// Import types we need locally
import type { AblationResult as _AblationResult } from '../api/client';

// Re-export API types
export type {
  Node,
  Edge,
  Graph,
  GatekeeperNode,
  CentralityResult,
  AblationIteration,
  NetworkMetrics,
  ImpactMetrics,
  AblationResult,
  BengaluruDemo,
} from '../api/client';

// Local alias for use in interfaces below
type AblationResult = _AblationResult;

// UI State Types

export interface AppState {
  mode: 'upload' | 'demo' | 'analysis';
  loading: boolean;
  error: string | null;
  currentStep: AnalysisStep;
}

export type AnalysisStep =
  | 'idle'
  | 'uploading'
  | 'segmenting'
  | 'extracting-graph'
  | 'healing-graph'
  | 'computing-centrality'
  | 'simulating-ablation'
  | 'complete';

export interface AnalysisProgress {
  step: AnalysisStep;
  progress: number; // 0-100
  message: string;
}

export interface UploadedImage {
  file: File;
  preview: string; // Base64 or URL
  dimensions: {
    width: number;
    height: number;
  };
}

export interface SegmentationResult {
  maskBlob: Blob;
  maskPreview: string;
  stats: {
    total_pixels: number;
    road_pixels: number;
    road_percentage: number;
  };
}

export interface MapState {
  center: [number, number]; // [lat, lon]
  zoom: number;
  bounds?: [[number, number], [number, number]];
  selectedNode: string | null;
  highlightedEdges: string[];
  showHeatmap: boolean;
  showLabels: boolean;
}

export interface SimulationState {
  active: boolean;
  removedNodes: string[];
  currentIteration: number;
  results: AblationResult | null;
  showImpact: boolean;
}

// Map Marker Types

export interface NodeMarker {
  id: string;
  position: [number, number]; // [lat, lon]
  type: 'normal' | 'gatekeeper' | 'removed';
  color: string;
  size: number;
  label?: string;
  data: {
    centrality: number;
    criticality_level: string;
    degree: number;
  };
}

export interface EdgePolyline {
  id: string;
  positions: [number, number][]; // Array of [lat, lon]
  color: string;
  weight: number;
  healed: boolean;
  dashed?: boolean;
}

// Chart Data Types

export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface ResilienceChartData {
  iteration: number;
  connectivity: number;
  efficiency: number;
  components: number;
}

// Color Schemes

export const CriticalityColors = {
  critical: '#ef4444', // Red
  high: '#f97316', // Orange
  medium: '#f59e0b', // Amber
  low: '#10b981', // Green
  normal: '#6b7280', // Gray
  removed: '#1f2937', // Dark gray
} as const;

export const HeatmapColors = {
  0: '#10b981', // Green - low
  0.25: '#f59e0b', // Yellow - medium
  0.5: '#f97316', // Orange - high
  0.75: '#ef4444', // Red - very high
  1: '#991b1b', // Dark red - critical
} as const;

// Utility Types

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

// Filter Types

export interface NodeFilter {
  minCentrality?: number;
  maxCentrality?: number;
  criticalityLevels?: string[];
  minDegree?: number;
  maxDegree?: number;
}

export interface GraphFilter {
  showHealed: boolean;
  showOriginal: boolean;
  minEdgeWeight?: number;
}

// Export Options

export interface ExportOptions {
  format: 'json' | 'csv' | 'png' | 'svg';
  includeMetadata: boolean;
  filename: string;
}

// Settings

export interface AppSettings {
  mapProvider: 'osm' | 'mapbox';
  mapboxToken?: string;
  defaultZoom: number;
  animationSpeed: number;
  showTutorial: boolean;
  theme: 'light' | 'dark' | 'system';
}

// API Response Wrappers

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface APIError {
  error: string;
  details?: any;
  timestamp?: string;
}

// Event Types

export interface NodeClickEvent {
  nodeId: string;
  node: NodeMarker;
  position: [number, number];
  event: MouseEvent;
}

export interface EdgeClickEvent {
  edgeId: string;
  edge: EdgePolyline;
  position: [number, number];
  event: MouseEvent;
}

// Analysis Configuration

export interface AnalysisConfig {
  segmentation: {
    threshold: number;
    handleOcclusion: boolean;
  };
  graph: {
    simplify: boolean;
    maxGap: number;
  };
  centrality: {
    algorithm: 'betweenness' | 'closeness' | 'eigenvector';
    topN: number;
  };
  ablation: {
    iterations: number;
    customNodes?: string[];
  };
}

// Default Values

export const DEFAULT_ANALYSIS_CONFIG: AnalysisConfig = {
  segmentation: {
    threshold: 0.5,
    handleOcclusion: true,
  },
  graph: {
    simplify: true,
    maxGap: 50,
  },
  centrality: {
    algorithm: 'betweenness',
    topN: 20,
  },
  ablation: {
    iterations: 10,
  },
};

export const DEFAULT_MAP_STATE: MapState = {
  center: [12.9716, 77.5946], // Bengaluru
  zoom: 13,
  selectedNode: null,
  highlightedEdges: [],
  showHeatmap: true,
  showLabels: false,
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  mapProvider: 'osm',
  defaultZoom: 13,
  animationSpeed: 1000,
  showTutorial: true,
  theme: 'system',
};
