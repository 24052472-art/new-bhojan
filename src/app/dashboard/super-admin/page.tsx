"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { 
  Users, 
  UtensilsCrossed, 
  Activity,
  ArrowUpRight,
  Loader2,
  TrendingUp,
  Globe,
  Plus,
  ArrowRight,
  ShieldCheck,
  Zap,
  Server,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart3
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { getSuperAdminStats } from "./actions";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';

const dummyChartData = [
  { name: 'Jan', revenue: 4000, churn: 240 },
  { name: 'Feb', revenue: 3000, churn: 139 },
  { name: 'Mar', revenue: 2000, churn: 980 },
  { name: 'Apr', revenue: 2780, churn: 390 },
  { name: 'May', revenue: 1890, churn: 480 },
  { name: 'Jun', revenue: 2390, churn: 380 },
  { name: 'Jul', revenue: 3490, churn: 430 },
];

const COLORS = ['#ff5a2c', '#1e293b', '#94a3b8', '#cbd5e1'];

export default function SuperAdminOverview() {
  const [stats, setStats] = useState({
    restaurants: 0,
    users: 0,
    orders: 0,
    revenue: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchStats();
    
    const channel = supabase.channel('super-admin-overview')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurants' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchStats())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchStats() {
    try {
      const { stats: fetchedStats, recentActivity: fetchedActivity, error } = await getSuperAdminStats();
      
      if (error) throw new Error(error);

      if (fetchedStats) {
        setStats(fetchedStats);
      }
      setRecentActivity(fetchedActivity || []);
    } catch (e) {
      console.error("Critical error fetching stats:", e);
    } finally {
      setIsLoading(false);
    }
  }

  const cards = [
    { name: "Active Ecosystems", value: stats.restaurants, icon: UtensilsCrossed, trend: "Market Capacity" },
    { name: "Total Identities", value: stats.users, icon: Users, trend: "Global Reach" },
    { name: "Live Transactions", value: stats.orders, icon: Activity, trend: "Real-time Flow" },
    { name: "Global Revenue", value: `₹${stats.revenue.toLocaleString()}`, icon: TrendingUp, trend: "GTV (All Time)" },
  ];

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 py-8 animate-fade-in px-4">
      {/* Hero Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ff5a2c]/10 text-[#ff5a2c] text-[11px] font-bold uppercase tracking-widest border border-[#ff5a2c]/10">
            <Zap className="w-4 h-4" />
            Central Command Active
          </div>
          <h2 className="text-6xl md:text-7xl font-black tracking-tight text-slate-900 leading-[0.9]">
            Platform <span className="text-[#ff5a2c]">Intel.</span>
          </h2>
          <p className="text-slate-500 text-lg md:text-xl font-medium max-w-xl leading-relaxed">
            Global multi-tenant intelligence. Monitoring revenue, growth, and infrastructure health.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
           <button className="h-14 px-8 rounded-full bg-white border border-slate-200 text-slate-900 font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm">
             <BarChart3 className="w-5 h-5" /> Detailed Reports
           </button>
           <button className="h-14 px-8 rounded-full bg-[#ff5a2c] text-white font-bold flex items-center gap-2 hover:bg-[#ff5a2c]/90 transition-all shadow-lg shadow-[#ff5a2c]/20 group">
             <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" /> Onboard Tenant
           </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={card.name}
          >
            <Card className="bg-white border border-slate-100 hover:border-[#ff5a2c]/30 transition-all duration-500 group rounded-[32px] shadow-xl shadow-slate-200/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-[40px] -mr-10 -mt-10 transition-transform group-hover:scale-110" />
              <CardContent className="p-8 relative z-10">
                <div className="flex justify-between items-start mb-8">
                  <div className={`p-4 rounded-2xl bg-slate-50 text-[#ff5a2c] border border-slate-100 group-hover:bg-[#ff5a2c] group-hover:text-white transition-colors duration-500`}>
                    <card.icon className={`w-6 h-6`} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">{card.trend}</span>
                </div>
                <div>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tight">
                    {isLoading ? <Loader2 className="w-8 h-8 animate-spin text-slate-300" /> : card.value}
                  </h3>
                  <p className="text-sm font-bold text-slate-400 mt-2 uppercase tracking-widest">{card.name}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Analytics Visualization */}
      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 bg-white border border-slate-100 rounded-[40px] p-10 shadow-xl shadow-slate-200/40 space-y-8">
           <div className="flex justify-between items-center">
             <div>
               <h3 className="text-2xl font-black text-slate-900 tracking-tight">Revenue Stream</h3>
               <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Platform-wide Growth (Monthly)</p>
             </div>
             <div className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                <button className="px-4 py-2 bg-white text-slate-900 text-xs font-bold rounded-xl shadow-sm border border-slate-100">Revenue</button>
                <button className="px-4 py-2 text-slate-400 text-xs font-bold hover:text-slate-600">Churn</button>
             </div>
           </div>
           
           <div className="h-[400px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={dummyChartData}>
                 <defs>
                   <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#ff5a2c" stopOpacity={0.1}/>
                     <stop offset="95%" stopColor="#ff5a2c" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis 
                   dataKey="name" 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} 
                   dy={10}
                 />
                 <YAxis 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} 
                 />
                 <Tooltip 
                   contentStyle={{ 
                     backgroundColor: '#fff', 
                     borderRadius: '16px', 
                     border: 'none', 
                     boxShadow: '0 20px 50px rgba(0,0,0,0.1)' 
                   }}
                   itemStyle={{ color: '#1e293b', fontWeight: 700 }}
                 />
                 <Area 
                   type="monotone" 
                   dataKey="revenue" 
                   stroke="#ff5a2c" 
                   strokeWidth={4}
                   fillOpacity={1} 
                   fill="url(#colorRevenue)" 
                 />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </Card>

        <Card className="bg-slate-900 border-0 rounded-[40px] p-10 shadow-2xl space-y-10 relative overflow-hidden">
           <div className="absolute bottom-0 right-0 p-10 opacity-10 pointer-events-none text-white">
             <ShieldCheck className="w-60 h-60" />
           </div>
           
           <div className="relative z-10 space-y-8">
             <div>
               <h3 className="text-2xl font-black text-white tracking-tight">Market Share</h3>
               <p className="text-sm font-bold text-white/40 uppercase tracking-widest mt-1">Distribution by Plan</p>
             </div>

             <div className="h-[250px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={[
                       { name: 'Starter', value: 400 },
                       { name: 'Pro', value: 300 },
                       { name: 'Enterprise', value: 100 },
                     ]}
                     innerRadius={60}
                     outerRadius={80}
                     paddingAngle={10}
                     dataKey="value"
                   >
                     {dummyChartData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                   </Pie>
                   <Tooltip />
                 </PieChart>
               </ResponsiveContainer>
             </div>

             <div className="space-y-4 pt-6 border-t border-white/10">
                {[
                  { label: "Starter Tier", pct: 50, color: "bg-[#ff5a2c]" },
                  { label: "Pro Tier", pct: 35, color: "bg-white" },
                  { label: "Enterprise Tier", pct: 15, color: "bg-slate-400" }
                ].map((tier, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-white/60 uppercase tracking-widest">
                      <span>{tier.label}</span>
                      <span>{tier.pct}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full ${tier.color} rounded-full`} style={{ width: `${tier.pct}%` }} />
                    </div>
                  </div>
                ))}
             </div>
           </div>
        </Card>
      </div>

      {/* Secondary Content Area */}
      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              Live Network Flow
            </h4>
            <button className="text-xs font-bold text-slate-500 hover:text-[#ff5a2c] transition-colors flex items-center gap-2 bg-white border border-slate-100 px-5 py-2.5 rounded-full shadow-sm hover:shadow-md">
              Full Activity Feed <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-4">
             {recentActivity.map((item, i) => (
               <motion.div 
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: i * 0.1 }}
                 key={item.id} 
                 className="flex items-center justify-between p-7 bg-white border border-slate-100 rounded-[32px] group hover:border-[#ff5a2c]/30 transition-all cursor-pointer shadow-sm hover:shadow-xl hover:shadow-[#ff5a2c]/5"
               >
                 <div className="flex items-center gap-6">
                   <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-slate-50 text-slate-600 border border-slate-100 group-hover:bg-[#ff5a2c]/10 group-hover:text-[#ff5a2c] group-hover:border-[#ff5a2c]/20 transition-all">
                     <Globe className="w-7 h-7" />
                   </div>
                   <div>
                     <p className="text-xl font-bold text-slate-900">{item.restaurants?.name || "Unknown Tenant"}</p>
                     <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Transaction ID: {item.id.slice(0, 12)}</p>
                   </div>
                 </div>
                 <div className="text-right">
                    <p className="text-2xl font-black text-slate-900">₹{item.grand_total}</p>
                    <p className="text-[10px] text-[#ff5a2c] font-bold uppercase tracking-widest mt-1">Settled Access</p>
                 </div>
               </motion.div>
             ))}

             {recentActivity.length === 0 && !isLoading && (
               <div className="py-24 text-center border-2 border-dashed border-slate-200 rounded-[32px] bg-white">
                 <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                   <Activity className="w-10 h-10 text-slate-300" />
                 </div>
                 <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No recent platform activity detected.</p>
               </div>
             )}
          </div>
        </div>

        <div className="space-y-6">
           <h4 className="text-2xl font-black text-slate-900 tracking-tight">Core Infrastructure</h4>
           <Card className="bg-white border border-slate-100 rounded-[40px] p-10 space-y-10 shadow-xl shadow-slate-200/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none text-slate-900">
                <Server className="w-40 h-40" />
              </div>
              <div className="relative z-10 space-y-12">
                {[
                  { label: "Compute Latency", value: "14ms", status: "good", pct: 95 },
                  { label: "Database Health", value: "Optimal", status: "good", pct: 100 },
                  { label: "Sync Engine", value: "Running", status: "good", pct: 100 },
                  { label: "Storage Load", value: "2.4 TB", status: "good", pct: 45 }
                ].map((m, i) => (
                  <div key={i} className="space-y-4">
                    <div className="flex justify-between items-end">
                      <span className="text-[11px] font-black uppercase text-slate-400 tracking-widest">{m.label}</span>
                      <span className="text-sm font-black text-slate-900">{m.value}</span>
                    </div>
                    <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${m.pct}%` }}
                        transition={{ duration: 1.5, delay: 0.5 }}
                        className={`h-full rounded-full ${m.pct > 80 ? 'bg-[#ff5a2c]' : 'bg-slate-900'}`} 
                      />
                    </div>
                  </div>
                ))}
                
                <div className="pt-8 border-t border-slate-100 mt-6">
                   <div className="p-8 rounded-[32px] bg-[#ff5a2c]/5 border border-[#ff5a2c]/10 text-center">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-[#ff5a2c] opacity-80">Supabase Stack</p>
                      <p className="text-2xl font-black text-slate-900 tracking-tight leading-tight">All Systems <br/>Operational</p>
                      <div className="flex justify-center gap-1.5 mt-4">
                        {[1, 2, 3, 4, 5].map(dot => (
                          <div key={dot} className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        ))}
                      </div>
                   </div>
                </div>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}
