"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
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
import { useRouter, useSearchParams } from "next/navigation";

export default function WaiterDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();

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
  const [searchQuery, setSearchQuery] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [isBucketOpen, setIsBucketOpen] = useState(false);
  const [isLive, setIsLive] = useState(false);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);
  const [isMenuSelectorOpen, setIsMenuSelectorOpen] = useState(false);
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
    const action = searchParams.get('action');
    const tab = searchParams.get('tab');
    
    if (action === 'menu') {
      setIsMenuSelectorOpen(true);
    }
    if (tab === 'orders') {
      setActiveTab('orders');
    } else if (tab === 'tables') {
      setActiveTab('tables');
    }
  }, [searchParams]);

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
    const { getWaiterDashboardData } = await import('./actions');
    const { tables: tableData, orders: orderData, menu: menuData, error } = await getWaiterDashboardData(restaurantId);
    
    if (error) {
      toast.error("Failed to sync with central database");
      return;
    }

    const processedTables = tableData?.map(t => ({ ...t, activeOrder: orderData?.find((o: any) => o.table_id === t.id) }));
    if (menuData) setCategories(["All", ...Array.from(new Set(menuData.map((m: any) => m.category)))]);
    setTables(processedTables || []);
    setMenu(menuData || []);
  }

  const handleTableClick = (table: any) => {
    setSelectedTable(table);
    if (table.activeOrder) {
      setCustomer({ name: table.activeOrder.customer_name, phone: table.activeOrder.customer_phone });
      setIsBucketOpen(true);
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
    
    const newRoundTotal = cart.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);
    const activeOrder = selectedTable.activeOrder;
    
    // Optimistic UI update
    const previousTables = [...tables];
    setTables(prev => prev.map(t => t.id === selectedTable.id ? { ...t, status: 'occupied' } : t));
    
    try {
      const { placeOrder } = await import('./actions');
      
      const orderData = activeOrder ? {
        total_amount: (activeOrder.total_amount || 0) + newRoundTotal,
        grand_total: (activeOrder.grand_total || 0) + newRoundTotal
      } : {
        restaurant_id: profile.restaurant_id,
        table_id: selectedTable.id,
        waiter_id: profile.id,
        customer_name: customer.name,
        customer_phone: customer.phone,
        status: 'pending',
        payment_status: 'unpaid',
        total_amount: newRoundTotal,
        grand_total: newRoundTotal
      };

      const orderItems = cart.map(item => ({
        menu_item_id: item.id,
        quantity: item.qty,
        unit_price: item.price,
        total_price: item.price * item.qty
      }));

      const { orderId, error } = await placeOrder(orderData, orderItems, activeOrder?.id, selectedTable.id);
      
      if (error) throw new Error(error);

      await transmitEvent('refresh_kitchen', { 
        type: 'NEW_ORDER', 
        orderId: orderId, 
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
      setTables(previousTables);
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

  const groupedMenu = useMemo(() => {
    const raw = categories.slice(1).map(cat => ({
      name: cat,
      items: menu.filter(i => i.category === cat && 
        (i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
         i.description?.toLowerCase().includes(searchQuery.toLowerCase())))
    }));
    return raw.filter(g => g.items.length > 0);
  }, [categories, menu, searchQuery]);

  const filteredItems = useMemo(() => {
    return menu.filter(i => 
      (selectedCategory === "All" || i.category === selectedCategory) &&
      (i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
       i.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [menu, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex flex-col relative overflow-hidden">
      
      {/* Dynamic Header */}
      {/* Dynamic Header */}
      <header className="sticky top-0 z-[60] bg-white/80 backdrop-blur-3xl border-b border-slate-100 px-8 py-8 md:px-12 shadow-sm">
         <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-3">
               <div className="flex items-center gap-4">
                  <div className="w-1.5 h-6 bg-slate-900 rounded-full" />
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">POS TERMINAL</span>
               </div>
               <h1 className="text-[var(--font-xl)] font-black italic tracking-tighter uppercase leading-none text-slate-900">
                  {restaurant?.name || 'BHOJAN'} <span className="text-slate-300">SYSTEM</span>
               </h1>
            </div>

            <div className="flex items-center gap-4 bg-slate-50 p-1.5 rounded-[24px] border border-slate-200">
               {(['tables', 'orders'] as const).map((tab) => (
                 <button
                   key={tab} onClick={() => setActiveTab(tab)}
                   className={cn(
                     "px-10 py-3.5 rounded-[18px] text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap",
                     activeTab === tab ? 'bg-white text-slate-900 shadow-xl scale-105' : 'text-slate-400 hover:text-slate-600'
                   )}
                 >
                   {tab === 'tables' ? 'STATIONS' : 'LIVE FEED'}
                 </button>
               ))}
            </div>
         </div>
      </header>

      {/* Main Content Feed */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full px-8 md:px-12 py-12 relative">
         <AnimatePresence mode="wait">
            {activeTab === 'tables' && (
              <motion.div key="tables" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8">
                 {tables.map(table => {
                   const order = table.activeOrder;
                   const isOccupied = table.status === 'occupied' || !!order;
                   const isPreparing = order?.status === 'preparing';
                   const isReady = order?.order_items?.some((i: any) => i.status === 'ready');
                   const duration = order ? Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000) : 0;

                   return (
                     <motion.button
                       whileHover={{ scale: 1.02, y: -5 }} whileTap={{ scale: 0.98 }}
                       key={table.id} onClick={() => handleTableClick(table)}
                       className={cn(
                         "h-64 rounded-[40px] border-2 flex flex-col p-8 transition-all shadow-xl relative group overflow-hidden text-left",
                         isOccupied 
                           ? isReady ? 'bg-emerald-500 border-emerald-400 text-white shadow-emerald-500/20' : 
                             isPreparing ? 'bg-orange-500 border-orange-400 text-white shadow-orange-500/20' :
                             'bg-slate-900 border-slate-800 text-white shadow-slate-900/20'
                           : 'bg-white border-slate-100 text-slate-900 hover:border-slate-300'
                       )}
                     >
                        <div className="flex justify-between items-start w-full">
                           <span className="text-4xl font-black italic tracking-tighter leading-none">{formatTableNumber(table.table_number)}</span>
                           {isOccupied && <div className="px-3 py-1 rounded-full bg-white/20 text-[8px] font-black uppercase tracking-widest">{order?.status}</div>}
                        </div>

                        {isOccupied ? (
                          <div className="mt-auto space-y-2">
                             <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">{order?.customer_name || 'Anonymous Guest'}</p>
                             <div className="flex items-center justify-between">
                                <span className="text-xl font-black tracking-tighter leading-none">₹{order?.total_amount || 0}</span>
                                <div className="flex items-center gap-1 opacity-60">
                                   <Clock size={12} />
                                   <span className="text-[9px] font-black">{duration}m</span>
                                </div>
                             </div>
                             <div className="flex items-center gap-2 pt-2">
                                <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                                   <motion.div 
                                     initial={{ width: 0 }} animate={{ width: '60%' }} 
                                     className="h-full bg-white" 
                                   />
                                </div>
                                <span className="text-[8px] font-black">{order?.order_items?.length || 0} ITEMS</span>
                             </div>
                          </div>
                        ) : (
                          <div className="mt-auto">
                             <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">STATION STATUS</p>
                             <p className="text-lg font-black text-slate-400 uppercase italic tracking-tighter">Available</p>
                             <div className="mt-4 w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all">
                                <Plus size={20} />
                             </div>
                          </div>
                        )}
                     </motion.button>
                   );
                 })}
              </motion.div>
            )}


            {activeTab === 'orders' && (
              <motion.div key="live-feed" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                 <div className="flex items-center justify-between">
                    <div>
                       <h2 className="text-4xl font-black italic tracking-tighter text-slate-900 uppercase">Live <span className="text-slate-300">Feed</span></h2>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Monitor active sessions across the floor</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {tables.filter(t => t.activeOrder).map(table => (
                      <motion.div 
                        whileHover={{ y: -8 }} key={table.id} onClick={() => handleTableClick(table)}
                        className="bg-white border border-slate-100 rounded-[40px] p-8 flex flex-col gap-6 shadow-xl relative overflow-hidden group cursor-pointer"
                      >
                         <div className="flex justify-between items-start">
                            <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-2xl font-black italic">
                               {formatTableNumber(table.table_number)}
                            </div>
                            <div className="text-right">
                               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">SESSION TOTAL</p>
                               <p className="text-2xl font-black text-slate-900 tracking-tighter italic leading-none">₹{table.activeOrder.total_amount}</p>
                            </div>
                         </div>
                         
                         <div className="space-y-3">
                            {table.activeOrder.order_items?.slice(0, 3).map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center text-[11px] font-bold text-slate-600">
                                 <span className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center text-[9px] font-black">{item.quantity}x</span>
                                    <span className="truncate max-w-[120px] uppercase italic">{item.menu_items?.name}</span>
                                 </span>
                                 <span className={cn(
                                   "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                                   item.status === 'ready' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                                 )}>{item.status || 'cooking'}</span>
                              </div>
                            ))}
                         </div>

                         <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{table.activeOrder.status}</span>
                            </div>
                            <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-900 transition-colors" />
                         </div>
                      </motion.div>
                    ))}
                 </div>
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

      {/* Station Control Panel (Drawer) */}
      <AnimatePresence>
         {isBucketOpen && selectedTable && (
            <div className="fixed inset-0 z-[200] flex items-end md:items-stretch justify-end">
               <motion.div 
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                 onClick={() => setIsBucketOpen(false)}
                 className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xl"
               />
               <motion.aside 
                 initial={{ x: "100%" }} 
                 animate={{ x: 0 }} 
                 exit={{ x: "100%" }}
                 transition={{ type: "spring", damping: 30, stiffness: 300 }}
                 className="relative w-full xl:w-[85vw] 2xl:w-[75vw] bg-white h-full shadow-[-20px_0_100px_rgba(0,0,0,0.2)] flex flex-row overflow-hidden"
               >
                  {/* LEFT PANE: Menu Discovery (Integrated) */}
                  <div className="hidden lg:flex flex-[3] flex-col border-r border-slate-100 bg-[#f8f9fb]">
                     <div className="p-8 border-b border-slate-100 bg-white/50 backdrop-blur-xl flex items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                           <div className="w-1.5 h-6 bg-[#ff5a2c] rounded-full" />
                           <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">MENU <span className="text-slate-300">DISCOVERY</span></h3>
                        </div>
                        <div className="relative w-96">
                           <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                           <input 
                             value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                             placeholder="Search flavors..." 
                             className="w-full h-14 bg-white border border-slate-200 rounded-2xl pl-14 pr-6 text-xs font-bold outline-none focus:border-[#ff5a2c] transition-all shadow-sm" 
                           />
                        </div>
                     </div>
                     <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                           {filteredItems.map(item => (
                             <div key={item.id} className="bg-white p-6 rounded-3xl border border-slate-100 flex justify-between items-center shadow-sm">
                                <div>
                                  <p className="font-black text-slate-900 uppercase italic">{item.name}</p>
                                  <p className="text-[10px] font-bold text-slate-400">₹{item.price}</p>
                                </div>
                                <button onClick={() => { addToCart(item); toast.success(`${item.name} ADDED`); }} className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all"><Plus size={16}/></button>
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>

                  {/* RIGHT PANE: Order Management */}
                  <div className="flex-[2] flex flex-col min-w-[400px] bg-white">
                     {/* Header */}
                     <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-6">
                           <div className="w-16 h-16 bg-slate-900 text-white rounded-3xl flex items-center justify-center text-2xl font-black italic shadow-2xl">
                              {formatTableNumber(selectedTable.table_number)}
                           </div>
                           <div>
                              <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
                                 {selectedTable.activeOrder?.customer_name || 'STATION CONTROL'}
                              </h3>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
                                {selectedTable.activeOrder ? `ACTIVE SESSION • ₹${selectedTable.activeOrder.total_amount}` : 'PENDING ACTIVATION'}
                              </p>
                           </div>
                        </div>
                        <button onClick={() => setIsBucketOpen(false)} className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 hover:text-red-500 transition-all shadow-sm">
                           <X size={24} />
                        </button>
                     </div>

                     {/* Body - Ordered Items */}
                     <div className="flex-1 overflow-y-auto p-8 space-y-12">
                        <div className="space-y-6">
                           <div className="flex items-center justify-between">
                              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] italic">SESSION TRACKER</p>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
                                 {selectedTable.activeOrder?.order_items?.length || 0} ITEMS
                              </span>
                           </div>

                           <div className="space-y-4">
                              {selectedTable.activeOrder?.order_items?.map((item: any) => (
                                 <div key={item.id} className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-[32px] group hover:bg-white hover:shadow-xl transition-all duration-500">
                                    <div className="flex items-center gap-6">
                                       <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-sm font-black italic text-slate-400 group-hover:text-[#ff5a2c] transition-colors shadow-sm">
                                          {item.quantity}x
                                       </div>
                                       <div>
                                          <p className="text-base font-black text-slate-900 uppercase italic tracking-tighter leading-tight group-hover:text-[#ff5a2c] transition-colors">{item.menu_items?.name}</p>
                                          <div className="flex items-center gap-2 mt-1">
                                             <div className={cn(
                                               "w-1.5 h-1.5 rounded-full",
                                               item.status === 'ready' ? 'bg-emerald-500 animate-pulse' : 'bg-orange-500'
                                             )} />
                                             <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{item.status || 'cooking'}</span>
                                          </div>
                                       </div>
                                    </div>
                                    {item.status === 'ready' && (
                                       <button 
                                         onClick={async () => {
                                           const { updateOrderItemStatus } = await import('./actions');
                                           await updateOrderItemStatus(item.id, 'served');
                                           fetchData(profile.restaurant_id);
                                           toast.success("MARKED AS SERVED");
                                         }}
                                         className="px-6 py-2 rounded-xl bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                                       >
                                          SERVE
                                       </button>
                                    )}
                                 </div>
                              ))}

                              {/* Pending/Bucket Items */}
                              {cart.length > 0 && (
                                 <div className="space-y-4 pt-4 border-t border-dashed border-slate-200">
                                    <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em] italic ml-2 animate-pulse">UNSENT MODIFICATIONS</p>
                                    {cart.map(item => (
                                       <div key={item.id} className="flex items-center justify-between p-6 bg-orange-50/50 border border-orange-100 rounded-[32px]">
                                          <div className="flex items-center gap-6">
                                             <div className="w-12 h-12 rounded-2xl bg-white border border-orange-100 flex items-center justify-center text-sm font-black italic text-orange-500">
                                                {item.qty}x
                                             </div>
                                             <p className="text-base font-black text-slate-900 uppercase italic tracking-tighter leading-tight">{item.name}</p>
                                          </div>
                                          <div className="flex items-center gap-4">
                                             <button onClick={() => updateQty(item.id, -1)} className="p-2 text-slate-400 hover:text-red-500"><Minus size={16} /></button>
                                             <button onClick={() => updateQty(item.id, 1)} className="p-2 text-orange-500"><Plus size={16} /></button>
                                          </div>
                                       </div>
                                    ))}
                                 </div>
                              )}
                           </div>
                        </div>
                     </div>

                     {/* Actions Footer */}
                     <div className="p-10 border-t border-slate-100 bg-white space-y-6 shadow-[0_-20px_50px_rgba(0,0,0,0.05)]">
                        {cart.length > 0 && (
                           <button 
                             onClick={async () => {
                               setIsLoading(true);
                               try {
                                  const { placeOrder } = await import('./actions');
                                  const totalFromCart = cart.reduce((a, b) => a + (b.price * b.qty), 0);
                                  const activeOrder = selectedTable.activeOrder;

                                  const orderData = activeOrder ? {
                                    total_amount: (activeOrder.total_amount || 0) + totalFromCart,
                                    grand_total: (activeOrder.grand_total || 0) + totalFromCart
                                  } : {
                                    restaurant_id: profile.restaurant_id,
                                    table_id: selectedTable.id,
                                    waiter_id: profile.id,
                                    customer_name: customer.name,
                                    status: 'pending',
                                    payment_status: 'unpaid',
                                    total_amount: totalFromCart,
                                    grand_total: totalFromCart
                                  };

                                  const orderItems = cart.map(item => ({
                                    menu_item_id: item.id,
                                    quantity: item.qty,
                                    unit_price: item.price,
                                    total_price: item.price * item.qty,
                                    status: 'pending'
                                  }));

                                  await placeOrder(orderData, orderItems, activeOrder?.id, selectedTable.id);
                                  setCart([]);
                                  fetchData(profile.restaurant_id);
                                  transmitEvent('refresh_kitchen', { type: 'NEW_ORDER' });
                                  toast.success("SENT TO KITCHEN");
                               } catch (e: any) {
                                  toast.error(e.message);
                               } finally {
                                  setIsLoading(false);
                               }
                             }}
                             className="w-full h-20 bg-slate-900 text-white rounded-[32px] font-black uppercase tracking-[0.4em] text-[10px] italic shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-4"
                           >
                              {isLoading ? <Loader2 size={24} className="animate-spin" /> : <><Flame size={20} className="text-[#ff5a2c]" /> TRANSMIT BATCH</>}
                           </button>
                        )}
                        
                        {selectedTable.activeOrder && cart.length === 0 && (
                           <button 
                             onClick={() => {
                                setIsCheckoutOpen(true);
                                setIsBucketOpen(false);
                             }}
                             className="w-full h-20 bg-[#ff5a2c] text-white rounded-[32px] font-black uppercase tracking-[0.4em] text-[10px] italic shadow-2xl hover:bg-orange-600 transition-all flex items-center justify-center gap-4"
                           >
                              <CreditCard size={20} /> FINALIZE SETTLEMENT
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
                      setIsBucketOpen(true);
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
                           const previousTables = [...tables];
                           
                           // Optimistic UI update
                           setTables(prev => prev.map(t => t.id === selectedTable.id ? { ...t, status: 'available', activeOrder: null } : t));
                           setIsCheckoutOpen(false);
                           setSelectedTable(null);

                           try {
                              const finalTotal = selectedTable.activeOrder.total_amount * 1.1;
                              const { settleBill } = await import('./actions');
                              
                              const { error } = await settleBill(selectedTable.activeOrder.id, selectedTable.id, {
                                status: 'completed', 
                                payment_status: 'paid',
                                payment_method: paymentMethod,
                                grand_total: finalTotal
                              });
                              
                              if (error) throw new Error(error);
                              
                              toast.success("SESSION SETTLED SUCCESSFULLY");
                              fetchData(profile.restaurant_id);
                           } catch (err: any) {
                              setTables(previousTables);
                              toast.error("SETTLEMENT FAILED: " + err.message);
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
 
      {/* Menu Selector (Read-Only) */}
      <AnimatePresence>
         {isMenuSelectorOpen && (
            <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-8 bg-slate-900/40 backdrop-blur-3xl">
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
                 className="bg-white w-full max-w-[1400px] h-[90vh] rounded-[48px] shadow-[0_60px_150px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden border-4 border-white"
               >
                  {/* Menu Header */}
                  <div className="p-10 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8 bg-slate-50/50">
                     <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center"><MenuIcon size={28} /></div>
                        <div>
                           <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Select <span className="text-slate-300">Delicacies</span></h3>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Browse the current operational menu</p>
                        </div>
                     </div>
                     <div className="relative w-full md:w-96">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                        <input 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search flavor..." 
                          className="w-full h-16 bg-white border-2 border-slate-100 rounded-3xl pl-16 pr-8 text-sm font-bold outline-none focus:border-slate-900 transition-all shadow-sm" 
                        />
                     </div>
                     <button onClick={() => setIsMenuSelectorOpen(false)} className="w-16 h-16 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 hover:text-slate-900 transition-all shadow-sm shrink-0">
                        <X size={24} />
                     </button>
                  </div>

                  {/* Menu Discovery Grid */}
                  <div className="flex-1 overflow-y-auto p-10 bg-[#f8f9fb]">
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                        {filteredItems.map(item => (
                          <MenuItemCard 
                            key={item.id} 
                            item={item} 
                            onAdd={(item) => {
                              addToCart(item);
                              toast.success(`${item.name} ADDED TO BUCKET`, { position: 'bottom-center' });
                            }} 
                          />
                        ))}
                     </div>
                  </div>

                  {/* Footer - Bucket Summary */}
                  <div className="p-8 border-t border-slate-100 bg-white flex items-center justify-between">
                     <div className="flex items-center gap-6">
                        <div className="text-left">
                           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">CURRENT BUCKET</p>
                           <p className="text-2xl font-black italic text-slate-900 tracking-tighter">{cart.reduce((a, b) => a + b.qty, 0)} ITEMS SELECTED</p>
                        </div>
                     </div>
                     <button 
                       onClick={() => setIsMenuSelectorOpen(false)}
                       className="px-12 h-16 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-[0.3em] text-[10px] italic shadow-xl"
                     >
                        RETURN TO STATION
                     </button>
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
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -10 }}
      className="bg-white rounded-[40px] overflow-hidden shadow-xl border border-slate-100 group flex flex-col h-full"
    >
       <div className="relative h-56 overflow-hidden">
          <img 
            src={item.image_url || `https://source.unsplash.com/800x600/?food,dish,${item.name.toLowerCase().split(' ')[0]}`} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
            alt={item.name} 
          />
          <div className="absolute top-6 left-6 flex flex-col gap-2">
             {item.is_veg ? (
               <div className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur-md flex items-center justify-center border border-emerald-200">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
               </div>
             ) : (
               <div className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur-md flex items-center justify-center border border-red-200">
                  <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
               </div>
             )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
       </div>

       <div className="p-8 flex flex-col flex-1 gap-4">
          <div className="flex-1">
             <h4 className="text-lg font-black text-slate-900 uppercase italic tracking-tighter leading-tight group-hover:text-[#ff5a2c] transition-colors">{item.name}</h4>
             <p className="text-[10px] font-medium text-slate-400 mt-2 line-clamp-2 leading-relaxed">{item.description || "Freshly prepared chef's signature dish."}</p>
          </div>

          <div className="flex items-center justify-between mt-2">
             <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">PRICE</span>
                <span className="text-xl font-black text-slate-900 italic tracking-tighter leading-none">₹{item.price}</span>
             </div>
             <motion.button
               whileHover={{ scale: 1.1 }}
               whileTap={{ scale: 0.9 }}
               onClick={(e) => { e.stopPropagation(); onAdd(item); }}
               className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xl hover:bg-[#ff5a2c] transition-all"
             >
                <Plus size={20} />
             </motion.button>
          </div>
       </div>
    </motion.div>
  );
}

