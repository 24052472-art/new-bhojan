"use client";

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import { 
  BarChart3, 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  ArrowUpRight,
  Filter,
  Download
} from "lucide-react";

const data = [
  { name: "Mon", sales: 4000, orders: 24 },
  { name: "Tue", sales: 3000, orders: 18 },
  { name: "Wed", sales: 5000, orders: 32 },
  { name: "Thu", sales: 2780, orders: 22 },
  { name: "Fri", sales: 6890, orders: 45 },
  { name: "Sat", sales: 8390, orders: 60 },
  { name: "Sun", sales: 7490, orders: 58 },
];

const categoryData = [
  { name: "Main Course", value: 400 },
  { name: "Starters", value: 300 },
  { name: "Drinks", value: 300 },
  { name: "Desserts", value: 200 },
];

const COLORS = ["#ff5a2c", "#3b82f6", "#10b981", "#8b5cf6"];

export default function AnalyticsPage() {
  return (
    <div className="space-y-12 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-900 uppercase tracking-widest">
              <BarChart3 size={12} /> Analytics Matrix
           </div>
           <h2 className="text-6xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Sector <span className="text-slate-300">Insights</span></h2>
           <p className="text-slate-500 font-medium">Deep dive into your restaurant's performance metrics.</p>
        </div>
        <div className="flex items-center gap-4">
           <button className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all">
              <Filter size={18} />
           </button>
           <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-[12px] text-xs font-bold hover:bg-slate-800 transition-all uppercase tracking-widest">
              <Download size={14} /> Export Data
           </button>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         {[
           { label: 'Total Revenue', value: '₹1,24,500', trend: '+14.2%', icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50' },
           { label: 'Total Orders', value: '1,420', trend: '+5.6%', icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-50' },
           { label: 'Repeat Guests', value: '28%', trend: '+2.1%', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50' },
         ].map((stat, i) => (
           <div key={i} className="bg-white p-8 rounded-[32px] border border-slate-200/60 shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-center">
                 <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                    <stat.icon size={24} />
                 </div>
                 <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full">
                    <ArrowUpRight size={12} /> {stat.trend}
                 </span>
              </div>
              <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                 <h4 className="text-3xl font-black text-slate-900 mt-1">{stat.value}</h4>
              </div>
           </div>
         ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-10 flex flex-col gap-8">
          <div className="flex justify-between items-center">
             <div>
                <h3 className="text-xl font-black text-slate-900 uppercase italic">Revenue Stream</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Daily gross accumulation.</p>
             </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff5a2c" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ff5a2c" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 800, color: '#ff5a2c' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#ff5a2c" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-10 flex flex-col gap-8">
          <div className="flex justify-between items-center">
             <div>
                <h3 className="text-xl font-black text-slate-900 uppercase italic">Category Mix</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Revenue share by category.</p>
             </div>
          </div>
          <div className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
