import os

app_path = r'C:\Users\JOY\OneDrive\Desktop\RoadNet\backend\app.py'

with open(app_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find where get_osm_data gets mangled
for i, line in enumerate(lines):
    if "network_type = request.args.get('network_type', 'drive')" in line:
        start_idx = i + 1
        break

# Find where the error handlers start
for i, line in enumerate(lines):
    if "ERROR HANDLERS" in line:
        end_idx = i - 1
        break

new_content = """        
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
        logger.error(f"OSM load error: {str(e)}\\n{traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/graph/shortest_path', methods=['POST'])
def get_shortest_path():
    \"\"\"
    Calculate the shortest path between two nodes
    \"\"\"
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
        logger.error(f"Shortest path error: {str(e)}\\n{traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/demo/bengaluru', methods=['GET'])
def demo_bengaluru():
    \"\"\"
    Load complete Bengaluru demo with full analysis
    
    Response:
        - Complete analyzed road network for Bengaluru
        - Pre-computed centrality and resilience metrics
    \"\"\"
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
        logger.error(f"Bengaluru demo error: {str(e)}\\n{traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

"""

new_lines = lines[:start_idx] + [new_content] + lines[end_idx:]

with open(app_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Fixed app.py successfully")
