import { motion } from 'motion/react';
import { useInView } from './hooks/useInView';
import { AlertTriangle, GitMerge, Target } from 'lucide-react';

const challenges = [
  {
    icon: AlertTriangle,
    title: 'Occlusion in Imagery',
    description:
      'Satellite imagery is frequently obscured by cloud cover, tree canopy, and shadows, making automated road detection unreliable.',
    accent: 'text-amber-400',
    bg: 'bg-amber-400/8',
    border: 'border-amber-400/15',
  },
  {
    icon: GitMerge,
    title: 'Fragmented Networks',
    description:
      'Extracted road masks are broken and topologically incomplete, requiring intelligent healing before any graph analysis can proceed.',
    accent: 'text-blue-400',
    bg: 'bg-blue-400/8',
    border: 'border-blue-400/15',
  },
  {
    icon: Target,
    title: 'Hidden Vulnerabilities',
    description:
      'Critical bottleneck nodes in transportation networks are non-obvious — traditional inspection cannot surface them at scale.',
    accent: 'text-purple-400',
    bg: 'bg-purple-400/8',
    border: 'border-purple-400/15',
  },
];

export function ProblemStatement() {
  const [ref, isInView] = useInView({ threshold: 0.15 });

  return (
    <section ref={ref} className="py-24 px-5 sm:px-8 bg-background">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-14"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-3">
            The Problem
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
            Infrastructure analysis at scale is broken
          </h2>
          <p className="text-[#7888a8] max-w-xl leading-relaxed">
            Current tools fail at three interconnected layers — from noisy input data to incomplete topology to invisible failure points.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-5 mb-14">
          {challenges.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 18 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className={`rounded-2xl p-6 border ${item.border} ${item.bg} hover:border-opacity-40 transition-all duration-300`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-5 ${item.bg} border ${item.border}`}>
                <item.icon className={`w-4.5 h-4.5 ${item.accent}`} />
              </div>
              <h3 className="text-white font-semibold mb-2">{item.title}</h3>
              <p className="text-[#7888a8] text-sm leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Solution callout */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="rounded-2xl border border-white/[0.07] bg-card p-8 sm:p-10"
        >
          <div className="flex flex-col sm:flex-row gap-8 items-start">
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-3">
                Our Approach
              </p>
              <h3 className="text-xl font-bold text-white mb-3">
                A four-layer pipeline from raw pixels to resilience scores
              </h3>
              <p className="text-[#7888a8] text-sm leading-relaxed">
                RoadNet chains deep learning segmentation, graph-healing algorithms, betweenness centrality analysis, and an interactive simulation dashboard into one coherent system — turning noisy satellite tiles into actionable infrastructure intelligence.
              </p>
            </div>
            <div className="flex flex-wrap sm:flex-col gap-2 sm:min-w-[160px]">
              {[
                '4-layer architecture',
                'Sub-meter resolution',
                'AI-powered',
                'Real-time simulation',
              ].map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1.5 rounded-full border border-white/[0.08] text-[#7888a8] bg-white/[0.03] whitespace-nowrap"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
