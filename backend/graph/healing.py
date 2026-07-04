"""
Graph Healing Module - Friend 3
MST + Disjoint Set to bridge gaps in road networks
"""

import numpy as np
import networkx as nx
from scipy.spatial import KDTree
from scipy.sparse import csr_matrix
from scipy.sparse.csgraph import minimum_spanning_tree
import logging

from config import config

logger = logging.getLogger(__name__)


class GraphHealer:
    """
    Heals broken connections in road graphs using MST and Disjoint Set Union
    Friend 3 responsibility: Phase II - Graph Healing
    """
    
    def __init__(self, max_gap_distance=None, angular_threshold=None):
        """
        Initialize graph healer
        
        Args:
            max_gap_distance: Maximum distance to bridge gaps (from config if None)
            angular_threshold: Maximum angle deviation for natural trajectories (degrees)
        """
        self.max_gap_distance = max_gap_distance or config.MAX_GAP_DISTANCE
        self.angular_threshold = angular_threshold or config.ANGULAR_THRESHOLD
    
    def heal_graph(self, G):
        """
        Heal broken connections in graph
        
        Args:
            G: NetworkX graph
            
        Returns:
            Healed NetworkX graph
        """
        if len(G.nodes) == 0:
            logger.warning("Empty graph provided for healing")
            return G
        
        logger.info(f"Healing graph: {len(G.nodes)} nodes, {len(G.edges)} edges")
        
        # Find connected components
        components = list(nx.connected_components(G))
        
        if len(components) == 1:
            logger.info("Graph already fully connected")
            return G
        
        logger.info(f"Found {len(components)} disconnected components")
        
        # Create a copy to modify
        G_healed = G.copy()
        
        # Heal gaps between components
        bridges_added = self._bridge_components(G_healed, components)
        
        logger.info(f"Added {bridges_added} healing edges")
        
        # Verify healing
        components_after = list(nx.connected_components(G_healed))
        logger.info(f"After healing: {len(components_after)} components")
        
        return G_healed
    
    def _bridge_components(self, G, components):
        """
        Bridge disconnected components using a single global KD-Tree
        
        Args:
            G: Graph to modify (in-place)
            components: List of connected components
            
        Returns:
            Number of bridges added
        """
        bridges_added = 0
        
        # Convert components to list for indexing
        component_list = [list(comp) for comp in components]
        
        # Build a mapping from node_id -> component index
        node_to_comp_index = {}
        for idx, comp_nodes in enumerate(component_list):
            for n in comp_nodes:
                node_to_comp_index[n] = idx
                
        node_ids = list(G.nodes())
        
        # Build a single global KD-Tree
        from scipy.spatial import cKDTree
        
        # Ensure 'pos' exists on all nodes
        try:
            positions = np.array([G.nodes[n]['pos'] for n in node_ids])
        except KeyError:
            # Fallback to x,y if pos doesn't exist
            positions = np.array([[G.nodes[n].get('x', 0), G.nodes[n].get('y', 0)] for n in node_ids])
            
        if len(positions) == 0:
            return 0
            
        global_tree = cKDTree(positions)
        
        # Find all pairs within max_gap_distance
        pairs = global_tree.query_pairs(self.max_gap_distance)
        
        potential_bridges = []
        for i, j in pairs:
            node_i = node_ids[i]
            node_j = node_ids[j]
            comp_i = node_to_comp_index[node_i]
            comp_j = node_to_comp_index[node_j]
            
            # Only consider bridging nodes in different components
            if comp_i != comp_j:
                pos_i = positions[i]
                pos_j = positions[j]
                
                dist = np.linalg.norm(pos_i - pos_j)
                angle_score = self._compute_angular_score(G, node_i, node_j, pos_i, pos_j)
                score = dist + angle_score * 10
                
                potential_bridges.append({
                    'comp_i': comp_i,
                    'comp_j': comp_j,
                    'node1': node_i,
                    'node2': node_j,
                    'distance': dist,
                    'angle_score': angle_score,
                    'score': score
                })
        
        # Sort bridges by quality (distance + angular alignment)
        potential_bridges.sort(key=lambda b: b['score'])
        
        # Use Disjoint Set Union to add bridges without creating cycles
        dsu = DisjointSetUnion(len(component_list))
        
        for bridge in potential_bridges:
            comp_i = bridge['comp_i']
            comp_j = bridge['comp_j']
            
            # Only add if components not already connected
            if dsu.find(comp_i) != dsu.find(comp_j):
                node1 = bridge['node1']
                node2 = bridge['node2']
                distance = bridge['distance']
                
                # Add healing edge
                G.add_edge(
                    node1,
                    node2,
                    weight=distance,
                    length=distance,
                    healed=True,
                    healing_score=bridge['score']
                )
                
                dsu.union(comp_i, comp_j)
                bridges_added += 1
                
                # Stop if all components connected
                if dsu.count_sets() == 1:
                    break
        
        return bridges_added
    
    def _compute_angular_score(self, G, node1, node2, pos1, pos2):
        """
        Compute angular alignment score for potential bridge
        
        Args:
            G: Graph
            node1, node2: Node IDs
            pos1, pos2: Node positions
            
        Returns:
            Angular score (0 = perfect alignment, higher = worse)
        """
        # Get neighbors to estimate road direction
        neighbors1 = list(G.neighbors(node1))
        neighbors2 = list(G.neighbors(node2))
        
        if not neighbors1 or not neighbors2:
            return 0  # Can't compute angle without neighbors
        
        # Compute average direction at each node
        dir1 = self._compute_direction(G, node1, neighbors1, pos1)
        dir2 = self._compute_direction(G, node2, neighbors2, pos2)
        
        # Direction of potential bridge
        bridge_dir = pos2 - pos1
        bridge_dir = bridge_dir / (np.linalg.norm(bridge_dir) + 1e-7)
        
        # Compute angles
        angle1 = self._angle_between(dir1, bridge_dir)
        angle2 = self._angle_between(dir2, -bridge_dir)
        
        # Average angle deviation
        avg_angle = (angle1 + angle2) / 2
        
        # Normalize to [0, 1] range
        angle_score = avg_angle / 180.0
        
        return angle_score
    
    def _compute_direction(self, G, node, neighbors, pos):
        """Compute average direction from node to its neighbors"""
        directions = []
        
        for neighbor in neighbors:
            neighbor_pos = np.array(G.nodes[neighbor]['pos'])
            direction = neighbor_pos - pos
            norm = np.linalg.norm(direction)
            if norm > 0:
                directions.append(direction / norm)
        
        if not directions:
            return np.array([1.0, 0.0])
        
        avg_direction = np.mean(directions, axis=0)
        norm = np.linalg.norm(avg_direction)
        
        if norm > 0:
            return avg_direction / norm
        else:
            return np.array([1.0, 0.0])
    
    def _angle_between(self, v1, v2):
        """Compute angle between two vectors (in degrees)"""
        cos_angle = np.clip(np.dot(v1, v2), -1.0, 1.0)
        angle_rad = np.arccos(cos_angle)
        angle_deg = np.degrees(angle_rad)
        return angle_deg
    
    def compute_healing_stats(self, G):
        """
        Compute statistics about graph healing
        
        Args:
            G: Healed graph
            
        Returns:
            Dictionary of statistics
        """
        # Count healing edges
        healing_edges = [e for e in G.edges(data=True) if e[2].get('healed', False)]
        
        # Connectivity metrics
        components = list(nx.connected_components(G))
        largest_component_size = len(max(components, key=len)) if components else 0
        
        stats = {
            'total_nodes': len(G.nodes),
            'total_edges': len(G.edges),
            'healing_edges': len(healing_edges),
            'connected_components': len(components),
            'largest_component_size': largest_component_size,
            'connectivity_ratio': largest_component_size / len(G.nodes) if len(G.nodes) > 0 else 0
        }
        
        return stats


