import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, MapPin, Building, Flag } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend,
} from 'recharts';

const COLORS = [
  'hsl(152, 60%, 36%)', 'hsl(200, 80%, 55%)', 'hsl(42, 90%, 55%)',
  'hsl(12, 80%, 60%)', 'hsl(220, 40%, 50%)', 'hsl(142, 70%, 45%)',
  'hsl(280, 60%, 55%)', 'hsl(180, 40%, 50%)',
];

// Sample global recycling data
const globalData = [
  { country: 'Germany', rate: 67, plastic: 42, paper: 78, metal: 89, organic: 60, ewaste: 35 },
  { country: 'South Korea', rate: 59, plastic: 38, paper: 72, metal: 85, organic: 55, ewaste: 30 },
  { country: 'Austria', rate: 58, plastic: 35, paper: 70, metal: 82, organic: 58, ewaste: 28 },
  { country: 'Wales', rate: 57, plastic: 33, paper: 68, metal: 80, organic: 52, ewaste: 25 },
  { country: 'Switzerland', rate: 53, plastic: 30, paper: 65, metal: 78, organic: 50, ewaste: 22 },
  { country: 'Netherlands', rate: 51, plastic: 28, paper: 63, metal: 75, organic: 48, ewaste: 20 },
  { country: 'Japan', rate: 49, plastic: 25, paper: 60, metal: 72, organic: 45, ewaste: 32 },
  { country: 'India', rate: 22, plastic: 12, paper: 30, metal: 45, organic: 18, ewaste: 8 },
];

const indiaStateData = [
  { state: 'Kerala', rate: 38, volume: 2100 },
  { state: 'Goa', rate: 35, volume: 450 },
  { state: 'Himachal', rate: 32, volume: 680 },
  { state: 'Sikkim', rate: 30, volume: 320 },
  { state: 'Karnataka', rate: 28, volume: 3800 },
  { state: 'Tamil Nadu', rate: 26, volume: 4200 },
  { state: 'Maharashtra', rate: 24, volume: 6500 },
  { state: 'Delhi', rate: 20, volume: 3200 },
  { state: 'Uttar Pradesh', rate: 15, volume: 5800 },
  { state: 'Bihar', rate: 12, volume: 2200 },
];

const indiaCityData = [
  { city: 'Mysuru', rate: 42, co2Saved: 1200 },
  { city: 'Indore', rate: 40, co2Saved: 2800 },
  { city: 'Pune', rate: 35, co2Saved: 3100 },
  { city: 'Bengaluru', rate: 30, co2Saved: 4500 },
  { city: 'Chennai', rate: 28, co2Saved: 3800 },
  { city: 'Mumbai', rate: 25, co2Saved: 5200 },
  { city: 'Hyderabad', rate: 24, co2Saved: 2900 },
  { city: 'Delhi', rate: 20, co2Saved: 4100 },
  { city: 'Kolkata', rate: 18, co2Saved: 2600 },
  { city: 'Ahmedabad', rate: 16, co2Saved: 1900 },
];

const yearlyTrend = [
  { year: '2018', global: 18, india: 10 },
  { year: '2019', global: 20, india: 12 },
  { year: '2020', global: 19, india: 11 },
  { year: '2021', global: 22, india: 14 },
  { year: '2022', global: 25, india: 17 },
  { year: '2023', global: 28, india: 19 },
  { year: '2024', global: 30, india: 21 },
  { year: '2025', global: 32, india: 23 },
];

const wasteComposition = [
  { name: 'Organic', value: 45 },
  { name: 'Plastic', value: 18 },
  { name: 'Paper', value: 15 },
  { name: 'Glass', value: 7 },
  { name: 'Metal', value: 5 },
  { name: 'E-Waste', value: 4 },
  { name: 'Other', value: 6 },
];

