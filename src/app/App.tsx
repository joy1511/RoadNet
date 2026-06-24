import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { ProblemStatement } from './components/ProblemStatement';
import { Architecture } from './components/Architecture';
import { Footer } from './components/Footer';

export default function App() {
  return (
    <div className="min-h-screen" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}>
      <Nav />
      <Hero />
      <ProblemStatement />
      <Architecture />
      <Footer />
    </div>
  );
}
