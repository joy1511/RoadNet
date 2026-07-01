/**
 * Custom Hook - useMapControls
 * Manages map state and interactions
 */

import { useState, useCallback } from 'react';
import { MapState, DEFAULT_MAP_STATE } from '../types';

export function useMapControls(initialState: MapState = DEFAULT_MAP_STATE) {
  const [mapState, setMapState] = useState<MapState>(initialState);

  // Set center
  const setCenter = useCallback((center: [number, number]) => {
    setMapState((prev) => ({ ...prev, center }));
  }, []);

  // Set zoom
  const setZoom = useCallback((zoom: number) => {
    setMapState((prev) => ({ ...prev, zoom }));
  }, []);

  // Select node
  const selectNode = useCallback((nodeId: string | null) => {
    setMapState((prev) => ({ ...prev, selectedNode: nodeId }));
  }, []);

  // Highlight edges
  const highlightEdges = useCallback((edgeIds: string[]) => {
    setMapState((prev) => ({ ...prev, highlightedEdges: edgeIds }));
  }, []);

  // Toggle heatmap
  const toggleHeatmap = useCallback(() => {
    setMapState((prev) => ({ ...prev, showHeatmap: !prev.showHeatmap }));
  }, []);

  // Toggle labels
  const toggleLabels = useCallback(() => {
    setMapState((prev) => ({ ...prev, showLabels: !prev.showLabels }));
  }, []);

  // Set bounds
  const setBounds = useCallback((bounds: [[number, number], [number, number]]) => {
    setMapState((prev) => ({ ...prev, bounds }));
  }, []);

  // Reset map state
  const reset = useCallback(() => {
    setMapState(initialState);
  }, [initialState]);

  // Pan to node
  const panToNode = useCallback((lat: number, lon: number, zoom?: number) => {
    setMapState((prev) => ({
      ...prev,
      center: [lat, lon],
      zoom: zoom || prev.zoom,
    }));
  }, []);

  return {
    mapState,
    setCenter,
    setZoom,
    selectNode,
    highlightEdges,
    toggleHeatmap,
    toggleLabels,
    setBounds,
    panToNode,
    reset,
  };
}

export default useMapControls;
