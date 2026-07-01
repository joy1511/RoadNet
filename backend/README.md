# AstroRoute - Backend API

Production-ready Flask API implementing complete AstroRoute analysis pipeline.

---

## 🎯 What It Does

This backend implements the complete AstroRoute pipeline:

1. **Phase I (Friend 1+2):** Road segmentation from satellite imagery with HuggingFace integration
2. **Phase II (Friend 3):** Graph extraction, skeletonization, and healing
3. **Phase III (Friend 3+1):** Centrality analysis and node ablation simulation  
4. **Data Integration (Friend 2):** OpenStreetMap integration for real road networks

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy example env file
copy .env.example .env

# Edit .env and add your tokens
# REQUIRED:
#   - HUGGINGFACE_TOKEN
#   - HF_SEGMENTATION_MODEL
```

### 3. Run Server

```bash
python app.py
```

Server starts at: `http://localhost:5000`

---

## 📡 API Endpoints

### Health & Info

```
GET  /api/health              - Health check
GET  /api/info                - API capabilities
```

### Phase I - Segmentation

```
POST /api/segment
    - Body: multipart/form-data
    - Fields:
        file: Image file (PNG/JPG/TIFF)
        threshold: float (0-1, default: 0.5)
        return_format: 'image' | 'geojson'
    - Returns: Binary road mask
```

### Phase II - Graph Processing

```
POST /api/graph/extract
    - Body: multipart/form-data
    - Fields:
        file: Binary mask image
        simplify: bool (default: true)
    - Returns: Graph JSON

POST /api/graph/heal
    - Body: application/json
    - Fields:
        graph: Graph JSON from extract
        max_gap: float (default: from config)
    - Returns: Healed graph JSON
```

### Phase III - Centrality & Ablation

```
POST /api/centrality
    - Body: application/json
    - Fields:
        graph: Graph JSON
        algorithm: 'betweenness' | 'closeness' | 'eigenvector'
        top_n: int (default: 20)
    - Returns: Graph with centrality scores + gatekeeper nodes

POST /api/ablation/simulate
    - Body: application/json
    - Fields:
        graph: Graph JSON with centrality
        nodes_to_remove: array (optional)
        iterations: int (default: 10)
    - Returns: Resilience analysis
```

### Complete Pipeline

```
POST /api/pipeline/full
    - Body: multipart/form-data
    - Fields:
        file: Satellite image
        threshold: float
        max_gap: float
        centrality_algorithm: string
    - Returns: Complete analysis (all phases)
```

### OSM Integration

```
GET /api/osm/load
    - Query params:
        location: string (e.g., "Bengaluru, India")
        OR
        lat: float
        lon: float
        radius: int (meters)
    - Returns: Real OSM road network

GET /api/demo/bengaluru
    - Returns: Pre-analyzed Bengaluru demo with full metrics
```

---

## 📁 Project Structure

```
backend/
├── app.py                     # Main Flask server
├── config.py                  # Configuration management
├── requirements.txt           # Dependencies
│
├── models/                    # Phase I - Segmentation
│   ├── segmentation_api.py   # HuggingFace integration
│   └── __init__.py
│
├── graph/                     # Phase II & III - Graph analysis
│   ├── pipeline.py           # Complete graph pipeline
│   ├── skeletonize.py        # Mask to centerline
│   ├── healing.py            # MST + Disjoint Set
│   ├── centrality_analysis.py # Betweenness centrality
│   ├── ablation.py           # Node removal simulation
│   └── __init__.py
│
├── data/                      # Data management
│   ├── osm_loader.py         # OpenStreetMap integration
│   └── __init__.py
│
└── utils/                     # Utilities
    ├── validators.py         # Input validation
    ├── cache_manager.py      # Caching system
    ├── metrics.py            # Evaluation metrics
    └── __init__.py
```

---

## 🔧 Configuration

All configuration via environment variables in `.env`:

### Required
```bash
HUGGINGFACE_TOKEN=hf_xxxxx
HF_SEGMENTATION_MODEL=your-username/road-segmentation-unet
```

### Optional
```bash
# API Config
API_PORT=5000
CORS_ORIGINS=http://localhost:3000

# Model Config
DEVICE=auto  # or 'cuda' / 'cpu'
SEGMENTATION_THRESHOLD=0.5

# Graph Processing
MAX_GAP_DISTANCE=50
ANGULAR_THRESHOLD=45
TOP_N_CRITICAL_NODES=20

# Caching
ENABLE_CACHE=True
CACHE_TTL=3600
```

---

## 🧪 Testing

Each module has self-test functionality:

```bash
# Test segmentation API
python models/segmentation_api.py

# Test graph pipeline
python graph/pipeline.py

# Test OSM loader
python data/osm_loader.py

# Test validators
python utils/validators.py
```

---

## 📊 Model Requirements

You need to train and deploy ONE model to HuggingFace:

1. **Road Segmentation Model** (U-Net or DeepLabV3+)
   - Input: RGB satellite image
   - Output: Binary road mask
   - Training data: DeepGlobe / SpaceNet

See `../MODELS_TO_TRAIN.md` for detailed training instructions.

---

## 🐛 Debugging

### Enable Debug Mode

```bash
# In .env
FLASK_DEBUG=True
LOG_LEVEL=DEBUG
```

### Check Logs

```bash
# Logs are written to
backend/logs/app.log
```

### Common Issues

**Issue:** Model not loading  
**Solution:** Check `HUGGINGFACE_TOKEN` and `HF_SEGMENTATION_MODEL` in .env

**Issue:** OSM download fails  
**Solution:** Check internet connection, try smaller radius

**Issue:** Out of memory  
**Solution:** Reduce `BATCH_SIZE` in config

---

## 📈 Performance

### Expected Response Times (CPU)
- Segmentation: 0.5-2s per 512x512 image
- Graph extraction: 0.2-1s per mask
- Centrality: 0.5-3s depending on graph size
- Ablation: 1-5s for 10 iterations

### With GPU
- Segmentation: 0.1-0.3s per image
- Other operations: Same (CPU-bound)

---

## 🚢 Deployment

### Development
```bash
python app.py
```

### Production (with Gunicorn)
```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Docker (Optional)
```dockerfile
FROM python:3.9
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

---

## 🔒 Security

- Input validation on all endpoints
- File size limits enforced
- Rate limiting enabled
- CORS configured
- No secrets in code (all in .env)

---

## 📚 Dependencies

See `requirements.txt` for full list. Key dependencies:

- **Flask** - API server
- **PyTorch** - Deep learning
- **NetworkX** - Graph analysis
- **OSMnx** - OpenStreetMap integration
- **HuggingFace Hub** - Model deployment
- **scikit-image** - Image processing

---

## 💡 Tips

1. **Use caching** - Speeds up repeated OSM queries
2. **Start with demo** - Test with `/api/demo/bengaluru` first
3. **Monitor logs** - Check `logs/app.log` for issues
4. **Test locally** - Use small images/areas for quick iteration

---

## 🤝 Contributing

For production deployment, consider adding:

1. Add authentication
2. Add database for persistence
3. Add comprehensive error handling
4. Add rate limiting per user
5. Add monitoring (Sentry, etc.)

---

## 📄 License

MIT License - Open source road network resilience analysis system

---

## 🆘 Support

Check the main project documentation:
- `../README.md` - Project overview
- `../SETUP.md` - Getting started guide
- `../PROJECT_STATUS.md` - Current status and features
