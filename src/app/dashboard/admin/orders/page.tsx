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
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
    setProfile(data);
    if (data?.restaurant_id) {
      fetchRestaurant(data.restaurant_id);
      fetchOrders(data.restaurant_id);
      subscribeToOrders(data.restaurant_id);
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
      const totals = calculateTotal(selectedOrder);
      await supabase.from("orders").update({ 
        status: 'completed', 
        payment_status: 'paid',
        grand_total: totals.total,
        customer_email: customerEmail,
        settled_by: profile?.full_name || 'Admin',
        settled_at: new Date().toISOString()
      }).eq("id", selectedOrder.id);
      
      if (selectedOrder.table_id) {
        await supabase.from("tables").update({ status: 'available' }).eq("id", selectedOrder.table_id);
      }

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
      setIsCheckoutOpen(false);
      setSelectedOrder(null);
      fetchOrders(profile.restaurant_id);
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

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-[#ff5a2c]" />
    </div>
  );

  return (
    <div className="space-y-8 pb-32 md:pb-20">
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

      <div className="grid grid-cols-1 gap-4 md:gap-6">
        {filteredOrders.map((order) => {
          const status = getStatusInfo(order.status);
          const totals = calculateTotal(order);
          return (
            <div key={order.id} className="bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all overflow-hidden flex flex-col md:flex-row group">
              <div className={`w-full md:w-3 border-r md:border-r-0 md:border-b-0 border-b border-slate-50 ${status.bg} shrink-0`} />
              
              <div className="flex-1 p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-[24px] bg-slate-50 border border-slate-100 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Table</span>
                    <span className="text-2xl md:text-3xl font-black text-slate-900 leading-none italic">{order.tables?.table_number || '!!'}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                       <h4 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter truncate leading-none">{order.customer_name || "Public Guest"}</h4>
                       <span className={`text-[8px] px-3 py-1 rounded-full font-black ${status.bg} ${status.color} uppercase tracking-[0.2em] border border-current opacity-70`}>{status.label}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Clock size={14} className="text-[#ff5a2c]" /> {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5"><Hash size={14} /> {order.id.slice(-6).toUpperCase()}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 max-w-md">
                   {order.order_items?.map((item: any) => (
                     <span key={item.id} className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-black text-slate-500 uppercase tracking-widest">
                        {item.quantity}× {item.menu_items?.name}
                     </span>
                   ))}
                </div>

                <div className="flex items-center justify-between lg:justify-end gap-8 pt-4 md:pt-0 border-t md:border-t-0 border-slate-50">
                   <div className="text-left lg:text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Settlement</p>
                      <p className="text-2xl font-black text-slate-900 italic tracking-tighter">₹{(order.grand_total || totals.total).toLocaleString()}</p>
                   </div>
                   <button 
                     onClick={() => { setSelectedOrder(order); setIsCheckoutOpen(true); }}
                     className="flex-1 md:flex-none bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#ff5a2c] transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3 active:scale-95 group-hover:bg-[#ff5a2c] group-hover:shadow-orange-500/20"
                   >
                     Process <ArrowRight size={16} />
                   </button>
                </div>
              </div>
            </div>
          );
        })}
        {filteredOrders.length === 0 && (
          <div className="py-24 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-100">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200 mb-6">
                <ShoppingBag size={32} />
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">No Active Operations</p>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      <AnimatePresence>
        {isCheckoutOpen && selectedOrder && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-8 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="bg-white w-full max-w-5xl md:rounded-[48px] shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-screen md:min-h-0"
            >
              {/* Receipt Part */}
              <div className="flex-1 p-8 md:p-16 lg:p-20 overflow-y-auto">
                <div className="flex justify-between items-start mb-12">
                   <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-4">
                         <Zap size={12} /> Transaction Preview
                      </div>
                      <h3 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Settle <span className="text-slate-300">Bill</span></h3>
                   </div>
                   <button onClick={() => setIsCheckoutOpen(false)} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-400 transition-all"><X size={24} /></button>
                </div>

                <div className="space-y-8 mb-12">
                   <div className="flex items-center justify-between px-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Operational Items</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Value</p>
                   </div>
                   <div className="space-y-4">
                      {selectedOrder.order_items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between items-center group">
                           <div className="flex flex-col">
                              <span className="font-black text-slate-900 uppercase italic tracking-tighter">{item.quantity}× {item.menu_items?.name}</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Unit: ₹{item.unit_price}</span>
                           </div>
                           <span className="font-black text-slate-900 italic">₹{item.total_price}</span>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="pt-10 border-t border-slate-100 space-y-6">
                   {(() => {
                      const t = calculateTotal(selectedOrder);
                      return (
                        <>
                          <div className="flex justify-between text-slate-400 font-black text-[10px] uppercase tracking-widest">
                             <span>Sector Subtotal</span>
                             <span>₹{t.subtotal}</span>
                          </div>
                          <div className="flex justify-between text-slate-400 font-black text-[10px] uppercase tracking-widest">
                             <span>Levies & Charges</span>
                             <span>₹{(t.cgst + t.sgst + t.service).toFixed(0)}</span>
                          </div>
                          <div className="flex justify-between items-end pt-8">
                             <div className="space-y-1">
                                <span className="text-[10px] font-black text-[#ff5a2c] uppercase tracking-[0.3em]">Grand Total Settlement</span>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Inclusive of all operational taxes</p>
                             </div>
                             <span className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter italic">₹{t.total.toFixed(0)}</span>
                          </div>
                        </>
                      )
                   })()}
                </div>
              </div>

              {/* Action Part */}
              <div className="w-full lg:w-[450px] bg-slate-900 p-8 md:p-16 flex flex-col justify-between text-white relative overflow-hidden shrink-0">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff5a2c]/10 blur-[100px] rounded-full" />
                 
                 <div className="space-y-12 relative z-10">
                    <div className="text-center">
                       <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-[20px] flex items-center justify-center mx-auto mb-6 text-[#ff5a2c]">
                          <CreditCard size={32} />
                       </div>
                       <h4 className="text-2xl font-black uppercase italic tracking-tighter">Settlement</h4>
                       <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">Scan to initiate transfer</p>
                    </div>

                    <div className="bg-white p-6 rounded-[40px] shadow-2xl flex items-center justify-center aspect-square max-w-[280px] mx-auto overflow-hidden">
                       {restaurant?.merchant_qr_url ? (
                         <img src={restaurant.merchant_qr_url} className="w-full h-full object-contain" alt="Merchant QR" />
                       ) : (
                         <div className="text-center space-y-3 opacity-20">
                            <QrCode size={80} className="mx-auto text-slate-900" />
                            <p className="text-[8px] font-black text-slate-900 uppercase tracking-widest">Config Missing</p>
                         </div>
                       )}
                    </div>

                    <div className="space-y-3">
                       <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Digital Receipt Endpoint</label>
                       <div className="relative group">
                          <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#ff5a2c] transition-colors" />
                          <input 
                            type="email" placeholder="customer@endpoint.com" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)}
                            className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 outline-none focus:border-[#ff5a2c] focus:bg-white/10 font-bold text-sm transition-all placeholder:text-slate-700"
                          />
                       </div>
                    </div>
                 </div>

                 <div className="space-y-6 pt-12 relative z-10">
                    <button 
                      onClick={handleFinalCheckout} disabled={isProcessingPayment}
                      className="w-full bg-[#ff5a2c] text-white py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-2xl shadow-orange-500/20 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
                    >
                      {isProcessingPayment ? <Loader2 className="animate-spin" /> : <>Complete Settlement <ChevronRight size={18} /></>}
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
                        toast.success("PDF Synchronized");
                      }}
                      className="w-full py-4 text-[9px] font-black text-slate-500 hover:text-white transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                    >
                      <Download size={16} /> Export PDF Resource
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
