"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight,
  MoreVertical,
  Calendar,
  Filter
} from "lucide-react";
import { auth as firebaseAuth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "react-hot-toast";
import { RotateCcw, FileText } from "lucide-react";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from "recharts";
import { isToday, startOfDay, subDays, format } from "date-fns";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any[]>([
    { name: "Daily Revenue", value: "₹0", change: "+12.5%", trend: "up", icon: TrendingUp, color: "text-orange-500", bg: "bg-orange-50" },
    { name: "Active Tables", value: "0 / 0", change: "Live", trend: "up", icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
    { name: "Total Orders", value: "0", change: "+5.2%", trend: "up", icon: ShoppingBag, color: "text-emerald-500", bg: "bg-emerald-50" },
    { name: "Avg. Prep Time", value: "15m", change: "-2m", trend: "down", icon: Clock, color: "text-purple-500", bg: "bg-purple-50" },
  ]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user) {
        const { getProfileByAuth } = await import('@/app/(auth)/actions');
        const { profile, error } = await getProfileByAuth(user.uid, user.email || "");
        
        if (profile?.restaurant_id) {
          setRestaurantId(profile.restaurant_id);
        } else {
          console.error("Profile or Restaurant ID not found for UID:", user.uid, error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!restaurantId) return;

    console.log("AdminDashboard: Initializing data for Restaurant ID:", restaurantId);
    fetchDashboardData(restaurantId);

    // Set up real-time subscriptions
    const ordersSubscription = supabase
      .channel('realtime-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        (payload) => {
          console.log("AdminDashboard: Order Change Detected:", payload.eventType);
          fetchDashboardData(restaurantId);
        }
      )
      .subscribe((status) => {
        console.log("AdminDashboard: Orders Subscription Status:", status);
      });

    const tablesSubscription = supabase
      .channel('realtime-tables')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tables',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        (payload) => {
          console.log("AdminDashboard: Table Change Detected:", payload.eventType);
          fetchDashboardData(restaurantId);
        }
      )
      .subscribe((status) => {
        console.log("AdminDashboard: Tables Subscription Status:", status);
      });

    // Fallback polling every 60 seconds just in case
    const interval = setInterval(() => fetchDashboardData(restaurantId), 60000);

    return () => {
      supabase.removeChannel(ordersSubscription);
      supabase.removeChannel(tablesSubscription);
      clearInterval(interval);
    };
  }, [restaurantId]);

  async function fetchDashboardData(resId: string) {
    try {
      const { getAdminDashboardData } = await import('./actions');
      const data = await getAdminDashboardData(resId);
      
      if (data.error) {
        console.error("Error fetching dashboard data:", data.error);
        return;
      }

      const { weekOrders, totalTables, recent } = data;
      const today = startOfDay(new Date());
      const yesterday = subDays(today, 1);
      
      const todayOrders = weekOrders.filter((o: any) => isToday(new Date(o.created_at)));
      const yesterdayOrders = weekOrders.filter((o: any) => {
        const d = new Date(o.created_at);
        return d >= yesterday && d < today;
      });

      const revenue = todayOrders
        .filter((o: any) => ['completed', 'delivered', 'paid', 'served'].includes(o.status.toLowerCase()))
        .reduce((acc: number, curr: any) => acc + (curr.grand_total || 0), 0);
      
      const yesterdayRevenue = yesterdayOrders
        .filter((o: any) => ['completed', 'delivered', 'paid', 'served'].includes(o.status.toLowerCase()))
        .reduce((acc: number, curr: any) => acc + (curr.grand_total || 0), 0);

      const revenueChange = yesterdayRevenue > 0 
        ? `${(((revenue - yesterdayRevenue) / yesterdayRevenue) * 100).toFixed(1)}%`
        : "+100%";

      const activeTables = totalTables.filter((t: any) => t.status === 'occupied').length;
      const orderCount = todayOrders.length;

      console.log(`AdminDashboard: Fetched Data - Orders: ${orderCount}, Revenue: ₹${revenue}, Active Tables: ${activeTables}`);

      setStats([
        { name: "Daily Revenue", value: `₹${revenue.toLocaleString()}`, change: revenueChange, trend: revenue >= yesterdayRevenue ? "up" : "down", icon: TrendingUp, color: "text-orange-500", bg: "bg-orange-50" },
        { name: "Active Tables", value: `${activeTables} / ${totalTables.length}`, change: "Live", trend: "up", icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
        { name: "Total Orders", value: orderCount.toString(), change: "Today", trend: "up", icon: ShoppingBag, color: "text-emerald-500", bg: "bg-emerald-50" },
        { name: "Avg. Prep Time", value: "12m", change: "-3m", trend: "down", icon: Clock, color: "text-purple-500", bg: "bg-purple-50" },
      ]);

      // Chart Data Processing
      const last7Days = Array.from({length: 7}, (_, i) => {
        const d = subDays(new Date(), i);
        return format(d, 'eee');
      }).reverse();

      const dataMap = weekOrders.reduce((acc: any, order: any) => {
        const day = format(new Date(order.created_at), 'eee');
        acc[day] = (acc[day] || 0) + (order.grand_total || 0);
        return acc;
      }, {});

      setChartData(last7Days.map(day => ({ name: day, revenue: dataMap[day] || 0 })));
      setRecentOrders(recent);
    } catch (err) {
      console.error("AdminDashboard: Critical Error in fetchDashboardData:", err);
    }
  }

  const generateReport = () => {
    try {
      const doc = new jsPDF();
      const today = new Date();
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(26, 28, 46);
      doc.text("DAILY ANALYTICS REPORT", 105, 20, { align: "center" });
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated on: ${format(today, 'PPPP p')}`, 105, 28, { align: "center" });
      
      doc.line(20, 35, 190, 35);

      // Stats Summary
      doc.setFontSize(14);
      doc.setTextColor(26, 28, 46);
      doc.text("Operational Summary", 20, 45);
      
      const statsData = stats.map(s => [s.name, s.value, s.change]);
      autoTable(doc, {
        startY: 50,
        head: [['Metric', 'Value', 'Status/Trend']],
        body: statsData,
        theme: 'striped',
        headStyles: { fillColor: [255, 90, 44] }
      });

      // Recent Orders
      const finalY = (doc as any).lastAutoTable.finalY + 15;
      doc.text("Recent Activity (Last 6 Orders)", 20, finalY);
      
      const orderData = recentOrders.map(o => [
        `Table ${o.tables?.table_number || 'Gen'}`,
        `₹${o.grand_total}`,
        o.status,
        format(new Date(o.created_at), 'p')
      ]);

      autoTable(doc, {
        startY: finalY + 5,
        head: [['Station', 'Amount', 'Status', 'Time']],
        body: orderData,
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59] }
      });

      // Footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("BHOJAN - Next Gen Restaurant Suite", 105, pageHeight - 10, { align: "center" });

      doc.save(`Bhojan_Report_${format(today, 'yyyy-MM-dd')}.pdf`);
      toast.success("Report Generated Successfully");
    } catch (err) {
      console.error("Report Generation Error:", err);
      toast.error("Failed to generate report");
    }
  };

  const resetTables = async () => {
    if (!restaurantId) return;
    if (!confirm("Are you sure you want to reset all tables to 'available'? This will clear current occupancy status.")) return;

    try {
      const { error } = await supabase
        .from("tables")
        .update({ status: 'available' })
        .eq("restaurant_id", restaurantId);

      if (error) throw error;
      
      toast.success("All stations have been reset to available");
      fetchDashboardData(restaurantId);
    } catch (err) {
      console.error("Reset Error:", err);
      toast.error("Failed to reset stations");
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-3xl font-black text-slate-900 tracking-tight">System Analytics</h2>
           <p className="text-sm font-medium text-slate-400 mt-1">Real-time operational telemetry and insights.</p>
        </div>
         <div className="flex items-center gap-3">
            <button 
              onClick={resetTables}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-[10px] text-xs font-bold text-red-500 hover:bg-red-50 transition-all"
            >
               <RotateCcw size={14} /> Reset Stations
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-[10px] text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
               <Calendar size={14} /> Last 7 Days
            </button>
            <button 
              onClick={generateReport}
              className="flex items-center gap-2 px-4 py-2 bg-[#ff5a2c] text-white rounded-[10px] text-xs font-bold hover:bg-[#ea580c] transition-all shadow-lg shadow-orange-500/10"
            >
               <FileText size={14} /> Generate Report
            </button>
         </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[24px] border border-slate-200/60 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-6">
               <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                  <stat.icon size={24} />
               </div>
               <div className={cn(
                 "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold",
                 stat.trend === "up" ? "bg-emerald-50 text-emerald-600" : "bg-purple-50 text-purple-600"
               )}>
                 {stat.trend === "up" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                 {stat.change}
               </div>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.name}</p>
            <h3 className="text-3xl font-black text-slate-900 mt-2">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-[32px] border border-slate-200/60 shadow-sm p-8 md:p-10 flex flex-col">
          <div className="flex items-center justify-between mb-10">
             <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Revenue Trends</h3>
                <p className="text-xs font-medium text-slate-400 mt-1">Daily gross revenue synchronization.</p>
             </div>
             <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400"><Filter size={18} /></button>
          </div>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff5a2c" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ff5a2c" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px 16px' }}
                  itemStyle={{ fontWeight: 800, color: '#ff5a2c' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#ff5a2c" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#revenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Orders Stream */}
        <div className="bg-white rounded-[32px] border border-slate-200/60 shadow-sm p-8 flex flex-col">
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-xl font-black text-slate-900 tracking-tight">Recent Orders</h3>
             <button className="text-xs font-bold text-[#ff5a2c] hover:underline">View All</button>
          </div>
          <div className="space-y-6 flex-1">
            {recentOrders.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 opacity-50">
                 <ShoppingBag size={48} />
                 <p className="text-xs font-bold uppercase tracking-widest">No active orders</p>
              </div>
            )}
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center gap-4 group cursor-pointer">
                <div className="w-12 h-12 rounded-[14px] bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-slate-600 transition-colors group-hover:border-orange-200 group-hover:bg-orange-50 group-hover:text-[#ff5a2c]">
                  {order.tables?.table_number || '??'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">Table {order.tables?.table_number || 'General'}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">₹{order.grand_total.toLocaleString()} • {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold",
                  order.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                )}>
                  {order.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
