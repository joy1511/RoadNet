/**
 * CriticalityHeatmap Component
 * Overlay showing criticality distribution as heatmap
 */

import React, { useMemo } from 'react';
import { Node } from '../types';

interface CriticalityHeatmapProps {
  nodes: Node[];
  visible: boolean;
}

export const CriticalityHeatmap: React.FC<CriticalityHeatmapProps> = ({ nodes, visible }) => {
  // Calculate heatmap data
  const heatmapData = useMemo(() => {
    if (!visible) return null;

    const criticalNodes = nodes.filter((n) => n.centrality && n.centrality > 0.01);

    return {
      critical: criticalNodes.filter((n) => n.centrality! > 0.1).length,
      high: criticalNodes.filter((n) => n.centrality! > 0.05 && n.centrality! <= 0.1).length,
      medium: criticalNodes.filter((n) => n.centrality! > 0.01 && n.centrality! <= 0.05).length,
      low: nodes.filter((n) => !n.centrality || n.centrality <= 0.01).length,
      maxCentrality: Math.max(...nodes.map((n) => n.centrality || 0)),
      avgCentrality:
        nodes.reduce((sum, n) => sum + (n.centrality || 0), 0) / nodes.length,
    };
  }, [nodes, visible]);

  if (!visible || !heatmapData) return null;

  return (
    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 z-[1000] max-w-xs">
      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <span className="w-3 h-3 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full" />
        Criticality Distribution
      </h4>

      <div className="space-y-2">
        {/* Critical */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-gray-700">Critical</span>
          </div>
          <span className="font-semibold text-red-600">{heatmapData.critical}</span>
        </div>

        {/* High */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-gray-700">High</span>
          </div>
          <span className="font-semibold text-orange-600">{heatmapData.high}</span>
        </div>

        {/* Medium */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-gray-700">Medium</span>
          </div>
          <span className="font-semibold text-yellow-600">{heatmapData.medium}</span>
        </div>

        {/* Low */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-gray-700">Low</span>
          </div>
          <span className="font-semibold text-green-600">{heatmapData.low}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200 space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-600">Max Centrality:</span>
          <span className="font-mono font-semibold">
            {heatmapData.maxCentrality.toFixed(4)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Avg Centrality:</span>
          <span className="font-mono font-semibold">
            {heatmapData.avgCentrality.toFixed(4)}
          </span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-600 leading-relaxed">
          Critical nodes are key junctions whose failure would significantly impact network
          connectivity.
        </p>
      </div>
    </div>
  );
};

export default CriticalityHeatmap;
