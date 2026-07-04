/**
 * SimulationPanel Component
 * Controls for node removal simulation
 */

import React, { useState, useCallback } from 'react';
import { Graph, CentralityResult } from '../types';

interface SimulationPanelProps {
  graph: Graph;
  centralityResult: CentralityResult;
  selectedNode: string | undefined;  // Fix: was 'string | null', parent passes 'string | undefined'
  onSimulate: (nodeIds: string[]) => void;
}

export const SimulationPanel: React.FC<SimulationPanelProps> = ({
  graph,
  centralityResult,
  selectedNode,
  onSimulate,
}) => {
  const [simulationMode, setSimulationMode] = useState<'single' | 'top-n' | 'custom' | 'shortest-path'>(
    'single'
  );
  const [topN, setTopN] = useState(5);
  const [customNodes, setCustomNodes] = useState<string[]>([]);
  
  // Shortest path state
  const [spSource, setSpSource] = useState<string | null>(null);
  const [spTarget, setSpTarget] = useState<string | null>(null);

  // Handle simulation
  const handleRunSimulation = useCallback(() => {
    let nodesToRemove: string[] = [];

    switch (simulationMode) {
      case 'single':
        if (selectedNode) {
          nodesToRemove = [selectedNode];
        }
        break;

      case 'top-n':
        nodesToRemove = centralityResult.gatekeeper_nodes
          .slice(0, topN)
          .map((gn) => gn.node_id);
        break;

      case 'custom':
        nodesToRemove = customNodes;
        break;
        
      case 'shortest-path':
        if (spSource && spTarget) {
          // Special signal array for shortest path
          onSimulate(['SHORTEST_PATH', spSource, spTarget]);
          return;
        }
        break;
    }

    if (nodesToRemove.length > 0) {
      onSimulate(nodesToRemove);
    }
  }, [simulationMode, selectedNode, topN, customNodes, spSource, spTarget, centralityResult, onSimulate]);

  // Get selected node info
  const selectedNodeInfo = selectedNode
    ? centralityResult.gatekeeper_nodes.find((gn) => gn.node_id === selectedNode) ||
      centralityResult.graph.nodes.find((n) => n.id === selectedNode)
    : null;

  return (
    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 shadow-lg">
      <h3 className="text-lg font-semibold mb-4 text-white">Node Removal Simulation</h3>

      {/* Simulation Mode Selection */}
      <div className="space-y-4 mb-6">
        {/* Single Node */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="radio"
            name="simulation-mode"
            checked={simulationMode === 'single'}
            onChange={() => setSimulationMode('single')}
            className="mt-1 border-slate-600 bg-slate-900 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-slate-900"
          />
          <div className="flex-1">
            <div className="font-medium text-sm text-slate-200 group-hover:text-white transition-colors">Single Node</div>
            <div className="text-xs text-slate-400">Remove the selected node</div>
            {selectedNode && selectedNodeInfo && (
              <div className="mt-1.5 text-xs text-blue-400 font-medium">
                Selected: Node {selectedNode}
                {'centrality' in selectedNodeInfo &&
                  ` (${selectedNodeInfo.centrality?.toFixed(4)})`}
              </div>
            )}
          </div>
        </label>

        {/* Top N Critical Nodes */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="radio"
            name="simulation-mode"
            checked={simulationMode === 'top-n'}
            onChange={() => setSimulationMode('top-n')}
            className="mt-1 border-slate-600 bg-slate-900 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-slate-900"
          />
          <div className="flex-1">
            <div className="font-medium text-sm text-slate-200 group-hover:text-white transition-colors">Top N Critical Nodes</div>
            <div className="text-xs text-slate-400">Remove most critical nodes</div>
            {simulationMode === 'top-n' && (
              <div className="mt-3 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={topN}
                  onChange={(e) => setTopN(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <div className="text-xs text-slate-400 mt-2 font-medium">Remove top <span className="text-blue-400">{topN}</span> nodes</div>
              </div>
            )}
          </div>
        </label>

        {/* Custom Selection */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="radio"
            name="simulation-mode"
            checked={simulationMode === 'custom'}
            onChange={() => setSimulationMode('custom')}
            className="mt-1 border-slate-600 bg-slate-900 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-slate-900"
          />
          <div className="flex-1">
            <div className="font-medium text-sm text-slate-200 group-hover:text-white transition-colors">Custom Selection</div>
            <div className="text-xs text-slate-400">Choose specific nodes</div>
            {simulationMode === 'custom' && (
              <div className="mt-2">
                <input
                  type="text"
                  placeholder="Enter node IDs (comma-separated)"
                  value={customNodes.join(', ')}
                  onChange={(e) =>
                    setCustomNodes(
                      e.target.value.split(',').map((id) => id.trim()).filter(Boolean)
                    )
                  }
                  className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            )}
          </div>
        </label>

        {/* Shortest Path */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="radio"
            name="simulation-mode"
            checked={simulationMode === 'shortest-path'}
            onChange={() => setSimulationMode('shortest-path')}
            className="mt-1 border-slate-600 bg-slate-900 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-slate-900"
          />
          <div className="flex-1">
            <div className="font-medium text-sm text-slate-200 group-hover:text-white transition-colors">Shortest Path</div>
            <div className="text-xs text-slate-400">Find route between two nodes</div>
            {simulationMode === 'shortest-path' && (
              <div className="mt-2 space-y-2">
                <input
                  type="text"
                  placeholder="Source Node ID"
                  value={spSource || ''}
                  onChange={(e) => setSpSource(e.target.value.trim() || null)}
                  className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                />
                <input
                  type="text"
                  placeholder="Target Node ID"
                  value={spTarget || ''}
                  onChange={(e) => setSpTarget(e.target.value.trim() || null)}
                  className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            )}
          </div>
        </label>
      </div>

      {/* Run Button */}
      <button
        onClick={handleRunSimulation}
        disabled={
          (simulationMode === 'single' && !selectedNode) ||
          (simulationMode === 'custom' && customNodes.length === 0) ||
          (simulationMode === 'shortest-path' && (!spSource || !spTarget))
        }
        className="w-full px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg hover:from-red-500 hover:to-rose-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-red-900/20 transition-all border border-red-500/20"
      >
        Run Simulation
      </button>

      {/* Info */}
      <div className="mt-5 p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-3">
        <div className="text-xs text-blue-300 leading-relaxed">
          <strong className="text-blue-400">Tip:</strong> Click on nodes in the map to select them for single-node
          simulation. The simulation shows how network connectivity changes when critical nodes
          are removed.
        </div>
      </div>

      {/* Top Critical Nodes List */}
      <div className="mt-6">
        <h4 className="text-sm font-semibold mb-3 text-slate-300">Top 10 Critical Nodes</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
          {centralityResult.gatekeeper_nodes.slice(0, 10).map((gn) => (
            <div
              key={gn.node_id}
              className={`flex items-center justify-between p-2.5 rounded-lg text-xs border transition-colors ${
                selectedNode === gn.node_id 
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' 
                  : 'bg-slate-900/60 border-slate-700/50 text-slate-300 hover:border-slate-600'
              }`}
            >
              <div>
                <div className="font-medium text-slate-200">
                  #{gn.rank} Node {gn.node_id}
                </div>
                <div className="text-slate-400 mt-0.5">
                  <span className={
                    gn.criticality_level === 'critical' ? 'text-red-400' :
                    gn.criticality_level === 'high' ? 'text-orange-400' :
                    gn.criticality_level === 'medium' ? 'text-yellow-400' : 'text-slate-400'
                  }>{gn.criticality_level}</span> • Degree: {gn.degree}
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono font-semibold text-slate-200 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                  {gn.centrality_score.toFixed(4)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SimulationPanel;
