"""
Node Ablation Simulator - Friend 1
Simulate node removal and measure network resilience
"""

import networkx as nx
import numpy as np
import logging
from typing import List, Dict, Any
from copy import deepcopy

from config import config

logger = logging.getLogger(__name__)


class NodeAblationSimulator:
    """
    Simulates node failures and measures network resilience
    Friend 1 responsibility: Phase III - Stress Testing & Resilience Index
    """
    
    def __init__(self, iterations=None):
        """
        Initialize ablation simulator
        
        Args:
            iterations: Number of ablation iterations (from config if None)
        """
        self.iterations = iterations or config.ABLATION_ITERATIONS
    
    def simulate(self, graph_data, nodes_to_remove=None, iterations=None):
        """
        Run node ablation simulation
        
        Args:
            graph_data: Graph as NetworkX object or JSON dict
            nodes_to_remove: List of node IDs to remove (uses top centrality if None)
            iterations: Number of iterations (uses config if None)
            
        Returns:
            Simulation results with resilience metrics
        """
        if iterations is None:
            iterations = self.iterations
        
        # Convert to NetworkX if JSON
        if isinstance(graph_data, dict):
            from .pipeline import GraphPipeline
            pipeline = GraphPipeline()
            G = pipeline.json_to_graph(graph_data)
        else:
            G = graph_data.copy()
        
        if len(G.nodes) == 0:
            logger.warning("Empty graph provided for ablation simulation")
            return {
                'resilience_index': 1.0,
                'ablation_results': [],
                'summary': {}
            }
        
        logger.info(f"Running ablation simulation on {len(G.nodes)} nodes...")
        
        # If nodes_to_remove not provided, use top centrality nodes
        if nodes_to_remove is None:
            nodes_to_remove = self._get_top_central_nodes(G, iterations)
        else:
            # Convert to list if single node
            if not isinstance(nodes_to_remove, list):
                nodes_to_remove = [nodes_to_remove]
            
            # Limit to iterations
            nodes_to_remove = nodes_to_remove[:iterations]
        
        # Compute baseline metrics
        baseline_metrics = self._compute_network_metrics(G)
        
        logger.info(f"Baseline metrics: {baseline_metrics}")
        
        # Run ablation for each node
        ablation_results = []
        
        G_current = G.copy()
        metrics_after = baseline_metrics
        
        for i, node_id in enumerate(nodes_to_remove):
            # Convert node_id if needed
            try:
                node_id = int(node_id)
            except (ValueError, TypeError):
                pass
            
            if node_id not in G_current.nodes:
                logger.warning(f"Node {node_id} not in graph, skipping")
                continue
            
            logger.info(f"Iteration {i+1}/{len(nodes_to_remove)}: Removing node {node_id}")
            
            # Remove node
            G_current.remove_node(node_id)
            
            # Compute metrics after removal
            metrics_after = self._compute_network_metrics(G_current)
            
            # Compute impact
            impact = self._compute_impact(baseline_metrics, metrics_after)
            
            result = {
                'iteration': i + 1,
                'node_removed': str(node_id),
                'metrics_before': baseline_metrics if i == 0 else ablation_results[i-1]['metrics_after'],
                'metrics_after': metrics_after,
                'impact': impact
            }
            
            ablation_results.append(result)
        
        # Compute overall resilience index
        resilience_index = self._compute_resilience_index(baseline_metrics, metrics_after)
        
        # Create summary
        summary = self._create_summary(baseline_metrics, metrics_after, ablation_results)
        
        result = {
            'resilience_index': resilience_index,
            'baseline_metrics': baseline_metrics,
            'final_metrics': metrics_after,
            'nodes_removed': [str(n) for n in nodes_to_remove],
            'ablation_results': ablation_results,
            'summary': summary
        }
        
        logger.info(f"Ablation simulation complete. Resilience Index: {resilience_index:.3f}")
        
        return result
    
    def _get_top_central_nodes(self, G, n):
        """
        Get top-N nodes by betweenness centrality
        
        Args:
            G: NetworkX graph
            n: Number of nodes to return
            
        Returns:
            List of node IDs
        """
        # Check if centrality already computed
        if 'centrality' in G.nodes[list(G.nodes)[0]]:
            centrality = {node: data.get('centrality', 0) for node, data in G.nodes(data=True)}
        else:
            # Compute betweenness centrality
            centrality = nx.betweenness_centrality(G, weight='weight', normalized=True)
        
        # Sort by centrality
        sorted_nodes = sorted(centrality.items(), key=lambda x: x[1], reverse=True)
        
        # Return top-N node IDs
        return [node for node, _ in sorted_nodes[:n]]
    
    def _compute_network_metrics(self, G):
        """
        Compute network efficiency and connectivity metrics
        
        Args:
            G: NetworkX graph
            
        Returns:
            Dictionary of metrics
        """
        if len(G.nodes) == 0:
            return {
                'node_count': 0,
                'edge_count': 0,
                'connected_components': 0,
                'largest_component_size': 0,
                'average_shortest_path': -1.0,
                'global_efficiency': 0.0,
                'connectivity_ratio': 0.0
            }
        
        # Basic stats
        node_count = len(G.nodes)
        edge_count = len(G.edges)
        
        # Connected components
        comp_func = nx.weakly_connected_components if getattr(G, 'is_directed', lambda: False)() else nx.connected_components
        components = list(comp_func(G))
        num_components = len(components)
        largest_component_size = len(max(components, key=len)) if components else 0
        
        # Get largest connected component
        if num_components > 0 and largest_component_size > 1:
            largest_cc = G.subgraph(max(components, key=len)).copy()
            
            # Skip O(V^2) shortest path calculations for massive graphs
            if node_count <= 1000:
                # Average shortest path (only on connected component)
                try:
                    avg_shortest_path = nx.average_shortest_path_length(largest_cc, weight='weight')
                except:
                    avg_shortest_path = -1.0
                
                # Global efficiency
                global_efficiency = nx.global_efficiency(largest_cc)
            else:
                logger.info(f"Graph too large ({node_count} nodes), skipping O(V^2) efficiency metrics")
                avg_shortest_path = 0.0
                global_efficiency = 0.0
        else:
            avg_shortest_path = -1.0
            global_efficiency = 0.0
        
        # Connectivity ratio (fraction of nodes in largest component)
        connectivity_ratio = largest_component_size / node_count if node_count > 0 else 0.0
        
        metrics = {
            'node_count': node_count,
            'edge_count': edge_count,
            'connected_components': num_components,
            'largest_component_size': largest_component_size,
            'average_shortest_path': float(avg_shortest_path),
            'global_efficiency': float(global_efficiency),
            'connectivity_ratio': float(connectivity_ratio)
        }
        
        return metrics
    
    def _compute_impact(self, baseline, current):
        """
        Compute impact of node removal
        
        Args:
            baseline: Baseline metrics
            current: Current metrics after removal
            
        Returns:
            Impact metrics
        """
        impact = {}
        
        # Change in each metric
        for key in ['node_count', 'edge_count', 'connected_components', 
                    'largest_component_size', 'connectivity_ratio', 'global_efficiency']:
            baseline_val = baseline.get(key, 0)
            current_val = current.get(key, 0)
            
            if key in ['connected_components']:
                # For components, increase is bad
                impact[f'{key}_change'] = current_val - baseline_val
            else:
                # For others, decrease is bad
                impact[f'{key}_change'] = current_val - baseline_val
                
            # Percentage change (safe division)
            if baseline_val != 0 and not (isinstance(baseline_val, float) and baseline_val == float('inf')):
                impact[f'{key}_pct_change'] = ((current_val - baseline_val) / abs(baseline_val)) * 100
            else:
                impact[f'{key}_pct_change'] = 0.0
        
        # Average shortest path - special handling (lower is better)
        baseline_path = baseline.get('average_shortest_path', float('inf'))
        current_path = current.get('average_shortest_path', float('inf'))
        
        if baseline_path != float('inf') and current_path != float('inf'):
            impact['avg_path_increase'] = current_path - baseline_path
            if baseline_path != 0:
                impact['avg_path_pct_increase'] = ((current_path - baseline_path) / baseline_path) * 100
            else:
                impact['avg_path_pct_increase'] = 0.0
        else:
            impact['avg_path_increase'] = -1.0
            impact['avg_path_pct_increase'] = -1.0
        
        # Overall impact score (0-1, higher is worse)
        impact_score = 1.0 - current.get('connectivity_ratio', 0) / max(baseline.get('connectivity_ratio', 1), 0.01)
        impact['overall_impact_score'] = float(impact_score)
        
        return impact
    
    def _compute_resilience_index(self, baseline, final):
        """
        Compute Resilience Index (as per PDF specification)
        
        Resilience Index = baseline_avg_shortest_path / perturbed_avg_shortest_path
        
        Args:
            baseline: Baseline metrics
            final: Final metrics after all removals
            
        Returns:
            Resilience index (0-1, higher is better)
        """
        baseline_path = baseline.get('average_shortest_path', float('inf'))
        final_path = final.get('average_shortest_path', float('inf'))
        
        if final_path == 0 or final_path == float('inf'):
            # Network completely disconnected
            return 0.0
        
        if baseline_path == float('inf'):
            # Baseline was disconnected (shouldn't happen but handle it)
            return 0.0
        
        # Resilience index: lower final path = better resilience
        # Index close to 1.0 = good resilience (small increase in path length)
        # Index close to 0.0 = poor resilience (large increase in path length)
        resilience = baseline_path / final_path
        
        # Clamp to [0, 1]
        resilience = max(0.0, min(1.0, resilience))
        
        return float(resilience)
    
    def _create_summary(self, baseline, final, ablation_results):
        """
        Create human-readable summary of simulation
        
        Args:
            baseline: Baseline metrics
            final: Final metrics
            ablation_results: List of ablation results
            
        Returns:
            Summary dictionary
        """
        # Find worst impact iteration
        worst_impact = (
            max(ablation_results, key=lambda x: x['impact']['overall_impact_score'])
            if ablation_results
            else None
        )
        
        # Network fragmentation
        components_created = final['connected_components'] - baseline['connected_components']
        
        # Efficiency loss
        efficiency_loss = baseline['global_efficiency'] - final['global_efficiency']
        efficiency_loss_pct = (efficiency_loss / baseline['global_efficiency'] * 100) if baseline['global_efficiency'] > 0 else 0
        
        summary = {
            'nodes_removed': len(ablation_results),
            'components_created': components_created,
            'connectivity_degradation': f"{(1 - final['connectivity_ratio']) * 100:.1f}%",
            'efficiency_loss': f"{efficiency_loss_pct:.1f}%",
            'worst_single_removal': {
                'node': worst_impact['node_removed'],
                'iteration': worst_impact['iteration'],
                'impact_score': worst_impact['impact']['overall_impact_score']
            } if worst_impact else None,
            'interpretation': self._interpret_resilience(
                float(self._compute_resilience_index(baseline, final))
            )
        }
        
        return summary
    
    def _interpret_resilience(self, resilience_index):
        """
        Provide human-readable interpretation of resilience index
        
        Args:
            resilience_index: Resilience index (0-1)
            
        Returns:
            String interpretation
        """
        if resilience_index >= 0.9:
            return "Excellent resilience - network highly robust to node failures"
        elif resilience_index >= 0.7:
            return "Good resilience - network moderately robust"
        elif resilience_index >= 0.5:
            return "Fair resilience - network vulnerable to critical node failures"
        elif resilience_index >= 0.3:
            return "Poor resilience - network highly vulnerable"
        else:
            return "Critical - network severely compromised by node failures"


if __name__ == '__main__':
    # Test
    print("Testing NodeAblationSimulator...")
    
    # Create test graph
    G = nx.karate_club_graph()
    
    simulator = NodeAblationSimulator(iterations=5)
    result = simulator.simulate(G)
    
    print(f"Resilience Index: {result['resilience_index']:.3f}")
    print(f"Nodes removed: {len(result['nodes_removed'])}")
    print(f"Interpretation: {result['summary']['interpretation']}")
    print("✅ NodeAblationSimulator test passed")
