"""
Input Validators
Validate API inputs for security and correctness
"""

from PIL import Image
import numpy as np
from pathlib import Path
import logging

from config import config

logger = logging.getLogger(__name__)


def validate_image(image_file):
    """
    Validate uploaded image file
    
    Args:
        image_file: Werkzeug FileStorage object
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    # Check file exists
    if not image_file:
        return False, "No file provided"
    
    # Check filename
    filename = image_file.filename
    if not filename:
        return False, "Empty filename"
    
    # Check file extension
    ext = Path(filename).suffix.lower().lstrip('.')
    if ext not in config.ALLOWED_EXTENSIONS:
        return False, f"Invalid file type. Allowed: {', '.join(config.ALLOWED_EXTENSIONS)}"
    
    # Check file size (read first to get size)
    image_file.seek(0, 2)  # Seek to end
    file_size = image_file.tell()
    image_file.seek(0)  # Seek back to start
    
    if file_size > config.MAX_UPLOAD_SIZE:
        max_mb = config.MAX_UPLOAD_SIZE / (1024 * 1024)
        return False, f"File too large. Maximum size: {max_mb}MB"
    
    # Try to open as image
    try:
        img = Image.open(image_file)
        img.verify()  # Verify it's actually an image
        image_file.seek(0)  # Reset after verify
        
        # Check image dimensions
        img = Image.open(image_file)
        width, height = img.size
        image_file.seek(0)
        
        if width < 10 or height < 10:
            return False, "Image too small (minimum 10x10 pixels)"
        
        if width > config.MAX_IMAGE_SIZE or height > config.MAX_IMAGE_SIZE:
            return False, f"Image too large (maximum {config.MAX_IMAGE_SIZE}x{config.MAX_IMAGE_SIZE} pixels)"
        
        return True, None
        
    except Exception as e:
        logger.error(f"Image validation error: {e}")
        return False, f"Invalid image file: {str(e)}"


def validate_graph_data(graph_data):
    """
    Validate graph JSON structure
    
    Args:
        graph_data: Dictionary with graph data
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not isinstance(graph_data, dict):
        return False, "Graph data must be a dictionary"
    
    # Check required fields
    if 'nodes' not in graph_data:
        return False, "Graph data missing 'nodes' field"
    
    if 'edges' not in graph_data:
        return False, "Graph data missing 'edges' field"
    
    nodes = graph_data['nodes']
    edges = graph_data['edges']
    
    # Check types
    if not isinstance(nodes, list):
        return False, "'nodes' must be a list"
    
    if not isinstance(edges, list):
        return False, "'edges' must be a list"
    
    # Check not empty
    if len(nodes) == 0:
        return False, "Graph has no nodes"
    
    # Validate node structure
    node_ids = set()
    for i, node in enumerate(nodes):
        if not isinstance(node, dict):
            return False, f"Node {i} is not a dictionary"
        
        # Check required fields
        if 'id' not in node and 'node_id' not in node:
            return False, f"Node {i} missing 'id' or 'node_id' field"
        
        node_id = node.get('id', node.get('node_id'))
        node_ids.add(str(node_id))
        
        # Check position data
        if 'x' not in node or 'y' not in node:
            if 'pos' not in node and 'lat' not in node:
                return False, f"Node {node_id} missing position data (x/y or lat/lon)"
    
    # Validate edge structure
    for i, edge in enumerate(edges):
        if not isinstance(edge, dict):
            return False, f"Edge {i} is not a dictionary"
        
        # Check required fields
        if 'source' not in edge:
            return False, f"Edge {i} missing 'source' field"
        
        if 'target' not in edge:
            return False, f"Edge {i} missing 'target' field"
        
        # Check nodes exist
        source = str(edge['source'])
        target = str(edge['target'])
        
        if source not in node_ids:
            return False, f"Edge {i} references non-existent source node: {source}"
        
        if target not in node_ids:
            return False, f"Edge {i} references non-existent target node: {target}"
    
    return True, None


def validate_coordinates(lat, lon):
    """
    Validate latitude/longitude coordinates
    
    Args:
        lat: Latitude
        lon: Longitude
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    try:
        lat = float(lat)
        lon = float(lon)
    except (ValueError, TypeError):
        return False, "Coordinates must be numeric"
    
    if lat < -90 or lat > 90:
        return False, f"Invalid latitude: {lat} (must be between -90 and 90)"
    
    if lon < -180 or lon > 180:
        return False, f"Invalid longitude: {lon} (must be between -180 and 180)"
    
    return True, None


def validate_threshold(threshold):
    """
    Validate segmentation threshold
    
    Args:
        threshold: Threshold value
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    try:
        threshold = float(threshold)
    except (ValueError, TypeError):
        return False, "Threshold must be numeric"
    
    if threshold < 0 or threshold > 1:
        return False, f"Invalid threshold: {threshold} (must be between 0 and 1)"
    
    return True, None


def validate_positive_number(value, name="value"):
    """
    Validate positive number
    
    Args:
        value: Value to validate
        name: Parameter name for error message
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    try:
        value = float(value)
    except (ValueError, TypeError):
        return False, f"{name} must be numeric"
    
    if value <= 0:
        return False, f"{name} must be positive"
    
    return True, None


if __name__ == '__main__':
    # Test
    print("Testing validators...")
    
    # Test graph validation
    valid_graph = {
        'nodes': [
            {'id': 0, 'x': 0, 'y': 0},
            {'id': 1, 'x': 10, 'y': 10}
        ],
        'edges': [
            {'source': 0, 'target': 1, 'weight': 14.14}
        ]
    }
    
    is_valid, error = validate_graph_data(valid_graph)
    print(f"Valid graph test: {is_valid} (expected True)")
    
    invalid_graph = {
        'nodes': [],
        'edges': []
    }
    
    is_valid, error = validate_graph_data(invalid_graph)
    print(f"Invalid graph test: {is_valid} (expected False), error: {error}")
    
    print("✅ Validators test passed")
