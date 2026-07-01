"""
AstroRoute - Main Flask Application
Production-level API server implementing all 4 friends' responsibilities
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.utils import secure_filename
import os
import json
import logging
from pathlib import Path
import traceback

# Import configuration
from config import config

# Import modules (we'll create these)
from models.segmentation_api import SegmentationAPI
from graph.pipeline import GraphPipeline
from graph.centrality_analysis import CentralityAnalysis
from graph.ablation import NodeAblationSimulator
from data.osm_loader import OSMLoader
from utils.validators import validate_image, validate_graph_data
from utils.cache_manager import CacheManager

# Initialize Flask app
app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = config.MAX_UPLOAD_SIZE

# Enable CORS
CORS(app, origins=config.CORS_ORIGINS)

# Rate limiting
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    storage_uri="memory://",
    default_limits=[f"{config.RATE_LIMIT_REQUESTS} per minute"]
    if config.RATE_LIMIT_ENABLED else []
)

# Configure logging
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(config.LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Initialize components (lazy loading for performance)
segmentation_api = None
graph_pipeline = None
centrality_analysis = None
ablation_simulator = None
osm_loader = None
cache_manager = CacheManager() if config.ENABLE_CACHE else None


def get_segmentation_api():
    """Lazy initialization of segmentation API"""
    global segmentation_api
    if segmentation_api is None:
        logger.info("Initializing Segmentation API...")
        segmentation_api = SegmentationAPI()
    return segmentation_api


def get_graph_pipeline():
    """Lazy initialization of graph pipeline"""
    global graph_pipeline
    if graph_pipeline is None:
        logger.info("Initializing Graph Pipeline...")
        graph_pipeline = GraphPipeline()
    return graph_pipeline


def get_centrality_analysis():
    """Lazy initialization of centrality analysis"""
    global centrality_analysis
    if centrality_analysis is None:
        logger.info("Initializing Centrality Analysis...")
        centrality_analysis = CentralityAnalysis()
    return centrality_analysis


def get_ablation_simulator():
    """Lazy initialization of ablation simulator"""
    global ablation_simulator
    if ablation_simulator is None:
        logger.info("Initializing Ablation Simulator...")
        ablation_simulator = NodeAblationSimulator()
    return ablation_simulator


def get_osm_loader():
    """Lazy initialization of OSM loader"""
    global osm_loader
    if osm_loader is None:
        logger.info("Initializing OSM Loader...")
        osm_loader = OSMLoader()
    return osm_loader


# ========================================
# HEALTH & INFO ENDPOINTS
# ========================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'AstroRoute API is running',
        'version': '1.0.0',
        'environment': config.FLASK_ENV
    })


@app.route('/api/info', methods=['GET'])
def api_info():
    """API information and capabilities"""
    return jsonify({
        'name': 'AstroRoute API',
        'description': 'Occlusion-Robust Road Extraction & Graph-Theoretic Criticality Analysis',
        'version': '1.0.0',
        'capabilities': {
            'segmentation': 'Road extraction from satellite imagery with occlusion handling',
            'graph_healing': 'Convert broken masks to routable networks',
            'centrality_analysis': 'Identify critical network bottlenecks',
            'node_ablation': 'Simulate network disruptions',
            'osm_integration': 'Real OpenStreetMap data integration'
        },
        'endpoints': {
            'POST /api/segment': 'Extract roads from satellite image',
            'POST /api/graph/extract': 'Convert mask to graph',
            'POST /api/graph/heal': 'Heal broken graph connections',
            'POST /api/centrality': 'Compute network centrality',
            'POST /api/ablation/simulate': 'Simulate node removal',
            'POST /api/pipeline/full': 'Run complete pipeline',
            'GET /api/demo/bengaluru': 'Load Bengaluru demo data',
            'GET /api/osm/load': 'Load OSM data for any location'
        }
    })


# ========================================
# PHASE I: ROAD SEGMENTATION (Friend 1 + 2)
# ========================================

@app.route('/api/segment', methods=['POST'])
@limiter.limit("20 per minute")
def segment_road():
    """
    Extract roads from satellite imagery
    
    Request:
        - file: Image file (PNG, JPG, TIFF)
        - threshold: Confidence threshold (0.0-1.0, default: 0.5)
        - return_format: 'image' or 'geojson' (default: 'image')
    
    Response:
        - Binary road mask image or GeoJSON
    """
    try:
        # Validate request
        if 'file' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        image_file = request.files['file']
        
        if image_file.filename == '':
            return jsonify({'error': 'Empty filename'}), 400
        
        # Validate file
        is_valid, error_msg = validate_image(image_file)
        if not is_valid:
            return jsonify({'error': error_msg}), 400
        
        # Get parameters
        threshold = float(request.form.get('threshold', config.SEGMENTATION_THRESHOLD))
        return_format = request.form.get('return_format', 'image')
        handle_occlusion = request.form.get('handle_occlusion', 'true').lower() == 'true'
        
        logger.info(f"Segmentation request: threshold={threshold}, format={return_format}")
        
        # Save uploaded file temporarily
        filename = secure_filename(image_file.filename)
        temp_path = config.TEMP_DIR / filename
        image_file.save(temp_path)
        
        # Run segmentation
        api = get_segmentation_api()
        result = api.segment(
            str(temp_path),
            threshold=threshold,
            handle_occlusion=handle_occlusion,
            return_format=return_format
        )
        
        # Clean up
        temp_path.unlink()
        
        # Return result
        if return_format == 'image':
            mask_path = config.TEMP_DIR / f"mask_{filename}"
            result['mask'].save(mask_path)
            return send_file(mask_path, mimetype='image/png')
        else:
            return jsonify(result)
    
    except Exception as e:
        logger.error(f"Segmentation error: {str(e)}\n{traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500


# ========================================
# PHASE II: GRAPH EXTRACTION & HEALING (Friend 3)
# ========================================

@app.route('/api/graph/extract', methods=['POST'])
@limiter.limit("20 per minute")
def extract_graph():
    """
    Convert road mask to graph structure
    
    Request:
        - file: Binary mask image
        - simplify: Whether to simplify graph (default: true)
    
    Response:
        - Graph as JSON (nodes, edges)
    """
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No mask file provided'}), 400
        
        mask_file = request.files['file']
        simplify = request.form.get('simplify', 'true').lower() == 'true'
        
        # Save temporarily
        filename = secure_filename(mask_file.filename)
        temp_path = config.TEMP_DIR / filename
        mask_file.save(temp_path)
        
        logger.info(f"Graph extraction request: simplify={simplify}")
        
        # Extract graph
        pipeline = get_graph_pipeline()
        graph = pipeline.mask_to_graph(str(temp_path), simplify=simplify)
        
        # Convert to JSON
        graph_json = pipeline.graph_to_json(graph)
        
        # Clean up
        temp_path.unlink()
        
        return jsonify(graph_json)
    
    except Exception as e:
        logger.error(f"Graph extraction error: {str(e)}\n{traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/graph/heal', methods=['POST'])
@limiter.limit("20 per minute")
def heal_graph():
    """
    Heal broken connections in road graph
    
    Request:
        - graph: Graph JSON from extract endpoint
        - max_gap: Maximum gap distance to heal (default: from config)
    
    Response:
        - Healed graph as JSON
    """
    try:
        data = request.get_json()
        
        if not data or 'graph' not in data:
            return jsonify({'error': 'No graph data provided'}), 400
        
        # Validate graph data
        is_valid, error_msg = validate_graph_data(data['graph'])
        if not is_valid:
            return jsonify({'error': error_msg}), 400
        
        max_gap = data.get('max_gap', config.MAX_GAP_DISTANCE)
        
        logger.info(f"Graph healing request: max_gap={max_gap}")
        
        # Heal graph
        pipeline = get_graph_pipeline()
        healed_graph = pipeline.heal_graph(data['graph'], max_gap=max_gap)
        
        return jsonify(healed_graph)
    
    except Exception as e:
        logger.error(f"Graph healing error: {str(e)}\n{traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500


# ========================================
# PHASE III: CENTRALITY & STRESS TESTING (Friend 3 + 1)
# ========================================

@app.route('/api/centrality', methods=['POST'])
@limiter.limit("20 per minute")
def compute_centrality():
    """
    Compute network centrality metrics
    
    Request:
        - graph: Graph JSON
        - algorithm: 'betweenness', 'closeness', or 'eigenvector' (default: betweenness)
        - top_n: Number of top critical nodes to return (default: from config)
    
    Response:
        - Graph with centrality scores
        - List of gatekeeper nodes
    """
    try:
        data = request.get_json()
        
        if not data or 'graph' not in data:
            return jsonify({'error': 'No graph data provided'}), 400
        
        algorithm = data.get('algorithm', config.CENTRALITY_ALGORITHM)
        top_n = data.get('top_n', config.TOP_N_CRITICAL_NODES)
        
        logger.info(f"Centrality analysis request: algorithm={algorithm}, top_n={top_n}")
        
        # Compute centrality
        analysis = get_centrality_analysis()
        result = analysis.compute_centrality(
            data['graph'],
            algorithm=algorithm,
            top_n=top_n
        )
        
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Centrality analysis error: {str(e)}\n{traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/ablation/simulate', methods=['POST'])
@limiter.limit("10 per minute")  # Lower limit for computationally expensive operation
def simulate_ablation():
    """
    Simulate node removal and measure network impact
    
    Request:
        - graph: Graph JSON with centrality scores
        - nodes_to_remove: List of node IDs (optional, uses top critical if not provided)
        - iterations: Number of ablation iterations (default: from config)
    
    Response:
        - Resilience index
        - Impact metrics for each removed node
        - Network efficiency degradation
    """
    try:
        data = request.get_json()
        
        if not data or 'graph' not in data:
            return jsonify({'error': 'No graph data provided'}), 400
        
        nodes_to_remove = data.get('nodes_to_remove', None)
        iterations = data.get('iterations', config.ABLATION_ITERATIONS)
        
        logger.info(f"Ablation simulation request: iterations={iterations}")
        
        # Run simulation
        simulator = get_ablation_simulator()
        result = simulator.simulate(
            data['graph'],
            nodes_to_remove=nodes_to_remove,
            iterations=iterations
        )
        
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Ablation simulation error: {str(e)}\n{traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500


# ========================================
# COMPLETE PIPELINE (All Friends)
# ========================================

@app.route('/api/pipeline/full', methods=['POST'])
@limiter.limit("5 per minute")
def run_full_pipeline():
    """
    Run complete end-to-end pipeline
    
    Request:
        - file: Satellite image
        - threshold: Segmentation threshold
        - max_gap: Graph healing max gap
        - centrality_algorithm: Centrality algorithm to use
    
    Response:
        - Complete analysis results including:
          - Segmented mask
          - Extracted and healed graph
          - Centrality scores
          - Resilience analysis
    """
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        image_file = request.files['file']
        
        # Get parameters
        threshold = float(request.form.get('threshold', config.SEGMENTATION_THRESHOLD))
        max_gap = float(request.form.get('max_gap', config.MAX_GAP_DISTANCE))
        algorithm = request.form.get('centrality_algorithm', config.CENTRALITY_ALGORITHM)
        
        logger.info(f"Full pipeline request: threshold={threshold}, max_gap={max_gap}")
        
        # Save image
        filename = secure_filename(image_file.filename)
        temp_path = config.TEMP_DIR / filename
        image_file.save(temp_path)
        
        # PHASE I: Segment
        logger.info("Phase I: Segmentation...")
        seg_api = get_segmentation_api()
        seg_result = seg_api.segment(str(temp_path), threshold=threshold, return_format='both')
        
        # Save mask
        mask_path = config.TEMP_DIR / f"mask_{filename}"
        seg_result['mask'].save(mask_path)
        
        # PHASE II: Extract & Heal Graph
        logger.info("Phase II: Graph extraction and healing...")
        pipeline = get_graph_pipeline()
        graph = pipeline.mask_to_graph(str(mask_path), simplify=True)
        healed_graph = pipeline.heal_graph_obj(graph, max_gap=max_gap)
        graph_json = pipeline.graph_to_json(healed_graph)
        
        # PHASE III: Centrality Analysis
        logger.info("Phase III: Centrality analysis...")
        analysis = get_centrality_analysis()
        centrality_result = analysis.compute_centrality(graph_json, algorithm=algorithm)
        
        # PHASE III: Ablation Simulation
        logger.info("Phase III: Node ablation simulation...")
        simulator = get_ablation_simulator()
        ablation_result = simulator.simulate(centrality_result['graph'])
        
        # Clean up
        temp_path.unlink()
        mask_path.unlink()
        
        # Compile results
        result = {
            'success': True,
            'segmentation': {
                'threshold': threshold,
                'mask_stats': seg_result.get('stats', {})
            },
            'graph': {
                'nodes_count': len(centrality_result['graph']['nodes']),
                'edges_count': len(centrality_result['graph']['edges']),
                'healed': True,
                'max_gap_used': max_gap
            },
            'centrality': {
                'algorithm': algorithm,
                'gatekeeper_nodes': centrality_result['gatekeeper_nodes']
            },
            'resilience': ablation_result,
            'data': {
                'graph': centrality_result['graph'],
                'detailed_metrics': ablation_result
            }
        }
        
        logger.info("Full pipeline completed successfully")
        
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Full pipeline error: {str(e)}\n{traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500


# ========================================
# OSM DATA & DEMO (Real Data Integration)
# ========================================

@app.route('/api/osm/load', methods=['GET'])
@limiter.limit("10 per minute")
def load_osm_data():
    """
    Load OpenStreetMap data for a location
    
    Query params:
        - location: Place name (e.g., "Bengaluru, India")
        - lat: Latitude (alternative to location)
        - lon: Longitude (alternative to location)
        - radius: Radius in meters (if using lat/lon)
        - network_type: 'drive', 'walk', 'bike', 'all' (default: drive)
    
    Response:
        - Road network graph with real data
    """
    try:
        location = request.args.get('location')
        lat = request.args.get('lat', type=float)
        lon = request.args.get('lon', type=float)
        radius = request.args.get('radius', type=int, default=5000)
        network_type = request.args.get('network_type', 'drive')
        
        # Check cache
        cache_key = f"osm_{location or f'{lat}_{lon}'}_{radius}_{network_type}"
        if cache_manager and cache_manager.has(cache_key):
            logger.info(f"Returning cached OSM data for {cache_key}")
            return jsonify(cache_manager.get(cache_key))
        
        logger.info(f"Loading OSM data: location={location}, lat={lat}, lon={lon}")
        
        # Load OSM data
        loader = get_osm_loader()
        
        if location:
            graph = loader.load_by_place(location, network_type=network_type)
        elif lat and lon:
            graph = loader.load_by_point(lat, lon, radius=radius, network_type=network_type)
        else:
            return jsonify({'error': 'Provide either location or lat/lon'}), 400
        
        # Convert to JSON
        pipeline = get_graph_pipeline()
        graph_json = pipeline.graph_to_json(graph)
        
        # Cache result
        if cache_manager:
            cache_manager.set(cache_key, graph_json)
        
        return jsonify(graph_json)
    
    except Exception as e:
        logger.error(f"OSM load error: {str(e)}\n{traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/graph/shortest_path', methods=['POST'])
def get_shortest_path():
    """
    Calculate the shortest path between two nodes
    """
    try:
        data = request.json
        if not data or 'graph' not in data or 'source' not in data or 'target' not in data:
            return jsonify({'error': 'Missing required fields: graph, source, target'}), 400
            
        pipeline = get_graph_pipeline()
        G = pipeline.json_to_graph(data['graph'])
        
        source = str(data['source'])
        target = str(data['target'])
        
        if source not in G.nodes or target not in G.nodes:
            return jsonify({'error': 'Source or target node not found in graph'}), 404
            
        try:
            # Calculate shortest path using weight='length'
            import networkx as nx
            path = nx.shortest_path(G, source=source, target=target, weight='length')
            distance = nx.shortest_path_length(G, source=source, target=target, weight='length')
            
            return jsonify({
                'path': [str(node) for node in path],
                'distance': float(distance)
            })
        except Exception as e:
            if type(e).__name__ == 'NetworkXNoPath':
                return jsonify({'error': 'No path exists between the selected nodes'}), 404
            raise e
            
    except Exception as e:
        logger.error(f"Shortest path error: {str(e)}\n{traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/demo/bengaluru', methods=['GET'])
def demo_bengaluru():
    """
    Load complete Bengaluru demo with full analysis
    
    Response:
        - Complete analyzed road network for Bengaluru
        - Pre-computed centrality and resilience metrics
    """
    try:
        # Check cache
        cache_key = "demo_bengaluru_complete"
        if cache_manager and cache_manager.has(cache_key):
            logger.info("Returning cached Bengaluru demo")
            return jsonify(cache_manager.get(cache_key))
        
        logger.info("Loading Bengaluru demo...")
        
        # Load OSM data
        loader = get_osm_loader()
        graph = loader.load_by_place(config.DEMO_CITY, network_type='drive')
        
        # Convert to JSON
        pipeline = get_graph_pipeline()
        graph_json = pipeline.graph_to_json(graph)
        
        # Run centrality analysis
        analysis = get_centrality_analysis()
        centrality_result = analysis.compute_centrality(graph_json)
        
        # Run ablation simulation
        simulator = get_ablation_simulator()
        ablation_result = simulator.simulate(centrality_result['graph'])
        
        # Compile demo result
        demo_result = {
            'location': config.DEMO_CITY,
            'center': {
                'lat': config.DEMO_CENTER_LAT,
                'lon': config.DEMO_CENTER_LON
            },
            'stats': {
                'nodes': len(centrality_result['graph']['nodes']),
                'edges': len(centrality_result['graph']['edges'])
            },
            'graph': centrality_result['graph'],
            'gatekeeper_nodes': centrality_result['gatekeeper_nodes'],
            'resilience': ablation_result,
            'description': 'Pre-analyzed Bengaluru road network with criticality scores'
        }
        
        # Cache for future requests
        if cache_manager:
            cache_manager.set(cache_key, demo_result)
        
        logger.info("Bengaluru demo loaded successfully")
        
        return jsonify(demo_result)
    
    except Exception as e:
        logger.error(f"Bengaluru demo error: {str(e)}\n{traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

# ========================================
# ERROR HANDLERS
# ========================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({'error': 'Internal server error'}), 500


@app.errorhandler(413)
def too_large(error):
    return jsonify({'error': f'File too large. Maximum size: {config.MAX_UPLOAD_SIZE / (1024*1024)}MB'}), 413


# ========================================
# MAIN
# ========================================

if __name__ == '__main__':
    # Validate configuration
    print("\nStarting AstroRoute API...\n")
    config.print_config()
    config.validate()
    
    print(f"\nServer starting on http://{config.API_HOST}:{config.API_PORT}")
    print("Available endpoints: /api/health, /api/info, /api/demo/bengaluru, /api/osm/load")
    print("   (ML endpoints require PyTorch + HuggingFace token)\n")
    
    # Run Flask app
    app.run(
        host=config.API_HOST,
        port=config.API_PORT,
        debug=config.FLASK_DEBUG
    )
