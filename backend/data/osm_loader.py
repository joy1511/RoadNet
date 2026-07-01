"""
OpenStreetMap Data Loader - Friend 2
Load real road networks from OpenStreetMap
"""

import osmnx as ox
import networkx as nx
import logging
from pathlib import Path
import pickle

from config import config

logger = logging.getLogger(__name__)

# Configure OSMnx
ox.settings.use_cache = True
ox.settings.log_console = False


class OSMLoader:
    """
    Load road networks from OpenStreetMap
    Friend 2 responsibility: Real data integration
    """
    
    def __init__(self, cache_dir=None):
        """
        Initialize OSM loader
        
        Args:
            cache_dir: Directory for caching downloaded graphs
        """
        self.cache_dir = cache_dir or config.CACHE_DIR / 'osm'
        self.cache_dir.mkdir(parents=True, exist_ok=True)
    
    def load_by_place(self, place_name, network_type='drive', simplify=True):
        """
        Load road network for a place by name
        
        Args:
            place_name: Place name (e.g., "Bengaluru, India")
            network_type: 'drive', 'walk', 'bike', or 'all'
            simplify: Whether to simplify the graph
            
        Returns:
            NetworkX MultiDiGraph
        """
        logger.info(f"Loading OSM data for: {place_name}")
        
        # Check cache
        cache_key = self._get_cache_key(place_name, network_type)
        cached_graph = self._load_from_cache(cache_key)
        
        if cached_graph is not None:
            logger.info("Loaded from cache")
            return cached_graph
        
        try:
            # Download from OSM
            graph = ox.graph_from_place(
                place_name,
                network_type=network_type,
                simplify=simplify
            )
            
            logger.info(f"Downloaded graph: {len(graph.nodes)} nodes, {len(graph.edges)} edges")
            
            # Ensure nodes have x, y coordinates
            graph = self._ensure_coordinates(graph)
            
            # Cache for future use
            self._save_to_cache(cache_key, graph)
            
            return graph
            
        except Exception as e:
            logger.error(f"Error loading OSM data: {e}")
            raise
    
    def load_by_point(self, lat, lon, radius=5000, network_type='drive', simplify=True):
        """
        Load road network around a point
        
        Args:
            lat: Latitude
            lon: Longitude
            radius: Radius in meters
            network_type: 'drive', 'walk', 'bike', or 'all'
            simplify: Whether to simplify
            
        Returns:
            NetworkX MultiDiGraph
        """
        logger.info(f"Loading OSM data around ({lat}, {lon}) with radius {radius}m")
        
        # Check cache
        cache_key = self._get_cache_key(f"{lat}_{lon}_{radius}", network_type)
        cached_graph = self._load_from_cache(cache_key)
        
        if cached_graph is not None:
            logger.info("Loaded from cache")
            return cached_graph
        
        try:
            # Download from OSM
            graph = ox.graph_from_point(
                (lat, lon),
                dist=radius,
                network_type=network_type,
                simplify=simplify
            )
            
            logger.info(f"Downloaded graph: {len(graph.nodes)} nodes, {len(graph.edges)} edges")
            
            # Ensure coordinates
            graph = self._ensure_coordinates(graph)
            
            # Cache
            self._save_to_cache(cache_key, graph)
            
            return graph
            
        except Exception as e:
            logger.error(f"Error loading OSM data: {e}")
            raise
    
    def load_by_bbox(self, north, south, east, west, network_type='drive', simplify=True):
        """
        Load road network within bounding box
        
        Args:
            north, south, east, west: Bounding box coordinates
            network_type: 'drive', 'walk', 'bike', or 'all'
            simplify: Whether to simplify
            
        Returns:
            NetworkX MultiDiGraph
        """
        logger.info(f"Loading OSM data for bbox: N={north}, S={south}, E={east}, W={west}")
        
        try:
            graph = ox.graph_from_bbox(
                north=north,
                south=south,
                east=east,
                west=west,
                network_type=network_type,
                simplify=simplify
            )
            
            logger.info(f"Downloaded graph: {len(graph.nodes)} nodes, {len(graph.edges)} edges")
            
            # Ensure coordinates
            graph = self._ensure_coordinates(graph)
            
            return graph
            
        except Exception as e:
            logger.error(f"Error loading OSM data: {e}")
            raise
    
    def _ensure_coordinates(self, graph):
        """
        Ensure all nodes have x, y coordinates
        
        Args:
            graph: NetworkX graph
            
        Returns:
            Graph with coordinates
        """
        for node, data in graph.nodes(data=True):
            # OSM uses 'y' for latitude, 'x' for longitude
            if 'y' in data and 'x' in data:
                data['lat'] = data['y']
                data['lon'] = data['x']
                data['pos'] = (data['x'], data['y'])
            elif 'lat' in data and 'lon' in data:
                data['x'] = data['lon']
                data['y'] = data['lat']
                data['pos'] = (data['lon'], data['lat'])
        
        return graph
    
    def _get_cache_key(self, identifier, network_type):
        """Generate cache key"""
        # Sanitize identifier for filename
        safe_id = str(identifier).replace(' ', '_').replace(',', '').replace('/', '_')
        return f"{safe_id}_{network_type}"
    
    def _load_from_cache(self, cache_key):
        """Load graph from cache"""
        cache_file = self.cache_dir / f"{cache_key}.pkl"
        
        if cache_file.exists():
            try:
                with open(cache_file, 'rb') as f:
                    graph = pickle.load(f)
                return graph
            except Exception as e:
                logger.warning(f"Failed to load from cache: {e}")
                return None
        
        return None
    
    def _save_to_cache(self, cache_key, graph):
        """Save graph to cache"""
        cache_file = self.cache_dir / f"{cache_key}.pkl"
        
        try:
            with open(cache_file, 'wb') as f:
                pickle.dump(graph, f)
            logger.info(f"Cached graph to {cache_file}")
        except Exception as e:
            logger.warning(f"Failed to cache graph: {e}")
    
    def convert_to_undirected(self, graph):
        """
        Convert OSM directed graph to undirected for analysis
        
        Args:
            graph: NetworkX MultiDiGraph
            
        Returns:
            NetworkX Graph (undirected)
        """
        # Convert to undirected
        G_undirected = ox.convert.to_undirected(graph)
        
        # Simplify to regular Graph (not MultiGraph)
        G = nx.Graph(G_undirected)
        
        return G
    
    def get_graph_stats(self, graph):
        """
        Get statistics about OSM graph
        
        Args:
            graph: NetworkX graph
            
        Returns:
            Dictionary of statistics
        """
        stats = {
            'nodes': len(graph.nodes),
            'edges': len(graph.edges),
            'is_directed': graph.is_directed(),
            'is_multigraph': graph.is_multigraph()
        }
        
        # Try to get bounds
        try:
            bounds = ox.graph_to_gdfs(graph, edges=False)['geometry'].total_bounds
            stats['bounds'] = {
                'min_x': float(bounds[0]),
                'min_y': float(bounds[1]),
                'max_x': float(bounds[2]),
                'max_y': float(bounds[3])
            }
        except:
            stats['bounds'] = None
        
        # Try to get total length
        try:
            total_length = sum(data.get('length', 0) for u, v, data in graph.edges(data=True))
            stats['total_length_meters'] = float(total_length)
            stats['total_length_km'] = float(total_length / 1000)
        except:
            stats['total_length_meters'] = None
        
        return stats


# Convenience functions
def load_bengaluru():
    """Load Bengaluru road network (most used for demo)"""
    loader = OSMLoader()
    return loader.load_by_place(config.DEMO_CITY, network_type='drive')


def load_city(city_name, country='India'):
    """Load any city road network"""
    loader = OSMLoader()
    place = f"{city_name}, {country}"
    return loader.load_by_place(place, network_type='drive')


if __name__ == '__main__':
    # Test
    print("Testing OSMLoader...")
    
    loader = OSMLoader()
    
    # Test with a small area
    try:
        graph = loader.load_by_point(12.9716, 77.5946, radius=1000)
        print(f"Loaded graph: {len(graph.nodes)} nodes")
        
        stats = loader.get_graph_stats(graph)
        print(f"Stats: {stats}")
        
        print("OSMLoader test passed")
    except Exception as e:
        print(f"Test failed (might be network issue): {e}")