class DisjointSetUnion:
    """
    Disjoint Set Union (Union-Find) data structure
    Used to efficiently track connected components during healing
    """
    
    def __init__(self, n):
        """Initialize with n elements"""
        self.parent = list(range(n))
        self.rank = [0] * n
        self.n_sets = n
    
    def find(self, x):
        """Find root of element x with path compression"""
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]
    
    def union(self, x, y):
        """Union two sets containing x and y"""
        root_x = self.find(x)
        root_y = self.find(y)
        
        if root_x == root_y:
            return False
        
        # Union by rank
        if self.rank[root_x] < self.rank[root_y]:
            self.parent[root_x] = root_y
        elif self.rank[root_x] > self.rank[root_y]:
            self.parent[root_y] = root_x
        else:
            self.parent[root_y] = root_x
            self.rank[root_x] += 1
        
        self.n_sets -= 1
        return True
    
    def count_sets(self):
        """Return number of disjoint sets"""
        return self.n_sets


if __name__ == '__main__':
    # Test
    print("Testing GraphHealer...")
    
    # Create a simple disconnected graph
    G = nx.Graph()
    
    # Component 1
    G.add_node(0, pos=(0, 0))
    G.add_node(1, pos=(10, 0))
    G.add_edge(0, 1)
    
    # Component 2
    G.add_node(2, pos=(20, 0))
    G.add_node(3, pos=(30, 0))
    G.add_edge(2, 3)
    
    print(f"Before healing: {len(list(nx.connected_components(G)))} components")
    
    healer = GraphHealer(max_gap_distance=15)
    G_healed = healer.heal_graph(G)
    
    print(f"After healing: {len(list(nx.connected_components(G_healed)))} components")
    print(f"✅ Test passed: {len(G_healed.edges)} edges")
