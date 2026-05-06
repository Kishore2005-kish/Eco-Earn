import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { getLevelName, WASTE_CONFIG } from '@/lib/constants';
import {
  User, Shield, LogOut, Moon, Sun, Share2, Copy, Check,
  Award, Flame, TrendingUp, Loader2, Camera, IdCard,
} from 'lucide-react';

const AVATARS = ['🌿', '🌍', '🌱', '♻️', '🌊', '🐢', '🦋', '🌸', '🍃', '🌻', '🐝', '🏔️'];

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [darkMode, setDarkMode] = useState(() =>
    document.documentElement.classList.contains('dark')
  );

  // Form state
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [governmentId, setGovernmentId] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: p }, { data: s }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('submissions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);
      if (p) {
        setProfile(p);
        setName(p.name || '');
        setBio((p as any).bio || '');
        setGovernmentId((p as any).government_id || '');
        setCity((p as any).city || '');
        setState((p as any).state || '');
        setCountry((p as any).country || '');
        setSelectedAvatar(p.avatar_url || '');
      }
      setSubmissions(s || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const toggleDarkMode = (checked: boolean) => {
    setDarkMode(checked);
    document.documentElement.classList.toggle('dark', checked);
    localStorage.setItem('theme', checked ? 'dark' : 'light');
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      name,
      bio,
      government_id: governmentId,
      city,
      state,
      country,
      avatar_url: selectedAvatar,
    } as any).eq('id', user.id);
    setSaving(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Profile saved!', description: 'Your details have been updated.' });
      setProfile((prev: any) => ({ ...prev, name, bio, government_id: governmentId, city, state, country, avatar_url: selectedAvatar }));
    }
  };

  const copyUniqueId = () => {
    if (!user) return;
    navigator.clipboard.writeText(user.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Copied!', description: 'Your unique ID has been copied.' });
  };

  const shareProgress = async () => {
    if (!profile) return;
    const text = `🌿 I'm a ${getLevelName(profile.level)} (Level ${profile.level}) on EcoTrack!\n\n♻️ ${Number(profile.total_kg_recycled).toFixed(1)} kg recycled\n🔥 ${profile.streak} day streak\n⭐ ${profile.points} points\n\nJoin me in making the planet greener! #EcoTrack #Sustainability #Recycle`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'My EcoTrack Progress', text });
      } catch {}
    } else {
      navigator.clipboard.writeText(text);
      toast({ title: 'Copied!', description: 'Share text copied to clipboard.' });
    }
  };

  if (loading || !profile) {
    return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  // Stats
  const approvedCount = submissions.filter(s => s.status === 'approved').length;
  const totalCo2 = submissions.reduce((acc: number, s: any) => {
    const cfg = WASTE_CONFIG[s.waste_type] || WASTE_CONFIG.unknown;
    return acc + cfg.co2PerKg * Number(s.quantity);
  }, 0);
  const wasteBreakdown = Object.entries(
    submissions.reduce<Record<string, number>>((acc, s) => {
      acc[s.waste_type] = (acc[s.waste_type] || 0) + Number(s.quantity);
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <User className="w-6 h-6 text-primary" /> Profile
        </h1>
        <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground gap-1">
          <LogOut className="w-4 h-4" /> Sign out
        </Button>
      </div>

      {/* Avatar & Level Banner */}
      <Card className="bg-primary text-primary-foreground overflow-hidden relative">
        <CardContent className="p-5 flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 rounded-full bg-primary-foreground/20 flex items-center justify-center text-3xl">
            {selectedAvatar || (profile.name || '?')[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="text-lg font-bold">{name || 'Eco Hero'}</p>
            <p className="text-xs opacity-80">Level {profile.level} · {getLevelName(profile.level)}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-[10px]">{profile.points} pts</Badge>
              <Badge variant="secondary" className="text-[10px]">🔥 {profile.streak} streak</Badge>
            </div>
          </div>
        </CardContent>
        <div className="absolute top-[-20px] right-[-20px] w-32 h-32 rounded-full bg-primary-foreground/10" />
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card><CardContent className="p-3 text-center">
          <TrendingUp className="w-4 h-4 mx-auto text-primary mb-1" />
          <p className="font-bold text-sm">{Number(profile.total_kg_recycled).toFixed(1)} kg</p>
          <p className="text-[10px] text-muted-foreground">Recycled</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <Award className="w-4 h-4 mx-auto text-primary mb-1" />
          <p className="font-bold text-sm">{approvedCount}</p>
          <p className="text-[10px] text-muted-foreground">Submissions</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <Flame className="w-4 h-4 mx-auto text-accent mb-1" />
          <p className="font-bold text-sm">{totalCo2.toFixed(1)} kg</p>
          <p className="text-[10px] text-muted-foreground">CO₂ Saved</p>
        </CardContent></Card>
      </div>

      {/* Waste Breakdown Mini */}
      {wasteBreakdown.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Your Recycling Mix</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {wasteBreakdown.slice(0, 5).map(([type, kg]) => {
              const cfg = WASTE_CONFIG[type] || WASTE_CONFIG.unknown;
              const pct = (kg / Math.max(Number(profile.total_kg_recycled), 1)) * 100;
              return (
                <div key={type} className="flex items-center gap-2">
                  <span className="text-sm">{cfg.icon}</span>
                  <span className="text-xs flex-1">{cfg.label}</span>
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: cfg.color }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground w-12 text-right">{kg.toFixed(1)} kg</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Share Progress */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">Share Your Progress</p>
            <p className="text-xs text-muted-foreground">Show off your eco achievements</p>
          </div>
          <Button size="sm" onClick={shareProgress} className="gap-1">
            <Share2 className="w-4 h-4" /> Share
          </Button>
        </CardContent>
      </Card>

      {/* Unique ID */}
      <Card>
        <CardContent className="p-4">
          <p className="font-medium text-sm mb-1 flex items-center gap-1"><IdCard className="w-4 h-4 text-primary" /> Unique Recycler ID</p>
          <p className="text-[10px] text-muted-foreground mb-2">Fallback ID if QR scanning fails</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-muted px-3 py-2 rounded-lg text-xs font-mono break-all select-all">{user?.id}</code>
            <Button variant="outline" size="sm" onClick={copyUniqueId} className="shrink-0">
              {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Avatar Picker */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1"><Camera className="w-4 h-4" /> Choose Avatar</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-2">
            {AVATARS.map(emoji => (
              <button
                key={emoji}
                onClick={() => setSelectedAvatar(emoji)}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all ${selectedAvatar === emoji ? 'bg-primary/20 ring-2 ring-primary scale-110' : 'bg-muted hover:bg-muted/80'}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Personal Details</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label className="text-xs">Display Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" /></div>
          <div><Label className="text-xs">Bio</Label><Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us about your eco journey..." rows={2} /></div>
          <div><Label className="text-xs flex items-center gap-1"><Shield className="w-3 h-3" /> Government ID (Aadhaar/PAN/etc.)</Label><Input value={governmentId} onChange={e => setGovernmentId(e.target.value)} placeholder="Optional – for verified status" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">City</Label><Input value={city} onChange={e => setCity(e.target.value)} placeholder="City" /></div>
            <div><Label className="text-xs">State</Label><Input value={state} onChange={e => setState(e.target.value)} placeholder="State" /></div>
          </div>
          <div><Label className="text-xs">Country</Label><Input value={country} onChange={e => setCountry(e.target.value)} placeholder="Country" /></div>
        </CardContent>
      </Card>

      {/* Dark Mode */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {darkMode ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-accent" />}
            <div>
              <p className="font-medium text-sm">Dark Mode</p>
              <p className="text-[10px] text-muted-foreground">Toggle theme</p>
            </div>
          </div>
          <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
        </CardContent>
      </Card>

      {/* Save */}
      <Button className="w-full" onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Save Profile
      </Button>
    </div>
  );
}
