import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, ScanLine, PlusCircle, Trophy, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/dashboard', label: 'Home', icon: Home },
  { path: '/scan', label: 'Scan', icon: ScanLine },
  { path: '/submit', label: 'Submit', icon: PlusCircle },
  { path: '/leaderboard', label: 'Rank', icon: Trophy },
  { path: '/history', label: 'Profile', icon: User },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

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
