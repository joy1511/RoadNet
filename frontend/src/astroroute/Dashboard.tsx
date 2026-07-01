/**
 * Main Dashboard Component - AstroRoute
 * Interactive Dashboard with multi-step pipeline progress
 */

import React, { useState, useCallback } from 'react';
import {
  ArrowLeft,
  MapPinned,
  Plus,
  RefreshCw,
  CheckCircle2,
  Loader2,
  Circle,
  Upload,
  BrainCircuit,
  GitBranch,
  Activity,
  Radar,
  Network,
  Satellite,
} from 'lucide-react';
import { InteractiveMapPanel } from './InteractiveMapPanel';
import { ImageUpload } from './ImageUpload';
import { ResultsPanel } from './ResultsPanel';
import { GraphStats } from './GraphStats';
import { useRoadAnalysis } from '../hooks/useRoadAnalysis';
import {
  AppState,
  AnalysisConfig,
  DEFAULT_ANALYSIS_CONFIG,
  DEFAULT_MAP_STATE,
  MapState,
} from '../types';

// Pipeline step definitions for the stepper
const PIPELINE_STEPS = [
  {
    id: 'uploading',
    label: 'Upload',
    description: 'Preparing satellite image',
    icon: Upload,
  },
  {
    id: 'segmenting',
    label: 'Segmentation',
    description: 'Extracting road mask via ML model',
    icon: BrainCircuit,
  },
  {
    id: 'extracting-graph',
    label: 'Skeletonization',
    description: 'Converting mask to graph topology',
    icon: GitBranch,
  },
  {
    id: 'healing-graph',
    label: 'Graph Healing',
    description: 'Bridging broken connections via MST',
    icon: Network,
  },
  {
    id: 'computing-centrality',
    label: 'Centrality',
    description: 'Computing betweenness centrality',
    icon: Activity,
  },
  {
    id: 'simulating-ablation',
    label: 'Ablation',
    description: 'Simulating node removal impact',
    icon: Radar,
  },
];

function getStepStatus(stepId: string, currentStep: string | undefined, progress: number) {
  if (!currentStep) return 'pending';
  const currentIndex = PIPELINE_STEPS.findIndex((s) => s.id === currentStep);
  const stepIndex = PIPELINE_STEPS.findIndex((s) => s.id === stepId);

  if (currentStep === 'complete') return 'done';
  if (stepIndex < currentIndex) return 'done';
  if (stepIndex === currentIndex) return progress >= 100 ? 'done' : 'active';
  return 'pending';
}

