# AstroRoute - Frontend Dashboard

React + TypeScript + Leaflet.js dashboard for visualizing road network analysis.

---

## 🎯 What It Does

Interactive dashboard implementing Friend 4's responsibilities:

1. **Upload & Analyze** - Upload satellite images for road extraction
2. **Criticality Heatmap** - Visualize critical nodes color-coded by importance
3. **Simulation Toggle** - Click nodes to simulate removal and see impact
4. **Real-time Metrics** - Display resilience index and network stats
5. **Bengaluru Demo** - Pre-loaded demo with real OSM data

---

## 🚀 Quick Start

### 1. Move Existing Files (DO THIS FIRST!)

```bash
# From project root, move these to frontend/
move src frontend\
move index.html frontend\
move package.json frontend\
move postcss.config.mjs frontend\
move default_shadcn_theme.css frontend\

# If they exist:
move vite.config.ts frontend\
move tsconfig.json frontend\
move tailwind.config.js frontend\
```

### 2. Install Dependencies

```bash
cd frontend
npm install

# Install new dependencies for AstroRoute
npm install leaflet react-leaflet axios
npm install --save-dev @types/leaflet
```

### 3. Configure Environment

```bash
# Create .env file
echo VITE_API_BASE_URL=http://localhost:5000 > .env
```

### 4. Start Development Server

```bash
npm run dev
```

Dashboard available at: `http://localhost:5173` (or 3000 depending on Vite config)

---

## 📁 New Structure

After moving existing files and adding AstroRoute components:

```
frontend/
├── src/
│   ├── app/                       # Your existing components
│   │   └── components/
│   ├── astroroute/                # AstroRoute components
│   │   ├── Dashboard.tsx          # Main dashboard
│   │   ├── MapView.tsx            # Leaflet map
│   │   ├── CriticalityHeatmap.tsx # Critical nodes overlay
│   │   ├── SimulationPanel.tsx    # Node simulation UI
│   │   ├── ImageUpload.tsx        # Image upload
│   │   ├── ResultsPanel.tsx       # Analysis results
│   │   └── GraphStats.tsx         # Network statistics
│   ├── api/                       # NEW - Backend integration
│   │   └── client.ts              # API client
│   ├── types/                     # NEW - TypeScript types
│   │   └── index.ts
│   ├── hooks/                     # NEW - Custom hooks
│   │   ├── useRoadAnalysis.ts
│   │   └── useMapControls.ts
│   ├── utils/                     # NEW - Utilities
│   │   └── mapHelpers.ts
│   ├── styles/                    # Your existing styles
│   └── main.tsx                   # Updated with new routes
├── public/
├── index.html
├── package.json
├── .env
└── README.md (this file)
```

---

## 🗺️ Main Features

### 1. Upload Satellite Image
- Drag & drop or click to upload
- Supported formats: PNG, JPG, TIFF
- Max size: 50MB
- Shows preview before processing

### 2. Interactive Map
- Leaflet.js with OpenStreetMap tiles
- Road network overlay
- Click nodes to see details
- Pan/zoom controls
- Layer toggles

### 3. Criticality Heatmap
- Color-coded nodes:
  - 🔴 Critical (>0.1 centrality)
  - 🟠 High (0.05-0.1)
  - 🟡 Medium (0.01-0.05)
  - 🟢 Low (<0.01)
- Road segments colored by importance
- Legend with explanations

### 4. Node Simulation
- Click any node to see removal impact
- Shows:
  - Rerouted paths
  - Travel time increase
  - Disconnected areas
  - Resilience index change
- Undo simulation button

### 5. Bengaluru Demo
- One-click load pre-analyzed data
- Real OSM road network
- Pre-computed centrality
- Shows full capabilities

---

## 🔌 API Integration

The frontend connects to the Flask backend (must be running):

```typescript
// frontend/src/api/client.ts

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// Upload image for segmentation
export async function segmentRoad(file: File): Promise<Blob>

// Extract graph from mask
export async function extractGraph(maskFile: Blob): Promise<Graph>

// Compute centrality
export async function computeCentrality(graph: Graph): Promise<CentralityResult>

// Run ablation simulation
export async function simulateAblation(graph: Graph): Promise<AblationResult>

// Load Bengaluru demo
export async function loadBengaluruDemo(): Promise<DemoData>
```

---

