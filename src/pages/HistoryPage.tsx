import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WASTE_CONFIG } from '@/lib/constants';
import { LogOut, History } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

export default function HistoryPage() {
  const { user, signOut } = useAuth();
  const [submissions, setSubmissions] = useState<Tables<'submissions'>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('submissions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setSubmissions(data || []);
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <History className="w-6 h-6 text-primary" /> History
          </h1>
          <p className="text-muted-foreground text-sm">Your recycling submissions</p>
        </div>
        <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground gap-1">
          <LogOut className="w-4 h-4" /> Sign out
        </Button>
      </div>

      {submissions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">No submissions yet</p>
          <p className="text-sm">Start recycling to see your history here!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {submissions.map(s => {
            const cfg = WASTE_CONFIG[s.waste_type] || WASTE_CONFIG.unknown;
            return (
              <Card key={s.id}>
                <CardContent className="p-3 flex items-center gap-3">
                  <span className="text-2xl">{cfg.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{cfg.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(s.created_at).toLocaleDateString()} · {Number(s.quantity)} kg · {Number(s.confidence).toFixed(0)}% conf
                    </p>
                    {s.bin_id && <p className="text-[10px] text-primary">📍 {s.bin_id}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-primary">+{s.points_awarded}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      s.status === 'approved' ? 'bg-primary/10 text-primary' :
                      s.status === 'review' ? 'bg-accent/10 text-accent-foreground' :
                      'bg-destructive/10 text-destructive'
                    }`}>
                      {s.status}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
