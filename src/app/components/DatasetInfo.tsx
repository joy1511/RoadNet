import { motion } from 'motion/react';
import { useInView } from './hooks/useInView';
import { Database, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export function DatasetInfo() {
  const [ref, isInView] = useInView({ threshold: 0.1 });

  const datasets = [
    {
      name: 'SpaceNet Roads (SN3 & SN5)',
      status: 'available',
      resolution: '0.3–0.5m',
      access: 'AWS Public Dataset (Free)',
      usage: 'Primary training data',
      notes: 'Closest open proxy to Cartosat-3 resolution',
    },
    {
      name: 'DeepGlobe Road Extraction',
      status: 'available',
      resolution: '50cm/px',
      access: 'Kaggle (Free)',
      usage: 'Occlusion-robustness training',
      notes: '6,226 images, DigitalGlobe imagery',
    },
    {
      name: 'OpenStreetMap Vectors',
      status: 'available',
      resolution: 'Vector data',
      access: 'OSMnx / Overpass API',
      usage: 'Ground truth for graph validation',
      notes: 'Bengaluru road network for India context',
    },
    {
      name: 'Sentinel-2',
      status: 'available',
      resolution: '10m',
      access: 'Copernicus Data Space',
      usage: 'Wide-area context',
      notes: 'Too coarse for road-level segmentation',
    },
    {
      name: 'Resourcesat-2 LISS-IV',
      status: 'gated',
      resolution: '5.8m',
      access: 'ISRO Bhoonidhi Portal',
      usage: 'India-specific validation',
      notes: 'Registration approval required',
    },
    {
      name: 'Cartosat-3',
      status: 'event-only',
      resolution: 'Sub-meter',
      access: 'Provided during hackathon',
      usage: 'Live event testing',
      notes: 'Only available in 30-hour window',
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'gated':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'event-only':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'gated':
        return 'bg-yellow-100 text-yellow-800';
      case 'event-only':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <section ref={ref} className="py-24 px-6 bg-gradient-to-b from-white to-blue-50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-blue-100 rounded-full mb-6">
            <Database className="w-5 h-5 text-blue-600" />
            <span className="text-blue-800 font-semibold">Verified 24 June 2026</span>
          </div>
          <h2 className="text-5xl font-bold text-gray-900 mb-4">Dataset Access</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A comprehensive multi-source approach ensuring the prototype isn't blocked by data availability
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-900 text-white">
                  <th className="px-6 py-4 text-left">Dataset</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-left">Resolution</th>
                  <th className="px-6 py-4 text-left">Access</th>
                  <th className="px-6 py-4 text-left">Usage</th>
                </tr>
              </thead>
              <tbody>
                {datasets.map((dataset, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="border-b border-gray-200 hover:bg-blue-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{dataset.name}</div>
                      <div className="text-sm text-gray-500 mt-1">{dataset.notes}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(dataset.status)}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(dataset.status)}`}>
                          {dataset.status.replace('-', ' ').toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{dataset.resolution}</td>
                    <td className="px-6 py-4 text-gray-700">{dataset.access}</td>
                    <td className="px-6 py-4 text-gray-700">{dataset.usage}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white"
        >
          <h3 className="text-2xl font-bold mb-4">Cartosat-3 Workaround Strategy</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-2xl">🎯</span>
              <span>Train & validate on SpaceNet + DeepGlobe (sub-meter resolution proxy)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">🌳</span>
              <span>Build synthetic occlusion injector to simulate clouds/shadows/tree canopy</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">🗺️</span>
              <span>Use Bengaluru OSM vectors + Sentinel-2 for India-context demo</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">🔌</span>
              <span>Keep data-loader decoupled for seamless Cartosat-3 integration on event day</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
