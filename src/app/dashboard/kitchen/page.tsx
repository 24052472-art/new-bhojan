"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  ChefHat,
  Clock,
  CheckCircle2,
  Utensils,
  Bell,
  RefreshCcw,
  Loader2,
  Table2,
  Flame,
  Timer,
  User,
  HistoryIcon,
  Play,
  CheckCircle,
  Truck,
  Wifi,
  WifiOff,
  ChevronRight,
  ChevronDown,
  Info,
  Users,
  AlertCircle,
  LayoutGrid,
  Layers
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { auth as firebaseAuth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served';

export default function KitchenDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [staffMap, setStaffMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [view, setView] = useState<OrderStatus>('pending');
  const [isLive, setIsLive] = useState(false);

  const supabase = createClient();
  const channelRef = useRef<any>(null);
  const buzzerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    buzzerRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
    
    const staffSessionStr = localStorage.getItem("staff_session");
    if (staffSessionStr) {
      const staff = JSON.parse(staffSessionStr);
      setProfile(staff);
      initDashboard(staff.restaurant_id);
    } else {
      const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
        if (user) {
          const { data } = await supabase.from("profiles").select("*").eq("id", user.uid).single();
          if (data) {
            setProfile(data);
            initDashboard(data.restaurant_id);
          }
        }
      });
      return () => unsubscribe();
    }

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, []);

  async function initDashboard(resId: string) {
    if (!resId) return;
    setIsLoading(true);
    await Promise.all([fetchStaff(resId), fetchLiveOrders(resId)]);
    setupRealtime(resId);
    setIsLoading(false);
  }

  async function fetchStaff(resId: string) {
    const { data } = await supabase.from("profiles").select("id, full_name").eq("restaurant_id", resId);
    if (data) {
      const map: Record<string, string> = {};
      data.forEach(s => map[s.id] = s.full_name);
      setStaffMap(map);
    }
  }

  async function fetchLiveOrders(restaurantId: string) {
    if (!restaurantId) return;
    const { data, error } = await supabase
      .from("orders")
      .select(`*, tables (table_number), order_items (*, menu_items (name))`)
      .eq("restaurant_id", restaurantId)
      .not("status", "eq", "cancelled")
      .order("created_at", { ascending: false }); // Latest first

    if (!error) setOrders(data || []);
  }

  function setupRealtime(restaurantId: string) {
    const channelName = `bhojan-res-${restaurantId}`;
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    
    const channel = supabase.channel(channelName, { config: { broadcast: { self: true, ack: true } } });

    channel
      .on('broadcast', { event: 'refresh_kitchen' }, () => {
        if (buzzerRef.current) buzzerRef.current.play().catch(() => {});
        fetchLiveOrders(restaurantId);
        toast.success("NEW TRANSMISSION", { position: 'top-right', icon: '⚡' });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload: any) => {
        fetchLiveOrders(restaurantId); // Re-fetch on ANY change to orders
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => {
        fetchLiveOrders(restaurantId); // Re-fetch on ANY change to order_items
      })
      .subscribe((status) => setIsLive(status === 'SUBSCRIBED'));
      
    channelRef.current = channel;
  }

  const transmitEvent = async (event: string, payload: any = {}) => {
    if (!channelRef.current) return;
    try {
      await channelRef.current.send({ type: 'broadcast', event, payload: payload || {} });
    } catch (e) { console.error(e); }
  };

  const updateStatus = async (orderId: string, newStatus: string, tableNum?: string) => {
    console.log("UPDATING STATUS:", newStatus);

    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    if (!error) {
      const broadcastType = newStatus === 'preparing' ? 'PREPARING' : 
                          newStatus === 'ready' ? 'COOKED' : 'SERVED';
      
      await transmitEvent('refresh_waiter', { type: broadcastType, tableNum: tableNum || '??' });
      await transmitEvent('refresh_customer', { type: broadcastType, orderId: orderId, tableNum: tableNum });
      
      fetchLiveOrders(profile.restaurant_id);
    }
  };

  // Logic: Show all active orders in the current category
  const displayOrders = orders.filter(o => o.status === view);

  return (
    <div className="min-h-screen bg-[#f9fafb] text-[#111827] flex flex-col font-sans overflow-hidden">
      
      {/* Header with Mode Toggle */}
      <header className="sticky top-0 z-[60] bg-white/90 backdrop-blur-2xl border-b border-slate-100 px-8 py-8 md:px-12 shadow-sm">
         <div className="max-w-[1800px] mx-auto flex flex-col xl:flex-row xl:items-center justify-between gap-10">
            <div className="space-y-3">
               <div className="flex items-center gap-4">
                  <div className="w-1.5 h-6 bg-[#ff5a2c] rounded-full" />
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">PRODUCTION TERMINAL</span>
               </div>
               <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none text-slate-900">
                  KITCHEN <span className="text-slate-200">FEED</span>
               </h1>
            </div>

            <div className="flex items-center gap-6">
               <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-[28px] border border-slate-200 overflow-x-auto no-scrollbar">
                  {(['pending', 'preparing', 'ready', 'served'] as const).map((status) => (
                    <button
                      key={status} onClick={() => setView(status)}
                      className={cn(
                        "px-10 py-4 rounded-[22px] text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap flex items-center gap-4",
                        view === status ? 'bg-white text-slate-900 shadow-xl scale-105' : 'text-slate-400 hover:text-slate-600'
                      )}
                    >
                      <div className={cn(
                        "w-2.5 h-2.5 rounded-full shadow-lg",
                        status === 'pending' ? 'bg-orange-500' : 
                        status === 'preparing' ? 'bg-blue-500' : 
                        status === 'ready' ? 'bg-emerald-500' : 'bg-slate-400'
                      )} />
                      {status === 'pending' ? 'QUEUED' : status === 'preparing' ? 'PREPARING' : status === 'ready' ? 'READY' : 'SERVED'}
                    </button>
                  ))}
               </div>
            </div>
         </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 w-full overflow-x-auto overflow-y-auto no-scrollbar p-12">
         <LayoutGroup>
            <motion.div layout className="flex flex-wrap gap-12 min-w-full items-start">
               <AnimatePresence mode="popLayout">
                  {displayOrders.map((order) => (
                    <motion.div
                      layout
                      layoutId={order.id}
                      initial={{ opacity: 0, scale: 0.8, y: 100 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.5, y: -100 }}
                      transition={{ type: "spring", damping: 25, stiffness: 150 }}
                      key={order.id}
                      className="flex-shrink-0"
                    >
                       <OrderCardSquare 
                          order={order} 
                          staffName={staffMap[order.waiter_id]} 
                          onUpdate={updateStatus} 
                       />
                    </motion.div>
                  ))}
               </AnimatePresence>

               {displayOrders.length === 0 && (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full py-48 flex flex-col items-center justify-center opacity-10 gap-8 grayscale">
                    <ChefHat size={160} strokeWidth={1} />
                    <p className="text-5xl font-black uppercase italic tracking-tighter">Station Clear</p>
                 </motion.div>
               )}
            </motion.div>
         </LayoutGroup>
      </main>

      {/* Connection Status Bar */}
      <footer className="sticky bottom-0 bg-white/80 backdrop-blur-3xl border-t border-slate-100 px-12 py-6 flex items-center justify-between z-[50]">
         <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
               <div className={cn("w-3 h-3 rounded-full shadow-lg", isLive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500')} />
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-900 italic">{isLive ? 'NEURAL LINK ACTIVE' : 'RECONNECTING...'}</span>
            </div>
         </div>
         <div className="flex items-center gap-6">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">
               TOTAL ACTIVE SESSIONS: {orders.filter(o => o.status !== 'served').length}
            </span>
            <button onClick={() => fetchLiveOrders(profile?.restaurant_id)} className="px-10 py-3 bg-slate-900 text-white rounded-full text-[9px] font-black italic tracking-[0.3em] uppercase hover:bg-slate-800 transition-all">
               FORCE REFRESH
            </button>
         </div>
      </footer>
    </div>
  );
}

function OrderCardSquare({ order, staffName, onUpdate }: any) {
  const timeElapsed = Math.floor((new Date().getTime() - new Date(order.created_at).getTime()) / 60000);
  const isUrgent = timeElapsed > 15 && order.status !== 'ready' && order.status !== 'served';

  return (
    <div className={cn(
      "w-[440px] min-h-[440px] bg-white rounded-[44px] border-4 p-10 flex flex-col shadow-2xl relative transition-all duration-500",
      isUrgent ? 'border-red-500 shadow-red-500/10' : 'border-slate-50 hover:border-orange-500/20'
    )}>
       <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-6">
             <motion.div 
               layoutId={`table-${order.id}`}
               className={cn(
                 "w-20 h-20 rounded-[28px] flex flex-col items-center justify-center font-black italic shadow-2xl border-b-4",
                 order.status === 'pending' ? 'bg-orange-500 border-orange-700 text-white' : 
                 order.status === 'preparing' ? 'bg-blue-500 border-blue-700 text-white scale-110 shadow-blue-500/40' : 
                 order.status === 'ready' ? 'bg-emerald-500 border-emerald-700 text-white scale-110 shadow-emerald-500/40' : 'bg-slate-100 text-slate-400'
               )}
             >
                <span className="text-[10px] opacity-40 leading-none mb-1 uppercase tracking-widest">T</span>
                <span className="text-4xl leading-none tracking-tighter">{order.tables?.table_number?.toString().replace('T-', '') || '!!'}</span>
             </motion.div>
             <div className="min-w-0">
                <h4 className="text-3xl font-black italic uppercase tracking-tighter truncate leading-none mb-2 text-slate-900">{order.customer_name || 'GUEST'}</h4>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest italic leading-none">
                    <User size={12} className="text-[#ff5a2c]" /> SERVER: {staffName || (!order.waiter_id ? 'STATION GUEST' : 'SYSTEM')}
                  </div>
                  {!order.waiter_id && (
                    <div className="px-3 py-1 bg-orange-100 text-[#ff5a2c] text-[8px] font-black rounded-lg tracking-[0.2em] italic border border-orange-200/50">QR ACCESS</div>
                  )}
                </div>
             </div>
          </div>
          <div className={cn(
            "h-16 px-6 rounded-[24px] flex items-center gap-3 border shadow-inner",
            isUrgent ? 'bg-red-50 border-red-100 text-red-500' : 'bg-slate-50 border-slate-100 text-slate-400'
          )}>
             <Timer size={20} className={cn(isUrgent && 'animate-spin')} />
             <span className="text-3xl font-black italic tracking-tighter">{timeElapsed}m</span>
          </div>
       </div>        <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar pr-2 mb-8">
          <AnimatePresence>
            {(() => {
              // Find the timestamp of the most recent transmission for this order
              let latestTimestamp = 0;
              order.order_items?.forEach((item: any) => {
                const ts = new Date(item.created_at).getTime();
                if (ts > latestTimestamp) latestTimestamp = ts;
              });

              // Tolerance of 2 seconds to catch items inserted in the same batch
              const tolerance = 2000; 

              const aggregated: Record<string, { name: string, quantity: number, notes: string[] }> = {};
              order.order_items?.forEach((item: any) => {
                const ts = new Date(item.created_at).getTime();
                // ONLY show items from the latest transmission batch
                if (latestTimestamp - ts <= tolerance) {
                  const name = item.menu_items?.name || 'Unknown Item';
                  if (!aggregated[name]) aggregated[name] = { name, quantity: 0, notes: [] };
                  aggregated[name].quantity += (item.quantity || 1);
                  if (item.notes) aggregated[name].notes.push(item.notes);
                }
              });

              const itemsToShow = Object.values(aggregated);

              if (itemsToShow.length === 0) return (
                <div className="flex flex-col items-center justify-center py-10 opacity-20">
                  <CheckCircle2 size={40} className="mb-2" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Prior Batch Ready</p>
                </div>
              );

              return itemsToShow.map((item, idx) => (
                <motion.div 
                   initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                   key={item.name} className="p-6 bg-slate-50 border border-slate-100 rounded-[32px] group/item hover:bg-white hover:border-[#ff5a2c]/30 transition-all flex items-center gap-6"
                >
                   <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center font-black text-2xl italic text-[#ff5a2c] shadow-sm shrink-0">
                      {item.quantity}
                   </div>
                   <div className="min-w-0 flex-1">
                      <p className="text-xl font-black uppercase italic tracking-tight text-slate-900 leading-none truncate group-hover/item:text-[#ff5a2c] transition-colors">{item.name}</p>
                      {item.notes.length > 0 && (
                        <p className="text-[9px] font-bold text-orange-500/80 uppercase italic mt-2 truncate">
                          NOTES: {Array.from(new Set(item.notes)).join(", ")}
                        </p>
                      )}
                   </div>
                </motion.div>
              ));
            })()}
          </AnimatePresence>
       </div>

       <div className="mt-auto pt-4">
          {order.status === 'pending' && (
             <button
               onClick={() => onUpdate(order.id, 'preparing', order.tables?.table_number)}
               className="w-full h-24 rounded-[32px] bg-orange-500 text-white font-black uppercase tracking-[0.4em] text-[11px] transition-all flex items-center justify-center gap-6 italic active:scale-95 shadow-xl hover:bg-orange-600"
             >
                <Play size={28} /> INITIATE PREPARATION
             </button>
          )}
          {order.status === 'preparing' && (
             <button
               onClick={() => onUpdate(order.id, 'ready', order.tables?.table_number)}
               className="w-full h-24 rounded-[32px] bg-blue-500 text-white font-black uppercase tracking-[0.3em] text-[11px] transition-all flex items-center justify-center gap-6 italic active:scale-95 shadow-xl hover:bg-blue-600"
             >
                <CheckCircle size={28} /> MARK AS READY
             </button>
          )}
          {order.status === 'ready' && (
             <button
               onClick={() => onUpdate(order.id, 'served', order.tables?.table_number)}
               className="w-full h-24 rounded-[32px] bg-emerald-500 text-white font-black uppercase tracking-[0.4em] text-[11px] transition-all flex items-center justify-center gap-6 italic active:scale-95 shadow-xl hover:bg-emerald-600"
             >
                <Truck size={28} /> COMPLETE FLOW
             </button>
          )}
          {order.status === 'served' && (
             <div className="w-full h-24 flex items-center justify-center bg-slate-50 rounded-[32px] border border-slate-100">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] italic">TRANSMISSION ARCHIVED</span>
             </div>
          )}
       </div>
    </div>
  );
}