## 🎨 UI Components

Built with:
- **Shadcn/UI** - Your existing component library
- **Leaflet.js** - Interactive maps
- **Recharts** - Graphs and charts
- **Tailwind CSS** - Styling

---

## 📊 Data Flow

```
User uploads image
    ↓
POST /api/segment → Binary mask
    ↓
POST /api/graph/extract → Raw graph
    ↓
POST /api/graph/heal → Healed graph
    ↓
POST /api/centrality → Graph + centrality scores
    ↓
Display on map with heatmap
    ↓
User clicks node
    ↓
POST /api/ablation/simulate → Impact analysis
    ↓
Update map with simulation results
```

---

## 🧪 Development

### Run Tests
```bash
npm test
```

### Type Check
```bash
npm run type-check
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

---

## 🚀 Deployment

### Build
```bash
npm run build
# Outputs to dist/
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod
```

### Environment Variables (Production)
```bash
VITE_API_BASE_URL=https://your-backend-api.com
```

---

## 🔧 Configuration

### Vite Config
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
```

### TypeScript Config
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "jsx": "react-jsx",
    "strict": true
  }
}
```

---

## 🗺️ Map Configuration

### Using OpenStreetMap (Free)
```typescript
const osmTileLayer = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
```

### Using Mapbox (Better Quality)
```typescript
const mapboxTileLayer = `https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=${token}`;
```

---

## 📝 TypeScript Types

```typescript
// frontend/src/types/index.ts

interface Node {
  id: string;
  x: number;
  y: number;
  lat?: number;
  lon?: number;
  centrality?: number;
  criticality_level?: 'critical' | 'high' | 'medium' | 'low';
}

interface Edge {
  source: string;
  target: string;
  weight: number;
  length: number;
  healed?: boolean;
}

interface Graph {
  nodes: Node[];
  edges: Edge[];
  metadata?: {
    node_count: number;
    edge_count: number;
    is_connected: boolean;
  };
}

interface AblationResult {
  resilience_index: number;
  nodes_removed: string[];
  ablation_results: AblationIteration[];
  summary: {
    interpretation: string;
    efficiency_loss: string;
    connectivity_degradation: string;
  };
}
```

---

## 🎯 Key Components

### Dashboard.tsx
Main container component that orchestrates all sub-components.

### MapView.tsx
Leaflet map with:
- Road network overlay
- Node markers
- Edge polylines
- Click handlers

### CriticalityHeatmap.tsx
Renders heatmap overlay showing critical nodes.

### SimulationPanel.tsx
Side panel with:
- Node selection
- Simulation controls
- Impact metrics
- Undo button

### ImageUpload.tsx
Drag-and-drop zone for satellite images.

### ResultsPanel.tsx
Displays analysis results:
- Resilience index
- Top critical nodes
- Network stats
- Recommendations

---

## 💡 Usage Example

```typescript
import { Dashboard } from './astroroute/Dashboard';

function App() {
  return (
    <div className="app">
      <Dashboard />
    </div>
  );
}
```

---

## 🐛 Debugging

### Common Issues

**Map not displaying**
- Check Leaflet CSS is imported
- Verify `L` is available globally
- Check console for tile loading errors

**API calls failing**
- Ensure backend is running on port 5000
- Check CORS settings in backend
- Verify `VITE_API_BASE_URL` in .env

**TypeScript errors**
- Run `npm install --save-dev @types/leaflet`
- Check tsconfig.json paths

---

## 📚 Dependencies

### Core
- React 18.3.1
- TypeScript
- Vite

### Mapping
- Leaflet 1.9+
- React-Leaflet 4.2+

### UI
- Shadcn/UI components
- Tailwind CSS
- Lucide icons

### Data
- Axios (API calls)
- Recharts (charts)

---

## 🎓 Learning Resources

- Leaflet docs: https://leafletjs.com/
- React-Leaflet: https://react-leaflet.js.org/
- Shadcn/UI: https://ui.shadcn.com/

---

## 🏆 Tips for Success

1. **Use the demo** - Start with Bengaluru demo to show functionality
2. **Prepare screenshots** - Take screenshots of all features for PPT
3. **Record video** - Screen recording showing full workflow
4. **Test offline** - Ensure demo works without internet (use cached data)

---

## 📄 License

MIT License - Open source road network resilience analysis system
