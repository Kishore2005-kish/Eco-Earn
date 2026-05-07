import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Coins, Loader2, CheckCircle2, ArrowLeft, ShoppingBag, Package, MapPin,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface CheckoutState {
  reward: {
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    points_cost: number;
  };
  userPoints: number;
}

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const state = location.state as CheckoutState | null;

  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!state?.reward) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center space-y-4">
        <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground" />
        <p className="text-muted-foreground">No item selected for checkout.</p>
        <Button onClick={() => navigate('/marketplace')}>Go to Shop</Button>
      </div>
    );
  }

  const { reward, userPoints } = state;
  const remaining = userPoints - reward.points_cost;

  const handleConfirm = async () => {
    if (!user) return;
    setRedeeming(true);
    try {
      const { data, error } = await supabase.rpc('redeem_reward', {
        p_user_id: user.id,
        p_reward_id: reward.id,
      });
      if (error) throw error;
      if (data !== 'success') {
        toast({ title: 'Cannot redeem', description: data as string, variant: 'destructive' });
        setRedeeming(false);
        return;
      }
      setSuccess(true);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setRedeeming(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 flex flex-col items-center text-center space-y-5">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Order Confirmed! 🎉</h1>
        <p className="text-muted-foreground">
          You've redeemed <span className="font-semibold text-foreground">{reward.name}</span> for{' '}
          <span className="font-semibold text-primary">{reward.points_cost} pts</span>.
        </p>
        <Card className="w-full">
          <CardContent className="p-4 space-y-2 text-sm text-left">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Remaining Balance</span>
              <span className="font-semibold">{remaining} pts</span>
            </div>
            {address && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery Address</span>
                <span className="text-right max-w-[60%]">{address}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant="secondary">Processing</Badge>
            </div>
          </CardContent>
        </Card>
        <div className="flex gap-3 w-full">
          <Button variant="outline" className="flex-1" onClick={() => navigate('/marketplace')}>
            Continue Shopping
          </Button>
          <Button className="flex-1" onClick={() => navigate('/history')}>
            View History
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Package className="w-6 h-6 text-primary" /> Checkout
      </h1>

      {/* Item Summary */}
      <Card>
        <CardContent className="p-4 flex gap-4">
          {reward.image_url && (
            <img src={reward.image_url} alt={reward.name} className="w-20 h-20 rounded-lg object-cover shrink-0" />
          )}
          <div className="flex-1 space-y-1">
            <h3 className="font-semibold text-sm">{reward.name}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2">{reward.description}</p>
            <Badge variant="outline" className="gap-1 text-xs mt-1">
              <Coins className="w-3 h-3" /> {reward.points_cost} pts
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Details */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" /> Delivery Details
          </h3>
          <div className="space-y-1.5">
            <Label className="text-xs">Delivery Address</Label>
            <Textarea
              placeholder="Enter your full address with pincode..."
              value={address}
              onChange={e => setAddress(e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Phone Number</Label>
            <Input
              placeholder="+91 XXXXX XXXXX"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Note (optional)</Label>
            <Input
              placeholder="Any special instructions..."
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Points Summary */}
      <Card>
        <CardContent className="p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Your Balance</span>
            <span className="font-medium">{userPoints} pts</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Item Cost</span>
            <span className="font-medium text-destructive">-{reward.points_cost} pts</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>Remaining</span>
            <span className="text-primary">{remaining} pts</span>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleConfirm}
        className="w-full rounded-xl gap-2"
        size="lg"
        disabled={redeeming || remaining < 0}
      >
        {redeeming ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
        {redeeming ? 'Processing...' : 'Confirm Redemption'}
      </Button>
    </div>
  );
}
