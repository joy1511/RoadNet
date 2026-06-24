import { motion } from 'motion/react';
import { useInView } from './hooks/useInView';
import { Users, Code, Database, TrendingUp, Layout } from 'lucide-react';

export function TeamWorkSplit() {
  const [ref, isInView] = useInView({ threshold: 0.1 });

  const team = [
    {
      role: 'Friend 1',
      title: 'Segmentation Modelling + Resilience Testing',
      icon: Code,
      color: 'from-blue-500 to-cyan-500',
      responsibilities: [
        'Build baseline U-Net/DeepLabV3+ on SpaceNet+DeepGlobe',
        'Upgrade to context-aware architecture (attention/Transformer)',
        'Implement Node Ablation Simulation',
        'Calculate Resilience Index',
        'Export masks and ablation results',
      ],
      tools: ['PyTorch', 'Albumentations', 'NetworkX', 'U-Net/ResNet'],
    },
    {
      role: 'Friend 2',
      title: 'Data Pipeline + Evaluation',
      icon: Database,
      color: 'from-purple-500 to-pink-500',
      responsibilities: [
        'Dataset acquisition (SpaceNet, DeepGlobe, OSM, Bhoonidhi)',
        'Build tiling/normalization pipeline',
        'Synthetic occlusion-injection module',
        'Co-own segmentation model features',
        'All evaluation metrics (IoU, Dice, Connectivity, APLS)',
      ],
      tools: ['Rasterio', 'GDAL', 'OpenCV', 'NumPy', 'pandas'],
    },
    {
      role: 'Friend 3',
      title: 'Graph Healing + Centrality Analysis',
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-500',
      responsibilities: [
        'Skeletonize road masks into centerlines',
        'Implement MST + Disjoint Set healing',
        'Compute Betweenness Centrality',
        'Flag Gatekeeper Nodes',
        'Validate against OSM Bengaluru topology',
      ],
      tools: ['scikit-image', 'NetworkX', 'Shapely', 'OSMnx'],
    },
    {
      role: 'Friend 4',
      title: 'Dashboard + Integration Lead',
      icon: Layout,
      color: 'from-orange-500 to-red-500',
      responsibilities: [
        'Scaffold Streamlit + Leaflet.js dashboard',
        'Build criticality heatmap overlay',
        'Build Simulation Toggle feature',
        'Own end-to-end integration',
        'Lead Idea PPT and demo video',
      ],
      tools: ['Streamlit', 'Leaflet.js', 'Folium', 'Plotly'],
    },
  ];

  return (
    <section ref={ref} className="py-24 px-6 bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-blue-600/20 rounded-full mb-6 border border-blue-500/30">
            <Users className="w-5 h-5 text-blue-400" />
            <span className="text-blue-300 font-semibold">4-Person Team Structure</span>
          </div>
          <h2 className="text-5xl font-bold mb-4">Work Split & Ownership</h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Equal load distribution with cross-phase ownership — everyone has both a build task and analytical/logic task
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {team.map((member, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="group"
            >
              <div className="bg-gray-800 rounded-3xl p-8 hover:bg-gray-750 transition-all border border-gray-700 hover:border-gray-600 h-full">
                {/* Header */}
                <div className="flex items-start gap-6 mb-6">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${member.color} flex items-center justify-center flex-shrink-0 shadow-xl`}
                  >
                    <member.icon className="w-8 h-8 text-white" />
                  </motion.div>
                  <div>
                    <div className={`text-sm font-semibold bg-gradient-to-r ${member.color} bg-clip-text text-transparent mb-2`}>
                      {member.role}
                    </div>
                    <h3 className="text-xl font-bold">{member.title}</h3>
                  </div>
                </div>

                {/* Responsibilities */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Key Responsibilities
                  </h4>
                  <ul className="space-y-2">
                    {member.responsibilities.map((task, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.4, delay: index * 0.15 + i * 0.1 }}
                        className="flex items-start gap-3 text-gray-400 text-sm"
                      >
                        <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${member.color} mt-2 flex-shrink-0`} />
                        <span>{task}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* Tools */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Tools & Libraries
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {member.tools.map((tool, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm hover:bg-gray-600 transition-colors"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8"
        >
          <h3 className="text-2xl font-bold mb-4">Integration Checkpoints</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="text-lg font-semibold mb-2">📅 Day 4 — Checkpoint 1</div>
              <p className="text-white/80">F1 hands masks to F3 → F3 runs healing → F2 runs metrics</p>
            </div>
            <div>
              <div className="text-lg font-semibold mb-2">📅 Day 5 — Checkpoint 2</div>
              <p className="text-white/80">F1 runs stress-test → F4 wires live dashboard → All: end-to-end run</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
