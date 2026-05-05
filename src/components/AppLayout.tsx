import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, QrCode, ScanLine, Trophy, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserRole } from '@/hooks/useUserRole';

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useUserRole();

  const navItems = isAdmin
    ? [
        { path: '/dashboard', label: 'Home', icon: Home },
        { path: '/admin/submit', label: 'Scan', icon: ScanLine },
        { path: '/leaderboard', label: 'Rank', icon: Trophy },
        { path: '/history', label: 'Profile', icon: User },
      ]
    : [
        { path: '/dashboard', label: 'Home', icon: Home },
        { path: '/my-qr', label: 'My QR', icon: QrCode },
        { path: '/leaderboard', label: 'Rank', icon: Trophy },
        { path: '/history', label: 'Profile', icon: User },
      ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 pb-20 overflow-y-auto">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border backdrop-blur-lg bg-opacity-90">
        <div className="flex items-center justify-around max-w-lg mx-auto h-16">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all',
                  active ? 'text-primary scale-105' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <item.icon className={cn('w-5 h-5', active && 'stroke-[2.5]')} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
