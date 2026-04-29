"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { 
  TrendingUp, 
  Users, 
  UtensilsCrossed, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  Download,
  Calendar,
  Zap,
  Target,
  Activity,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { motion } from "framer-motion";

const growthData = [
  { name: 'Week 1', restaurants: 12, revenue: 12000, churn: 1 },
  { name: 'Week 2', restaurants: 18, revenue: 19000, churn: 0 },
  { name: 'Week 3', restaurants: 25, revenue: 27000, churn: 2 },
  { name: 'Week 4', restaurants: 34, revenue: 42000, churn: 1 },
  { name: 'Week 5', restaurants: 42, revenue: 58000, churn: 3 },
  { name: 'Week 6', restaurants: 58, revenue: 84000, churn: 2 },
];

const planDistribution = [
  { name: 'Starter', value: 400 },
  { name: 'Pro', value: 300 },
  { name: 'Enterprise', value: 100 },
];

const COLORS = ['#ff5a2c', '#0f172a', '#94a3b8'];

export default function SuperAdminAnalytics() {
  return (
    <div className="max-w-[1600px] mx-auto space-y-12 pb-20 animate-fade-in px-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 py-8 border-b border-slate-100">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ff5a2c]/10 text-[#ff5a2c] text-[11px] font-black uppercase tracking-widest border border-[#ff5a2c]/10">
             <Target className="w-4 h-4" /> Global Growth Engine
          </div>
          <h2 className="text-6xl font-black text-slate-900 tracking-tight leading-[0.9]">
            Deep <span className="text-[#ff5a2c]">Metrics.</span>
          </h2>
          <p className="text-slate-500 font-bold max-w-xl text-lg leading-relaxed uppercase tracking-tight opacity-70">
            Real-time churn analysis, MRR tracking, and platform scaling metrics.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
           <Button variant="outline" className="h-14 px-8 rounded-full border-2 border-slate-200 text-slate-900 font-black gap-2">
             <Calendar className="w-5 h-5" /> Last 30 Days
           </Button>
           <Button className="h-14 px-8 rounded-full bg-slate-900 text-white font-black flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10">
             <Download className="w-5 h-5" /> Export Intelligence
           </Button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Platform MRR", value: "₹4,82,900", change: "+12.5%", icon: DollarSign, positive: true },
          { label: "Active Tenants", value: "142", change: "+8", icon: UtensilsCrossed, positive: true },
          { label: "Churn Rate", value: "2.4%", change: "-0.4%", icon: Activity, positive: true },
          { label: "Avg. Revenue/User", value: "₹3,400", change: "+₹210", icon: TrendingUp, positive: true },
        ].map((kpi, i) => (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={kpi.label}>
            <Card className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-5 text-slate-900 group-hover:scale-110 transition-transform">
                 <kpi.icon className="w-16 h-16" />
               </div>
               <div className="space-y-4 relative z-10">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{kpi.label}</p>
                 <div className="flex items-end gap-4">
                   <h3 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{kpi.value}</h3>
                   <span className={`text-xs font-black px-2 py-1 rounded-lg ${kpi.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                     {kpi.change}
                   </span>
                 </div>
               </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 bg-white border border-slate-100 rounded-[48px] p-12 shadow-2xl shadow-slate-200/40 space-y-10">
           <div className="flex justify-between items-center">
             <div>
               <h3 className="text-3xl font-black text-slate-900 tracking-tight">Revenue Scaling</h3>
               <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">GTV Performance Over Time</p>
             </div>
             <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ff5a2c]" />
                  <span className="text-xs font-black text-slate-400 uppercase">Growth</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-200" />
                  <span className="text-xs font-black text-slate-400 uppercase">Projection</span>
                </div>
             </div>
           </div>

           <div className="h-[450px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={growthData}>
                 <defs>
                   <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#ff5a2c" stopOpacity={0.1}/>
                     <stop offset="95%" stopColor="#ff5a2c" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 900 }} dy={20} />
                 <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 900 }} />
                 <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px rgba(0,0,0,0.1)' }} />
                 <Area type="monotone" dataKey="revenue" stroke="#ff5a2c" strokeWidth={5} fillOpacity={1} fill="url(#colorRev)" />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </Card>

        <Card className="bg-slate-900 border-0 rounded-[48px] p-12 shadow-2xl relative overflow-hidden flex flex-col">
           <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-white pointer-events-none">
             <Zap className="w-60 h-60" />
           </div>
           
           <div className="relative z-10 space-y-12 flex-1">
             <div>
               <h3 className="text-3xl font-black text-white tracking-tight">Market Share</h3>
               <p className="text-sm font-bold text-white/30 uppercase tracking-widest mt-1">Tenant Breakdown by Tier</p>
             </div>

             <div className="h-[300px] w-full flex items-center justify-center">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={planDistribution}
                     innerRadius={80}
                     outerRadius={110}
                     paddingAngle={8}
                     dataKey="value"
                   >
                     {planDistribution.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                   </Pie>
                   <Tooltip />
                 </PieChart>
               </ResponsiveContainer>
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pt-24">
                  <p className="text-4xl font-black text-white">842</p>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Total Nodes</p>
               </div>
             </div>

             <div className="space-y-6">
                {planDistribution.map((plan, i) => (
                  <div key={i} className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 group hover:border-white/20 transition-all">
                    <div className="flex items-center gap-4">
                       <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                       <span className="text-sm font-black text-white tracking-tight">{plan.name} Plan</span>
                    </div>
                    <span className="text-sm font-black text-white/60">{plan.value}</span>
                  </div>
                ))}
             </div>
           </div>
        </Card>
      </div>

      {/* Subscription Churn Analysis */}
      <Card className="bg-white border border-slate-100 rounded-[48px] p-12 shadow-xl shadow-slate-200/40">
         <div className="grid lg:grid-cols-2 gap-20">
           <div className="space-y-10">
             <div className="space-y-2">
               <h3 className="text-3xl font-black text-slate-900 tracking-tight">Tenant Retention</h3>
               <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Weekly Churn vs Acquisition</p>
             </div>
             
             <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={growthData}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 900 }} dy={10} />
                   <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 900 }} />
                   <Tooltip />
                   <Bar dataKey="restaurants" fill="#ff5a2c" radius={[10, 10, 0, 0]} />
                   <Bar dataKey="churn" fill="#1e293b" radius={[10, 10, 0, 0]} />
                 </BarChart>
               </ResponsiveContainer>
             </div>
           </div>

           <div className="space-y-10">
             <div className="space-y-2">
               <h3 className="text-3xl font-black text-slate-900 tracking-tight">Performance Benchmarks</h3>
               <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Target Thresholds</p>
             </div>

             <div className="space-y-8">
                {[
                  { label: "New Signups", current: 84, target: 100, color: "bg-[#ff5a2c]" },
                  { label: "Conversion Rate", current: 68, target: 100, color: "bg-slate-900" },
                  { label: "GTV Milestone", current: 92, target: 100, color: "bg-[#ff5a2c]" },
                  { label: "Support Latency", current: 15, target: 100, color: "bg-slate-200" }
                ].map((bench, i) => (
                  <div key={i} className="space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">{bench.label}</span>
                      <span className="text-sm font-black text-slate-900">{bench.current}%</span>
                    </div>
                    <div className="h-4 w-full bg-slate-50 rounded-full overflow-hidden border-2 border-slate-100 p-1">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${bench.current}%` }}
                        transition={{ duration: 1, delay: i * 0.2 }}
                        className={`h-full rounded-full ${bench.color}`} 
                      />
                    </div>
                  </div>
                ))}
             </div>
           </div>
         </div>
      </Card>
    </div>
  );
}
