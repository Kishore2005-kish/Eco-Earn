import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { WASTE_CONFIG } from '@/lib/constants';
import {
  Users, Package, TrendingUp, CheckCircle2, XCircle, Clock, Loader2,
  Recycle, BarChart3, ShieldCheck, Activity, Award, Flame,
} from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend, LineChart, Line,
} from 'recharts';

type Submission = Tables<'submissions'>;
type Profile = Tables<'profiles'>;

const COLORS = ['hsl(152, 60%, 36%)', 'hsl(200, 80%, 55%)', 'hsl(42, 90%, 55%)', 'hsl(12, 80%, 60%)', 'hsl(220, 40%, 50%)', 'hsl(142, 70%, 45%)', 'hsl(180, 40%, 50%)'];

export default function AdminDashboard() {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = async () => {
    const [{ data: subs }, { data: profs }] = await Promise.all([
      supabase.from('submissions').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('profiles').select('*').order('points', { ascending: false }).limit(100),
    ]);
    setSubmissions(subs || []);
    setProfiles(profs || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (sub: Submission) => {
    setUpdatingId(sub.id);
    try {
      const pts = sub.points_awarded || 10;
      const { error } = await supabase.from('submissions').update({ status: 'approved', points_awarded: pts }).eq('id', sub.id);
      if (error) throw error;
      await supabase.rpc('increment_points', { p_user_id: sub.user_id, p_pts: pts, p_kg: Number(sub.quantity) });
      toast({ title: 'Approved!', description: `Awarded ${pts} points.` });
      load();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setUpdatingId(null); }
  };

  const handleReject = async (sub: Submission) => {
    setUpdatingId(sub.id);
    try {
      const { error } = await supabase.from('submissions').update({ status: 'rejected', points_awarded: 0 }).eq('id', sub.id);
      if (error) throw error;
      toast({ title: 'Rejected', description: 'Submission marked as rejected.' });
      load();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setUpdatingId(null); }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  // Stats
  const totalUsers = profiles.length;
  const totalSubmissions = submissions.length;
  const approvedCount = submissions.filter(s => s.status === 'approved').length;
  const pendingCount = submissions.filter(s => s.status === 'review').length;
  const rejectedCount = submissions.filter(s => s.status === 'rejected').length;
  const totalKg = profiles.reduce((a, p) => a + Number(p.total_kg_recycled), 0);
  const totalPoints = profiles.reduce((a, p) => a + p.points, 0);
  const avgPointsPerUser = totalUsers ? Math.round(totalPoints / totalUsers) : 0;
  const approvalRate = totalSubmissions ? Math.round((approvedCount / totalSubmissions) * 100) : 0;
  const totalCo2 = submissions.reduce((acc, s) => {
    const cfg = WASTE_CONFIG[s.waste_type] || WASTE_CONFIG.unknown;
    return acc + cfg.co2PerKg * Number(s.quantity);
  }, 0);

  // Charts
  const wasteBreakdown = Object.entries(
    submissions.reduce<Record<string, number>>((acc, s) => {
      acc[s.waste_type] = (acc[s.waste_type] || 0) + 1;
      return acc;
    }, {})
  ).map(([type, count]) => ({
    name: WASTE_CONFIG[type]?.label || type,
    value: count,
    color: WASTE_CONFIG[type]?.color || 'hsl(0,0%,50%)',
  }));

  const wasteKgBreakdown = Object.entries(
    submissions.reduce<Record<string, number>>((acc, s) => {
      acc[s.waste_type] = (acc[s.waste_type] || 0) + Number(s.quantity);
      return acc;
    }, {})
  ).map(([type, kg]) => ({
    name: WASTE_CONFIG[type]?.label || type,
    kg: Number(kg.toFixed(1)),
    color: WASTE_CONFIG[type]?.color || 'hsl(0,0%,50%)',
  }));

  // Daily trend (last 14 days)
  const dailyTrend = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const dateStr = d.toISOString().split('T')[0];
    const daySubs = submissions.filter(s => s.created_at.startsWith(dateStr));
    return {
      date: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      submissions: daySubs.length,
      kg: Number(daySubs.reduce((a, s) => a + Number(s.quantity), 0).toFixed(1)),
    };
  });

  // Level distribution
  const levelDist = profiles.reduce<Record<number, number>>((acc, p) => {
    acc[p.level] = (acc[p.level] || 0) + 1;
    return acc;
  }, {});
  const levelData = Object.entries(levelDist).map(([level, count]) => ({ level: `Lv.${level}`, count }));

  const pendingSubs = submissions.filter(s => s.status === 'review');

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5 pb-24">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-7 h-7 text-primary" />
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatsCard icon={<Users className="w-5 h-5 text-primary" />} label="Total Users" value={totalUsers} />
        <StatsCard icon={<Package className="w-5 h-5 text-primary" />} label="Submissions" value={totalSubmissions} />
        <StatsCard icon={<Recycle className="w-5 h-5 text-primary" />} label="Total Recycled" value={`${totalKg.toFixed(1)} kg`} />
        <StatsCard icon={<TrendingUp className="w-5 h-5 text-primary" />} label="Points Given" value={totalPoints} />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatsCard icon={<Activity className="w-5 h-5 text-accent" />} label="Approval Rate" value={`${approvalRate}%`} />
        <StatsCard icon={<Award className="w-5 h-5 text-accent" />} label="Avg Pts/User" value={avgPointsPerUser} />
        <StatsCard icon={<Flame className="w-5 h-5 text-accent" />} label="CO₂ Saved" value={`${totalCo2.toFixed(1)} kg`} />
        <StatsCard icon={<Recycle className="w-5 h-5 text-accent" />} label="Avg Kg/Sub" value={`${totalSubmissions ? (totalKg / totalSubmissions).toFixed(1) : 0}`} />
      </div>

      {/* Status overview */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-primary/20"><CardContent className="p-4 text-center">
          <CheckCircle2 className="w-6 h-6 text-primary mx-auto mb-1" />
          <p className="text-2xl font-bold">{approvedCount}</p>
          <p className="text-xs text-muted-foreground">Approved</p>
        </CardContent></Card>
        <Card className="border-yellow-500/20"><CardContent className="p-4 text-center">
          <Clock className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
          <p className="text-2xl font-bold">{pendingCount}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </CardContent></Card>
        <Card className="border-destructive/20"><CardContent className="p-4 text-center">
          <XCircle className="w-6 h-6 text-destructive mx-auto mb-1" />
          <p className="text-2xl font-bold">{rejectedCount}</p>
          <p className="text-xs text-muted-foreground">Rejected</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="pending" className="flex-1">Pending ({pendingCount})</TabsTrigger>
          <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
          <TabsTrigger value="users" className="flex-1">Users</TabsTrigger>
          <TabsTrigger value="analytics" className="flex-1">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3">
          {pendingSubs.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">No pending submissions 🎉</CardContent></Card>
          ) : (
            pendingSubs.map(sub => {
              const cfg = WASTE_CONFIG[sub.waste_type] || WASTE_CONFIG.unknown;
              return (
                <Card key={sub.id}>
                  <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
                    <img src={sub.image_url} alt="waste" className="w-24 h-24 rounded-lg object-cover shrink-0" />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{cfg.icon}</span>
                        <span className="font-semibold">{cfg.label}</span>
                        <Badge variant="secondary">{Number(sub.confidence).toFixed(0)}%</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Qty: {Number(sub.quantity)} kg · {new Date(sub.created_at).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">User: {sub.user_id.slice(0, 8)}…</p>
                    </div>
                    <div className="flex gap-2 items-start">
                      <Button size="sm" onClick={() => handleApprove(sub)} disabled={updatingId === sub.id} className="gap-1">
                        {updatingId === sub.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />} Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleReject(sub)} disabled={updatingId === sub.id} className="gap-1">
                        <XCircle className="w-3 h-3" /> Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="all">
          <Card><div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Type</TableHead><TableHead>Qty</TableHead><TableHead>Confidence</TableHead>
                <TableHead>Status</TableHead><TableHead>Points</TableHead><TableHead>Date</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {submissions.map(sub => {
                  const cfg = WASTE_CONFIG[sub.waste_type] || WASTE_CONFIG.unknown;
                  return (
                    <TableRow key={sub.id}>
                      <TableCell>{cfg.icon} {cfg.label}</TableCell>
                      <TableCell>{Number(sub.quantity)} kg</TableCell>
                      <TableCell>{Number(sub.confidence).toFixed(0)}%</TableCell>
                      <TableCell>
                        <Badge variant={sub.status === 'approved' ? 'default' : sub.status === 'review' ? 'secondary' : 'destructive'}>{sub.status}</Badge>
                      </TableCell>
                      <TableCell>{sub.points_awarded}</TableCell>
                      <TableCell className="text-xs">{new Date(sub.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div></Card>
        </TabsContent>

        <TabsContent value="users">
          <Card><div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>#</TableHead><TableHead>Name</TableHead><TableHead>Level</TableHead>
                <TableHead>Points</TableHead><TableHead>Streak</TableHead><TableHead>Recycled</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {profiles.map((p, i) => (
                  <TableRow key={p.id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="font-medium">{p.name || 'Anonymous'}</TableCell>
                    <TableCell>{p.level}</TableCell>
                    <TableCell className="font-bold">{p.points}</TableCell>
                    <TableCell>{p.streak}🔥</TableCell>
                    <TableCell>{Number(p.total_kg_recycled).toFixed(1)} kg</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div></Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Daily Trend */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Activity className="w-4 h-4" /> Daily Activity (14 days)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="submissions" name="Submissions" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.15} />
                  <Area type="monotone" dataKey="kg" name="Kg Recycled" stroke={COLORS[1]} fill={COLORS[1]} fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Waste Type Count */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Submissions by Type</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={wasteBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {wasteBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Weight Distribution Pie */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Weight by Type (kg)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={wasteKgBreakdown} dataKey="kg" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={3} label={({ name, kg }) => `${name} ${kg}kg`} labelLine={{ strokeWidth: 1 }}>
                      {wasteKgBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* User Level Distribution */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Users className="w-4 h-4" /> User Level Distribution</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={levelData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="level" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Users" fill={COLORS[0]} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatsCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        {icon}
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-bold text-sm">{String(value)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
