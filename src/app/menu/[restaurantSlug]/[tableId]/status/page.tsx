"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, 
  ChefHat, 
  CheckCircle2, 
  Utensils, 
  ArrowLeft, 
  Phone, 
  Plus, 
  Receipt,
  BellRing,
  Loader2,
  Flame,
  Zap,
  ChevronRight,
  MessageSquare,
  ShieldCheck,
  Smartphone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";

const STATUS_STEPS = [
  { id: 'pending', label: 'RECEIVED', icon: Clock, description: 'Kitchen is reviewing your sequence' },
  { id: 'preparing', label: 'PREPARING', icon: Flame, description: 'Chef is crafting your masterpiece' },
  { id: 'ready', label: 'READY', icon: ChefHat, description: 'Meal is prepared for extraction' },
  { id: 'served', label: 'SERVED', icon: CheckCircle2, description: 'Enjoy your culinary experience' }
];

export default function OrderStatusPage() {
  const { restaurantSlug, tableId } = useParams();
  const router = useRouter();
  
  const [order, setOrder] = useState<any>(null);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  
  const supabase = createClient();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    fetchInitialData();
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, []);

  async function fetchInitialData() {
    setIsLoading(true);
    try {
      const { data: res } = await supabase.from("restaurants").select("*").eq("slug", restaurantSlug).single();
      setRestaurant(res);

      if (res) {
        const { data: activeOrder } = await supabase
          .from("orders")
          .select(`*, order_items(*, menu_items(*))`)
          .eq("restaurant_id", res.id)
          .eq("table_id", tableId)
          .not("status", "in", "(completed,cancelled)")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        
        setOrder(activeOrder);
        if (activeOrder) setupRealtime(res.id, activeOrder.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  async function setupRealtime(resId: string, orderId: string) {
    const channelName = `bhojan-sync-${resId}`;
    const channel = supabase.channel(channelName);
    channel
      .on('broadcast', { event: 'refresh_customer' }, (payload) => {
        if (payload.payload.orderId === orderId) fetchOrderUpdate(orderId);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` }, () => fetchOrderUpdate(orderId))
      .subscribe((status) => setIsLive(status === 'SUBSCRIBED'));
    channelRef.current = channel;
  }

  async function fetchOrderUpdate(id: string) {
    const { data } = await supabase.from("orders").select(`*, order_items(*, menu_items(*))`).eq("id", id).single();
    if (data) {
      if (data.status !== order?.status) {
        toast.success(`STATUS UPGRADE: ${data.status.toUpperCase()}`, { icon: '🚀', position: 'top-center' });
      }
      setOrder(data);
    }
  }

  const handleCallWaiter = () => {
    toast.success("Waiter Summoned to Station", { icon: '🔔' });
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'refresh_waiter',
        payload: { type: 'CALL', tableNum: tableId || 'QR' }
      });
    }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6">
       <div className="w-16 h-16 border-4 border-slate-100 border-t-[#ff5a2c] rounded-full animate-spin" />
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] italic">Synchronizing Feed</p>
    </div>
  );

  if (!order) return (
    <div className="min-h-screen bg-[#f8f9fb] flex flex-col items-center justify-center p-12 text-center gap-12">
       <div className="w-40 h-40 bg-white rounded-[60px] flex items-center justify-center shadow-2xl border border-slate-100 relative group">
          <div className="absolute inset-0 bg-orange-500 blur-3xl opacity-5 group-hover:opacity-20 transition-opacity" />
          <Utensils size={64} className="text-slate-200 relative z-10" />
       </div>
       <div className="space-y-4 max-w-sm">
          <h2 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-tight">No Active<br/><span className="text-[#ff5a2c]">Sequences</span></h2>
          <p className="text-slate-400 font-medium text-sm leading-relaxed italic uppercase tracking-widest text-[10px]">RESCAN QR OR ACCESS MENU FEED TO INITIALIZE ORDERING</p>
       </div>
       <button onClick={() => router.push(`/menu/${restaurantSlug}/${tableId}`)} className="h-20 px-12 bg-slate-900 text-white rounded-[32px] font-black uppercase tracking-[0.3em] text-[11px] italic shadow-2xl hover:bg-[#ff5a2c] transition-all active:scale-95">RETURN TO MENU FEED</button>
    </div>
  );

  const currentIndex = STATUS_STEPS.findIndex(s => s.id === order.status);
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex flex-col relative overflow-hidden selection:bg-orange-100">
      
      {/* Neural Background Components */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#ff5a2c]/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-slate-900/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      {/* Fluid Header */}
      <header className="px-8 md:px-12 py-10 flex items-center justify-between relative z-10 sticky top-0 bg-[#f8f9fb]/80 backdrop-blur-2xl border-b border-slate-100">
         <button onClick={() => router.push(`/menu/${restaurantSlug}/${tableId}`)} className="h-16 w-16 rounded-[24px] bg-white shadow-xl flex items-center justify-center border border-slate-100 hover:scale-105 active:scale-95 transition-all"><ArrowLeft size={24} /></button>
         <div className="flex flex-col items-center gap-3">
            <h1 className="text-[var(--font-lg)] font-black italic uppercase tracking-tighter text-slate-900 leading-none">ORDER STATUS</h1>
            <div className="px-5 py-1.5 bg-white border border-slate-100 rounded-full flex items-center gap-3 shadow-sm">
               <div className={cn("w-2 h-2 rounded-full", isLive ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500')} />
               <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 italic leading-none">Neural Link Active</span>
            </div>
         </div>
         <div className="h-16 w-16 rounded-[24px] bg-[#ff5a2c] shadow-2xl flex items-center justify-center text-white shadow-orange-500/20"><Zap size={24} className="animate-pulse" /></div>
      </header>

      <main className="flex-1 max-w-[1200px] mx-auto w-full px-8 py-12 space-y-16 relative z-10 pb-48">
         
         {/* Live Progress Visualizer */}
         <section className="bg-white rounded-[64px] p-12 md:p-20 border border-slate-100 shadow-[0_40px_100px_rgba(0,0,0,0.04)] space-y-16 overflow-hidden relative">
            <div className="flex flex-col items-center text-center gap-10">
               <motion.div 
                 key={activeIndex}
                 initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                 className="w-32 h-32 md:w-40 md:h-40 rounded-[48px] bg-[#ff5a2c]/5 flex items-center justify-center text-[#ff5a2c] relative"
               >
                  <div className="absolute inset-0 bg-[#ff5a2c] blur-3xl opacity-10 animate-pulse" />
                  {React.createElement(STATUS_STEPS[activeIndex].icon, { size: 64, className: "relative z-10" })}
               </motion.div>
               <div className="space-y-4">
                  <h2 className="text-[var(--font-xl)] font-black italic uppercase tracking-tighter text-slate-900 leading-none">{STATUS_STEPS[activeIndex].label}</h2>
                  <p className="text-[12px] font-black text-slate-300 uppercase tracking-[0.6em] italic leading-none">{STATUS_STEPS[activeIndex].description}</p>
               </div>
            </div>

            {/* Fluid Multi-Step Progress */}
            <div className="relative pt-12">
               <div className="absolute top-1/2 left-0 right-0 h-2 bg-slate-50 -translate-y-1/2 rounded-full overflow-hidden">
                  <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${(activeIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
                     className="h-full bg-gradient-to-r from-orange-400 to-[#ff5a2c] shadow-[0_0_20px_rgba(255,90,44,0.4)]"
                  />
               </div>
               <div className="relative flex justify-between">
                  {STATUS_STEPS.map((step, idx) => {
                    const isActive = idx <= activeIndex;
                    const isCurrent = idx === activeIndex;
                    return (
                      <div key={step.id} className="flex flex-col items-center gap-6">
                         <div className={cn(
                           "w-10 h-10 rounded-full border-8 transition-all duration-700 relative z-10",
                           isActive ? 'bg-[#ff5a2c] border-white shadow-xl scale-125' : 'bg-white border-slate-50'
                         )}>
                           {isCurrent && <div className="absolute inset-0 bg-[#ff5a2c] rounded-full animate-ping opacity-30" />}
                         </div>
                         <span className={cn(
                           "text-[10px] font-black uppercase tracking-widest italic hidden md:block",
                           isActive ? 'text-slate-900' : 'text-slate-200'
                         )}>{step.id}</span>
                      </div>
                    );
                  })}
               </div>
            </div>
         </section>

         {/* Order Details Extraction */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
            
            <div className="lg:col-span-2 space-y-10">
               <div className="flex justify-between items-center px-4">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-400 italic leading-none">ORDER MANIFEST</h3>
                  <div className="h-px flex-1 mx-8 bg-slate-200/50" />
                  <span className="text-[11px] font-black text-[#ff5a2c] uppercase italic leading-none">T-{tableId}</span>
               </div>
               
               <div className="bg-white rounded-[56px] border border-slate-100 shadow-sm p-12 space-y-10">
                  <div className="space-y-6">
                     {order.order_items?.map((item: any) => (
                       <div key={item.id} className="flex justify-between items-center group">
                          <div className="flex items-center gap-8">
                             <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-lg text-slate-900 italic border border-slate-100 shadow-inner group-hover:bg-[#ff5a2c] group-hover:text-white transition-all">{item.quantity}x</div>
                             <div>
                                <span className="text-xl font-black uppercase italic tracking-tighter text-slate-900 leading-none group-hover:text-[#ff5a2c] transition-colors">{item.menu_items?.name}</span>
                                {item.notes && <p className="text-[9px] font-black text-orange-500/60 uppercase italic tracking-widest mt-2 leading-none">MSG: {item.notes}</p>}
                             </div>
                          </div>
                          <span className="text-xl font-black text-slate-900 italic tracking-tighter">₹{item.total_price}</span>
                       </div>
                     ))}
                  </div>
                  <div className="pt-12 border-t border-slate-50 flex flex-col md:flex-row justify-between items-end md:items-center gap-8">
                     <div className="space-y-4">
                        <p className="text-[11px] font-black text-[#ff5a2c] uppercase tracking-[0.4em] italic leading-none">AGGREGATE VALUATION</p>
                        <p className="text-6xl font-black text-slate-900 italic tracking-tighter leading-none">₹{order.grand_total || order.total_amount}</p>
                     </div>
                     <div className="px-8 py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-[28px] text-[11px] font-black text-emerald-600 uppercase tracking-[0.3em] italic flex items-center gap-3">
                        <ShieldCheck size={16} /> {order.payment_status}
                     </div>
                  </div>
               </div>
            </div>

            {/* Action Matrix */}
            <div className="space-y-8">
               <div className="flex items-center gap-4 px-4">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-400 italic leading-none">ACTION MATRIX</h3>
                  <div className="h-px flex-1 bg-slate-200/50" />
               </div>
               
               <div className="grid grid-cols-1 gap-6">
                  <motion.button 
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleCallWaiter}
                    className="bg-white border-2 border-slate-50 p-10 rounded-[48px] flex items-center justify-between group hover:border-[#ff5a2c] transition-all shadow-xl shadow-slate-200/20"
                  >
                     <div className="flex items-center gap-8">
                        <div className="w-16 h-16 rounded-[28px] bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#ff5a2c] group-hover:text-white transition-all shadow-inner"><BellRing size={28} /></div>
                        <div className="text-left">
                           <span className="text-xl font-black uppercase tracking-tighter text-slate-900 italic block leading-none">Call Waiter</span>
                           <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-300 italic mt-2 block">STATION SUMMON</span>
                        </div>
                     </div>
                     <ChevronRight className="text-slate-200 group-hover:text-[#ff5a2c] transition-colors" />
                  </motion.button>

                  <motion.button 
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => router.push(`/menu/${restaurantSlug}/${tableId}`)}
                    className="bg-slate-900 border-2 border-slate-900 p-10 rounded-[48px] flex items-center justify-between group hover:bg-[#ff5a2c] hover:border-[#ff5a2c] transition-all shadow-2xl"
                  >
                     <div className="flex items-center gap-8">
                        <div className="w-16 h-16 rounded-[28px] bg-white/10 flex items-center justify-center text-white shadow-inner"><Plus size={28} /></div>
                        <div className="text-left">
                           <span className="text-xl font-black uppercase tracking-tighter text-white italic block leading-none">Add Items</span>
                           <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 italic mt-2 block">UPGRADE SEQUENCE</span>
                        </div>
                     </div>
                     <ChevronRight className="text-white/20 group-hover:text-white transition-all" />
                  </motion.button>
               </div>

               {/* Invoice Shortcut */}
               <motion.button 
                 whileHover={{ y: -5 }}
                 className="w-full bg-gradient-to-br from-orange-400 to-[#ff5a2c] rounded-[48px] p-10 flex items-center justify-between shadow-2xl shadow-orange-500/30 group"
               >
                  <div className="flex items-center gap-8">
                     <div className="w-16 h-16 rounded-[28px] bg-white/20 flex items-center justify-center text-white"><Receipt size={28} /></div>
                     <div className="text-left">
                        <span className="text-xl font-black uppercase tracking-tighter text-white italic block leading-none">View Invoice</span>
                        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/40 italic mt-2 block">SETTLEMENT PREVIEW</span>
                     </div>
                  </div>
                  <ChevronRight size={32} className="text-white/40 group-hover:translate-x-2 group-hover:text-white transition-all" />
               </motion.button>
            </div>
         </div>
      </main>

      {/* Persistent Deployment Overlay */}
      <footer className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[200] w-full max-w-xl px-8">
         <div className="bg-white/90 backdrop-blur-3xl border border-slate-100 p-10 rounded-[64px] flex items-center justify-between shadow-[0_40px_120px_rgba(0,0,0,0.1)] border-b-8 border-b-[#ff5a2c]">
            <div className="flex items-center gap-6">
               <div className="w-16 h-16 bg-slate-900 rounded-[28px] flex items-center justify-center text-white shadow-xl"><Smartphone size={32} /></div>
               <div>
                  <h4 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Mobile Link</h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic mt-1 leading-none">Track anywhere from your homescreen</p>
               </div>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-[#ff5a2c]/10 flex items-center justify-center text-[#ff5a2c]"><Zap size={24} /></div>
         </div>
      </footer>

    </div>
  );
}
