import { Recycle, Leaf, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

export default function Index() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) navigate('/dashboard', { replace: true });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-hidden relative">
      {/* Decorative blobs */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-15%] w-[400px] h-[400px] rounded-full bg-accent/10 blur-3xl pointer-events-none" />

      <header className="flex items-center justify-between p-6 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary text-primary-foreground">
            <Recycle className="w-6 h-6" />
          </div>
          <span className="text-lg font-bold tracking-tight">EcoTrack</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
          Sign In
        </Button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
          <Leaf className="w-4 h-4" />
          AI-Powered Recycling
        </div>
        
        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight mb-4">
          Recycle Smarter,
          <br />
          <span className="text-primary">Earn Rewards</span>
        </h1>
        
        <p className="text-muted-foreground text-lg max-w-md mb-8">
          Scan, classify, and recycle waste with AI. Earn points, climb the leaderboard, and track your environmental impact.
        </p>

        <div className="flex gap-3">
          <Button size="lg" className="gap-2 rounded-xl" onClick={() => navigate('/signup')}>
            Get Started <ArrowRight className="w-4 h-4" />
          </Button>
          <Button size="lg" variant="outline" className="rounded-xl" onClick={() => navigate('/login')}>
            Sign In
          </Button>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-6 max-w-sm w-full">
          {[
            { value: '50K+', label: 'Kg Recycled' },
            { value: '2K+', label: 'Active Users' },
            { value: '15T', label: 'CO₂ Saved' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold text-primary">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </main>

      <footer className="p-6 text-center text-xs text-muted-foreground relative z-10">
        © 2026 EcoTrack. Making the planet cleaner, together.
      </footer>
    </div>
  );
}