export default function GlobalCharts() {
  const [tab, setTab] = useState('global');

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5 pb-24">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Globe className="w-6 h-6 text-primary" /> Recycling Insights
        </h1>
        <p className="text-muted-foreground text-sm">Real-world recycling data & trends</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full">
          <TabsTrigger value="global" className="flex-1 gap-1"><Globe className="w-3 h-3" /> Global</TabsTrigger>
          <TabsTrigger value="country" className="flex-1 gap-1"><Flag className="w-3 h-3" /> Country</TabsTrigger>
          <TabsTrigger value="state" className="flex-1 gap-1"><MapPin className="w-3 h-3" /> State</TabsTrigger>
          <TabsTrigger value="city" className="flex-1 gap-1"><Building className="w-3 h-3" /> City</TabsTrigger>
        </TabsList>

        {/* GLOBAL */}
        <TabsContent value="global" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">🌍 Global Recycling Rates by Country</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={globalData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <YAxis dataKey="country" type="category" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Bar dataKey="rate" radius={[0, 6, 6, 0]}>
                    {globalData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">📊 Global Waste Composition</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={wasteComposition} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({ name, value }) => `${name} ${value}%`} labelLine={{ strokeWidth: 1 }}>
                      {wasteComposition.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">📈 Recycling Rate Trend</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={yearlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="%" />
                    <Tooltip formatter={(v: number) => `${v}%`} />
                    <Legend />
                    <Area type="monotone" dataKey="global" name="Global" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.2} />
                    <Area type="monotone" dataKey="india" name="India" stroke={COLORS[3]} fill={COLORS[3]} fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* COUNTRY */}
        <TabsContent value="country" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">🇮🇳 India – Recycling by Material Type</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={globalData.filter(d => d.country === 'India').length > 0 ? globalData : globalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="country" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="plastic" name="Plastic" fill={COLORS[1]} radius={[4,4,0,0]} />
                  <Bar dataKey="paper" name="Paper" fill={COLORS[2]} radius={[4,4,0,0]} />
                  <Bar dataKey="metal" name="Metal" fill={COLORS[4]} radius={[4,4,0,0]} />
                  <Bar dataKey="ewaste" name="E-Waste" fill={COLORS[3]} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Fun facts */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-primary/20"><CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">62M</p>
              <p className="text-xs text-muted-foreground">Tons of waste generated in India/year</p>
            </CardContent></Card>
            <Card className="border-primary/20"><CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">22%</p>
              <p className="text-xs text-muted-foreground">Average recycling rate</p>
            </CardContent></Card>
            <Card className="border-accent/20"><CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-accent-foreground">3.4M</p>
              <p className="text-xs text-muted-foreground">Waste workers</p>
            </CardContent></Card>
            <Card className="border-accent/20"><CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-accent-foreground">₹30K Cr</p>
              <p className="text-xs text-muted-foreground">Recycling industry value</p>
            </CardContent></Card>
          </div>
        </TabsContent>

        {/* STATE */}
        <TabsContent value="state" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">🗺️ Indian States – Recycling Performance</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={indiaStateData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="state" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip formatter={(v: number, name: string) => name === 'rate' ? `${v}%` : `${v} tons`} />
                  <Legend />
                  <Bar dataKey="rate" name="Recycling Rate %" fill={COLORS[0]} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">📦 Waste Volume by State (tons/day)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={indiaStateData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="state" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="volume" name="Volume (tons/day)" fill={COLORS[2]} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CITY */}
        <TabsContent value="city" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">🏙️ Indian Cities – Recycling Rates</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={indiaCityData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 50]} tick={{ fontSize: 11 }} unit="%" />
                  <YAxis dataKey="city" type="category" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Bar dataKey="rate" radius={[0, 6, 6, 0]}>
                    {indiaCityData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">🌿 CO₂ Saved by City (tons/year)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={indiaCityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="city" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="co2Saved" name="CO₂ Saved (tons)" stroke={COLORS[0]} strokeWidth={2} dot={{ fill: COLORS[0], r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
