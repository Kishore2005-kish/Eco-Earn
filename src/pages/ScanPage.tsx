import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ScanLine, Camera, XCircle, MapPin } from 'lucide-react';

export default function ScanPage() {
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState<{ binId: string; location: string } | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const startScanner = async () => {
    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      setScanning(true);
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          try {
            const data = JSON.parse(decodedText);
            if (data.binId) {
              setScannedData(data);
              scanner.stop();
              setScanning(false);
              toast({ title: 'Bin scanned!', description: `${data.location || data.binId}` });
            }
          } catch {
            toast({ title: 'Invalid QR code', description: 'Not a valid EcoTrack bin.', variant: 'destructive' });
          }
        },
        () => {},
      );
    } catch (err) {
      toast({ title: 'Camera error', description: 'Could not access camera. Check permissions.', variant: 'destructive' });
      setScanning(false);
    }
  };

  const stopScanner = () => {
    scannerRef.current?.stop().catch(() => {});
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      scannerRef.current?.stop().catch(() => {});
    };
  }, []);

  const handleProceed = () => {
    navigate('/submit', { state: { binId: scannedData?.binId } });
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ScanLine className="w-6 h-6 text-primary" /> Scan Bin
        </h1>
        <p className="text-muted-foreground text-sm">Scan a QR code at a smart recycling bin for bonus points</p>
      </div>

      {!scannedData ? (
        <>
          <div id="qr-reader" className="rounded-xl overflow-hidden bg-muted aspect-square max-w-[300px] mx-auto" />

          {!scanning ? (
            <Button onClick={startScanner} className="w-full gap-2 rounded-xl" size="lg">
              <Camera className="w-5 h-5" /> Start Scanning
            </Button>
          ) : (
            <Button onClick={stopScanner} variant="outline" className="w-full gap-2 rounded-xl" size="lg">
              <XCircle className="w-5 h-5" /> Stop Scanner
            </Button>
          )}

          <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => navigate('/submit')}>
            Skip — submit without scanning
          </Button>
        </>
      ) : (
        <Card className="border-primary/50">
          <CardContent className="p-5 text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-bold text-lg">Bin Found!</h2>
            <p className="text-muted-foreground text-sm">{scannedData.location}</p>
            <p className="text-xs text-primary font-medium">Bin ID: {scannedData.binId}</p>
            <p className="text-xs text-accent font-medium">🎉 1.5x bonus points for using a smart bin!</p>
            <Button onClick={handleProceed} className="w-full rounded-xl" size="lg">
              Continue to Submit
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
