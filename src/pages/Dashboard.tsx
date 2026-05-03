import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { WASTE_CONFIG, getLevel, getNextLevelPoints, getLevelName } from '@/lib/constants';
import { Flame, Leaf, Trophy, TrendingUp, Droplets, TreePine } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Tables<'profiles'> | null>(null);
  const [submissions, setSubmissions] = useState<Tables<'submissions'>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: p }, { data: s }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('submissions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      ]);
      setProfile(p);
      setSubmissions(s || []);
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading || !profile) {
    return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  const level = getLevel(profile.points);
  const nextLevelPts = getNextLevelPoints(level);
  const prevLevelPts = getNextLevelPoints(level - 1);
  const progress = nextLevelPts === Infinity ? 100 : ((profile.points - prevLevelPts) / (nextLevelPts - prevLevelPts)) * 100;

  // Calculate impact
  const totalCo2 = submissions.reduce((acc, s) => {
    const cfg = WASTE_CONFIG[s.waste_type] || WASTE_CONFIG.unknown;
    return acc + cfg.co2PerKg * Number(s.quantity);
  }, 0);
  const totalTrees = submissions.reduce((acc, s) => {
    const cfg = WASTE_CONFIG[s.waste_type] || WASTE_CONFIG.unknown;
    return acc + cfg.treesPerKg * Number(s.quantity);
  }, 0);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Hey, {profile.name || 'Eco Hero'} 👋</h1>
        <p className="text-muted-foreground text-sm">Let's make an impact today!</p>
      </div>

      {/* Level Card */}
      <Card className="bg-primary text-primary-foreground overflow-hidden relative">
        <CardContent className="p-5 relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs opacity-80">Level {level}</p>
              <p className="text-lg font-bold">{getLevelName(level)}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold">{profile.points}</p>
              <p className="text-xs opacity-80">points</p>
            </div>
          </div>
          <Progress value={progress} className="h-2 bg-primary-foreground/20" />
          <p className="text-[10px] opacity-70 mt-1">{nextLevelPts === Infinity ? 'Max level!' : `${nextLevelPts - profile.points} pts to next level`}</p>
        </CardContent>
        <div className="absolute top-[-20px] right-[-20px] w-32 h-32 rounded-full bg-primary-foreground/10" />
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={<Flame className="w-5 h-5 text-accent" />} label="Streak" value={`${profile.streak} days`} />
        <StatCard icon={<TrendingUp className="w-5 h-5 text-primary" />} label="Recycled" value={`${Number(profile.total_kg_recycled).toFixed(1)} kg`} />
        <StatCard icon={<Droplets className="w-5 h-5 text-primary" />} label="CO₂ Saved" value={`${totalCo2.toFixed(1)} kg`} />
        <StatCard icon={<TreePine className="w-5 h-5 text-primary" />} label="Trees Saved" value={totalTrees.toFixed(2)} />
      </div>

      {/* Recent Submissions */}
      <div>
        <h2 className="font-semibold mb-3">Recent Activity</h2>
        {submissions.length === 0 ? (
          <p className="text-muted-foreground text-sm">No submissions yet. Start recycling!</p>
        ) : (
          <div className="space-y-2">
            {submissions.map(s => {
              const cfg = WASTE_CONFIG[s.waste_type] || WASTE_CONFIG.unknown;
              return (
                <Card key={s.id} className="p-3 flex items-center gap-3">
                  <span className="text-2xl">{cfg.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{cfg.label}</p>
                    <p className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()} · {Number(s.quantity)} kg</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-primary">+{s.points_awarded}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${s.status === 'approved' ? 'bg-primary/10 text-primary' : s.status === 'review' ? 'bg-accent/10 text-accent-foreground' : 'bg-destructive/10 text-destructive'}`}>
                      {s.status}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        {icon}
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-bold text-sm">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