export const Dashboard: React.FC = () => {
  // App state
  const [appState, setAppState] = useState<AppState>({
    mode: 'upload',
    loading: false,
    error: null,
    currentStep: 'idle',
  });

  // Map state (still needed for reset, but mostly handled inside InteractiveMapPanel now)
  const [mapState, setMapState] = useState<MapState>(DEFAULT_MAP_STATE);

  // Analysis configuration
  const [config] = useState<AnalysisConfig>(DEFAULT_ANALYSIS_CONFIG);

  // Custom hook for analysis workflow
  const {
    uploadedImage,
    segmentationResult,
    graph,
    centralityResult,
    ablationResult,
    shortestPathResult, // Added shortestPathResult
    loading,
    error,
    progress,
    uploadImage,
    runFullAnalysis,
    runAblationSimulation,
    runShortestPath, // Added runShortestPath
    loadDemo,
    reset,
  } = useRoadAnalysis(config);

  // Handle file upload
  const handleFileUpload = useCallback(
    async (file: File) => {
      setAppState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        await uploadImage(file);
        // Remain in 'upload' mode to show the preview and "Run Complete Analysis" button
      } catch (err) {
        setAppState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Upload failed',
        }));
      } finally {
        setAppState((prev) => ({ ...prev, loading: false }));
      }
    },
    [uploadImage]
  );

  // Handle full analysis
  const handleRunAnalysis = useCallback(async () => {
    if (!uploadedImage) return;

    // Switch to analysis mode when analysis actually starts
    setAppState((prev) => ({ ...prev, loading: true, error: null, mode: 'analysis' }));
    try {
      await runFullAnalysis(uploadedImage.file);
    } catch (err) {
      setAppState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Analysis failed',
      }));
    } finally {
      setAppState((prev) => ({ ...prev, loading: false }));
    }
  }, [uploadedImage, runFullAnalysis]);

  // Handle demo load
  const handleLoadDemo = useCallback(async () => {
    setAppState((prev) => ({ ...prev, loading: true, error: null, mode: 'demo' }));
    try {
      const demoData = await loadDemo();
      setMapState((prev) => ({
        ...prev,
        center: [demoData.center.lat, demoData.center.lon],
        zoom: 13,
      }));
    } catch (err) {
      setAppState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Demo loading failed',
      }));
    } finally {
      setAppState((prev) => ({ ...prev, loading: false }));
    }
  }, [loadDemo]);

  // Handle simulation by calling the ablation API or shortest path.
  const handleSimulate = useCallback(
    async (nodeIds: string[]) => {
      if (!graph) return;
      setAppState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        if (nodeIds[0] === 'SHORTEST_PATH') {
          await runShortestPath(graph, nodeIds[1], nodeIds[2]);
        } else {
          await runAblationSimulation(graph, nodeIds);
        }
      } catch (err) {
        setAppState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Simulation failed',
        }));
      } finally {
        setAppState((prev) => ({ ...prev, loading: false }));
      }
    },
    [graph, runAblationSimulation, runShortestPath]
  );

  // Handle reset
  const handleReset = useCallback(() => {
    reset();
    setAppState({
      mode: 'upload',
      loading: false,
      error: null,
      currentStep: 'idle',
    });
    setMapState(DEFAULT_MAP_STATE);
  }, [reset]);

  // Determine what to show
  const showMap = (appState.mode === 'analysis' || appState.mode === 'demo') && graph;
  const showResults = centralityResult && ablationResult;

  return (
    <div className="dashboard min-h-screen" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8">
          {/* Back link */}
          <a href="#" className="back-to-landing mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-400">
            <ArrowLeft size={16} />
            Back to Home
          </a>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                Astro<span style={{ color: '#60a5fa' }}>Route</span>{' '}
                <span style={{ color: '#91a3bb', fontWeight: 600, fontSize: '1.05rem' }}>Dashboard</span>
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Road network criticality analysis and resilience simulation
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleLoadDemo}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-semibold"
                id="load-demo-btn"
              >
                {loading && appState.mode === 'demo' ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="animate-spin w-4 h-4" />
                    Loading...
                  </span>
                ) : (
                  <>
                    <MapPinned size={16} />
                    Load Bengaluru Demo
                  </>
                )}
              </button>
              {appState.mode !== 'upload' && (
                <button
                  onClick={handleReset}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 text-sm font-semibold"
                  id="new-analysis-btn"
                >
                  <Plus size={16} />
                  New Analysis
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Error Display */}
      {(appState.error || error) && (
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 fade-in">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-center gap-2">
              <span>Warning</span>
              <p className="text-red-800">{appState.error || error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Step Pipeline Progress Stepper */}
      {loading && progress && (
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 fade-in">
          <div className="pipeline-stepper">
            <div className="stepper-header">
              <h3>
                <Loader2 className="animate-spin" size={18} />
                Processing Pipeline
              </h3>
              <span className="stepper-pct">{progress.progress}%</span>
            </div>

            {/* Overall progress bar */}
            <div className="stepper-progress-track">
              <div
                className="stepper-progress-fill"
                style={{ width: `${progress.progress}%` }}
              />
            </div>

            {/* Step list */}
            <div className="stepper-steps">
              {PIPELINE_STEPS.map((step, i) => {
                const status = getStepStatus(step.id, progress.step, progress.progress);
                const StepIcon = step.icon;

                return (
                  <div
                    key={step.id}
                    className={`stepper-step status-${status}`}
                  >
                    <div className="step-indicator">
                      {status === 'done' ? (
                        <CheckCircle2 size={18} />
                      ) : status === 'active' ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Circle size={18} />
                      )}
                    </div>
                    <div className="step-icon">
                      <StepIcon size={16} />
                    </div>
                    <div className="step-text">
                      <span className="step-label">{step.label}</span>
                      <span className="step-desc">{step.description}</span>
                    </div>
                    {i < PIPELINE_STEPS.length - 1 && (
                      <div className={`step-connector ${status === 'done' ? 'done' : ''}`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Current status message */}
            <div className="stepper-message">{progress.message}</div>
          </div>
        </div>
      )}

      {/* Loading skeleton when no progress data yet */}
      {loading && !progress && (
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="skeleton-loading h-[600px] rounded-lg" />
            </div>
            <div className="space-y-6">
              <div className="skeleton-loading h-[600px] rounded-lg" />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Upload Mode */}
        {appState.mode === 'upload' && (
          <div className="space-y-6 fade-in max-w-7xl mx-auto">
            <ImageUpload onFileSelect={handleFileUpload} disabled={loading} />

            {uploadedImage && (
              <div className="bg-white rounded-lg shadow p-6 fade-in">
                <h3 className="text-lg font-semibold mb-4">Uploaded Image</h3>
                <img
                  src={uploadedImage.preview}
                  alt="Uploaded satellite"
                  className="w-full max-w-2xl mx-auto rounded-md"
                  style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={handleRunAnalysis}
                    disabled={loading}
                    className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 font-medium text-sm"
                    id="run-analysis-btn"
                  >
                    Run Complete Analysis
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Analysis/Demo Mode Split View */}
        {showMap && (
          <div className="space-y-6 fade-in">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 min-h-[800px]">
              
              {/* Left Panel: Satellite/Original View */}
              <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex flex-col shadow-2xl relative group">
                <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center z-10">
                  <h3 className="text-white font-medium flex items-center gap-2">
                    <MapPinned size={18} className="text-blue-400" />
                    {appState.mode === 'demo' ? 'Bengaluru Satellite View' : 'Original Satellite Image'}
                  </h3>
                </div>
                <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
                  {appState.mode === 'analysis' && uploadedImage ? (
                    <>
                      <img 
                        src={uploadedImage.preview} 
                        alt="Satellite Input" 
                        className="absolute inset-0 w-full h-full object-cover opacity-90"
                      />
                      {segmentationResult?.maskPreview && (
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <img 
                            src={segmentationResult.maskPreview} 
                            alt="Road Mask" 
                            className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-70"
                            style={{ filter: 'hue-rotate(180deg) brightness(2)' }}
                          />
                          <div className="absolute bottom-4 left-4 bg-black/70 text-cyan-400 text-xs px-3 py-1 rounded backdrop-blur border border-white/10">
                            Hover: Extracted Mask Overlay
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    /* Demo Mode: Static Satellite Map Embed */
                    <div className="absolute inset-0 w-full h-full bg-slate-800 flex flex-col items-center justify-center">
                      <img 
                        src="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/13/3820/5835" 
                        alt="Bengaluru Satellite Base" 
                        className="absolute inset-0 w-full h-full object-cover opacity-70"
                        style={{ filter: 'contrast(1.2) saturate(1.1)' }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                         <div className="w-64 h-64 border border-blue-500/30 rounded-full animate-pulse flex items-center justify-center">
                            <div className="w-32 h-32 border border-blue-400/50 rounded-full animate-ping"></div>
                         </div>
                      </div>
                      <div className="z-10 text-center px-4">
                        <Satellite size={48} className="text-blue-400 mx-auto mb-4 opacity-80" />
                        <h4 className="text-xl font-medium text-white mb-2">High-Resolution Satellite Feed</h4>
                        <p className="text-slate-400 max-w-sm text-sm">Real-time Earth observation imagery mapping to the extracted OpenStreetMap graph on the right.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Panel: Interactive Network */}
              <div className="h-full relative shadow-2xl">
                 <InteractiveMapPanel
                    graph={graph}
                    centralityResult={centralityResult}
                    ablationResult={ablationResult}
                    shortestPathResult={shortestPathResult}
                    onSimulate={handleSimulate}
                 />
              </div>
            </div>

            {/* Results Charts (Radar, Donut, etc.) */}
            {showResults && (
              <div className="mt-8 max-w-7xl mx-auto">
                <ResultsPanel
                  centralityResult={centralityResult}
                  ablationResult={ablationResult}
                />
                <div className="mt-6">
                  <GraphStats
                    graph={graph}
                    centralityResult={centralityResult}
                    ablationResult={ablationResult}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-600">
            © 2026 AstroRoute. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
