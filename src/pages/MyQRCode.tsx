import { useAuth } from '@/hooks/useAuth';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QrCode, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function MyQRCode() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ name: string; level: number; points: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('name, level, points').eq('id', user.id).single()
      .then(({ data }) => { if (data) setProfile(data); });
  }, [user]);

  if (!user) return null;

  // QR data encodes the user ID for admin scanning
  const qrData = JSON.stringify({ userId: user.id, type: 'ecotrack-user' });

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <QrCode className="w-6 h-6 text-primary" /> My QR Code
        </h1>
        <p className="text-muted-foreground text-sm">Show this to the recycling station admin to log your submission</p>
      </div>

      <Card className="border-primary/30">
        <CardContent className="p-6 flex flex-col items-center space-y-4">
          <div className="bg-white p-4 rounded-2xl">
            <QRCodeSVG
              value={qrData}
              size={220}
              level="H"
              includeMargin={false}
              bgColor="#ffffff"
              fgColor="#0f172a"
            />
          </div>

          {profile && (
            <div className="text-center space-y-1">
              <p className="font-bold text-lg">{profile.name || 'EcoTrack User'}</p>
              <div className="flex items-center gap-2 justify-center">
                <Badge variant="secondary">Level {profile.level}</Badge>
                <Badge variant="outline">{profile.points} pts</Badge>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center max-w-[260px]">
            This is your unique recycling ID. The admin will scan this code when you drop off recyclable waste.
          </p>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="w-3.5 h-3.5" />
            <span>Secure & unique to your account</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
