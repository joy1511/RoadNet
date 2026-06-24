import { motion } from 'motion/react';
import { Github, Linkedin, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer id="contact" className="border-t border-white/[0.06] bg-background py-16 px-5 sm:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="grid sm:grid-cols-3 gap-10 mb-12">
          {/* Brand */}
          <div>
            <p className="text-lg font-bold text-white mb-3">
              Road<span className="text-blue-400">Net</span>
            </p>
            <p className="text-sm text-[#7888a8] mb-6 leading-relaxed">
              Occlusion-robust road extraction and graph-theoretic criticality analysis for resilient infrastructure.
            </p>
            <div className="flex gap-3">
              {[Github, Linkedin, Mail].map((Icon, i) => (
                <motion.a
                  key={i}
                  href="#"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.94 }}
                  className="w-9 h-9 rounded-xl border border-white/[0.08] flex items-center justify-center text-[#7888a8] hover:text-white hover:border-white/20 transition-colors duration-200"
                >
                  <Icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#7888a8] mb-4">
              Navigation
            </p>
            <ul className="space-y-2.5">
              {[
                { label: 'Overview', href: '#overview' },
                { label: 'How It Works', href: '#architecture' },
                { label: 'Contact', href: '#contact' },
              ].map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="text-sm text-[#7888a8] hover:text-white transition-colors duration-200"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#7888a8] mb-4">
              Resources
            </p>
            <ul className="space-y-2.5">
              {['Research Paper', 'Documentation', 'GitHub Repository'].map((r) => (
                <li key={r}>
                  <a
                    href="#"
                    className="text-sm text-[#7888a8] hover:text-white transition-colors duration-200"
                  >
                    {r}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/[0.06] pt-8">
          <p className="text-xs text-[#7888a8] text-center">
            © 2026 RoadNet. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
