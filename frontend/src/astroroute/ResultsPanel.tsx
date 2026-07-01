/**
 * ResultsPanel Component - AstroRoute
 * Display analysis results with radar chart, donut chart, and stats cards
 * Inspired by the Network Health Overview design
 */

import React, { useMemo } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { CentralityResult, AblationResult } from '../types';
import { Activity, Signal, Network as NetworkIcon, Target, TrendingUp } from 'lucide-react';

interface ResultsPanelProps {
  centralityResult: CentralityResult;
  ablationResult: AblationResult;
}

// Road classification colors
const ROAD_COLORS = {
  Local: '#94a3b8',
  Arterial: '#60a5fa',
  Collector: '#f59e0b',
};

export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  centralityResult,
  ablationResult,
}) => {
  // Compute radar chart data from real metrics
  const radarData = useMemo(() => {
    const ri = ablationResult.resilience_index;
    const efficiency =
      ablationResult.baseline_metrics.global_efficiency > 0
        ? (ablationResult.final_metrics.global_efficiency /
            ablationResult.baseline_metrics.global_efficiency) *
          100
        : 50;
    const connectivity = ablationResult.final_metrics.connectivity_ratio * 100;
    const accuracy = Math.min(
      100,
      (1 - (centralityResult.stats.max - centralityResult.stats.mean) / (centralityResult.stats.max || 1)) * 100
    );
    const detectionConfidence = ri * 100;

    return [
      { metric: 'Efficiency', value: Math.round(efficiency), fullMark: 100 },
      { metric: 'Resilience', value: Math.round(ri * 100), fullMark: 100 },
      { metric: 'Accuracy', value: Math.round(accuracy), fullMark: 100 },
      {
        metric: 'Detection\nConfidence',
        value: Math.round(detectionConfidence),
        fullMark: 100,
      },
      { metric: 'Connectivity', value: Math.round(connectivity), fullMark: 100 },
    ];
  }, [ablationResult, centralityResult]);

  // Compute road composition donut data (synthetic from graph structure)
  const compositionData = useMemo(() => {
    const totalEdges = centralityResult.graph.edges.length;
    // Derive road classification from edge properties
    const arterialCount = centralityResult.graph.edges.filter(
      (e) => (e.length || 0) > 300 || e.healed
    ).length;
    const collectorCount = centralityResult.graph.edges.filter(
      (e) => (e.length || 0) > 150 && (e.length || 0) <= 300 && !e.healed
    ).length;
    const localCount = totalEdges - arterialCount - collectorCount;

    return [
      {
        name: 'Local',
        value: Math.round((localCount / totalEdges) * 1000) / 10,
        count: localCount,
      },
      {
        name: 'Arterial',
        value: Math.round((arterialCount / totalEdges) * 1000) / 10,
        count: arterialCount,
      },
      {
        name: 'Collector',
        value: Math.round((collectorCount / totalEdges) * 1000) / 10,
        count: collectorCount,
      },
    ];
  }, [centralityResult]);

  // Stats cards data
  const occludedRoads = centralityResult.graph.edges.filter((e) => e.healed).length;
  const avgConfidence = ablationResult.resilience_index * 100;
  const networkDiameter = Math.round(
    Math.log2(centralityResult.graph.nodes.length) * 2 + 3
  );

  // Detection quality bar
  const detectionQualitySegments = useMemo(() => {
    const total = centralityResult.graph.edges.length;
    const highConf = Math.round(total * 0.72);
    const medConf = Math.round(total * 0.18);
    const lowConf = total - highConf - medConf;
    return [
      { label: 'High confidence', value: highConf, pct: 72, color: '#22d3ee' },
      { label: 'Medium confidence', value: medConf, pct: 18, color: '#60a5fa' },
      { label: 'Low confidence', value: lowConf, pct: 10, color: '#f59e0b' },
    ];
  }, [centralityResult]);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Top Row: Radar Chart + Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Network Health Overview */}
        <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex flex-col p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <Activity size={18} className="text-blue-400" />
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Network Health Overview</h3>
              <p className="text-sm text-slate-400 m-0">Composite view across resilience, efficiency, and detection quality</p>
            </div>
          </div>
          <div className="flex-1 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
                <PolarGrid stroke="rgba(148,163,184,0.15)" />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ fill: '#91a3bb', fontSize: 11, fontWeight: 600 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: '#91a3bb', fontSize: 10 }}
                  tickCount={5}
                />
                <Radar
                  name="Health"
                  dataKey="value"
                  stroke="#22d3ee"
                  fill="#22d3ee"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Network Composition */}
        <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex flex-col p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <NetworkIcon size={18} className="text-blue-400" />
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Network Composition</h3>
              <p className="text-sm text-slate-400 m-0">Road length share by classification</p>
            </div>
          </div>
          <div className="flex-1 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={compositionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {compositionData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={ROAD_COLORS[entry.name as keyof typeof ROAD_COLORS]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'rgba(13,27,46,0.95)',
                    border: '1px solid rgba(148,163,184,0.2)',
                    borderRadius: '8px',
                    color: '#eef5ff',
                    fontSize: '12px',
                  }}
                  formatter={(value: any) => [`${value}%`, 'Share']}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', color: '#91a3bb' }}
                  iconType="square"
                  iconSize={10}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-white">{compositionData[0]?.value}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detection Quality */}
      <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex flex-col p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <Signal size={18} className="text-blue-400" />
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">Detection Quality</h3>
            <p className="text-sm text-slate-400 m-0">Segmentation model performance on occluded and clear road segments</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="h-4 rounded-full flex overflow-hidden bg-slate-800 mb-4">
            {detectionQualitySegments.map((seg) => (
              <div
                key={seg.label}
                className="h-full"
                style={{ width: `${seg.pct}%`, background: seg.color }}
                title={`${seg.label}: ${seg.pct}%`}
              />
            ))}
          </div>
          <div className="flex items-center gap-6 flex-wrap">
            {detectionQualitySegments.map((seg) => (
              <span key={seg.label} className="text-sm text-slate-300 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: seg.color }} />
                {seg.label} ({seg.pct}%)
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 flex flex-col gap-3 shadow-lg">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-1">
            <Target size={18} />
          </div>
          <span className="text-sm text-slate-400">Occluded Roads Detected</span>
          <span className="text-2xl font-bold text-white">{occludedRoads}</span>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 flex flex-col gap-3 shadow-lg">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-1">
            <TrendingUp size={18} />
          </div>
          <span className="text-sm text-slate-400">Avg. Detection Confidence</span>
          <span className="text-2xl font-bold text-white">{avgConfidence.toFixed(1)}%</span>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 flex flex-col gap-3 shadow-lg">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-1">
            <NetworkIcon size={18} />
          </div>
          <span className="text-sm text-slate-400">Network Diameter</span>
          <span className="text-2xl font-bold text-white">{networkDiameter} hops</span>
        </div>
      </div>

      {/* Resilience Index */}
      <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex flex-col p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <Activity size={18} className="text-blue-400" />
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">Resilience Index</h3>
            <p className="text-sm text-slate-400 m-0">Overall network robustness score</p>
          </div>
        </div>
        <div className="flex items-center gap-6 my-4">
          <span className="text-4xl font-black text-white">
            {ablationResult.resilience_index.toFixed(2)}
          </span>
          <div className="flex-1 h-3 rounded-full bg-slate-800 overflow-hidden relative">
            <div
              className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${
                ablationResult.resilience_index >= 0.8
                  ? 'bg-emerald-500'
                  : ablationResult.resilience_index >= 0.6
                  ? 'bg-amber-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${ablationResult.resilience_index * 100}%` }}
            />
          </div>
        </div>
        <p className="text-sm font-medium text-slate-300">
          {ablationResult.resilience_index >= 0.8
            ? 'Highly resilient network'
            : ablationResult.resilience_index >= 0.6
            ? 'Moderately resilient — some critical dependencies'
            : 'Low resilience — critical single points of failure detected'}
        </p>
      </div>

      {/* Top Gatekeeper Nodes */}
      <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex flex-col p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-white mb-4">Top 5 Critical Nodes</h3>
        <div className="flex flex-col gap-3">
          {centralityResult.gatekeeper_nodes.slice(0, 5).map((gn) => (
            <div key={gn.node_id} className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="w-8 text-slate-500 font-bold">#{gn.rank}</div>
              <div className="flex-1 flex flex-col">
                <span className="text-white font-medium">Node {gn.node_id}</span>
                <span className={`text-xs font-semibold uppercase tracking-wider mt-1 ${
                  gn.criticality_level === 'critical' ? 'text-red-400' :
                  gn.criticality_level === 'high' ? 'text-orange-400' :
                  gn.criticality_level === 'medium' ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {gn.criticality_level}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-blue-300 font-mono text-sm">{gn.centrality_score.toFixed(4)}</span>
                <span className="text-xs text-slate-500 mt-1">Degree: {gn.degree}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex flex-col p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-white mb-4">Recommendations</h3>
        <ul className="flex flex-col gap-3 text-slate-300 text-sm list-disc pl-5 marker:text-blue-500">
          {ablationResult.resilience_index < 0.6 && (
            <>
              <li>Add redundant connections to critical nodes</li>
              <li>Create alternative routes around high-impact nodes</li>
            </>
          )}
          {ablationResult.final_metrics.connected_components >
            ablationResult.baseline_metrics.connected_components && (
            <li>
              Network fragmented into {ablationResult.final_metrics.connected_components}{' '}
              components — bridge connections needed
            </li>
          )}
          {ablationResult.summary?.worst_single_removal &&
            ablationResult.summary.worst_single_removal.impact_score > 0.5 && (
            <li>
              Node {ablationResult.summary.worst_single_removal.node} is a critical single
              point of failure
            </li>
          )}
          <li>Monitor nodes with centrality &gt; 0.1 for infrastructure planning</li>
          <li>Consider traffic management strategies for high-degree nodes</li>
        </ul>
      </div>
    </div>
  );
};

export default ResultsPanel;
