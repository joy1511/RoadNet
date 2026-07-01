"""
Centrality Analysis Module - Friend 3
Compute betweenness centrality and identify gatekeeper nodes
"""

import networkx as nx
import numpy as np
import logging
from typing import Dict, List, Any

from config import config

logger = logging.getLogger(__name__)


class CentralityAnalysis:
    """
    Network centrality analysis to identify critical nodes
    Friend 3 + Friend 1 responsibility: Phase III - Criticality Analysis
    """
    
    def __init__(self):
        """Initialize centrality analyzer"""
        self.algorithm = config.CENTRALITY_ALGORITHM
        self.weight_attr = config.CENTRALITY_WEIGHT
    
    def compute_centrality(self, graph_data, algorithm=None, top_n=None):
        """
        Compute centrality metrics for graph
        
        Args:
            graph_data: Graph as NetworkX object or JSON dict
            algorithm: 'betweenness', 'closeness', 'eigenvector', or 'all'
            top_n: Number of top critical nodes to return
            
        Returns:
            Dictionary with graph + centrality scores + gatekeeper nodes
        """
        if algorithm is None:
            algorithm = self.algorithm
        
        if top_n is None:
            top_n = config.TOP_N_CRITICAL_NODES
        
        # Convert to NetworkX if JSON
        if isinstance(graph_data, dict):
            from .pipeline import GraphPipeline
            pipeline = GraphPipeline()
            G = pipeline.json_to_graph(graph_data)
        else:
            G = graph_data
        
        if len(G.nodes) == 0:
            logger.warning("Empty graph provided for centrality analysis")
            return {
                'graph': graph_data if isinstance(graph_data, dict) else {'nodes': [], 'edges': []},
                'gatekeeper_nodes': [],
                'stats': {}
            }
        
        logger.info(f"Computing {algorithm} centrality for {len(G.nodes)} nodes...")
        
        # Compute centrality
        if algorithm == 'betweenness':
            centrality = self._compute_betweenness(G)
        elif algorithm == 'closeness':
            centrality = self._compute_closeness(G)
        elif algorithm == 'eigenvector':
            centrality = self._compute_eigenvector(G)
        elif algorithm == 'all':
            centrality = self._compute_all_centralities(G)
        else:
            raise ValueError(f"Unknown algorithm: {algorithm}")
        
        # Add centrality to graph
        for node, score in centrality.items():
            if isinstance(score, dict):  # Multiple centralities
                for metric, value in score.items():
                    G.nodes[node][metric] = float(value)
            else:
                G.nodes[node]['centrality'] = float(score)
        
        # Identify gatekeeper nodes (top-N by centrality)
        gatekeeper_nodes = self._identify_gatekeepers(G, centrality, top_n)
        
        # Compute statistics
        stats = self._compute_centrality_stats(centrality)
        
        # Convert back to JSON
        from .pipeline import GraphPipeline
        pipeline = GraphPipeline()
        graph_json = pipeline.graph_to_json(G)
        
        result = {
            'graph': graph_json,
            'gatekeeper_nodes': gatekeeper_nodes,
            'stats': stats,
            'algorithm': algorithm
        }
        
        logger.info(f"Centrality analysis complete. Top {len(gatekeeper_nodes)} critical nodes identified.")
        
        return result
    
    def _compute_betweenness(self, G):
        """
        Compute betweenness centrality
        Measures how often a node appears on shortest paths between other nodes
        """
        logger.info("Computing betweenness centrality...")
        
        # Use weight attribute if graph is weighted
        weight = self.weight_attr if nx.is_weighted(G, weight=self.weight_attr) else None
        
        # For large graphs, approximate by sampling k nodes to avoid O(V*E) hanging for hours
        num_nodes = len(G.nodes)
        k_sample = min(10, num_nodes) if num_nodes > 1000 else None
        
        if k_sample:
            logger.info(f"Graph is large ({num_nodes} nodes), using approximation with k={k_sample}")
            
        centrality = nx.betweenness_centrality(
            G,
            k=k_sample,
            weight=weight,
            normalized=True,
            seed=42 # for reproducibility
        )
        
        return centrality
    
    def _compute_closeness(self, G):
        """
        Compute closeness centrality
        Measures average distance to all other nodes
        """
        logger.info("Computing closeness centrality...")
        
        # Only compute for largest component if graph is disconnected
        is_conn = nx.is_weakly_connected(G) if G.is_directed() else nx.is_connected(G)
        if not is_conn:
            components = nx.weakly_connected_components(G) if G.is_directed() else nx.connected_components(G)
            largest_cc = max(components, key=len)
            G_connected = G.subgraph(largest_cc).copy()
        else:
            G_connected = G
        
        weight = self.weight_attr if nx.is_weighted(G_connected, weight=self.weight_attr) else None
        
        centrality = nx.closeness_centrality(
            G_connected,
            distance=weight
        )
        
        # Fill in zeros for nodes not in largest component
        for node in G.nodes:
            if node not in centrality:
                centrality[node] = 0.0
        
        return centrality
    
    def _compute_eigenvector(self, G):
        """
        Compute eigenvector centrality
        Measures influence based on connections to other influential nodes
        """
        logger.info("Computing eigenvector centrality...")
        
        try:
            weight = self.weight_attr if nx.is_weighted(G, weight=self.weight_attr) else None
            
            centrality = nx.eigenvector_centrality(
                G,
                weight=weight,
                max_iter=100,
                tol=1e-06
            )
        except nx.PowerIterationFailedConvergence:
            logger.warning("Eigenvector centrality failed to converge, using betweenness instead")
            centrality = self._compute_betweenness(G)
        
        return centrality
    
    def _compute_all_centralities(self, G):
        """Compute all centrality measures"""
        logger.info("Computing all centrality measures...")
        
        betweenness = self._compute_betweenness(G)
        closeness = self._compute_closeness(G)
        eigenvector = self._compute_eigenvector(G)
        
        # Combine into dict of dicts
        all_centrality = {}
        for node in G.nodes:
            all_centrality[node] = {
                'betweenness': betweenness.get(node, 0.0),
                'closeness': closeness.get(node, 0.0),
                'eigenvector': eigenvector.get(node, 0.0)
            }
        
        return all_centrality
    
    def _identify_gatekeepers(self, G, centrality, top_n):
        """
        Identify top-N gatekeeper nodes (bottlenecks)
        
        Args:
            G: Graph
            centrality: Centrality scores
            top_n: Number of gatekeepers to return
            
        Returns:
            List of gatekeeper node info
        """
        # Handle multiple centralities
        if centrality and isinstance(list(centrality.values())[0], dict):
            # Use betweenness as primary metric
            scores = {node: data['betweenness'] for node, data in centrality.items()}
        else:
            scores = centrality
        
        # Sort by centrality (descending)
        sorted_nodes = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        
        # Get top-N
        gatekeepers = []
        for i, (node, score) in enumerate(sorted_nodes[:top_n]):
            node_data = G.nodes[node]
            
            gatekeeper_info = {
                'rank': i + 1,
                'node_id': str(node),
                'centrality_score': float(score),
                'position': {
                    'x': float(node_data.get('x', node_data.get('pos', [0, 0])[0])),
                    'y': float(node_data.get('y', node_data.get('pos', [0, 0])[1]))
                },
                'degree': G.degree(node),
                'criticality_level': self._assess_criticality_level(score)
            }
            
            # Add lat/lon if available
            if 'lat' in node_data:
                gatekeeper_info['position']['lat'] = float(node_data['lat'])
            if 'lon' in node_data:
                gatekeeper_info['position']['lon'] = float(node_data['lon'])
            
            gatekeepers.append(gatekeeper_info)
        
        return gatekeepers
    
    def _assess_criticality_level(self, score):
        """
        Assess criticality level based on score
        
        Returns: 'critical', 'high', 'medium', 'low'
        """
        if score >= 0.1:
            return 'critical'
        elif score >= 0.05:
            return 'high'
        elif score >= 0.01:
            return 'medium'
        else:
            return 'low'
    
    def _compute_centrality_stats(self, centrality):
        """
        Compute statistics about centrality distribution
        
        Args:
            centrality: Centrality scores dict
            
        Returns:
            Statistics dict
        """
        # Handle multiple centralities
        if centrality and isinstance(list(centrality.values())[0], dict):
            scores = [data['betweenness'] for data in centrality.values()]
        else:
            scores = list(centrality.values())
        
        if not scores:
            return {}
        
        scores = np.array(scores)
        
        stats = {
            'mean': float(np.mean(scores)),
            'median': float(np.median(scores)),
            'std': float(np.std(scores)),
            'min': float(np.min(scores)),
            'max': float(np.max(scores)),
            'percentile_90': float(np.percentile(scores, 90)),
            'percentile_95': float(np.percentile(scores, 95)),
            'percentile_99': float(np.percentile(scores, 99))
        }
        
        return stats
    
    def analyze_vulnerability(self, G, top_n=10):
        """
        Analyze network vulnerability to node failures
        
        Args:
            G: NetworkX graph
            top_n: Number of critical nodes to analyze
            
        Returns:
            Vulnerability analysis report
        """
        logger.info("Analyzing network vulnerability...")
        
        # Compute betweenness centrality
        centrality = self._compute_betweenness(G)
        
        # Get top nodes
        sorted_nodes = sorted(centrality.items(), key=lambda x: x[1], reverse=True)
        top_nodes = [node for node, _ in sorted_nodes[:top_n]]
        
        # Analyze impact of removing each top node
        vulnerability_report = []
        
        for node in top_nodes:
            # Create graph without this node
            G_temp = G.copy()
            G_temp.remove_node(node)
            
            # Analyze impact
            components_before = nx.number_weakly_connected_components(G) if G.is_directed() else nx.number_connected_components(G)
            components_after = nx.number_weakly_connected_components(G_temp) if G_temp.is_directed() else nx.number_connected_components(G_temp)
            
            comp_func = nx.weakly_connected_components if G_temp.is_directed() else nx.connected_components
            impact = {
                'node_id': str(node),
                'centrality': float(centrality[node]),
                'components_created': components_after - components_before,
                'nodes_disconnected': len(G.nodes) - len(max(comp_func(G_temp), key=len)) if components_after > 1 else 0
            }
            
            vulnerability_report.append(impact)
        
        return vulnerability_report


if __name__ == '__main__':
    # Test
    print("Testing CentralityAnalysis...")
    
    # Create test graph
    G = nx.karate_club_graph()
    
    analyzer = CentralityAnalysis()
    result = analyzer.compute_centrality(G, algorithm='betweenness', top_n=5)
    
    print(f"Gatekeeper nodes: {len(result['gatekeeper_nodes'])}")
    print(f"Top node: {result['gatekeeper_nodes'][0]}")
    print("✅ CentralityAnalysis test passed")
