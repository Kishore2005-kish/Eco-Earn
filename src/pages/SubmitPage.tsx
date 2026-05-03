import { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { WASTE_CONFIG, calculatePoints } from '@/lib/constants';
import { Upload, Image, Loader2, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

type ClassifyResult = {
  wasteType: string;
  confidence: number;
  status: 'approved' | 'review' | 'rejected';
};

export default function SubmitPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const binId = (location.state as any)?.binId || null;
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [classifying, setClassifying] = useState(false);
  const [result, setResult] = useState<ClassifyResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 5MB.', variant: 'destructive' });
      return;
    }
    setImageFile(file);
    setResult(null);
    setSubmitted(false);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleClassify = async () => {
    if (!imageFile || !user) return;
    setClassifying(true);
    try {
      // Upload image to storage
      const ext = imageFile.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('waste-images').upload(path, imageFile);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('waste-images').getPublicUrl(path);

      // Call classify edge function
      const { data, error } = await supabase.functions.invoke('classify-waste', {
        body: { imageUrl: publicUrl },
      });
      if (error) throw error;

      const wasteType = data.wasteType || 'unknown';
      const confidence = data.confidence || 0;
      let status: 'approved' | 'review' | 'rejected' = 'rejected';
      if (confidence > 80) status = 'approved';
      else if (confidence >= 50) status = 'review';

      setResult({ wasteType, confidence, status });

      // If approved, submit immediately
      if (status === 'approved' || status === 'review') {
        setSubmitting(true);
        const { data: profileData } = await supabase.from('profiles').select('streak').eq('id', user.id).single();
        const streak = profileData?.streak || 0;
        const pts = calculatePoints(wasteType, quantity, confidence, !!binId, streak);

        const { error: insertError } = await supabase.from('submissions').insert({
          user_id: user.id,
          image_url: publicUrl,
          waste_type: wasteType as any,
          confidence,
          quantity,
          bin_id: binId,
          status,
          points_awarded: status === 'approved' ? pts : 0,
        });
        if (insertError) throw insertError;

        if (status === 'approved') {
          // Atomically increment points, streak, level via DB function
          await supabase.rpc('increment_points', { p_user_id: user.id, p_pts: pts, p_kg: quantity });
          setPointsEarned(pts);
        }
        setSubmitted(true);
        setSubmitting(false);
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Classification failed', variant: 'destructive' });
    } finally {
      setClassifying(false);
    }
  };

  if (submitted && result) {
    const cfg = WASTE_CONFIG[result.wasteType] || WASTE_CONFIG.unknown;
    return (
      <div className="max-w-lg mx-auto px-4 py-6 flex flex-col items-center justify-center min-h-[70vh] text-center space-y-4">
        {result.status === 'approved' ? (
          <>
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Recycling Approved!</h1>
            <p className="text-4xl">{cfg.icon}</p>
            <p className="text-lg font-semibold">{cfg.label} · {result.confidence.toFixed(0)}% confidence</p>
            <p className="text-3xl font-extrabold text-primary">+{pointsEarned} pts</p>
            {binId && <p className="text-sm text-accent">🎯 Smart bin bonus applied!</p>}
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-accent" />
            </div>
            <h1 className="text-2xl font-bold">Pending Review</h1>
            <p className="text-lg">{cfg.icon} {cfg.label} · {result.confidence.toFixed(0)}% confidence</p>
            <p className="text-muted-foreground text-sm">AI confidence was too low for auto-approval. An admin will review.</p>
          </>
        )}
        <div className="flex gap-3 pt-4">
          <Button onClick={() => { setResult(null); setSubmitted(false); setImageFile(null); setPreview(null); }} variant="outline" className="rounded-xl">Submit Another</Button>
          <Button onClick={() => navigate('/dashboard')} className="rounded-xl">Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Submit Waste</h1>
        <p className="text-muted-foreground text-sm">Upload a photo and our AI will classify it</p>
        {binId && (
          <p className="text-xs text-primary mt-1 font-medium">📍 Smart bin: {binId} (1.5x bonus!)</p>
        )}
      </div>

      {/* Image Upload */}
      <Card className="border-dashed border-2 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => fileRef.current?.click()}>
        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[200px]">
          {preview ? (
            <img src={preview} alt="Waste preview" className="max-h-[250px] rounded-lg object-contain" />
          ) : (
            <>
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
                <Image className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="font-medium text-sm">Tap to upload photo</p>
              <p className="text-xs text-muted-foreground">JPG, PNG up to 5MB</p>
            </>
          )}
        </CardContent>
      </Card>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />

      {/* Quantity */}
      <div className="space-y-1.5">
        <Label>Estimated quantity (kg)</Label>
        <Input type="number" min={0.1} max={100} step={0.1} value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
      </div>

      {/* Classify Button */}
      <Button
        onClick={handleClassify}
        className="w-full rounded-xl gap-2"
        size="lg"
        disabled={!imageFile || classifying || submitting}
      >
        {classifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
        {classifying ? 'Analyzing...' : 'Classify & Submit'}
      </Button>

      {result && result.status === 'rejected' && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 text-center space-y-2">
            <XCircle className="w-8 h-8 text-destructive mx-auto" />
            <p className="font-medium">Classification Rejected</p>
            <p className="text-sm text-muted-foreground">AI confidence too low ({result.confidence.toFixed(0)}%). Try a clearer photo.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
