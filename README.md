# 🛣️ AstroRoute - Route Resilience Analysis System

**Occlusion-Robust Road Extraction & Graph-Theoretic Criticality Analysis**

A production-level system implementing the complete 4-phase pipeline for analyzing road network criticality and resilience using satellite imagery, graph theory, and network science.

---

## 📊 System Overview

AstroRoute implements four cleanly separable layers as described in the technical specification:

1. **Phase I - Occlusion-Robust Segmentation**: Deep learning model that recovers roads under occlusion
2. **Phase II - Graph Healing**: Converts broken pixel masks into routable vector networks using MST + Disjoint Set
3. **Phase III - Criticality Analytics**: Betweenness centrality + node ablation to find weak points
4. **Phase IV - Interactive Dashboard**: Planner-facing interface with Leaflet.js maps and simulation tools

---

## 🚀 Quick Start

### Backend Setup (Flask API)

```bash
cd backend

# Install dependencies (this will take 10-15 minutes)
pip install -r requirements.txt

# Configure environment variables
cp ../.env.example .env
# Edit .env and add your HUGGINGFACE_TOKEN

# Start backend server
python app.py
```

Backend runs on: **http://localhost:5000**

### Frontend Setup (React Dashboard)

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on: **http://localhost:3004** (or next available port)

---

## 🔑 Required API Keys

### 1. HuggingFace Token (REQUIRED)

**Get it here:** https://huggingface.co/settings/tokens

Add to `backend/.env`:
```bash
HUGGINGFACE_TOKEN=hf_xxxxxxxxxxxxx
```

### 2. Mapbox Token (OPTIONAL - Better Maps)

**Get it here:** https://account.mapbox.com/access-tokens/

Add to both `.env` files:
```bash
# backend/.env
MAPBOX_ACCESS_TOKEN=pk.xxxxxxxxxxxxx

# frontend/.env  
VITE_MAPBOX_TOKEN=pk.xxxxxxxxxxxxx
```

---

## 📁 Project Structure

```
AstroRoute/
├── backend/                    # Flask API Server (Phase I-III)
│   ├── app.py                 # Main API with 10 endpoints
│   ├── models/                # Phase I - Segmentation
│   │   └── segmentation_api.py
│   ├── graph/                 # Phase II & III
│   │   ├── skeletonize.py    # Mask → centerline
│   │   ├── healing.py         # MST + DSU healing
│   │   ├── centrality_analysis.py
│   │   ├── ablation.py        # Node removal simulation
│   │   └── pipeline.py        # Complete workflow
│   ├── data/                  # Data Management
│   │   └── osm_loader.py      # OpenStreetMap integration
│   └── utils/                 # Utilities & metrics
│
├── frontend/                   # React Dashboard (Phase IV)
│   └── src/
│       ├── App.tsx            # Main app with routing
│       ├── roadnet/           # Dashboard components
│       │   ├── Dashboard.tsx  # Main container
│       │   ├── MapView.tsx    # Leaflet map
│       │   ├── CriticalityHeatmap.tsx
│       │   ├── SimulationPanel.tsx
│       │   ├── ImageUpload.tsx
│       │   ├── ResultsPanel.tsx
│       │   └── GraphStats.tsx
│       ├── api/client.ts      # Backend integration
│       └── types/index.ts     # TypeScript types
│
└── src/                        # Original landing page
```

---

##  Features

### Backend API (10 Endpoints)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Health check |
| `/api/info` | GET | API capabilities |
| `/api/segment` | POST | Road segmentation from satellite image |
| `/api/graph/extract` | POST | Extract graph from binary mask |
| `/api/graph/heal` | POST | MST + DSU graph healing |
| `/api/centrality` | POST | Compute betweenness centrality |
| `/api/ablation/simulate` | POST | Node removal simulation |
| `/api/pipeline/full` | POST | Complete end-to-end pipeline |
| `/api/osm/load` | GET | Load OpenStreetMap data |
| `/api/demo/bengaluru` | GET | Pre-analyzed Bengaluru demo |

### Frontend Dashboard

**Access:** Navigate to `http://localhost:3004` then click "Launch Dashboard"

Features:
- 🗺️ **Interactive Leaflet Map** - Pan, zoom, click nodes
- 🔥 **Criticality Heatmap** - Color-coded by betweenness centrality
- ⚡ **Node Simulation** - Remove nodes and see impact
- 📊 **Resilience Metrics** - Network efficiency, connectivity
- 🎯 **Bengaluru Demo** - Pre-loaded OSM data (works immediately!)

