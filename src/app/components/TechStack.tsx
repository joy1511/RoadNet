import { motion } from 'motion/react';
import { useInView } from './hooks/useInView';
import { Code2, Package, Activity, BarChart } from 'lucide-react';

export function TechStack() {
  const [ref, isInView] = useInView({ threshold: 0.1 });

  const categories = [
    {
      title: 'Preprocessing & Data',
      icon: Package,
      color: 'from-blue-500 to-cyan-500',
      technologies: ['Rasterio', 'GDAL', 'OpenCV', 'NumPy', 'Albumentations'],
    },
    {
      title: 'Deep Learning',
      icon: Code2,
      color: 'from-purple-500 to-pink-500',
      technologies: ['PyTorch', 'U-Net + ResNet', 'UNet++', 'DeepLabV3+', 'Transformer'],
    },
    {
      title: 'Graph & Network Science',
      icon: Activity,
      color: 'from-green-500 to-emerald-500',
      technologies: ['NetworkX', 'scikit-image', 'OSMnx', 'PyTorch Geometric', 'Shapely'],
    },
    {
      title: 'Visualization & Dashboard',
      icon: BarChart,
      color: 'from-orange-500 to-red-500',
      technologies: ['Streamlit', 'Leaflet.js', 'Matplotlib', 'Plotly', 'Folium'],
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
          <h2 className="text-5xl font-bold mb-4">Technology Stack</h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Industry-standard tools and frameworks for satellite imagery analysis, deep learning, and network science
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {categories.map((category, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              whileHover={{ scale: 1.02 }}
              className="bg-gray-800 rounded-3xl p-8 border border-gray-700 hover:border-gray-600 transition-all"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center shadow-xl`}>
                  <category.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold">{category.title}</h3>
              </div>

              <div className="flex flex-wrap gap-3">
                {category.technologies.map((tech, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.4, delay: index * 0.15 + i * 0.05 }}
                    whileHover={{ scale: 1.1 }}
                    className={`px-4 py-2 bg-gradient-to-r ${category.color} rounded-full text-white font-medium text-sm shadow-lg hover:shadow-xl transition-shadow cursor-default`}
                  >
                    {tech}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 grid md:grid-cols-3 gap-6"
        >
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold mb-2">4</div>
            <div className="text-blue-200">Modular Phases</div>
          </div>
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold mb-2">6+</div>
            <div className="text-purple-200">Data Sources</div>
          </div>
          <div className="bg-gradient-to-br from-pink-600 to-pink-800 rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold mb-2">15+</div>
            <div className="text-pink-200">Technologies</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
