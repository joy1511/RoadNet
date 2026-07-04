/**
 * Custom Hook - useRoadAnalysis
 * Manages the complete road analysis workflow
 */

import { useState, useCallback } from 'react';
import {
  segmentRoad,
  extractGraph,
  healGraph,
  computeCentrality,
  simulateAblation,
  runFullPipeline,
  loadBengaluruDemo,
  blobToBase64,
} from '../api/client';
import {
  AnalysisConfig,
  UploadedImage,
  SegmentationResult,
  AnalysisProgress,
  Graph,
  CentralityResult,
  AblationResult,
  BengaluruDemo,
} from '../types';

export function useRoadAnalysis(config: AnalysisConfig) {
  // State
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [segmentationResult, setSegmentationResult] = useState<SegmentationResult | null>(null);
  const [graph, setGraph] = useState<Graph | null>(null);
  const [centralityResult, setCentralityResult] = useState<CentralityResult | null>(null);
  const [ablationResult, setAblationResult] = useState<AblationResult | null>(null);
  const [shortestPathResult, setShortestPathResult] = useState<{ path: string[]; distance: number } | null>(null);
  const [demoData, setDemoData] = useState<BengaluruDemo | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);

  // Upload image
  const uploadImage = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    setProgress({
      step: 'uploading',
      progress: 0,
      message: 'Processing image...',
    });

    try {
      // Create preview
      const preview = await blobToBase64(file);

      // Get dimensions
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = preview;
      });

      setUploadedImage({
        file,
        preview,
        dimensions: {
          width: img.width,
          height: img.height,
        },
      });

      setProgress({
        step: 'uploading',
        progress: 100,
        message: 'Image uploaded successfully',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Run segmentation only
  const runSegmentation = useCallback(
    async (file: File) => {
      setLoading(true);
      setError(null);
      setProgress({
        step: 'segmenting',
        progress: 30,
        message: 'Segmenting roads from image...',
      });

      try {
        const maskBlob = await segmentRoad(
          file,
          config.segmentation.threshold,
          config.segmentation.handleOcclusion
        );

        const maskPreview = await blobToBase64(maskBlob);

        setSegmentationResult({
          maskBlob,
          maskPreview,
          stats: {
            total_pixels: 0, // Would need to calculate from image
            road_pixels: 0,
            road_percentage: 0,
          },
        });

        setProgress({
          step: 'segmenting',
          progress: 100,
          message: 'Segmentation complete',
        });

        return maskBlob;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Segmentation failed');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [config.segmentation]
  );

  // Run graph extraction
  const runGraphExtraction = useCallback(
    async (maskBlob: Blob) => {
      setLoading(true);
      setError(null);
      setProgress({
        step: 'extracting-graph',
        progress: 50,
        message: 'Extracting graph structure...',
      });

      try {
        let extractedGraph = await extractGraph(maskBlob, config.graph.simplify);

        setProgress({
          step: 'healing-graph',
          progress: 65,
          message: 'Healing broken connections...',
        });

        // Heal graph
        extractedGraph = await healGraph(extractedGraph, config.graph.maxGap);

        setGraph(extractedGraph);

        setProgress({
          step: 'extracting-graph',
          progress: 100,
          message: 'Graph extraction complete',
        });

        return extractedGraph;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Graph extraction failed');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [config.graph]
  );

  // Run centrality analysis
  const runCentralityAnalysis = useCallback(
    async (inputGraph: Graph) => {
      setLoading(true);
      setError(null);
      setProgress({
        step: 'computing-centrality',
        progress: 80,
        message: 'Computing centrality metrics...',
      });

      try {
        const result = await computeCentrality(
          inputGraph,
          config.centrality.algorithm,
          config.centrality.topN
        );

        setCentralityResult(result);

        setProgress({
          step: 'computing-centrality',
          progress: 100,
          message: 'Centrality analysis complete',
        });

        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Centrality computation failed');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [config.centrality]
  );

  // Run ablation simulation
  const runAblationSimulation = useCallback(
    async (inputGraph: Graph, nodesToRemove?: string[]) => {
      setLoading(true);
      setError(null);
      setProgress({
        step: 'simulating-ablation',
        progress: 90,
        message: 'Simulating node removal...',
      });

      try {
        const result = await simulateAblation(
          inputGraph,
          nodesToRemove,
          config.ablation.iterations
        );

        setAblationResult(result);

        setProgress({
          step: 'simulating-ablation',
          progress: 100,
          message: 'Simulation complete',
        });

        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ablation simulation failed');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [config.ablation]
  );

  // Run shortest path
  const runShortestPath = useCallback(
    async (inputGraph: Graph, source: string, target: string) => {
      setLoading(true);
      setError(null);
      // Fix: was incorrectly using 'simulating-ablation' step for shortest path
      setProgress({
        step: 'complete',
        progress: 90,
        message: 'Calculating shortest path...',
      });

      try {
        const { calculateShortestPath } = await import('../api/client');
        const result = await calculateShortestPath(inputGraph, source, target);
        
        setShortestPathResult(result);

        setProgress({
          step: 'complete',
          progress: 100,
          message: 'Path calculation complete',
        });

        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Path calculation failed');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Run full analysis pipeline
  // Fix: Call raw API functions directly to avoid each sub-step calling setLoading(false)
  // which caused the spinner to flicker off between pipeline steps.
  const runFullAnalysis = useCallback(
    async (file: File) => {
      setLoading(true);
      setError(null);
      setProgress({
        step: 'uploading',
        progress: 0,
        message: 'Starting analysis pipeline...',
      });

      try {
        // Step 1: Segmentation
        setProgress({ step: 'segmenting', progress: 20, message: 'Segmenting roads...' });
        const maskBlob = await segmentRoad(
          file,
          config.segmentation.threshold,
          config.segmentation.handleOcclusion
        );
        const maskPreview = await blobToBase64(maskBlob);
        setSegmentationResult({
          maskBlob,
          maskPreview,
          stats: { total_pixels: 0, road_pixels: 0, road_percentage: 0 },
        });

        // Step 2: Graph extraction
        setProgress({ step: 'extracting-graph', progress: 40, message: 'Extracting graph...' });
        let extractedGraph = await extractGraph(maskBlob, config.graph.simplify);

        setProgress({ step: 'healing-graph', progress: 55, message: 'Healing broken connections...' });
        extractedGraph = await healGraph(extractedGraph, config.graph.maxGap);
        setGraph(extractedGraph);

        // Step 3: Centrality
        setProgress({ step: 'computing-centrality', progress: 70, message: 'Computing centrality...' });
        const centralityRes = await computeCentrality(
          extractedGraph,
          config.centrality.algorithm,
          config.centrality.topN
        );
        setCentralityResult(centralityRes);

        // Step 4: Ablation
        setProgress({ step: 'simulating-ablation', progress: 90, message: 'Running ablation simulation...' });
        const ablationRes = await simulateAblation(
          extractedGraph,
          undefined,
          config.ablation.iterations
        );
        setAblationResult(ablationRes);

        setProgress({ step: 'complete', progress: 100, message: 'Analysis complete!' });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Analysis pipeline failed');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [config]
  );

  // Load Bengaluru demo
  const loadDemo = useCallback(async () => {
    setLoading(true);
    setError(null);
    setProgress({
      step: 'uploading',
      progress: 50,
      message: 'Loading Bengaluru demo...',
    });

    try {
      const demo = await loadBengaluruDemo();

      setDemoData(demo);
      setGraph(demo.graph);
      setCentralityResult({
        graph: demo.graph,
        gatekeeper_nodes: demo.gatekeeper_nodes,
        stats: {
          mean: 0,
          median: 0,
          max: 0,
          percentile_95: 0,
        },
        algorithm: 'betweenness',
      });
      setAblationResult(demo.resilience);

      setProgress({
        step: 'complete',
        progress: 100,
        message: 'Demo loaded successfully',
      });

      return demo;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo loading failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset all state
  const reset = useCallback(() => {
    setUploadedImage(null);
    setSegmentationResult(null);
    setGraph(null);
    setCentralityResult(null);
    setAblationResult(null);
    setShortestPathResult(null);
    setDemoData(null);
    setLoading(false);
    setError(null);
    setProgress(null);
  }, []);

  return {
    // State
    uploadedImage,
    segmentationResult,
    graph,
    centralityResult,
    ablationResult,
    shortestPathResult,
    demoData,
    loading,
    error,
    progress,

    // Actions
    uploadImage,
    runSegmentation,
    runGraphExtraction,
    runCentralityAnalysis,
    runAblationSimulation,
    runShortestPath,
    runFullAnalysis,
    loadDemo,
    reset,
  };
}

export default useRoadAnalysis;
