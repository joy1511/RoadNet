"""
Graph Pipeline - Complete mask-to-graph conversion
Friend 3 responsibility: Orchestrates skeletonization + healing
"""

import numpy as np
import networkx as nx
from PIL import Image
import logging
from pathlib import Path

from .skeletonize import RoadSkeletonizer
from .healing import GraphHealer
from config import config

logger = logging.getLogger(__name__)


class GraphPipeline:
    """
    Complete pipeline: Binary mask → Skeleton → Graph → Healed Graph
    Friend 3 responsibility: Phase II implementation
    """
    
    def __init__(self):
        """Initialize pipeline components"""
        self.skeletonizer = RoadSkeletonizer(method='zhang')
        self.healer = GraphHealer()
        logger.info("GraphPipeline initialized")
    
    def mask_to_graph(self, mask, simplify=True):
        """
        Convert binary road mask to NetworkX graph
        
        Args:
            mask: Binary mask (PIL Image, numpy array, or file path)
            simplify: Whether to simplify the graph
            
        Returns:
            NetworkX Graph
        """
        logger.info("Converting mask to graph...")
        
        # Load mask if path
        if isinstance(mask, (str, Path)):
            mask = Image.open(mask).convert('L')
        
        # Convert to numpy
        if isinstance(mask, Image.Image):
            mask = np.array(mask)
        
        # Step 1: Skeletonize
        logger.info("Step 1: Skeletonizing mask...")
        skeleton = self.skeletonizer.skeletonize_mask(mask)
        
        # Step 2: Extract graph
        logger.info("Step 2: Extracting graph from skeleton...")
        graph = self.skeletonizer.skeleton_to_graph(skeleton)
        
        # Step 3: Simplify if requested
        if simplify and len(graph.nodes) > 0:
            logger.info("Step 3: Simplifying graph...")
            graph = self._simplify_graph(graph)
        
        logger.info(f"Graph extracted: {len(graph.nodes)} nodes, {len(graph.edges)} edges")
        
        return graph
    
    def heal_graph_obj(self, graph, max_gap=None):
        """
        Heal graph object
        
        Args:
            graph: NetworkX graph
            max_gap: Maximum gap distance
            
        Returns:
            Healed NetworkX graph
        """
        if max_gap:
            healer = GraphHealer(max_gap_distance=max_gap)
            return healer.heal_graph(graph)
        else:
            return self.healer.heal_graph(graph)
    
    def heal_graph(self, graph_json, max_gap=None):
        """
        Heal graph from JSON format
        
        Args:
            graph_json: Graph in JSON format
            max_gap: Maximum gap distance
            
        Returns:
            Healed graph in JSON format
        """
        # Convert JSON to NetworkX
        G = self.json_to_graph(graph_json)
        
        # Heal
        G_healed = self.heal_graph_obj(G, max_gap)
        
        # Convert back to JSON
        return self.graph_to_json(G_healed)
    
    def graph_to_json(self, G):
        """
        Convert NetworkX graph to JSON format for API
        
        Args:
            G: NetworkX graph
            
        Returns:
            Dictionary with nodes and edges
        """
        nodes = []
        for node_id, data in G.nodes(data=True):
            node_dict = {
                'id': str(node_id),
                'x': float(data.get('x', data.get('pos', [0, 0])[0])),
                'y': float(data.get('y', data.get('pos', [0, 0])[1])),
            }
            
            # Add any additional attributes
            for key, value in data.items():
                if key not in ['x', 'y', 'pos']:
                    if isinstance(value, (int, float, str, bool)):
                        node_dict[key] = value
            
            nodes.append(node_dict)
        
        edges = []
        for u, v, data in G.edges(data=True):
            edge_dict = {
                'source': str(u),
                'target': str(v),
                'weight': float(data.get('weight', 1.0)),
                'length': float(data.get('length', data.get('weight', 1.0)))
            }
            
            # Add any additional attributes
            for key, value in data.items():
                if key not in ['weight', 'length', 'path']:
                    if isinstance(value, (int, float, str, bool)):
                        edge_dict[key] = value
            
            edges.append(edge_dict)
        
        return {
            'nodes': nodes,
            'edges': edges,
            'metadata': {
                'node_count': len(nodes),
                'edge_count': len(edges),
                'is_connected': (nx.is_weakly_connected(G) if G.is_directed() else nx.is_connected(G)) if len(G.nodes) > 0 else False
            }
        }
    
    def json_to_graph(self, graph_json):
        """
        Convert JSON format to NetworkX graph
        
        Args:
            graph_json: Dictionary with nodes and edges
            
        Returns:
            NetworkX graph
        """
        G = nx.Graph()
        
        # Add nodes
        for node in graph_json.get('nodes', []):
            node_id = node.get('id', node.get('node_id'))
            if node_id is None:
                continue
            
            # Try to convert to int if possible
            try:
                node_id = int(node_id)
            except (ValueError, TypeError):
                pass
            
            attrs = {
                'x': node.get('x', 0),
                'y': node.get('y', 0),
                'pos': (node.get('x', 0), node.get('y', 0))
            }
            
            # Add other attributes
            for key, value in node.items():
                if key not in ['id', 'node_id', 'x', 'y']:
                    attrs[key] = value
            
            G.add_node(node_id, **attrs)
        
        # Add edges
        for edge in graph_json.get('edges', []):
            source = edge.get('source')
            target = edge.get('target')
            
            if source is None or target is None:
                continue
            
            # Try to convert to int
            try:
                source = int(source)
            except (ValueError, TypeError):
                pass
            
            try:
                target = int(target)
            except (ValueError, TypeError):
                pass
            
            attrs = {
                'weight': edge.get('weight', edge.get('length', 1.0)),
                'length': edge.get('length', edge.get('weight', 1.0))
            }
            
            # Add other attributes
            for key, value in edge.items():
                if key not in ['source', 'target', 'weight', 'length']:
                    attrs[key] = value
            
            G.add_edge(source, target, **attrs)
        
        return G
    
    def _simplify_graph(self, G):
        """
        Simplify graph by merging degree-2 nodes
        
        Args:
            G: NetworkX graph
            
        Returns:
            Simplified graph
        """
        G_simple = G.copy()
        
        simplified = True
        removed_count = 0
        
        while simplified:
            simplified = False
            nodes_to_remove = []
            
            for node in list(G_simple.nodes()):
                if G_simple.degree(node) == 2:
                    neighbors = list(G_simple.neighbors(node))
                    if len(neighbors) == 2:
                        nodes_to_remove.append((node, neighbors[0], neighbors[1]))
            
            for node, n1, n2 in nodes_to_remove:
                # Check if edges still exist (might have been removed in this pass)
                if node in G_simple and n1 in G_simple[node] and n2 in G_simple[node]:
                    # Fix: skip self-loops (n1 == n2) which corrupt the graph
                    if n1 == n2:
                        continue
                    w1 = G_simple[node][n1].get('weight', 1)
                    w2 = G_simple[node][n2].get('weight', 1)
                    
                    G_simple.add_edge(n1, n2, weight=w1 + w2, length=w1 + w2, simplified=True)
                    G_simple.remove_node(node)
                    simplified = True
                    removed_count += 1
        
        if removed_count > 0:
            logger.info(f"Simplified graph: removed {removed_count} degree-2 nodes")
        
        return G_simple
    
    def compute_graph_stats(self, G):
        """
        Compute statistics about the graph
        
        Args:
            G: NetworkX graph
            
        Returns:
            Dictionary of statistics
        """
        if len(G.nodes) == 0:
            return {
                'nodes': 0,
                'edges': 0,
                'connected': False,
                'components': 0
            }
        
        components = list(nx.connected_components(G))
        is_connected = len(components) == 1
        
        stats = {
            'nodes': len(G.nodes),
            'edges': len(G.edges),
            'connected': is_connected,
            'components': len(components),
            'largest_component': len(max(components, key=len)),
            'average_degree': sum(dict(G.degree()).values()) / len(G.nodes),
            'density': nx.density(G)
        }
        
        if is_connected:
            stats['diameter'] = nx.diameter(G)
            stats['average_shortest_path'] = nx.average_shortest_path_length(G, weight='weight')
        
        return stats


if __name__ == '__main__':
    # Test
    print("Testing GraphPipeline...")
    
    # Create a simple test mask
    test_mask = np.zeros((100, 100), dtype=np.uint8)
    import cv2
    cv2.line(test_mask, (10, 50), (90, 50), 255, 5)
    cv2.line(test_mask, (50, 10), (50, 90), 255, 5)
    
    pipeline = GraphPipeline()
    graph = pipeline.mask_to_graph(test_mask)
    
    print(f"Graph: {len(graph.nodes)} nodes, {len(graph.edges)} edges")
    
    # Test JSON conversion
    graph_json = pipeline.graph_to_json(graph)
    print(f"JSON: {len(graph_json['nodes'])} nodes")
    
    print("✅ GraphPipeline test passed")
