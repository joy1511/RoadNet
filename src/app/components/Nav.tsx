import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Menu, X } from 'lucide-react';

const links = [
  { label: 'Overview', href: '#overview' },
  { label: 'How It Works', href: '#architecture' },
  { label: 'Contact', href: '#contact' },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#080e1a]/90 backdrop-blur-md border-b border-white/[0.06]' : ''
      }`}
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <a href="#" className="text-white font-bold text-lg tracking-tight">
          Road<span className="text-blue-400">Net</span>
        </a>

        {/* Desktop links */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-[#7888a8] hover:text-white transition-colors duration-200"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#contact"
            className="text-sm px-4 py-1.5 rounded-full border border-blue-500/50 text-blue-400 hover:bg-blue-500/10 transition-colors duration-200"
          >
            Get in Touch
          </a>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-[#7888a8] hover:text-white transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-[#0f1624]/95 backdrop-blur-md border-b border-white/[0.06] px-5 pb-5"
        >
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block py-3 text-sm text-[#7888a8] hover:text-white transition-colors border-b border-white/[0.04] last:border-0"
            >
              {l.label}
            </a>
          ))}
        </motion.div>
      )}
    </motion.header>
  );
}
