import { motion } from 'motion/react';
import { useInView } from './hooks/useInView';
import { Calendar, CheckCircle2 } from 'lucide-react';

export function Timeline() {
  const [ref, isInView] = useInView({ threshold: 0.1 });

  const roadmap = [
    {
      day: 'Day 1',
      date: '24/25 Jun',
      title: 'Setup',
      tasks: [
        'Repo scaffold, shared Drive/Notion',
        'Download SpaceNet + DeepGlobe',
        'Register on Bhoonidhi',
        'Set up training environment',
        'Scaffold Streamlit app shell',
      ],
      color: 'from-blue-500 to-cyan-500',
    },
    {
      day: 'Day 2-3',
      date: '26/27 Jun',
      title: 'Core Build',
      tasks: [
        'Finish baseline U-Net/DeepLabV3+',
        'Attention/Transformer upgrade',
        'Occlusion-injection module',
        'Implement MST + Disjoint Set healing',
        'Wire dashboard to mock graph',
      ],
      color: 'from-purple-500 to-pink-500',
    },
    {
      day: 'Day 4',
      date: '28 Jun',
      title: 'Integration Checkpoint 1',
      tasks: [
        'F1 hands real masks to F3',
        'F3 runs skeletonization + healing',
        'Compute centrality scores',
        'F2 runs first full metrics pass',
      ],
      color: 'from-green-500 to-emerald-500',
    },
    {
      day: 'Day 5',
      date: '29 Jun',
      title: 'Wire It Live',
      tasks: [
        'F1 runs Node Ablation Simulation',
        'Calculate Resilience Index',
        'F4 swaps dummy for real graph',
        'Build node-disable simulation',
        'Finalize all metrics',
      ],
      color: 'from-orange-500 to-amber-500',
    },
    {
      day: 'Day 6',
      date: '30 Jun',
      title: 'End-to-End Run + PPT',
      tasks: [
        'Run full pipeline on Bengaluru AOI',
        'Fix integration bugs',
        'Record demo video/GIFs',
        'Assemble Idea PPT',
        'Rehearse walkthrough',
      ],
      color: 'from-red-500 to-rose-500',
    },
    {
      day: 'Day 7',
      date: '1 Jul',
      title: 'Submit',
      tasks: [
        'Final polish',
        'Package repo + PPT + demo',
        'Submit early in the day',
      ],
      color: 'from-indigo-500 to-purple-500',
    },
  ];

  return (
    <section ref={ref} className="py-24 px-6 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-blue-100 rounded-full mb-6">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span className="text-blue-800 font-semibold">24 June → 1 July</span>
          </div>
          <h2 className="text-5xl font-bold text-gray-900 mb-4">7-Day Build Roadmap</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A detailed day-by-day plan to deliver a working prototype with comprehensive documentation
          </p>
        </motion.div>

        <div className="relative">
          {/* Timeline line */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-300 via-purple-300 to-pink-300 transform -translate-x-1/2" />

          <div className="space-y-12">
            {roadmap.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                className={`relative flex flex-col md:flex-row gap-8 ${
                  index % 2 === 0 ? 'md:flex-row-reverse' : ''
                }`}
              >
                {/* Timeline dot */}
                <div className="hidden md:block absolute left-1/2 top-8 transform -translate-x-1/2">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={isInView ? { scale: 1 } : {}}
                    transition={{ duration: 0.5, delay: index * 0.15 + 0.3 }}
                    className={`w-6 h-6 rounded-full bg-gradient-to-br ${item.color} shadow-lg border-4 border-white`}
                  />
                </div>

                {/* Content */}
                <div className={`flex-1 ${index % 2 === 0 ? 'md:text-right' : ''}`}>
                  <div className={`inline-block ${index % 2 === 0 ? 'md:ml-auto' : ''}`}>
                    <div className={`bg-gradient-to-br ${item.color} text-white px-6 py-3 rounded-2xl inline-block mb-4 shadow-lg`}>
                      <div className="font-bold text-lg">{item.day}</div>
                      <div className="text-sm opacity-90">{item.date}</div>
                    </div>
                  </div>
                </div>

                {/* Card */}
                <div className="flex-1">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200 hover:shadow-2xl transition-all"
                  >
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{item.title}</h3>
                    <ul className="space-y-3">
                      {item.tasks.map((task, i) => (
                        <li key={i} className="flex items-start gap-3 text-gray-700">
                          <CheckCircle2 className={`w-5 h-5 mt-0.5 flex-shrink-0 bg-gradient-to-r ${item.color} bg-clip-text text-transparent`} />
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 1 }}
          className="mt-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 md:p-12 text-white"
        >
          <h3 className="text-3xl font-bold mb-6">Live Event — 30-Hour Run Sheet</h3>
          <p className="text-lg mb-6 opacity-90">
            Once Cartosat-3 data is provided during the hackathon, the team follows a condensed workflow:
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
              <div className="text-4xl font-bold mb-2">0-10h</div>
              <div className="text-sm opacity-90">Swap to Cartosat-3 data & fine-tune model on real imagery</div>
            </div>
            <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
              <div className="text-4xl font-bold mb-2">10-20h</div>
              <div className="text-sm opacity-90">Full pipeline integration & stress-testing on live graph</div>
            </div>
            <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
              <div className="text-4xl font-bold mb-2">20-30h</div>
              <div className="text-sm opacity-90">Polish dashboard, finalize metrics, rehearse & submit</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
