"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  Plus,
  Minus,
  Trash2,
  Send,
  User,
  Phone,
  ArrowLeft,
  CheckCircle2,
  X,
  QrCode,
  Mail,
  Loader2,
  Flame,
  LayoutGrid,
  ShieldAlert,
  ShoppingCart,
  Zap,
  Bell,
  Search,
  ChevronRight,
  Info,
  Printer,
  Download,
  CreditCard,
  ChefHat,
  Wifi,
  UtensilsCrossed,
  Clock,
  Smartphone,
  ChevronLeft,
  Filter,
  Users,
  Menu as MenuIcon,
  LogOut,
  ArrowRight,
  ChevronDown
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { auth as firebaseAuth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function WaiterDashboard() {
  const router = useRouter();
  const [tables, setTables] = useState<any[]>([]);
  const [menu, setMenu] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'tables' | 'menu' | 'orders'>('tables');
  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card'>('cash');
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [isBucketOpen, setIsBucketOpen] = useState(false);
  const [isLive, setIsLive] = useState(false);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [notification, setNotification] = useState<{ table: string, id: string, type: 'COOKED' | 'PREPARING' | 'SETTLED' | 'SERVED' } | null>(null);

  const buzzerRef = useRef<HTMLAudioElement | null>(null);
  const supabase = createClient();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    const staffSessionStr = localStorage.getItem("staff_session");
    if (staffSessionStr) {
      const staff = JSON.parse(staffSessionStr);
      setProfile(staff);
      fetchInitialData(staff.restaurant_id);
      setupRealtime(staff.restaurant_id);
    } else {
      const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
        if (user) getProfile(user.uid);
        else router.push('/staff-login');
      });
      return () => unsubscribe();
    }
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, []);

  useEffect(() => {
    buzzerRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
  }, []);

  async function getProfile(uid: string) {
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
    setProfile(data);
    if (data?.restaurant_id) {
      fetchInitialData(data.restaurant_id);
      setupRealtime(data.restaurant_id);
    }
  }

  async function setupRealtime(resId: string) {
    if (!resId) return;
    const channelName = `bhojan-res-${resId}`;
    if (channelRef.current) await supabase.removeChannel(channelRef.current);
    
    const channel = supabase.channel(channelName, { config: { broadcast: { self: true, ack: true } } });
    channel
      .on('broadcast', { event: 'refresh_waiter' }, (payload) => {
        console.log("WAITER BROADCAST RECEIVED:", payload);
        const data = payload.payload || payload; // Handle both structures
        const { type, tableNum } = data;
        
        if (['COOKED', 'PREPARING', 'SERVED', 'SETTLED'].includes(type)) {
           console.log(`TRIGGERING NOTIFICATION: ${type} for Table ${tableNum}`);
           triggerNotification(tableNum, type);
        }
        fetchData(resId);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload: any) => {
        console.log("POSTGRES UPDATE RECEIVED:", payload);
        const newStatus = payload.new?.status;
        const tableId = payload.new?.table_id;
        if (newStatus === 'ready') {
           const table = tables.find(t => t.id === tableId);
           if (table) triggerNotification(table.table_number, 'COOKED');
        }
        fetchData(resId);
      })
      .subscribe((status) => {
        console.log("REALTIME SUBSCRIPTION STATUS:", status);
        setIsLive(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;
  }

  const transmitEvent = async (event: string, payload: any = {}) => {
    if (!channelRef.current) return;
    try {
      // Prioritize reliability: Send the event regardless of isLive status
      // Supabase will handle the fallback if necessary.
      await channelRef.current.send({ 
        type: 'broadcast', 
        event: event, 
        payload: payload || {} 
      });
    } catch (e) {
      console.error("Transmission Error:", e);
    }
  };

  function triggerNotification(tableNum: string, type: 'COOKED' | 'PREPARING' | 'SETTLED' | 'SERVED') {
    if ((type === 'COOKED' || type === 'SETTLED') && buzzerRef.current) {
      buzzerRef.current.play().catch(() => {});
    }
    setNotification({ table: tableNum, id: Math.random().toString(), type });
    setTimeout(() => setNotification(null), 8000);
  }

  async function fetchInitialData(resId: string) {
    const { data: res } = await supabase.from("restaurants").select("*").eq("id", resId).single();
    setRestaurant(res);
    fetchData(resId);
  }

  async function fetchData(restaurantId: string) {
    const { data: tableData } = await supabase.from("tables").select("*").eq("restaurant_id", restaurantId).order("table_number", { ascending: true });
    const { data: orderData } = await supabase.from("orders").select(`*, order_items(*, menu_items(*))`).eq("restaurant_id", restaurantId).not("status", "in", "(completed,cancelled)").not("payment_status", "eq", "paid");
    const { data: menuData } = await supabase.from("menu_items").select("*").eq("restaurant_id", restaurantId).eq("is_available", true);

    const processedTables = tableData?.map(t => ({ ...t, activeOrder: orderData?.find((o: any) => o.table_id === t.id) }));
    if (menuData) setCategories(["All", ...Array.from(new Set(menuData.map((m: any) => m.category)))]);
    setTables(processedTables || []);
    setMenu(menuData || []);
  }

  const handleTableClick = (table: any) => {
    setSelectedTable(table);
    if (table.activeOrder) {
      setCustomer({ name: table.activeOrder.customer_name, phone: table.activeOrder.customer_phone });
      setActiveTab('menu');
    } else {
      setIsIdentityModalOpen(true);
    }
  };

  const addToCart = (item: any) => {
    if (!selectedTable) return toast.error("Select Station First");
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, qty: 1 }];
    });
    toast.success(`${item.name} added`, { duration: 800 });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === id);
      if (!existing) return prev;
      const newQty = existing.qty + delta;
      return newQty <= 0 ? prev.filter(i => i.id !== id) : prev.map(i => i.id === id ? { ...i, qty: newQty } : i);
    });
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setIsLoading(true);
    try {
      const newRoundTotal = cart.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);
      const activeOrder = selectedTable.activeOrder;
      let finalOrderId;

      if (activeOrder) {
        finalOrderId = activeOrder.id;
        const orderItems = cart.map(item => ({ order_id: activeOrder.id, menu_item_id: item.id, quantity: item.qty, unit_price: item.price, total_price: item.price * item.qty }));
        await supabase.from("order_items").insert(orderItems);
        await supabase.from("orders").update({ 
          status: 'pending', 
          total_amount: (activeOrder.total_amount || 0) + newRoundTotal, 
          grand_total: (activeOrder.grand_total || 0) + newRoundTotal
        }).eq("id", activeOrder.id);
      } else {
        const { data: order, error: orderError } = await supabase.from("orders").insert([{
          restaurant_id: profile.restaurant_id, 
          table_id: selectedTable.id, 
          waiter_id: profile.id, 
          customer_name: customer.name, 
          customer_phone: customer.phone, 
          status: 'pending', 
          payment_status: 'unpaid', 
          total_amount: newRoundTotal, 
          grand_total: newRoundTotal
        }]).select().single();
        if (orderError) throw orderError;
        finalOrderId = order.id;
        const orderItems = cart.map(item => ({ order_id: order.id, menu_item_id: item.id, quantity: item.qty, unit_price: item.price, total_price: item.price * item.qty }));
        await supabase.from("order_items").insert(orderItems);
        await supabase.from("tables").update({ status: 'occupied' }).eq("id", selectedTable.id);
      }

      await transmitEvent('refresh_kitchen', { 
        type: 'NEW_ORDER', 
        orderId: finalOrderId, 
        tableNum: selectedTable.table_number, 
        waiterName: profile?.full_name || 'SYSTEM' 
      });

      toast.success("Transmission Complete");
      setCart([]);
      setIsBucketOpen(false);
      setSelectedTable(null);
      setActiveTab('tables');
      fetchData(profile.restaurant_id);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  const formatTableNumber = (num: any) => {
    if (!num) return "";
    const s = num.toString();
    return s.startsWith('T-') ? s : `T-${s}`;
  };

  const groupedMenu = categories.slice(1).map(cat => ({
    name: cat,
    items: menu.filter(item => item.category === cat)
  })).filter(group => group.items.length > 0);

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex flex-col relative overflow-hidden">
      
      {/* Dynamic Header */}
      <header className="sticky top-0 z-[60] bg-white/80 backdrop-blur-3xl border-b border-slate-100 px-8 py-8 md:px-12 shadow-sm">
         <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-3">
               <div className="flex items-center gap-4">
                  <div className="w-1.5 h-6 bg-[#ff5a2c] rounded-full" />
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">OPERATIONAL INTERFACE</span>
               </div>
               <h1 className="text-[var(--font-xl)] font-black italic tracking-tighter uppercase leading-none text-slate-900">
                  {selectedTable ? <>STATION <span className="text-[#ff5a2c]">{formatTableNumber(selectedTable.table_number)}</span></> : <>WAITER <span className="text-slate-300">CONSOLE</span></>}
               </h1>
            </div>

            <div className="flex items-center gap-4 bg-slate-50 p-1.5 rounded-[24px] border border-slate-200">
               {(['tables', 'menu', 'orders'] as const).map((tab) => (
                 <button
                   key={tab} onClick={() => setActiveTab(tab)}
                   className={cn(
                     "px-10 py-3.5 rounded-[18px] text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap",
                     activeTab === tab ? 'bg-white text-slate-900 shadow-xl scale-105' : 'text-slate-400 hover:text-slate-600'
                   )}
                 >
                   {tab === 'tables' ? 'STATIONS' : tab === 'menu' ? 'LIVE FEED' : 'ACTIVE LOG'}
                 </button>
               ))}
            </div>
         </div>
      </header>

      {/* Main Content Feed */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full px-8 md:px-12 py-12 relative">
         <AnimatePresence mode="wait">
            {activeTab === 'tables' && (
              <motion.div key="tables" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-10">
                 {tables.map(table => {
                   const isOccupied = table.status === 'occupied';
                   const isReady = table.activeOrder?.status === 'ready';
                   return (
                     <motion.button
                       whileHover={{ scale: 1.05, y: -8 }} whileTap={{ scale: 0.95 }}
                       key={table.id} onClick={() => handleTableClick(table)}
                       className={cn(
                         "aspect-square rounded-[48px] border-4 flex flex-col items-center justify-center gap-3 transition-all shadow-2xl relative group overflow-hidden",
                         isOccupied 
                           ? (isReady ? 'bg-emerald-50 border-emerald-400 shadow-emerald-500/10' : 'bg-orange-50 border-orange-400 shadow-orange-500/10') 
                           : 'bg-white border-slate-50 hover:border-[#ff5a2c]/20'
                       )}
                     >
                        <span className="text-5xl font-black italic tracking-tighter text-slate-900 leading-none">
                           {table.table_number.toString().replace('T-', '')}
                        </span>
                        <span className={cn("text-[9px] font-black uppercase tracking-[0.4em] italic leading-none", isOccupied ? (isReady ? 'text-emerald-500' : 'text-[#ff5a2c]') : 'text-slate-200')}>
                           {isReady ? 'READY' : (table.status === 'available' ? 'FREE' : table.status)}
                        </span>
                        {isOccupied && <div className={cn("absolute top-6 right-6 w-3 h-3 rounded-full shadow-lg", isReady ? 'bg-emerald-500 animate-pulse' : 'bg-[#ff5a2c]')} />}
                     </motion.button>
                   );
                 })}
              </motion.div>
            )}

            {activeTab === 'menu' && (
              <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-16">
                 {/* Category Scrollbar */}
                 <div className="sticky top-[140px] z-[50] py-4 bg-[#f8f9fb]/80 backdrop-blur-xl border-b border-slate-100 -mx-12 px-12 overflow-x-auto no-scrollbar flex items-center gap-4">
                    {categories.map(cat => (
                      <button
                        key={cat} onClick={() => setSelectedCategory(cat)}
                        className={cn(
                          "px-12 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all border-2 italic",
                          selectedCategory === cat ? 'bg-slate-900 border-slate-900 text-white shadow-2xl scale-105' : 'bg-white border-slate-100 text-slate-300 hover:border-slate-200'
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                 </div>

                 {/* Grouped Menu Feed */}
                 <div className="space-y-24 pb-48">
                    {selectedCategory === 'All' ? (
                       groupedMenu.map(group => (
                          <div key={group.name} className="space-y-10">
                             <div className="flex items-center gap-6">
                                <h3 className="text-[var(--font-lg)] font-black italic uppercase tracking-tighter text-slate-900 leading-none">{group.name}</h3>
                                <div className="h-px flex-1 bg-slate-200/50" />
                             </div>
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-10">
                                {group.items.map(item => <MenuItemCard key={item.id} item={item} onAdd={addToCart} />)}
                             </div>
                          </div>
                       ))
                    ) : (
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-10">
                          {menu.filter(i => i.category === selectedCategory).map(item => <MenuItemCard key={item.id} item={item} onAdd={addToCart} />)}
                       </div>
                    )}
                 </div>
              </motion.div>
            )}

            {activeTab === 'orders' && (
              <motion.div key="orders" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                 {tables.filter(t => t.activeOrder).map(table => (
                   <motion.div 
                     whileHover={{ y: -10 }} key={table.id} onClick={() => handleTableClick(table)}
                     className="bg-white border border-slate-100 rounded-[48px] p-10 flex flex-col gap-8 shadow-xl relative overflow-hidden group cursor-pointer"
                   >
                      <div className="flex justify-between items-start">
                         <div className="w-16 h-16 rounded-[24px] bg-slate-900 text-white flex items-center justify-center text-3xl font-black italic shadow-2xl">{table.table_number.toString().replace('T-', '')}</div>
                         <div className={cn(
                           "px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.3em] border-2 italic",
                           table.activeOrder.status === 'ready' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-orange-50 border-orange-100 text-[#ff5a2c]'
                         )}>{table.activeOrder.status}</div>
                      </div>
                      <div className="space-y-3">
                         <h4 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 truncate leading-none">{table.activeOrder.customer_name}</h4>
                         <div className="flex items-center gap-3 text-[10px] font-black text-slate-300 uppercase italic tracking-widest leading-none"><Clock size={14} className="text-orange-500" /> {new Date(table.activeOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      <div className="pt-8 border-t border-slate-50 flex justify-between items-end">
                         <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic mb-2">VALUATION</p>
                            <p className="text-3xl font-black text-slate-900 italic tracking-tighter leading-none">₹{table.activeOrder.total_amount}</p>
                         </div>
                         <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-[#ff5a2c] group-hover:text-white transition-all shadow-inner"><ChevronRight size={24} /></div>
                      </div>
                   </motion.div>
                 ))}
              </motion.div>
            )}
         </AnimatePresence>
      </main>

      {/* Floating Action Bucket Button */}
      <AnimatePresence>
         {cart.length > 0 && (
            <motion.button
               initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 45 }}
               whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
               onClick={() => setIsBucketOpen(true)}
               className="fixed bottom-12 right-12 z-[100] w-24 h-24 bg-slate-900 rounded-[32px] flex items-center justify-center text-4xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-b-8 border-orange-500"
            >
               🪣
               <span className="absolute -top-3 -right-3 w-10 h-10 bg-[#ff5a2c] text-white text-xs font-black rounded-full flex items-center justify-center border-4 border-white shadow-xl animate-bounce">
                  {cart.reduce((a, b) => a + b.qty, 0)}
               </span>
            </motion.button>
         )}
      </AnimatePresence>

      {/* Station Bucket Drawer / Bottom Sheet */}
      <AnimatePresence>
         {isBucketOpen && (
            <div className="fixed inset-0 z-[200] flex items-end md:items-stretch justify-end">
               <motion.div 
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                 onClick={() => setIsBucketOpen(false)}
                 className="absolute inset-0 bg-slate-900/40 backdrop-blur-3xl"
               />
               <motion.aside 
                 initial={{ x: "100%", y: "100%" }} 
                 animate={{ x: 0, y: 0 }} 
                 exit={{ x: "100%", y: "100%" }}
                 transition={{ type: "spring", damping: 25, stiffness: 200 }}
                 className="relative w-full md:w-[480px] bg-white md:h-full rounded-t-[40px] md:rounded-t-none md:rounded-l-[40px] shadow-[-20px_0_100px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden max-h-[90vh] md:max-h-full"
               >
                  <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-xl">🪣</div>
                        <div>
                           <h3 className="text-lg font-black italic uppercase tracking-tighter text-slate-900 leading-none">STATION <span className="text-[#ff5a2c]">BUCKET</span></h3>
                           {selectedTable && (
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1 italic">
                                STATION: {formatTableNumber(selectedTable.table_number)} • GUEST: <span className="text-[#ff5a2c]">{customer.name || 'ANONYMOUS'}</span>
                              </p>
                           )}
                        </div>
                     </div>
                     <button onClick={() => setIsBucketOpen(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center hover:bg-red-50 transition-all text-slate-400 hover:text-red-500"><X size={20} /></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 space-y-8">
                     <div className="space-y-4">
                        {cart.length > 0 && <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.5em] italic ml-2">UNSENT ITEMS</p>}
                        {cart.map(item => (
                           <div key={item.id} className="flex items-center justify-between group bg-slate-50/30 p-4 rounded-2xl border border-slate-100/50">
                              <div className="flex-1 min-w-0 pr-4">
                                 <p className="font-black uppercase italic text-sm text-slate-900 leading-tight mb-1 group-hover:text-[#ff5a2c] transition-colors">{item.name}</p>
                                 <p className="text-[9px] font-bold text-slate-400 italic">VALUATION: ₹{item.price}</p>
                              </div>
                              <div className="flex items-center gap-4 bg-white rounded-xl p-1.5 border border-slate-100 shadow-sm">
                                 <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors"><Minus size={14} /></button>
                                 <span className="font-black text-slate-900 italic min-w-[20px] text-center text-sm">{item.qty}</span>
                                 <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 flex items-center justify-center text-[#ff5a2c]"><Plus size={14} /></button>
                              </div>
                           </div>
                        ))}
                     </div>

                     {selectedTable?.activeOrder?.order_items.length > 0 && (
                        <div className="pt-6 border-t border-slate-100 space-y-4">
                           <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.5em] italic ml-2">ACTIVE SESSION ITEMS</p>
                           <div className="space-y-3">
                              {selectedTable.activeOrder.order_items.map((item: any) => (
                                 <div key={item.id} className="flex justify-between items-center text-[10px] font-black uppercase italic text-slate-400 tracking-tight px-2">
                                    <span className="truncate pr-4">{item.quantity}x {item.menu_items?.name}</span>
                                    <span className="text-slate-900 shrink-0">₹{item.total_price}</span>
                                 </div>
                              ))}
                           </div>
                        </div>
                     )}
                  </div>

                  <div className="p-8 bg-slate-50/80 backdrop-blur-md space-y-6">
                     <div className="space-y-2">
                        <div className="flex justify-between items-end px-2">
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] italic">AGGREGATE COST</span>
                           <span className="text-3xl font-black text-slate-900 italic tracking-tighter leading-none">₹{cart.reduce((a, c) => a + (c.price * c.qty), 0) + (selectedTable?.activeOrder?.total_amount || 0)}</span>
                        </div>
                     </div>
                     <div className="grid grid-cols-1 gap-4">
                         {cart.length > 0 && (
                            <button 
                               onClick={handlePlaceOrder} disabled={isLoading}
                               className="w-full h-18 bg-white border-4 border-[#ff5a2c] text-[#ff5a2c] font-black uppercase tracking-[0.3em] text-[10px] rounded-[28px] shadow-xl hover:bg-orange-50 active:scale-95 transition-all flex items-center justify-center gap-3 italic disabled:opacity-30"
                            >
                               {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <><Send size={20} /> TRANSMIT TO KITCHEN</>}
                            </button>
                         )}
                         
                         {selectedTable?.activeOrder && (
                            <button 
                              onClick={() => { setIsCheckoutOpen(true); setIsBucketOpen(false); }}
                              className="w-full h-20 bg-[#ff5a2c] text-white font-black uppercase tracking-[0.4em] text-[11px] rounded-[32px] shadow-[0_20px_50px_rgba(255,90,44,0.3)] hover:bg-orange-600 active:scale-95 transition-all flex items-center justify-center gap-4 italic group"
                            >
                               <CreditCard size={22} className="group-hover:rotate-12 transition-transform" /> CHECKOUT SESSION
                            </button>
                         )}
                      </div>
                  </div>
               </motion.aside>
            </div>
         )}
      </AnimatePresence>

      {/* Identity Acquisition Protocol */}
      <AnimatePresence>
        {isIdentityModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-8 bg-slate-900/40 backdrop-blur-2xl">
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 1.1 }}
               className="bg-white w-full max-w-md rounded-[60px] p-12 md:p-16 shadow-[0_40px_120px_rgba(0,0,0,0.3)] relative overflow-hidden"
             >
                <div className="text-center space-y-6">
                   <div className="w-24 h-24 bg-orange-50 rounded-[32px] flex items-center justify-center mx-auto text-[#ff5a2c]"><Users size={48} /></div>
                   <h3 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">SESSION INIT</h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em] italic">STATION {formatTableNumber(selectedTable?.table_number)} ACTIVATION</p>
                </div>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (customer.name) {
                      setIsIdentityModalOpen(false);
                      setCart([]);
                      setActiveTab('menu');
                    }
                  }} 
                  className="mt-12 space-y-8"
                >
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] italic ml-6">GUEST IDENTITY</label>
                      <div className="relative group">
                         <User className="absolute left-8 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-[#ff5a2c] transition-colors" />
                         <input required autoFocus placeholder="e.g. RADHA" value={customer.name} onChange={(e) => setCustomer(p => ({ ...p, name: e.target.value }))} className="w-full h-20 bg-slate-50 border-2 border-slate-100 rounded-[32px] pl-20 pr-8 text-base font-black uppercase tracking-[0.2em] text-slate-900 outline-none focus:bg-white focus:border-[#ff5a2c] transition-all italic shadow-inner" />
                      </div>
                   </div>
                   <button type="submit" className="w-full h-20 rounded-[32px] bg-[#ff5a2c] text-white font-black uppercase tracking-[0.4em] text-[11px] shadow-2xl hover:bg-orange-600 transition-all italic active:scale-95">INITIALIZE FLOW</button>
                   <button type="button" onClick={() => setIsIdentityModalOpen(false)} className="w-full text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] italic mt-4 hover:text-slate-900 transition-colors">TERMINATE</button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Status Notification */}
      <AnimatePresence>
         {notification && (
           <motion.div 
             initial={{ x: 400, opacity: 0, scale: 0.8 }} 
             animate={{ x: 0, opacity: 1, scale: 1 }} 
             exit={{ x: 400, opacity: 0, scale: 0.8 }}
             className="fixed top-12 right-12 z-[1000]"
           >
             <div className={cn(
               "px-10 py-8 rounded-[40px] border-4 flex items-center gap-8 shadow-2xl backdrop-blur-3xl bg-white/90",
               notification.type === 'COOKED' ? 'border-emerald-500 text-emerald-600 shadow-emerald-500/20' : 
               notification.type === 'SETTLED' ? 'border-blue-500 text-blue-600 shadow-blue-500/20' :
               'border-[#ff5a2c] text-[#ff5a2c] shadow-orange-500/20'
             )}>
                <div className="text-6xl animate-bounce drop-shadow-xl">
                   {notification.type === 'COOKED' ? '🥘' : 
                    notification.type === 'PREPARING' ? '👨‍🍳' : 
                    notification.type === 'SETTLED' ? '💳' : '🍽️'}
                </div>
                <div>
                   <h4 className="text-2xl font-black italic uppercase tracking-tighter leading-none mb-2">
                      {notification.type === 'COOKED' ? 'EXTRACT READY' : 
                       notification.type === 'PREPARING' ? 'IN PRODUCTION' : 
                       notification.type === 'SETTLED' ? 'STATION RELEASED' : 'ORDER SERVED'}
                   </h4>
                   <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-40 italic leading-none">STATION {formatTableNumber(notification.table)}</p>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Floating Station Bucket 🪣 */}
      <motion.button 
        animate={{ 
          y: [0, -10, 0],
        }}
        transition={{ 
          y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
        }}
        whileHover={{ scale: 1.1, rotate: 8 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsBucketOpen(true)}
        className="fixed bottom-10 right-10 w-24 h-24 bg-white shadow-[0_20px_50px_rgba(255,90,44,0.3)] rounded-full flex items-center justify-center text-5xl z-[100] border-4 border-[#ff5a2c] cursor-pointer"
      >
        <span className="drop-shadow-lg">🪣</span>
        {cart.length > 0 && (
          <motion.div 
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-8 h-8 bg-black text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-xl"
          >
            {cart.length}
          </motion.div>
        )}
      </motion.button>
 
       <AnimatePresence>
        {isCheckoutOpen && selectedTable?.activeOrder && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-8 md:p-12 lg:p-20 bg-slate-900/60 backdrop-blur-3xl transition-all">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 20 }}
               className="bg-white w-full max-w-[1200px] max-h-[90vh] rounded-[60px] shadow-[0_60px_150px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col lg:flex-row relative border-4 border-white"
             >
                {/* Left Side - Itemized Audit (Scrollable) */}
                <div className="flex-1 flex flex-col min-h-0 bg-white">
                   {/* Sticky Header */}
                   <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl p-12 border-b border-slate-50 flex justify-between items-center">
                      <div className="min-w-0">
                         <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[9px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-4">
                            <Zap size={12} className="fill-current" /> TRANSACTION AUDIT
                         </div>
                         <h3 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none truncate">SETTLE <span className="text-slate-300">BILL</span></h3>
                      </div>
                      <button onClick={() => setIsCheckoutOpen(false)} className="w-16 h-16 bg-slate-50 hover:bg-red-50 hover:text-red-500 rounded-2xl text-slate-300 transition-all flex items-center justify-center shrink-0 shadow-inner group">
                         <X size={28} className="group-hover:rotate-90 transition-transform" />
                      </button>
                   </div>
 
                   <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar">
                      {/* Guest Metadata */}
                      <div className="grid grid-cols-3 gap-8 pb-10 border-b border-dashed border-slate-100">
                         <div>
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-1">STATION</p>
                            <p className="text-2xl font-black italic text-slate-900">{formatTableNumber(selectedTable.table_number)}</p>
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-1">IDENTITY</p>
                            <p className="text-2xl font-black italic text-slate-900 truncate">{selectedTable.activeOrder?.customer_name || "GUEST"}</p>
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-1">CHRONO</p>
                            <p className="text-2xl font-black italic text-slate-900">{new Date(selectedTable.activeOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                         </div>
                      </div>
 
                      <div className="space-y-10">
                         <div className="flex items-center gap-6">
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] italic whitespace-nowrap">ITEMIZED AUDIT</p>
                            <div className="h-px w-full bg-slate-100" />
                         </div>
                         <div className="space-y-6">
                            {selectedTable.activeOrder.order_items.map((item: any) => (
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
 
                      <div className="pt-12 border-t-4 border-double border-slate-100 space-y-6">
                         <div className="flex justify-between items-center text-slate-400 font-black text-[11px] uppercase tracking-[0.3em] italic">
                            <span>SUBTOTAL VALUATION</span>
                            <span>₹{selectedTable.activeOrder.total_amount}</span>
                         </div>
                         <div className="flex justify-between items-center text-slate-400 font-black text-[11px] uppercase tracking-[0.3em] italic">
                            <span>OPERATIONAL LEVIES (GST/SC)</span>
                            <span>₹{(selectedTable.activeOrder.total_amount * 0.1).toFixed(0)}</span>
                         </div>
                      </div>
                   </div>
                </div>
 
                {/* Right Side - Settlement Panel */}
                <div className="w-full lg:w-[420px] bg-slate-950 p-12 flex flex-col text-white relative overflow-y-auto no-scrollbar shrink-0 shadow-[-20px_0_100px_rgba(0,0,0,0.3)]">
                   <div className="absolute top-0 right-0 w-80 h-80 bg-[#ff5a2c]/20 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
                   
                   <div className="space-y-12 relative z-10 flex-1">
                      <div className="text-center space-y-4">
                         <div className="w-20 h-20 bg-white/5 border-2 border-white/10 rounded-[32px] flex items-center justify-center mx-auto text-[#ff5a2c] shadow-2xl">
                            <CreditCard size={40} />
                         </div>
                         <h4 className="text-3xl font-black uppercase italic tracking-tighter">SETTLEMENT</h4>
                         <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] italic text-center">CHANNEL ACTIVATION</p>
                      </div>
 
                      <div className="bg-white p-8 rounded-[50px] shadow-[0_30px_100px_rgba(0,0,0,0.4)] flex items-center justify-center aspect-square max-w-[320px] mx-auto overflow-hidden group">
                         {restaurant?.merchant_qr_url ? (
                            <img src={restaurant.merchant_qr_url} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700" alt="Merchant QR" />
                         ) : (
                            <div className="text-center space-y-4 opacity-20">
                               <QrCode size={100} className="mx-auto text-slate-900" />
                               <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">QR LINK INACTIVE</p>
                            </div>
                         )}
                      </div>
 
                      <div className="space-y-6">
                         <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/30 italic ml-4">PAYMENT CHANNEL</p>
                         <div className="grid grid-cols-3 gap-3">
                            {(['cash', 'upi', 'card'] as const).map(method => (
                               <button 
                                 key={method} onClick={() => setPaymentMethod(method)}
                                 className={cn(
                                   "h-16 rounded-[24px] border-2 font-black uppercase text-[11px] tracking-widest transition-all italic",
                                   paymentMethod === method 
                                     ? "bg-white text-slate-900 border-white shadow-2xl scale-105" 
                                     : "bg-white/5 border-white/10 text-white/40 hover:border-white/30"
                                 )}
                               >
                                  {method}
                               </button>
                            ))}
                         </div>
                      </div>
                   </div>
 
                   <div className="space-y-8 pt-12 relative z-10">
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/30 mb-2 italic text-center">AGGREGATE TOTAL</p>
                         <p className="text-7xl font-black italic tracking-tighter text-center leading-none">₹{(selectedTable.activeOrder.total_amount * 1.1).toFixed(0)}</p>
                      </div>
 
                      <button 
                        onClick={async () => {
                           setIsLoading(true);
                           try {
                              const finalTotal = selectedTable.activeOrder.total_amount * 1.1;
                              await supabase.from("orders").update({ 
                                 status: 'completed', 
                                 payment_status: 'paid',
                                 payment_method: paymentMethod,
                                 grand_total: finalTotal
                              }).eq("id", selectedTable.activeOrder.id);
                              await supabase.from("tables").update({ status: 'available' }).eq("id", selectedTable.id);
                              toast.success("SESSION SETTLED SUCCESSFULLY");
                              setIsCheckoutOpen(false);
                              setSelectedTable(null);
                              fetchData(profile.restaurant_id);
                           } catch (err) {
                              toast.error("SETTLEMENT FAILED");
                           } finally {
                              setIsLoading(false);
                           }
                        }}
                        disabled={isLoading}
                        className="w-full h-20 bg-[#ff5a2c] text-white rounded-[32px] text-[11px] font-black uppercase tracking-[0.5em] italic hover:bg-orange-600 transition-all shadow-2xl shadow-orange-500/40 flex items-center justify-center gap-4 active:scale-95 group"
                      >
                         {isLoading ? <Loader2 className="animate-spin w-6 h-6" /> : <>FINALIZE SETTLEMENT <ChevronRight size={22} className="group-hover:translate-x-2 transition-transform" /></>}
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

function MenuItemCard({ item, onAdd }: { item: any, onAdd: (item: any) => void }) {
   return (
      <motion.div 
         whileHover={{ y: -10 }}
         onClick={() => onAdd(item)}
         className="bg-white rounded-[48px] border-2 border-slate-50 p-8 flex flex-col gap-6 cursor-pointer shadow-sm hover:shadow-2xl hover:border-[#ff5a2c]/30 transition-all duration-500 group relative overflow-hidden"
      >
         <div className="w-16 h-16 rounded-[24px] bg-slate-50 flex items-center justify-center text-3xl font-black italic text-[#ff5a2c] shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
            {item.name.charAt(0)}
         </div>
         
         <div className="flex-1 space-y-4">
            <h4 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 leading-[1.1] line-clamp-2 group-hover:text-[#ff5a2c] transition-colors min-h-[2.2em]">
               {item.name}
            </h4>
            <div className="flex items-center gap-2">
               <div className={cn("w-2 h-2 rounded-full", item.is_veg ? 'bg-emerald-500' : 'bg-red-500')} />
               <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">{item.is_veg ? 'PURE VEG' : 'PROTEIN'}</span>
            </div>
         </div>

         <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
            <span className="text-2xl font-black italic tracking-tighter text-slate-900 leading-none">₹{item.price}</span>
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xl group-hover:bg-[#ff5a2c] group-hover:scale-110 transition-all">
               <Plus size={20} />
            </div>
         </div>

         <div className="absolute inset-0 bg-[#ff5a2c]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </motion.div>
   );
}
