import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Coins, Loader2, Gift, ShoppingCart } from 'lucide-react';

interface Reward {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  points_cost: number;
  stock: number;
  category: string;
}

export default function Marketplace() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [{ data: rw }, { data: profile }] = await Promise.all([
      supabase.from('rewards').select('*').eq('is_active', true).order('points_cost'),
      supabase.from('profiles').select('points').eq('id', user?.id).single(),
    ]);
    setRewards((rw as Reward[]) || []);
    setUserPoints(profile?.points || 0);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const handleBuy = (reward: Reward) => {
    navigate('/checkout', {
      state: { reward, userPoints },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Marketplace</h1>
        </div>
        <Badge variant="secondary" className="text-sm gap-1 px-3 py-1.5">
          <Coins className="w-4 h-4" />
          {userPoints} pts
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {rewards.map(reward => {
          const canAfford = userPoints >= reward.points_cost;
          const outOfStock = reward.stock === 0;
          return (
            <Card key={reward.id} className="overflow-hidden">
              {reward.image_url && (
                <img src={reward.image_url} alt={reward.name} className="w-full h-32 object-cover" />
              )}
              <CardContent className="p-3 space-y-2">
                <h3 className="font-semibold text-sm leading-tight">{reward.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{reward.description}</p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Coins className="w-3 h-3" /> {reward.points_cost}
                  </Badge>
                  {reward.stock > 0 && (
                    <span className="text-[10px] text-muted-foreground">{reward.stock} left</span>
                  )}
                </div>
                <Button
                  size="sm"
                  className="w-full gap-1 text-xs"
                  disabled={!canAfford || outOfStock}
                  onClick={() => handleBuy(reward)}
                >
                  {outOfStock ? (
                    'Out of Stock'
                  ) : !canAfford ? (
                    'Not Enough Points'
                  ) : (
                    <><ShoppingCart className="w-3 h-3" /> Buy Now</>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {rewards.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Gift className="w-10 h-10 mx-auto mb-2 opacity-50" />
            No rewards available yet
          </CardContent>
        </Card>
      )}
    </div>
  );
}