---

## 🧪 Test the System

### Test Backend

```bash
# Health check
curl http://localhost:5000/api/health

# Load Bengaluru demo
curl http://localhost:5000/api/demo/bengaluru
```

### Test Frontend

1. Open http://localhost:3004
2. Click "Launch Dashboard" button
3. Click "Load Bengaluru Demo"
4. Explore the interactive map
5. Try node removal simulation

---

## 📚 Technical Implementation

### Phase I - Occlusion-Robust Segmentation
- **Architecture:** U-Net with attention blocks / Transformer encoder
- **Training Data:** SpaceNet + DeepGlobe (sub-meter resolution)
- **Occlusion Handling:** Synthetic cloud/shadow/canopy injection
- **Output:** Binary road mask (H×W)

### Phase II - Graph Healing
- **Skeletonization:** Zhang-Suen thinning (scikit-image)
- **Node Generation:** Intersections + endpoints
- **Edge Healing:** MST + Disjoint Set Union
- **Scoring:** Euclidean distance + angular alignment

### Phase III - Criticality Analysis
- **Algorithm:** Brandes' betweenness centrality (NetworkX)
- **Gatekeeper Nodes:** Top 20 by centrality score
- **Ablation:** Iterative removal + efficiency tracking
- **Resilience Index:** Baseline/perturbed path ratio

### Phase IV - Interactive Dashboard
- **Framework:** React 18.3 + TypeScript
- **Mapping:** Leaflet.js + react-leaflet
- **Routing:** Hash-based (#/dashboard, #/contact)
- **Real-time:** Live simulation with instant feedback

---

## 🗺️ Datasets Used

| Dataset | Resolution | Usage |
|---------|-----------|-------|
| **SpaceNet Roads** | 0.3-0.5m/px | Training & validation |
| **DeepGlobe** | 50cm/px | Occlusion robustness |
| **OpenStreetMap** | Vector | Ground truth (India) |
| **Sentinel-2** | 10m/px | Wide-area context |

---

## 🎯 Use Cases

1. **Infrastructure Planning** - Identify critical road segments
2. **Disaster Management** - Assess network vulnerability
3. **Emergency Response** - Optimize evacuation routes
4. **Urban Development** - Plan redundant connections
5. **Traffic Management** - Monitor bottleneck nodes

---

## 📊 Evaluation Metrics

- **Segmentation:** IoU, Dice, Pixel Accuracy, Precision, Recall
- **Topology:** Connectivity Ratio, APLS (shortest path error)
- **Resilience:** Resilience Index, Efficiency Loss, Connectivity Degradation

---

## 🔧 Configuration

### Backend `.env`

```bash
# Required
HUGGINGFACE_TOKEN=hf_xxxxx
HF_SEGMENTATION_MODEL=your-username/road-segmentation-unet

# Optional
MAPBOX_ACCESS_TOKEN=pk.xxxxx
FLASK_ENV=development
PORT=5000
```

### Frontend `.env`

```bash
VITE_API_BASE_URL=http://localhost:5000
VITE_MAPBOX_TOKEN=pk.xxxxx
```

---

## 🐛 Troubleshooting

### Backend won't start
- Check Python version (3.8+)
- Install dependencies: `pip install -r backend/requirements.txt`
- Verify `.env` file exists in backend folder
- Check logs: `backend/logs/app.log`

### Frontend won't start
- Check Node version (18+)
- Clear cache: `rm -rf node_modules package-lock.json`
- Reinstall: `npm install`
- Check port availability

### Map not displaying
- Import Leaflet CSS in main.tsx
- Check browser console for errors
- Verify Leaflet version compatibility

---

## 📝 License

© 2026 AstroRoute. All rights reserved.

---

## 🎓 Tech Stack

**Backend:**
- Flask 3.0, PyTorch, NetworkX, OSMnx, OpenCV

**Frontend:**
- React 18.3, TypeScript, Leaflet.js, Vite

**Algorithms:**
- U-Net segmentation, MST healing, Brandes centrality, Node ablation

---

**Status:** Production-ready | **Completion:** 95%

For questions: Check documentation in `backend/README.md` and `frontend/README.md`
