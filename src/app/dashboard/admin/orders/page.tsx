"use client";

import { useState, useEffect, useRef } from "react";
import { 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Hash, 
  Loader2, 
  Flame, 
  Bell, 
  X,
  QrCode,
  Mail,
  ArrowRight,
  Calendar,
  UserCheck,
  Zap,
  Download,
  Search,
  Filter,
  CreditCard,
  ShoppingBag,
  ChevronRight
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { auth as firebaseAuth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { sendReceiptEmail } from "@/lib/actions/email";
import { generateReceipt } from "@/lib/pdf/generateReceipt";
import { cn } from "@/lib/utils";

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [filter, setFilter] = useState("all");

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [customerEmail, setCustomerEmail] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const supabase = createClient();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      if (user) getProfile(user.uid);
    });
    return () => {
      unsubscribe();
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, []);

  async function getProfile(uid: string) {
    if (!uid) return;
    const { getProfileByAuth } = await import('@/app/(auth)/actions');
    const { profile } = await getProfileByAuth(uid, firebaseAuth.currentUser?.email || "");
    
    setProfile(profile);
    if (profile?.restaurant_id) {
      fetchRestaurant(profile.restaurant_id);
      fetchOrders(profile.restaurant_id);
      subscribeToOrders(profile.restaurant_id);
    } else {
      setIsLoading(false);
    }
  }

  async function fetchRestaurant(resId: string) {
    if (!resId) return;
    const { data } = await supabase.from("restaurants").select("*").eq("id", resId).single();
    setRestaurant(data);
  }

  async function fetchOrders(resId: string) {
    if (!resId) return;
    const { data, error } = await supabase
      .from("orders")
      .select(`*, tables (*), order_items (*, menu_items (name))`)
      .eq("restaurant_id", resId)
      .order("created_at", { ascending: false });
    
    if (!error) setOrders(data || []);
    setIsLoading(false);
  }

  function subscribeToOrders(resId: string) {
    if (!resId) return;
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    const channel = supabase.channel(`admin-orders-${resId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders(resId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => fetchOrders(resId))
      .subscribe();
    channelRef.current = channel;
  }

  const calculateTotal = (order: any) => {
    if (!order || !restaurant) return { subtotal: 0, cgst: 0, sgst: 0, service: 0, total: 0 };
    const subtotal = order.total_amount || 0;
    const cgst = (subtotal * (restaurant.cgst_percent || 2.5)) / 100;
    const sgst = (subtotal * (restaurant.sgst_percent || 2.5)) / 100;
    const service = (subtotal * (restaurant.service_charge_percent || 5)) / 100;
    return { subtotal, cgst, sgst, service, total: subtotal + cgst + sgst + service };
  };

  const handleFinalCheckout = async () => {
    if (!selectedOrder) return;
    setIsProcessingPayment(true);
    try {
      const { finalizeCheckout } = await import('./actions');
      const totals = calculateTotal(selectedOrder);
      
      const checkoutData = {
        grand_total: totals.total,
        customer_email: customerEmail,
        settled_by: profile?.full_name || 'Admin'
      };

      const result = await finalizeCheckout(selectedOrder.id, selectedOrder.table_id, checkoutData);
      
      if (!result.success) throw new Error(result.error);

      if (customerEmail) {
        await supabase.from("customers").upsert({
          restaurant_id: profile.restaurant_id,
          name: selectedOrder.customer_name || "Guest",
          email: customerEmail,
          is_verified: true
        }, { onConflict: 'email' });

        await sendReceiptEmail({
          email: customerEmail,
          orderId: selectedOrder.id,
          customerName: selectedOrder.customer_name || "Guest",
          items: selectedOrder.order_items,
          total: totals.total,
          restaurantName: restaurant?.name || "Bhojan"
        });
      }

      toast.success("Checkout Successful");
      
      // Optimistic state update to ensure immediate UI transition
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { 
        ...o, 
        status: 'completed', 
        payment_status: 'paid',
        grand_total: totals.total 
      } : o));

      setIsCheckoutOpen(false);
      setSelectedOrder(null);
      
      // Final synchronization with server
      setTimeout(() => fetchOrders(profile.restaurant_id), 500);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    if (filter === "all") return true;
    if (filter === "active") return o.status === "pending" || o.status === "preparing" || o.status === "ready";
    if (filter === "completed") return o.status === "completed";
    return true;
  });

  const getStatusInfo = (status: string) => {
    switch(status) {
      case 'preparing': return { label: "Preparing", color: "text-orange-600", bg: "bg-orange-50", icon: Flame };
      case 'ready': return { label: "Ready", color: "text-emerald-600", bg: "bg-emerald-50", icon: Bell };
      case 'completed': return { label: "Completed", color: "text-blue-600", bg: "bg-blue-50", icon: CheckCircle2 };
      default: return { label: "Pending", color: "text-slate-600", bg: "bg-slate-50", icon: Clock };
    }
  };

  const formatTableNumber = (num: any) => {
    if (!num) return "";
    const s = num.toString();
    return s.startsWith('T-') ? s : `T-${s}`;
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-[#ff5a2c]" />
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12 pb-32 md:pb-20 transition-all duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[9px] font-black text-slate-900 uppercase tracking-widest mb-3">
              <ShoppingBag size={12} /> Live Ops
           </div>
           <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Order <span className="text-slate-300">Terminal</span></h2>
           <p className="text-sm font-medium text-slate-500 mt-2">Track and settle active guest sessions.</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-[20px] border border-slate-200 shadow-sm w-full md:w-fit overflow-x-auto no-scrollbar">
           {["all", "active", "completed"].map(t => (
             <button 
               key={t} onClick={() => setFilter(t)}
               className={`flex-1 md:flex-none px-6 py-2.5 rounded-[14px] text-[10px] font-black transition-all uppercase tracking-widest whitespace-nowrap ${filter === t ? 'bg-[#ff5a2c] text-white shadow-lg shadow-orange-500/20' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
             >
               {t}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:gap-8">
        {filteredOrders.map((order) => {
          const status = getStatusInfo(order.status);
          const totals = calculateTotal(order);
          return (
            <motion.div 
              layout key={order.id} 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all overflow-hidden flex flex-col md:flex-row group min-w-0"
            >
              <div className={cn("w-full md:w-3 border-r md:border-r-0 md:border-b-0 border-b border-slate-50 shrink-0", status.bg)} />
              
              <div className="flex-1 p-8 sm:p-10 flex flex-col xl:flex-row xl:items-center justify-between gap-10 min-w-0">
                <div className="flex items-start sm:items-center gap-8 min-w-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[32px] bg-slate-50 border border-slate-100 flex flex-col items-center justify-center shrink-0 shadow-inner">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] leading-none mb-2">STATION</span>
                    <span className="text-3xl sm:text-4xl font-black text-slate-900 leading-none italic">{order.tables?.table_number?.toString().replace('T-', '') || '!!'}</span>
                  </div>
                  <div className="min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-4">
                       <h4 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase italic tracking-tighter truncate leading-none">{order.customer_name || "Public Guest"}</h4>
                       {!order.waiter_id && (
                          <span className="px-2 py-0.5 bg-orange-50 text-[#ff5a2c] text-[8px] font-black rounded-md tracking-widest border border-orange-100 italic">QR</span>
                       )}
                       <span className={cn("text-[9px] px-4 py-1.5 rounded-full font-black uppercase tracking-[0.2em] border border-current opacity-70", status.bg, status.color)}>{status.label}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-6">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2.5"><Clock size={16} className="text-[#ff5a2c]" /> {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2.5"><Hash size={16} /> {order.id.slice(-6).toUpperCase()}</p>
                    </div>
                  </div>
                </div>
 
                <div className="flex flex-wrap gap-3 max-w-2xl min-w-0">
                   {order.order_items?.map((item: any) => (
                     <span key={item.id} className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                        {item.quantity}× {item.menu_items?.name}
                     </span>
                   ))}
                </div>
 
                <div className="flex items-center justify-between xl:justify-end gap-10 pt-8 xl:pt-0 border-t xl:border-t-0 border-slate-50 shrink-0">
                   <div className="text-left xl:text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">VALUATION</p>
                      <p className="text-3xl sm:text-4xl font-black text-slate-900 italic tracking-tighter leading-none">₹{(order.grand_total || totals.total).toLocaleString()}</p>
                   </div>
                   <button 
                     onClick={() => { setSelectedOrder(order); setIsCheckoutOpen(true); }}
                     className="bg-slate-900 text-white w-16 h-16 sm:w-20 sm:h-20 rounded-[28px] flex items-center justify-center hover:bg-[#ff5a2c] transition-all shadow-xl shadow-slate-900/10 active:scale-95 group-hover:bg-[#ff5a2c] group-hover:shadow-orange-500/20"
                   >
                     <ArrowRight size={28} />
                   </button>
                </div>
              </div>
            </motion.div>
          );
        })}
        {filteredOrders.length === 0 && (
          <div className="py-32 text-center bg-white rounded-[60px] border-4 border-dashed border-slate-50">
             <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mx-auto text-slate-200 mb-8">
                <ShoppingBag size={48} />
             </div>
             <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] italic">No Operational Feed Found</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isCheckoutOpen && selectedOrder && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 md:p-12 lg:p-20 bg-slate-900/60 backdrop-blur-xl transition-all">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 20 }}
              className="bg-white w-full max-w-[1200px] max-h-[90vh] rounded-[48px] sm:rounded-[60px] shadow-[0_40px_120px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col lg:flex-row relative"
            >
              {/* Receipt Part - Scrollable Details */}
              <div className="flex-1 flex flex-col min-h-0 bg-white">
                {/* Sticky Header */}
                <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl p-8 sm:p-12 md:p-16 border-b border-slate-50 flex justify-between items-center">
                   <div className="min-w-0">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[9px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-4">
                         <Zap size={12} className="fill-current" /> TRANSACTION AUDIT
                      </div>
                      <h3 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none truncate">SETTLE <span className="text-slate-300">BILL</span></h3>
                   </div>
                   <button onClick={() => setIsCheckoutOpen(false)} className="w-14 h-14 bg-slate-50 hover:bg-red-50 hover:text-red-500 rounded-2xl text-slate-300 transition-all flex items-center justify-center shrink-0 shadow-inner"><X size={24} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 sm:p-12 md:p-16 space-y-12 custom-scrollbar">
                   {/* Guest Metadata */}
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 pb-8 border-b border-dashed border-slate-100">
                      <div>
                         <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-1">STATION</p>
                         <p className="text-2xl font-black italic text-slate-900">{formatTableNumber(selectedOrder.tables?.table_number)}</p>
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-1">IDENTITY</p>
                         <p className="text-2xl font-black italic text-slate-900 truncate">{selectedOrder.customer_name || "GUEST"}</p>
                      </div>
                      <div className="hidden sm:block">
                         <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-1">CHRONO</p>
                         <p className="text-2xl font-black italic text-slate-900">{new Date(selectedOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                   </div>

                   <div className="space-y-10">
                      <div className="flex items-center gap-6">
                         <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] italic whitespace-nowrap">ITEMIZED AUDIT</p>
                         <div className="h-px w-full bg-slate-100" />
                      </div>
                      <div className="space-y-6">
                         {selectedOrder.order_items?.map((item: any) => (
                           <div key={item.id} className="flex justify-between items-start group">
                              <div className="flex gap-6 min-w-0">
                                 <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-sm font-black italic text-[#ff5a2c] shadow-inner shrink-0 group-hover:scale-110 transition-transform">{item.quantity}x</div>
                                 <div className="min-w-0">
                                    <span className="block font-black text-lg text-slate-900 uppercase italic tracking-tighter leading-tight group-hover:text-[#ff5a2c] transition-colors">{item.menu_items?.name}</span>
                                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1">VALUATION: ₹{item.unit_price}</span>
                                 </div>
                              </div>
                              <span className="font-black text-xl text-slate-900 italic tracking-tighter ml-6">₹{item.total_price}</span>
                           </div>
                         ))}
                      </div>
                   </div>

                   {/* Levies & Totals breakdown */}
                   <div className="pt-12 border-t-4 border-double border-slate-100 space-y-6">
                      {(() => {
                         const t = calculateTotal(selectedOrder);
                         return (
                           <div className="space-y-4">
                              <div className="flex justify-between items-center text-slate-400 font-black text-[11px] uppercase tracking-[0.3em] italic">
                                 <span>SUBTOTAL VALUATION</span>
                                 <span>₹{t.subtotal}</span>
                              </div>
                              <div className="flex justify-between items-center text-slate-400 font-black text-[11px] uppercase tracking-[0.3em] italic">
                                 <span>OPERATIONAL LEVIES (GST/SC)</span>
                                 <span>₹{(t.cgst + t.sgst + t.service).toFixed(0)}</span>
                              </div>
                           </div>
                         )
                      })()}
                   </div>
                </div>

                {/* Sticky Mobile Footer for Total */}
                <div className="lg:hidden bg-slate-900 p-8 text-white flex justify-between items-center shrink-0">
                   <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/40">AGGREGATE TOTAL</p>
                      <p className="text-3xl font-black italic tracking-tighter">₹{(selectedOrder.grand_total || calculateTotal(selectedOrder).total).toFixed(0)}</p>
                   </div>
                   <button className="bg-[#ff5a2c] h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">SETTLE</button>
                </div>
              </div>
 
              {/* Action Part - Fixed/Sticky Right Panel */}
              <div className="w-full lg:w-[420px] bg-slate-950 p-10 sm:p-16 flex flex-col text-white relative overflow-y-auto no-scrollbar shrink-0 shadow-[-20px_0_100px_rgba(0,0,0,0.3)]">
                 <div className="absolute top-0 right-0 w-80 h-80 bg-[#ff5a2c]/20 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
                 
                 <div className="space-y-12 relative z-10 flex-1">
                    <div className="text-center space-y-4">
                       <div className="w-20 h-20 bg-white/5 border-2 border-white/10 rounded-[32px] flex items-center justify-center mx-auto text-[#ff5a2c] shadow-2xl">
                          <CreditCard size={40} />
                       </div>
                       <h4 className="text-3xl font-black uppercase italic tracking-tighter">SETTLEMENT</h4>
                       <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] italic">CHANNEL ACTIVATION</p>
                    </div>
 
                    <div className="bg-white p-8 rounded-[50px] shadow-[0_30px_100px_rgba(0,0,0,0.4)] flex items-center justify-center aspect-square max-w-[320px] mx-auto overflow-hidden group">
                       {restaurant?.merchant_qr_url ? (
                         <img src={restaurant.merchant_qr_url} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700" alt="Merchant QR" />
                       ) : (
                         <div className="text-center space-y-4 opacity-20 group-hover:opacity-30 transition-opacity">
                            <QrCode size={100} className="mx-auto text-slate-900" />
                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">QR LINK INACTIVE</p>
                         </div>
                       )}
                    </div>
 
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em] italic ml-2">DIGITAL ENDPOINT</label>
                       <div className="relative group">
                          <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-[#ff5a2c] transition-colors" />
                          <input 
                            type="email" placeholder="GUEST@DOMAIN.COM" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)}
                            className="w-full h-18 bg-white/5 border-2 border-white/10 rounded-[28px] pl-16 pr-8 outline-none focus:border-[#ff5a2c] focus:bg-white/10 font-black text-sm transition-all placeholder:text-white/10 uppercase tracking-[0.2em] italic shadow-inner"
                          />
                       </div>
                    </div>
                 </div>
 
                 <div className="space-y-6 pt-12 relative z-10">
                    <div className="hidden lg:block mb-8">
                       <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/30 mb-2 italic text-center">AGGREGATE TOTAL</p>
                       <p className="text-7xl font-black italic tracking-tighter text-center leading-none">₹{calculateTotal(selectedOrder).total.toFixed(0)}</p>
                    </div>

                    <button 
                      onClick={handleFinalCheckout} disabled={isProcessingPayment}
                      className="w-full h-20 bg-[#ff5a2c] text-white rounded-[32px] text-[11px] font-black uppercase tracking-[0.5em] italic hover:bg-orange-600 transition-all shadow-2xl shadow-orange-500/40 flex items-center justify-center gap-4 disabled:opacity-50 active:scale-95 group"
                    >
                      {isProcessingPayment ? <Loader2 className="animate-spin w-6 h-6" /> : <>FINALIZE SETTLEMENT <ChevronRight size={22} className="group-hover:translate-x-2 transition-transform" /></>}
                    </button>
                    
                    <button 
                      onClick={() => {
                        const totals = calculateTotal(selectedOrder);
                        generateReceipt({
                          id: selectedOrder.id,
                          customer_name: selectedOrder.customer_name || "Guest",
                          table_number: selectedOrder.tables?.table_number || "N/A",
                          items: selectedOrder.order_items,
                          subtotal: totals.subtotal,
                          cgst: totals.cgst,
                          sgst: totals.sgst,
                          serviceCharge: totals.service,
                          total: totals.total
                        }, restaurant);
                        toast.success("RECEIPT SYNCHRONIZED", { icon: '📄' });
                      }}
                      className="w-full py-4 text-[10px] font-black text-white/30 hover:text-[#ff5a2c] transition-all flex items-center justify-center gap-3 uppercase tracking-[0.4em] italic group"
                    >
                      <Download size={18} className="group-hover:-translate-y-1 transition-transform" /> EXPORT PDF PROTOCOL
                    </button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
