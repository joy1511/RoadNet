"""
Configuration Management
Loads environment variables and provides application configuration
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Lazy torch import - backend should start even without ML dependencies
_torch_available = False
try:
    import torch
    _torch_available = True
except ImportError:
    pass


class Config:
    """Application configuration"""
    
    # ========================================
    # BASE PATHS
    # ========================================
    BASE_DIR = Path(__file__).parent
    ROOT_DIR = BASE_DIR.parent
    
    # ========================================
    # HUGGING FACE CONFIGURATION
    # ========================================
    HUGGINGFACE_TOKEN = os.getenv('HUGGINGFACE_TOKEN')
    HF_SEGMENTATION_MODEL = os.getenv('HF_SEGMENTATION_MODEL', 'your-username/road-segmentation-model')
    HF_OCCLUSION_MODEL = os.getenv('HF_OCCLUSION_MODEL', None)
    
    # ========================================
    # API CONFIGURATION
    # ========================================
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    FLASK_DEBUG = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    API_PORT = int(os.getenv('API_PORT', 5000))
    API_HOST = os.getenv('API_HOST', '0.0.0.0')
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://localhost:5173').split(',')
    
    # ========================================
    # EXTERNAL APIS
    # ========================================
    OSM_API_URL = os.getenv('OSM_API_URL', 'https://overpass-api.de/api/interpreter')
    
    # ========================================
    # MODEL CONFIGURATION
    # ========================================
    DEVICE_PREFERENCE = os.getenv('DEVICE', 'auto')
    
    @property
    def DEVICE(self):
        """Auto-detect best available device"""
        if not _torch_available:
            return 'cpu'
        if self.DEVICE_PREFERENCE == 'auto':
            return torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        return torch.device(self.DEVICE_PREFERENCE)
    
    SEGMENTATION_THRESHOLD = float(os.getenv('SEGMENTATION_THRESHOLD', 0.5))
    BATCH_SIZE = int(os.getenv('BATCH_SIZE', 4))
    MAX_IMAGE_SIZE = int(os.getenv('MAX_IMAGE_SIZE', 2048))
    
    # ========================================
    # GRAPH PROCESSING CONFIGURATION
    # ========================================
    MIN_EDGE_LENGTH = float(os.getenv('MIN_EDGE_LENGTH', 5))
    MAX_GAP_DISTANCE = float(os.getenv('MAX_GAP_DISTANCE', 50))
    ANGULAR_THRESHOLD = float(os.getenv('ANGULAR_THRESHOLD', 45))
    
    CENTRALITY_ALGORITHM = os.getenv('CENTRALITY_ALGORITHM', 'betweenness')
    CENTRALITY_WEIGHT = os.getenv('CENTRALITY_WEIGHT', 'length')
    
    TOP_N_CRITICAL_NODES = int(os.getenv('TOP_N_CRITICAL_NODES', 20))
    ABLATION_ITERATIONS = int(os.getenv('ABLATION_ITERATIONS', 10))
    
    # ========================================
    # DIRECTORIES
    # ========================================
    DATA_DIR = BASE_DIR / os.getenv('DATA_DIR', 'data')
    CACHE_DIR = BASE_DIR / os.getenv('CACHE_DIR', 'cache')
    RESULTS_DIR = BASE_DIR / os.getenv('RESULTS_DIR', 'results')
    TEMP_DIR = BASE_DIR / os.getenv('TEMP_DIR', 'temp')
    
    # ========================================
    # CACHE SETTINGS
    # ========================================
    ENABLE_CACHE = os.getenv('ENABLE_CACHE', 'True').lower() == 'true'
    CACHE_TTL = int(os.getenv('CACHE_TTL', 3600))
    
    # ========================================
    # LOGGING
    # ========================================
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = BASE_DIR / os.getenv('LOG_FILE', 'logs/app.log')
    
    # ========================================
    # SECURITY & RATE LIMITING
    # ========================================
    RATE_LIMIT_ENABLED = os.getenv('RATE_LIMIT_ENABLED', 'True').lower() == 'true'
    RATE_LIMIT_REQUESTS = int(os.getenv('RATE_LIMIT_REQUESTS', 100))
    RATE_LIMIT_PERIOD = int(os.getenv('RATE_LIMIT_PERIOD', 60))
    
    MAX_UPLOAD_SIZE = int(os.getenv('MAX_UPLOAD_SIZE', 50)) * 1024 * 1024  # Convert MB to bytes
    ALLOWED_EXTENSIONS = set(os.getenv('ALLOWED_EXTENSIONS', 'png,jpg,jpeg,tif,tiff').split(','))
    
    # ========================================
    # DEMO CONFIGURATION
    # ========================================
    DEMO_CITY = os.getenv('DEMO_CITY', 'Bengaluru, India')
    DEMO_CENTER_LAT = float(os.getenv('DEMO_CENTER_LAT', 12.9716))
    DEMO_CENTER_LON = float(os.getenv('DEMO_CENTER_LON', 77.5946))
    DEMO_RADIUS_KM = float(os.getenv('DEMO_RADIUS_KM', 10))
    
    def __init__(self):
        # Create directories if they don't exist
        for dir_path in [self.DATA_DIR, self.CACHE_DIR, self.RESULTS_DIR, self.TEMP_DIR]:
            dir_path.mkdir(parents=True, exist_ok=True)
            
        # Ensure log directory exists
        self.LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    
    @classmethod
    def validate(cls):
        """Validate configuration - warnings only, never blocks startup"""
        warnings = []
        
        if not cls.HUGGINGFACE_TOKEN:
            warnings.append("WARNING: HUGGINGFACE_TOKEN not set - segmentation endpoints require this")
        
        if not cls.HF_SEGMENTATION_MODEL or 'your-username' in cls.HF_SEGMENTATION_MODEL:
            warnings.append("WARNING: HF_SEGMENTATION_MODEL not configured - using fallback weights")
        
        if not _torch_available:
            warnings.append("WARNING: PyTorch not installed - ML endpoints will not work")
        
        if warnings:
            print("\n".join(warnings))
            print("\nOSM demo and graph analysis endpoints will still work.")
        else:
            print("All configurations valid.")
        
        # Always return True so the server starts
        return True
    
    @classmethod
    def print_config(cls):
        """Print current configuration (for debugging)"""
        print("=" * 50)
        print("ASTROROUTE - CONFIGURATION")
        print("=" * 50)
        print(f"Environment: {cls.FLASK_ENV}")
        print(f"Device: {cls().DEVICE}")
        print(f"API Port: {cls.API_PORT}")
        print(f"Segmentation Model: {cls.HF_SEGMENTATION_MODEL}")
        print(f"Cache Enabled: {cls.ENABLE_CACHE}")
        print(f"Data Directory: {cls.DATA_DIR}")
        print(f"PyTorch Available: {_torch_available}")
        print("=" * 50)


# Create a global config instance
config = Config()

if __name__ == '__main__':
    # Test configuration
    config.print_config()
    config.validate()
