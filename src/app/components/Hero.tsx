import { motion } from 'motion/react';
import { Satellite, Network, Shield, BarChart3, ArrowDown } from 'lucide-react';
import { EtherCanvas } from './EtherCanvas';

const features = [
  { icon: Satellite, label: 'Satellite Imagery' },
  { icon: Network, label: 'Graph Analysis' },
  { icon: Shield, label: 'Resilience Testing' },
  { icon: BarChart3, label: 'Live Analytics' },
];

export function Hero() {
  return (
    <section
      id="overview"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background"
    >
      <EtherCanvas />

      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(59,130,246,0.08) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 pt-24 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium text-blue-300 bg-blue-500/10 border border-blue-500/20 mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          Deep Learning · Computer Vision · Network Science
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl sm:text-7xl font-extrabold text-white mb-5 tracking-tight leading-[1.1]"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Road<span className="text-blue-400">Net</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-lg sm:text-xl text-[#c5cce0] mb-4 max-w-2xl mx-auto leading-relaxed"
        >
          Occlusion-robust road extraction & graph-theoretic criticality analysis
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-sm sm:text-base text-[#7888a8] mb-12 max-w-xl mx-auto leading-relaxed"
        >
          A platform that maps road networks from satellite imagery, heals fragmented graphs, and identifies the most critical nodes for infrastructure resilience.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap justify-center gap-3 mb-16"
        >
          <a
            href="#architecture"
            className="px-6 py-2.5 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors duration-200"
          >
            Explore the Platform
          </a>
          <a
            href="#contact"
            className="px-6 py-2.5 rounded-full border border-white/15 text-[#c5cce0] text-sm font-medium hover:bg-white/5 transition-colors duration-200"
          >
            Get in Touch
          </a>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-wrap justify-center gap-3"
        >
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 + i * 0.08 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.07] text-sm text-[#7888a8] hover:text-[#c5cce0] hover:bg-white/[0.07] transition-all duration-200"
            >
              <f.icon className="w-3.5 h-3.5 text-blue-400" />
              {f.label}
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-[#7888a8]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.6 }}
      >
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ArrowDown className="w-4 h-4" />
        </motion.div>
      </motion.div>
    </section>
  );
}
