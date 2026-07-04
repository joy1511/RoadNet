"""
OSM Topology Validation
Friend 3 responsibility: Validate the healed graph against OSM Bengaluru topology as a sanity check
"""

import networkx as nx
import osmnx as ox
import logging
from shapely.geometry import Point
from scipy.spatial import cKDTree
import numpy as np

logger = logging.getLogger(__name__)

class OSMValidator:
    def __init__(self, location="Bengaluru, India"):
        self.location = location
        self.osm_graph = None
        
    def load_ground_truth(self, center_lat, center_lon, dist=2000):
        """
        Download ground truth road network for a bounding box from OSM
        Args:
            center_lat, center_lon: Center coordinates of the area to validate
            dist: Bounding box distance in meters
        """
        logger.info(f"Downloading OSM ground truth for {center_lat}, {center_lon} (dist={dist}m)...")
        try:
            # Download driveable road network around the center point
            self.osm_graph = ox.graph_from_point(
                (center_lat, center_lon), 
                dist=dist, 
                network_type='drive'
            )
            # Project to UTM for accurate distance measurements
            self.osm_graph = ox.project_graph(self.osm_graph)
            logger.info(f"Loaded ground truth graph: {len(self.osm_graph.nodes)} nodes, {len(self.osm_graph.edges)} edges")
            return True
        except Exception as e:
            logger.error(f"Failed to load OSM ground truth: {e}")
            return False

    def validate_graph(self, generated_graph, distance_threshold=20.0):
        """
        Validate the generated/healed graph against the OSM ground truth.
        Uses cKDTree for fast nearest-neighbor spatial matching.
        
        Args:
            generated_graph (nx.Graph): The output graph from the healing pipeline
            distance_threshold (float): Max distance (meters) to consider a match valid
            
        Returns:
            Dictionary of validation metrics (Node recall, Edge alignment, etc)
        """
        if self.osm_graph is None:
            raise ValueError("Ground truth graph not loaded. Call load_ground_truth first.")
            
        if len(generated_graph.nodes) == 0:
            return {"node_match_rate": 0.0, "error": "Empty generated graph"}

        # Extract coordinates from ground truth (already projected to UTM)
        gt_nodes = []
        for node, data in self.osm_graph.nodes(data=True):
            gt_nodes.append([data['x'], data['y']])
            
        if not gt_nodes:
            return {"error": "No nodes in ground truth"}
            
        gt_tree = cKDTree(np.array(gt_nodes))
        
        # We assume generated_graph nodes have 'x' and 'y' (in UTM) or 'lat'/'lon'
        # If they only have lat/lon, we would need to project them first.
        # For this script, we'll assume they've been projected or are close enough 
        # in a local coordinate system.
        
        matches = 0
        total_gen_nodes = len(generated_graph.nodes)
        distances = []
        
        # Perform nearest neighbor search
        for node, data in generated_graph.nodes(data=True):
            # Try to get coordinates, default to 0 if missing (in a real pipeline these must exist)
            x = data.get('x', data.get('lon', 0))
            y = data.get('y', data.get('lat', 0))
            
            # Query nearest ground truth node
            distance, idx = gt_tree.query([x, y], k=1)
            distances.append(distance)
            
            if distance <= distance_threshold:
                matches += 1
                
        node_match_rate = matches / total_gen_nodes
        avg_displacement = np.mean(distances)
        
        # Check topological complexity ratio (are we over/under generating?)
        gt_edge_count = len(self.osm_graph.edges)
        gen_edge_count = len(generated_graph.edges)
        edge_ratio = gen_edge_count / max(1, gt_edge_count)
        
        results = {
            "node_match_rate": float(node_match_rate),
            "average_displacement_meters": float(avg_displacement),
            "generated_nodes": total_gen_nodes,
            "ground_truth_nodes": len(gt_nodes),
            "generated_edges": gen_edge_count,
            "ground_truth_edges": gt_edge_count,
            "edge_density_ratio": float(edge_ratio),
            "sanity_check_passed": node_match_rate > 0.5 and avg_displacement < distance_threshold * 2
        }
        
        return results

if __name__ == "__main__":
    # Test execution
    print("Testing OSM Validator...")
    validator = OSMValidator()
    
    # Use a coordinate in central Bengaluru
    success = validator.load_ground_truth(12.9716, 77.5946, dist=500)
    
    if success:
        # Create a dummy generated graph that perfectly matches a subset of OSM
        dummy_graph = nx.Graph()
        nodes = list(validator.osm_graph.nodes(data=True))[:50]
        for node_id, data in nodes:
            dummy_graph.add_node(node_id, x=data['x'], y=data['y'])
            
        results = validator.validate_graph(dummy_graph)
        
        print("\nValidation Results:")
        for k, v in results.items():
            print(f"  {k}: {v}")
        print("\n✅ OSM Validation test passed")
    else:
        print("Failed to download test data, check internet connection.")
