import { motion } from 'motion/react';
import { useInView } from './hooks/useInView';
import { Brain, GitBranch, Activity, Monitor } from 'lucide-react';

const phases = [
  {
    number: '01',
    title: 'Occlusion-Robust Segmentation',
    description:
      'A deep learning model processes satellite tiles and outputs clean binary road masks, handling canopy, shadow, and clutter through synthetic occlusion training.',
    icon: Brain,
    color: 'text-blue-400',
    borderColor: 'border-blue-400/20',
    bgColor: 'bg-blue-400/8',
    details: [
      'Multi-scale feature fusion',
      'Attention mechanisms',
      'Combined Dice + IoU + boundary loss',
      'Synthetic occlusion augmentation',
    ],
  },
  {
    number: '02',
    title: 'Graph Skeletonization & Healing',
    description:
      'Road masks are thinned to 1-pixel centerlines, converted to nodes and edges, then gaps are bridged using Minimum Spanning Tree and Disjoint-Set union-find algorithms.',
    icon: GitBranch,
    color: 'text-purple-400',
    borderColor: 'border-purple-400/20',
    bgColor: 'bg-purple-400/8',
    details: [
      'Skeleton extraction',
      'Minimum Spanning Tree gap bridging',
      'Angular alignment scoring',
      'Topology validation',
    ],
  },
  {
    number: '03',
    title: 'Centrality & Stress Testing',
    description:
      'Betweenness centrality scores every node to surface high-traffic gatekeeper points. Targeted node ablation simulations quantify network efficiency loss.',
    icon: Activity,
    color: 'text-emerald-400',
    borderColor: 'border-emerald-400/20',
    bgColor: 'bg-emerald-400/8',
    details: [
      'Betweenness centrality computation',
      'Node ablation simulation',
      'Resilience index calculation',
      'Network efficiency metrics',
    ],
  },
  {
    number: '04',
    title: 'Interactive Dashboard',
    description:
      'A real-time map interface renders criticality heatmaps, lets analysts disable individual nodes, and immediately shows travel-time impact across the network.',
    icon: Monitor,
    color: 'text-amber-400',
    borderColor: 'border-amber-400/20',
    bgColor: 'bg-amber-400/8',
    details: [
      'Interactive map visualization',
      'Color-coded criticality overlay',
      'Click-to-disable node simulation',
      'Travel-time impact analysis',
    ],
  },
];

export function Architecture() {
  const [ref, isInView] = useInView({ threshold: 0.05 });

  return (
    <section id="architecture" ref={ref} className="py-24 px-5 sm:px-8 bg-background">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-14"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-3">
            Architecture
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
            How It Works
          </h2>
          <p className="text-[#7888a8] max-w-xl leading-relaxed">
            A modular pipeline where each phase builds on the previous — from raw satellite data to actionable resilience insights.
          </p>
        </motion.div>

        <div className="relative">
          {/* Vertical connector line */}
          <div className="absolute left-[23px] top-0 bottom-0 w-px bg-white/[0.05] hidden sm:block" />

          <div className="space-y-5">
            {phases.map((phase, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="relative"
              >
                <div
                  className={`rounded-2xl border ${phase.borderColor} bg-card hover:bg-white/[0.03] transition-colors duration-300 overflow-hidden`}
                >
                  <div className="flex flex-col sm:flex-row gap-6 p-6 sm:p-8">
                    {/* Phase marker */}
                    <div className="flex sm:flex-col items-center sm:items-center gap-4 sm:gap-2 sm:min-w-[48px]">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${phase.bgColor} border ${phase.borderColor}`}
                      >
                        <phase.icon className={`w-5 h-5 ${phase.color}`} />
                      </div>
                      <span className={`text-xs font-mono font-bold ${phase.color} opacity-60`}>
                        {phase.number}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-lg mb-2">{phase.title}</h3>
                      <p className="text-[#7888a8] text-sm leading-relaxed mb-5">
                        {phase.description}
                      </p>
                      <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
                        {phase.details.map((d, j) => (
                          <li
                            key={j}
                            className="flex items-center gap-2 text-xs text-[#7888a8]"
                          >
                            <span className={`w-1 h-1 rounded-full flex-shrink-0 ${phase.color} opacity-70`} style={{ background: 'currentColor' }} />
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
