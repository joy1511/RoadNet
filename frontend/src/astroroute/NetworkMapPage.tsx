import React, { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { InteractiveMapPanel } from './InteractiveMapPanel';
import useRoadAnalysis from '../hooks/useRoadAnalysis';
import { DEFAULT_ANALYSIS_CONFIG } from '../types';

export const NetworkMapPage: React.FC = () => {
  const [loadingDemo, setLoadingDemo] = useState(true);
  
  const {
    graph,
    centralityResult,
    ablationResult,
    shortestPathResult,
    loading,
    error,
    loadDemo,
    runAblationSimulation,
    runShortestPath
  } = useRoadAnalysis(DEFAULT_ANALYSIS_CONFIG);

  useEffect(() => {
    loadDemo().finally(() => setLoadingDemo(false));
  }, [loadDemo]);

  // Handle simulation
  const handleSimulate = async (nodeIds: string[]) => {
    if (!graph) return;
    if (nodeIds[0] === 'SHORTEST_PATH') {
      await runShortestPath(graph, nodeIds[1], nodeIds[2]);
    } else {
      await runAblationSimulation(graph, nodeIds);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="max-w-[1600px] mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <a href="#" className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </a>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">An Example</h1>
              <p className="text-sm text-slate-400 mt-1">
                Interactive Bengaluru Road Network Analysis
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        {loadingDemo || (loading && !graph) ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/50 rounded-xl border border-slate-800">
            <RefreshCw className="animate-spin text-blue-500 mb-4" size={32} />
            <p className="text-slate-400">Loading Bengaluru Demo Data...</p>
          </div>
        ) : error && !graph ? (
          <div className="flex-1 flex items-center justify-center bg-slate-900/50 rounded-xl border border-red-500/20 text-red-400">
            <p>{error}</p>
          </div>
        ) : graph && centralityResult ? (
          <div className="flex-1 min-h-[800px]">
             <InteractiveMapPanel
                graph={graph}
                centralityResult={centralityResult}
                ablationResult={ablationResult}
                shortestPathResult={shortestPathResult}
                onSimulate={handleSimulate}
             />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default NetworkMapPage;
