"""
Skeletonization Module - Friend 3
Convert binary road masks to 1-pixel centerlines
"""

import numpy as np
import cv2
from skimage.morphology import skeletonize, medial_axis
from scipy import ndimage
from PIL import Image
import networkx as nx
import logging

logger = logging.getLogger(__name__)


class RoadSkeletonizer:
    """
    Converts binary road masks into skeletonized centerlines
    Friend 3 responsibility: Phase II - Graph Skeletonization
    """
    
    def __init__(self, method='zhang'):
        """
        Initialize skeletonizer
        
        Args:
            method: 'zhang' (default) or 'medial_axis'
        """
        self.method = method
    
    def skeletonize_mask(self, mask):
        """
        Convert binary mask to skeleton
        
        Args:
            mask: Binary mask (numpy array or PIL Image)
            
        Returns:
            Skeleton as binary numpy array
        """
        # Convert to numpy if needed
        if isinstance(mask, Image.Image):
            mask = np.array(mask)
        
        # Ensure binary
        mask_binary = (mask > 127).astype(np.uint8)
        
        # Apply skeletonization
        if self.method == 'zhang':
            skeleton = skeletonize(mask_binary > 0)
        elif self.method == 'medial_axis':
            skeleton, distance = medial_axis(mask_binary > 0, return_distance=True)
        else:
            raise ValueError(f"Unknown method: {self.method}")
        
        # Convert to uint8
        skeleton = (skeleton * 255).astype(np.uint8)
        
        # Clean up skeleton (remove small artifacts)
        skeleton = self._clean_skeleton(skeleton)
        
        return skeleton
    
    def _clean_skeleton(self, skeleton, min_length=10):
        """
        Remove small disconnected skeleton fragments
        
        Args:
            skeleton: Binary skeleton
            min_length: Minimum length of skeleton segment to keep
            
        Returns:
            Cleaned skeleton
        """
        # Label connected components
        num_labels, labels = cv2.connectedComponents(skeleton)
        
        # Keep only components with sufficient size
        cleaned = np.zeros_like(skeleton)
        
        for label in range(1, num_labels):
            component = (labels == label)
            if np.sum(component) >= min_length:
                cleaned[component] = 255
        
        return cleaned
    
    def extract_nodes_and_edges(self, skeleton):
        """
        Extract graph nodes (intersections/endpoints) and edges from skeleton
        
        Args:
            skeleton: Binary skeleton image
            
        Returns:
            nodes: List of (x, y) coordinates
            edges: List of (node_idx1, node_idx2, pixel_path)
        """
        # Find junction points (intersections) and endpoints
        junctions = self._find_junctions(skeleton)
        endpoints = self._find_endpoints(skeleton)
        
        # Combine into nodes
        nodes = junctions + endpoints
        
        logger.info(f"Found {len(junctions)} junctions and {len(endpoints)} endpoints")
        
        # Extract edges between nodes
        edges = self._extract_edges(skeleton, nodes)
        
        logger.info(f"Extracted {len(edges)} edges")
        
        return nodes, edges
    
    def _find_junctions(self, skeleton):
        """
        Find junction points (intersections) in skeleton
        
        Args:
            skeleton: Binary skeleton
            
        Returns:
            List of (x, y) junction coordinates
        """
        # Convert to binary
        skel_binary = (skeleton > 0).astype(np.uint8)
        
        # Create kernel for counting neighbors
        kernel = np.ones((3, 3), dtype=np.uint8)
        kernel[1, 1] = 0
        
        # Count neighbors for each pixel
        neighbor_count = cv2.filter2D(skel_binary, -1, kernel)
        
        # Junctions have 3+ neighbors
        junctions_mask = (skel_binary > 0) & (neighbor_count >= 3)
        
        # Get coordinates
        y_coords, x_coords = np.where(junctions_mask)
        junctions = list(zip(x_coords, y_coords))
        
        return junctions
    
    def _find_endpoints(self, skeleton):
        """
        Find endpoints in skeleton
        
        Args:
            skeleton: Binary skeleton
            
        Returns:
            List of (x, y) endpoint coordinates
        """
        # Convert to binary
        skel_binary = (skeleton > 0).astype(np.uint8)
        
        # Create kernel for counting neighbors
        kernel = np.ones((3, 3), dtype=np.uint8)
        kernel[1, 1] = 0
        
        # Count neighbors
        neighbor_count = cv2.filter2D(skel_binary, -1, kernel)
        
        # Endpoints have exactly 1 neighbor
        endpoints_mask = (skel_binary > 0) & (neighbor_count == 1)
        
        # Get coordinates
        y_coords, x_coords = np.where(endpoints_mask)
        endpoints = list(zip(x_coords, y_coords))
        
        return endpoints
    
    def _extract_edges(self, skeleton, nodes):
        """
        Extract edges between nodes
        
        Args:
            skeleton: Binary skeleton
            nodes: List of node coordinates
            
        Returns:
            List of (node_idx1, node_idx2, pixel_path, length)
        """
        # Create a copy to work with
        skel_work = skeleton.copy()
        
        # Mark nodes on skeleton
        node_image = np.zeros_like(skeleton)
        for x, y in nodes:
            if 0 <= y < node_image.shape[0] and 0 <= x < node_image.shape[1]:
                node_image[y, x] = 255
        
        # Remove nodes from skeleton to separate edges
        skel_edges = skel_work.copy()
        skel_edges[node_image > 0] = 0
        
        # Label each edge segment
        num_labels, labels = cv2.connectedComponents(skel_edges)
        
        edges = []
        
        # For each edge segment, find which nodes it connects
        for label in range(1, num_labels):
            edge_mask = (labels == label)
            edge_coords = np.column_stack(np.where(edge_mask))
            
            if len(edge_coords) == 0:
                continue
            
            # Find nodes within 2 pixels of edge endpoints
            connected_nodes = []
            
            for node_idx, (node_x, node_y) in enumerate(nodes):
                # Check if node is near this edge
                for ey, ex in edge_coords[[0, -1]]:  # Check edge endpoints
                    dist = np.sqrt((ex - node_x)**2 + (ey - node_y)**2)
                    if dist <= 2:
                        connected_nodes.append(node_idx)
                        break
            
            # If edge connects two nodes, add it
            if len(connected_nodes) >= 2:
                # Get pixel path
                pixel_path = [(int(ex), int(ey)) for ey, ex in edge_coords]
                length = len(pixel_path)
                
                edges.append((
                    connected_nodes[0],
                    connected_nodes[-1],
                    pixel_path,
                    length
                ))
        
        return edges
    
    def skeleton_to_graph(self, skeleton):
        """
        Convert skeleton to NetworkX graph
        
        Args:
            skeleton: Binary skeleton image
            
        Returns:
            NetworkX Graph with node positions and edge weights
        """
        # Extract nodes and edges
        nodes, edges = self.extract_nodes_and_edges(skeleton)
        
        # Create NetworkX graph
        G = nx.Graph()
        
        # Add nodes with positions
        for idx, (x, y) in enumerate(nodes):
            G.add_node(idx, pos=(x, y), x=x, y=y)
        
        # Add edges with weights (length)
        for node1, node2, path, length in edges:
            if node1 in G.nodes and node2 in G.nodes:
                G.add_edge(node1, node2, weight=length, path=path, length=length)
        
        logger.info(f"Created graph: {len(G.nodes)} nodes, {len(G.edges)} edges")
        
        return G


def skeletonize_road_mask(mask, method='zhang'):
    """
    Convenience function to skeletonize a road mask
    
    Args:
        mask: Binary road mask
        method: Skeletonization method
        
    Returns:
        Skeleton image
    """
    skeletonizer = RoadSkeletonizer(method=method)
    return skeletonizer.skeletonize_mask(mask)


if __name__ == '__main__':
    # Test
    print("Testing RoadSkeletonizer...")
    
    # Create a simple test mask
    test_mask = np.zeros((100, 100), dtype=np.uint8)
    # Draw some roads
    cv2.line(test_mask, (10, 50), (90, 50), 255, 5)
    cv2.line(test_mask, (50, 10), (50, 90), 255, 5)
    
    skeletonizer = RoadSkeletonizer()
    skeleton = skeletonizer.skeletonize_mask(test_mask)
    graph = skeletonizer.skeleton_to_graph(skeleton)
    
    print(f"✅ Test passed: {len(graph.nodes)} nodes, {len(graph.edges)} edges")
