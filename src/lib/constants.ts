export const WASTE_CONFIG: Record<string, { label: string; icon: string; basePoints: number; co2PerKg: number; treesPerKg: number; color: string }> = {
  plastic: { label: 'Plastic', icon: '♻️', basePoints: 5, co2PerKg: 1.5, treesPerKg: 0, color: 'hsl(200, 80%, 55%)' },
  metal: { label: 'Metal', icon: '🔩', basePoints: 8, co2PerKg: 4.0, treesPerKg: 0, color: 'hsl(220, 40%, 50%)' },
  paper: { label: 'Paper', icon: '📄', basePoints: 4, co2PerKg: 0.9, treesPerKg: 0.017, color: 'hsl(42, 90%, 55%)' },
  organic: { label: 'Organic', icon: '🌱', basePoints: 3, co2PerKg: 0.5, treesPerKg: 0, color: 'hsl(142, 70%, 45%)' },
  glass: { label: 'Glass', icon: '🫙', basePoints: 6, co2PerKg: 0.3, treesPerKg: 0, color: 'hsl(180, 40%, 50%)' },
  ewaste: { label: 'E-Waste', icon: '🔋', basePoints: 15, co2PerKg: 20, treesPerKg: 0, color: 'hsl(12, 80%, 60%)' },
  unknown: { label: 'Unknown', icon: '❓', basePoints: 2, co2PerKg: 0.5, treesPerKg: 0, color: 'hsl(0, 0%, 50%)' },
};

export function calculatePoints(wasteType: string, quantity: number, confidence: number, hasBin: boolean, streak: number): number {
  const config = WASTE_CONFIG[wasteType] || WASTE_CONFIG.unknown;
  const confidenceMultiplier = confidence / 100;
  const binBonus = hasBin ? 1.5 : 1.0;
  const streakBonus = 1 + Math.min(streak, 30) * 0.05;
  return Math.round(config.basePoints * quantity * confidenceMultiplier * binBonus * streakBonus);
}

export function getLevel(points: number): number {
  if (points < 50) return 1;
  if (points < 150) return 2;
  if (points < 350) return 3;
  if (points < 700) return 4;
  if (points < 1200) return 5;
  if (points < 2000) return 6;
  if (points < 3500) return 7;
  if (points < 5500) return 8;
  if (points < 8000) return 9;
  return 10;
}

export function getNextLevelPoints(level: number): number {
  const thresholds = [0, 50, 150, 350, 700, 1200, 2000, 3500, 5500, 8000, Infinity];
  return thresholds[level] ?? Infinity;
}

export function getLevelName(level: number): string {
  const names = ['', 'Eco Beginner', 'Green Starter', 'Recycling Fan', 'Eco Warrior', 'Green Champion', 'Recycling Pro', 'Eco Master', 'Sustainability Guru', 'Zero Waste Hero', 'Planet Savior'];
  return names[level] || 'Planet Savior';
}
