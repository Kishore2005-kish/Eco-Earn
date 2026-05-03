import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Medal, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getLevelName } from '@/lib/constants';
import type { Tables } from '@/integrations/supabase/types';

export default function Leaderboard() {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState<Tables<'profiles'>[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaders = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('points', { ascending: false })
      .limit(50);
    setLeaders(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchLeaders();

    // Realtime subscription
    const channel = supabase
      .channel('leaderboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchLeaders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  const podium = leaders.slice(0, 3);
  const rest = leaders.slice(3);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="w-6 h-6 text-accent" /> Leaderboard
        </h1>
        <p className="text-muted-foreground text-sm">Top recyclers in the community</p>
      </div>

      {/* Podium */}
      {podium.length >= 3 && (
        <div className="flex items-end justify-center gap-3 pt-4">
          <PodiumCard rank={2} profile={podium[1]} isMe={podium[1].id === user?.id} />
          <PodiumCard rank={1} profile={podium[0]} isMe={podium[0].id === user?.id} />
          <PodiumCard rank={3} profile={podium[2]} isMe={podium[2].id === user?.id} />
        </div>
      )}

      {/* Rest of leaderboard */}
      <div className="space-y-2">
        {rest.map((p, i) => (
          <Card key={p.id} className={cn('transition-all', p.id === user?.id && 'border-primary/50 bg-primary/5')}>
            <CardContent className="p-3 flex items-center gap-3">
              <span className="w-8 text-center font-bold text-muted-foreground text-sm">{i + 4}</span>
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                {(p.name || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{p.name || 'Anonymous'}</p>
                <p className="text-xs text-muted-foreground">Lv.{p.level} · {getLevelName(p.level)}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm">{p.points}</p>
                <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                  <Flame className="w-3 h-3" />{p.streak}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PodiumCard({ rank, profile, isMe }: { rank: number; profile: Tables<'profiles'>; isMe: boolean }) {
  const heights = { 1: 'h-28', 2: 'h-20', 3: 'h-16' };
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
  const sizes = { 1: 'w-14 h-14 text-lg', 2: 'w-11 h-11 text-sm', 3: 'w-11 h-11 text-sm' };

  return (
    <div className={cn('flex flex-col items-center gap-1', rank === 1 && 'order-2', rank === 2 && 'order-1', rank === 3 && 'order-3')}>
      <div className={cn(sizes[rank as 1|2|3], 'rounded-full bg-muted flex items-center justify-center font-bold', isMe && 'ring-2 ring-primary')}>
        {(profile.name || '?')[0].toUpperCase()}
      </div>
      <p className="text-xs font-medium truncate max-w-[80px]">{profile.name || 'Anon'}</p>
      <p className="text-[10px] text-muted-foreground">{profile.points} pts</p>
      <div className={cn('w-20 rounded-t-lg flex items-center justify-center', heights[rank as 1|2|3], rank === 1 ? 'bg-accent/20' : 'bg-muted')}>
        <span className="text-2xl">{medals[rank as 1|2|3]}</span>
      </div>
    </div>
  );
}
