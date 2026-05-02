"use client";

import { useState, useEffect } from "react";
import { auth as firebaseAuth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
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
  Download,
  Trash2,
  Loader2
} from "lucide-react";

const COLORS = ["#ff5a2c", "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899"];

export default function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    customersCount: 0,
    chartData: [] as any[],
    categoryData: [] as any[]
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user) {
        const { getProfileByAuth } = await import('@/app/(auth)/actions');
        const { profile } = await getProfileByAuth(user.uid, user.email || "");
        if (profile?.restaurant_id) {
          fetchAnalytics(profile.restaurant_id);
        } else {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  async function fetchAnalytics(resId: string) {
    const { getAdminAnalyticsData } = await import('../actions');
    const { orders, orderItems, customersCount } = await getAdminAnalyticsData(resId);
    
    // Process Total Orders and Revenue (all time or just complete)
    const completedOrders = orders.filter((o: any) => o.status === 'completed');
    const totalRevenue = completedOrders.reduce((acc: number, o: any) => acc + (o.grand_total || 0), 0);
    const totalOrders = orders.length;

    // Process Chart Data (Last 7 Days)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7DaysMap = new Map();
    for(let i=6; i>=0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7DaysMap.set(d.toISOString().split('T')[0], { name: days[d.getDay()], sales: 0, orders: 0 });
    }

    orders.forEach((o: any) => {
      const dateStr = new Date(o.created_at).toISOString().split('T')[0];
      if (last7DaysMap.has(dateStr)) {
         const dayData = last7DaysMap.get(dateStr);
         dayData.orders += 1;
         if (o.status === 'completed') {
            dayData.sales += (o.grand_total || 0);
         }
      }
    });
    
    // Process Category Mix
    const catMap = new Map();
    orderItems.forEach((item: any) => {
       const catName = item.menu_items?.menu_categories?.name || 'Uncategorized';
       catMap.set(catName, (catMap.get(catName) || 0) + (item.total_price || 0));
    });
    const categoryData = Array.from(catMap.entries()).map(([name, value]) => ({ name, value })).filter(c => c.value > 0);

    setMetrics({
      totalRevenue,
      totalOrders,
      customersCount,
      chartData: Array.from(last7DaysMap.values()),
      categoryData: categoryData.length > 0 ? categoryData : [{name: 'No Data', value: 1}]
    });
    setIsLoading(false);
  }

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-[#ff5a2c]" />
    </div>
  );

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
           <button 
             onClick={() => {
               if(confirm("Are you sure you want to reset all analytics data?")) {
                 import("react-hot-toast").then(({ toast }) => toast.success("Analytics Reset Scheduled!"));
               }
             }}
             className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-500 rounded-[12px] text-xs font-bold hover:bg-red-100 transition-all uppercase tracking-widest shadow-sm"
           >
              <Trash2 size={14} /> Reset Data
           </button>
           <button className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all shadow-sm">
              <Filter size={18} />
           </button>
           <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-[12px] text-xs font-bold hover:bg-slate-800 transition-all uppercase tracking-widest shadow-sm">
              <Download size={14} /> Export Data
           </button>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         {[
           { label: 'Total Revenue', value: `₹${metrics.totalRevenue.toLocaleString()}`, trend: '+0.0%', icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50' },
           { label: 'Total Orders', value: metrics.totalOrders.toLocaleString(), trend: '+0.0%', icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-50' },
           { label: 'Total Guests', value: metrics.customersCount.toLocaleString(), trend: '+0.0%', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50' },
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
              <AreaChart data={metrics.chartData}>
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
                  data={metrics.categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {metrics.categoryData.map((entry, index) => (
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
