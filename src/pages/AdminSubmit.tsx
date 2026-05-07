import { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { WASTE_CONFIG, calculatePoints } from '@/lib/constants';
import {
  Upload, Image, Loader2, CheckCircle2, AlertTriangle, XCircle,
  ScanLine, Camera, XCircle as XIcon, User, Clipboard,
} from 'lucide-react';

type ClassifyResult = {
  wasteType: string;
  confidence: number;
  status: 'approved' | 'review' | 'rejected';
};

export default function AdminSubmit() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Step 1: scan user QR or manual ID
  const [scanning, setScanning] = useState(false);
  const [scannedUser, setScannedUser] = useState<{ userId: string; name: string } | null>(null);
  const [manualId, setManualId] = useState('');
  const [lookingUp, setLookingUp] = useState(false);

  const lookupUserById = async () => {
    const id = manualId.trim();
    if (!id) return;
    setLookingUp(true);
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('id', id)
        .single();
      if (error || !profile) {
        toast({ title: 'User not found', description: 'No user with that ID exists.', variant: 'destructive' });
      } else {
        setScannedUser({ userId: profile.id, name: profile.name || 'Unknown User' });
        toast({ title: 'User identified!', description: profile.name || id });
      }
    } catch {
      toast({ title: 'Lookup failed', description: 'Could not find user.', variant: 'destructive' });
    } finally {
      setLookingUp(false);
    }
  };

  // Step 2: waste submission
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [classifying, setClassifying] = useState(false);
  const [result, setResult] = useState<ClassifyResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);

  const startScanner = async () => {
    try {
      const scanner = new Html5Qrcode('admin-qr-reader');
      scannerRef.current = scanner;
      setScanning(true);
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          try {
            const data = JSON.parse(decodedText);
            if (data.userId && data.type === 'ecotrack-user') {
              scanner.stop();
              setScanning(false);
              // Look up user profile
              const { data: profile } = await supabase
                .from('profiles')
                .select('name')
                .eq('id', data.userId)
                .single();
              setScannedUser({ userId: data.userId, name: profile?.name || 'Unknown User' });
              toast({ title: 'User identified!', description: profile?.name || data.userId });
            }
          } catch {
            toast({ title: 'Invalid QR code', description: 'Not a valid EcoTrack user QR.', variant: 'destructive' });
          }
        },
        () => {},
      );
    } catch {
      toast({ title: 'Camera error', description: 'Could not access camera.', variant: 'destructive' });
      setScanning(false);
    }
  };

  const stopScanner = () => {
    scannerRef.current?.stop().catch(() => {});
    setScanning(false);
  };

  useEffect(() => {
    return () => { scannerRef.current?.stop().catch(() => {}); };
  }, []);

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
    if (!imageFile || !scannedUser || !user) return;
    setClassifying(true);
    try {
      const ext = imageFile.name.split('.').pop();
      const path = `${scannedUser.userId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('waste-images').upload(path, imageFile);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('waste-images').getPublicUrl(path);

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

      if (status === 'approved' || status === 'review') {
        setSubmitting(true);
        const { data: profileData } = await supabase.from('profiles').select('streak').eq('id', scannedUser.userId).single();
        const streak = profileData?.streak || 0;
        // Admin submissions always count as "bin" submissions (1.5x)
        const pts = calculatePoints(wasteType, quantity, confidence, true, streak);

        const { error: insertError } = await supabase.from('submissions').insert({
          user_id: scannedUser.userId,
          image_url: publicUrl,
          waste_type: wasteType as any,
          confidence,
          quantity,
          bin_id: null,
          status,
          points_awarded: status === 'approved' ? pts : 0,
        });
        if (insertError) throw insertError;

        if (status === 'approved') {
          await supabase.rpc('increment_points', { p_user_id: scannedUser.userId, p_pts: pts, p_kg: quantity });
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

  const resetAll = () => {
    setScannedUser(null);
    setImageFile(null);
    setPreview(null);
    setQuantity(1);
    setResult(null);
    setSubmitted(false);
    setPointsEarned(0);
  };

  // Success / Review screen
  if (submitted && result) {
    const cfg = WASTE_CONFIG[result.wasteType] || WASTE_CONFIG.unknown;
    return (
      <div className="max-w-lg mx-auto px-4 py-6 flex flex-col items-center justify-center min-h-[70vh] text-center space-y-4">
        {result.status === 'approved' ? (
          <>
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Submission Approved!</h1>
            <p className="text-sm text-muted-foreground">For: {scannedUser?.name}</p>
            <p className="text-4xl">{cfg.icon}</p>
            <p className="text-lg font-semibold">{cfg.label} · {result.confidence.toFixed(0)}% confidence</p>
            <p className="text-3xl font-extrabold text-primary">+{pointsEarned} pts</p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-accent" />
            </div>
            <h1 className="text-2xl font-bold">Pending Review</h1>
            <p className="text-sm text-muted-foreground">For: {scannedUser?.name}</p>
            <p className="text-lg">{cfg.icon} {cfg.label} · {result.confidence.toFixed(0)}%</p>
            <p className="text-muted-foreground text-sm">AI confidence was too low for auto-approval.</p>
          </>
        )}
        <Button onClick={resetAll} className="rounded-xl" size="lg">
          Scan Next User
        </Button>
      </div>
    );
  }

  // Step 1: Scan user QR or enter ID manually
  if (!scannedUser) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ScanLine className="w-6 h-6 text-primary" /> Admin — Identify User
          </h1>
          <p className="text-muted-foreground text-sm">Scan the user's QR code or paste their unique ID</p>
        </div>

        {/* Manual ID Entry */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clipboard className="w-4 h-4 text-primary" /> Paste User ID
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Paste user's unique ID here..."
                value={manualId}
                onChange={e => setManualId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && lookupUserById()}
                className="font-mono text-xs"
              />
              <Button onClick={lookupUserById} disabled={!manualId.trim() || lookingUp} className="shrink-0">
                {lookingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Look Up'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground font-medium">OR</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* QR Scanner */}
        <div id="admin-qr-reader" className="rounded-xl overflow-hidden bg-muted aspect-square max-w-[300px] mx-auto" />

        {!scanning ? (
          <Button onClick={startScanner} className="w-full gap-2 rounded-xl" size="lg" variant="outline">
            <Camera className="w-5 h-5" /> Scan QR Code
          </Button>
        ) : (
          <Button onClick={stopScanner} variant="outline" className="w-full gap-2 rounded-xl" size="lg">
            <XIcon className="w-5 h-5" /> Stop Scanner
          </Button>
        )}
      </div>
    );
  }

  // Step 2: Upload waste image
  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Submit Waste</h1>
        <div className="flex items-center gap-2 mt-1">
          <User className="w-4 h-4 text-primary" />
          <p className="text-sm text-primary font-medium">User: {scannedUser.name}</p>
        </div>
      </div>

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

      <div className="space-y-1.5">
        <Label>Estimated quantity (kg)</Label>
        <Input type="number" min={0.1} max={100} step={0.1} value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
      </div>

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

      <Button variant="ghost" className="w-full text-muted-foreground" onClick={resetAll}>
        ← Scan Different User
      </Button>
    </div>
  );
}
