/**
 * GraphStats Component - AstroRoute
 * Display network statistics and metrics in a dark glassmorphism theme
 */

import React from 'react';
import { Graph, CentralityResult, AblationResult } from '../types';
import { Network, GitBranch, Activity, Navigation } from 'lucide-react';

interface GraphStatsProps {
  graph: Graph;
  centralityResult?: CentralityResult | null;
  ablationResult?: AblationResult | null;
}

export const GraphStats: React.FC<GraphStatsProps> = ({
  graph,
  centralityResult,
  ablationResult,
}) => {
  const stats = graph.metadata || {
    node_count: graph.nodes.length,
    edge_count: graph.edges.length,
    is_connected: true,
  };

  // Calculate additional stats
  const healedEdges = graph.edges.filter((e) => e.healed).length;
  const avgDegree = stats.node_count > 0 
    ? (stats.edge_count * 2) / stats.node_count 
    : 0;

  return (
    <div className="rp-card" style={{ padding: '1.25rem' }}>
      <div className="rp-card-header" style={{ marginBottom: '1.25rem' }}>
        <Network size={18} className="rp-accent" />
        <div>
          <h3>Network Statistics</h3>
          <p>Current graph topology metrics</p>
        </div>
      </div>

      <div className="rp-stats-row" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {/* Total Nodes */}
        <div className="rp-stat-card" style={{ padding: '1rem' }}>
          <div className="rp-stat-icon">
            <Activity size={16} />
          </div>
          <span className="rp-stat-label">Total Nodes</span>
          <span className="rp-stat-value" style={{ fontSize: '1.5rem' }}>{stats.node_count}</span>
        </div>

        {/* Total Edges */}
        <div className="rp-stat-card" style={{ padding: '1rem' }}>
          <div className="rp-stat-icon">
            <GitBranch size={16} />
          </div>
          <span className="rp-stat-label">Total Edges</span>
          <span className="rp-stat-value" style={{ fontSize: '1.5rem' }}>{stats.edge_count}</span>
        </div>

        {/* Average Degree */}
        <div className="rp-stat-card" style={{ padding: '1rem' }}>
          <div className="rp-stat-icon">
            <Network size={16} />
          </div>
          <span className="rp-stat-label">Avg Degree</span>
          <span className="rp-stat-value" style={{ fontSize: '1.5rem' }}>{avgDegree.toFixed(1)}</span>
        </div>

        {/* Connected */}
        <div className="rp-stat-card" style={{ padding: '1rem' }}>
          <div className="rp-stat-icon">
            <Navigation size={16} />
          </div>
          <span className="rp-stat-label">Connected</span>
          <span className="rp-stat-value" style={{ fontSize: '1.5rem', color: stats.is_connected ? '#10b981' : '#f59e0b' }}>
            {stats.is_connected ? 'Yes' : 'No'}
          </span>
        </div>
      </div>

      {/* Healed Edges */}
      {healedEdges > 0 && (
        <div style={{ padding: '0.85rem', background: 'rgba(34, 211, 238, 0.08)', border: '1px solid rgba(34, 211, 238, 0.2)', borderRadius: '0.65rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>Healed Connections</span>
            <span style={{ fontWeight: 700, color: 'var(--text)' }}>
              {healedEdges} / {stats.edge_count} ({((healedEdges / stats.edge_count) * 100).toFixed(1)}%)
            </span>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'rgba(34, 211, 238, 0.7)', marginTop: '0.4rem', marginBottom: 0 }}>
            MST + Disjoint Set algorithm bridged {healedEdges} gaps in the network
          </p>
        </div>
      )}

      {/* Centrality Stats */}
      {centralityResult && (
        <div style={{ marginBottom: '1.25rem' }}>
          <h4 className="rp-section-title">Centrality Analysis</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--muted)' }}>Algorithm</span>
              <span style={{ color: 'var(--text)', fontWeight: 600, textTransform: 'capitalize' }}>{centralityResult.algorithm}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--muted)' }}>Max Centrality</span>
              <span style={{ color: 'var(--text)', fontFamily: 'monospace', fontWeight: 600 }}>
                {centralityResult.stats.max.toFixed(4)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--muted)' }}>Mean Centrality</span>
              <span style={{ color: 'var(--text)', fontFamily: 'monospace', fontWeight: 600 }}>
                {centralityResult.stats.mean.toFixed(4)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div style={{ padding: '0.85rem', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(148, 163, 184, 0.1)', borderRadius: '0.65rem' }}>
        <p style={{ fontSize: '0.72rem', color: 'var(--soft)', lineHeight: 1.5, margin: 0 }}>
          <strong style={{ color: 'var(--text)' }}>Network Degree:</strong> Average number of connections per node. Higher
          degree indicates better connectivity and redundancy.
        </p>
      </div>
    </div>
  );
};

export default GraphStats;
