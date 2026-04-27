"use client";

import { useState, useEffect, useRef } from "react";
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
  Filter
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { auth as firebaseAuth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "react-hot-toast";
import { sendReceiptEmail } from "@/lib/actions/email";
import { generateReceipt } from "@/lib/pdf/generateReceipt";
import { motion, AnimatePresence } from "framer-motion";

export default function WaiterDashboard() {
  const [tables, setTables] = useState<any[]>([]);
  const [menu, setMenu] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'tables' | 'menu' | 'orders'>('tables');
  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [isBucketPulsing, setIsBucketPulsing] = useState(false);
  const [isLive, setIsLive] = useState(false);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerEmail, setCustomerEmail] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [notification, setNotification] = useState<{ table: string, id: string, type: 'COOKED' | 'PREPARING' } | null>(null);

  const buzzerRef = useRef<HTMLAudioElement | null>(null);

  const supabase = createClient();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;
    const staffSessionStr = localStorage.getItem("staff_session");
    
    if (staffSessionStr) {
      const staff = JSON.parse(staffSessionStr);
      setProfile(staff);
      fetchInitialData(staff.restaurant_id);
      setupRealtime(staff.restaurant_id);
    } else {
      const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
        if (user && isMounted) getProfile(user.uid);
      });
      return () => {
        isMounted = false;
        unsubscribe();
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
      };
    }

    return () => {
      isMounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Initialize buzzer sound
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
    
    const channelName = `bhojan-sync-${resId}`;

    if (channelRef.current) {
      const existingChannel = channelRef.current;
      if (existingChannel.topic === `realtime:${channelName}` && 
          (existingChannel.state === 'joined' || existingChannel.state === 'joining')) {
        console.log("WAITER: Channel already active or connecting, skipping re-setup");
        return;
      }

      console.log("WAITER: Cleaning up old or broken channel...");
      await supabase.removeChannel(existingChannel);
      channelRef.current = null;
    }

    console.log(`WAITER: Initializing Sync Channel: ${channelName}...`);
    
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: true, ack: true },
      },
    });

    channel
      .on('broadcast', { event: 'refresh_waiter' }, (payload) => {
        console.log("WAITER: Broadcast Received", payload);
        const { type, tableNum } = payload.payload || {};
        if (type === 'COOKED' || type === 'PREPARING') {
          triggerNotification(tableNum, type);
        }
        fetchData(resId);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders'
      }, (payload: any) => {
        console.log("WAITER: DB Update Detected", payload.new);
        const newStatus = payload.new?.status;
        const tableId = payload.new?.table_id;

        setTables(currentTables => {
          const table = currentTables.find(t => t.id === tableId);
          const tableNum = table ? table.table_number : '??';

          if (newStatus === 'ready') {
            triggerNotification(tableNum, 'COOKED');
          } else if (newStatus === 'preparing') {
            triggerNotification(tableNum, 'PREPARING');
          }
          return currentTables;
        });

        fetchData(resId);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, () => fetchData(resId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => fetchData(resId))
      .subscribe((status, err) => {
        console.log(`WAITER REALTIME STATUS: ${status}`, err || '');
        setIsLive(status === 'SUBSCRIBED');
        
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error("WAITER REALTIME ERROR:", err);
          setTimeout(() => {
            if (channelRef.current === channel) {
              setupRealtime(resId);
            }
          }, 5000);
        }
      });

    channelRef.current = channel;
  }

  function triggerNotification(tableNum: string, type: 'COOKED' | 'PREPARING') {
    if (type === 'COOKED' && buzzerRef.current) {
      buzzerRef.current.currentTime = 0;
      buzzerRef.current.play().catch(e => console.log("Audio play blocked"));
    }
    setNotification({ table: tableNum, id: Math.random().toString(), type });
    setTimeout(() => setNotification(null), type === 'PREPARING' ? 2000 : 5000);
  }

  async function fetchInitialData(resId: string) {
    fetchRestaurant(resId);
    fetchData(resId);
  }

  async function fetchRestaurant(resId: string) {
    const { data } = await supabase.from("restaurants").select("*").eq("id", resId).single();
    setRestaurant(data);
  }

  async function fetchData(restaurantId: string) {
    const { data: tableData } = await supabase
      .from("tables")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("table_number", { ascending: true });

    const { data: orderData } = await supabase
      .from("orders")
      .select(`*, order_items(*, menu_items(*))`)
      .eq("restaurant_id", restaurantId)
      .not("status", "eq", "completed")
      .not("payment_status", "eq", "paid");

    const { data: menuData } = await supabase
      .from("menu_items")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .eq("is_available", true);

    const processedTables = tableData?.map(t => {
      const active = orderData?.find((o: any) => o.table_id === t.id);
      return { ...t, activeOrder: active };
    });

    if (menuData) {
      const cats = ["All", ...Array.from(new Set(menuData.map((m: any) => m.category)))];
      setCategories(cats);
    }

    setTables(processedTables || []);
    setMenu(menuData || []);
  }

  const handleTableClick = (table: any) => {
    setSelectedTable(table);
    if (table.activeOrder) {
      setCustomer({ name: table.activeOrder.customer_name, phone: table.activeOrder.customer_phone });
    } else {
      setCustomer({ name: '', phone: '' });
    }
    setCart([]);
    setActiveTab('menu');
  };

  const addToCart = (item: any) => {
    if (!selectedTable) return toast.error("Selection Required");
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, qty: 1 }];
    });
    setIsBucketPulsing(true);
    setTimeout(() => setIsBucketPulsing(false), 300);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
    toast.success("De-selected");
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === id);
      if (!existing) return prev;
      const newQty = existing.qty + delta;
      if (newQty <= 0) return prev.filter(i => i.id !== id);
      return prev.map(i => i.id === id ? { ...i, qty: newQty } : i);
    });
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setIsLoading(true);
    try {
      const newRoundTotal = cart.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);
      const activeOrder = selectedTable.activeOrder;
      if (activeOrder) {
        const orderItems = cart.map(item => ({
          order_id: activeOrder.id,
          menu_item_id: item.id,
          quantity: item.qty,
          unit_price: item.price,
          total_price: item.price * item.qty
        }));
        await supabase.from("order_items").insert(orderItems);
        await supabase.from("orders").update({
          status: 'pending',
          total_amount: (activeOrder.total_amount || 0) + newRoundTotal,
          grand_total: (activeOrder.grand_total || 0) + newRoundTotal,
          customer_name: customer.name || activeOrder.customer_name,
          customer_phone: customer.phone || activeOrder.customer_phone
        }).eq("id", activeOrder.id);
      } else {
        const { data: order, error: orderError } = await supabase.from("orders").insert([{
          restaurant_id: profile.restaurant_id,
          table_id: selectedTable.id,
          waiter_id: profile.id?.includes('staff_') ? null : profile.id,
          customer_name: customer.name || "GUEST ASSET",
          customer_phone: customer.phone || "",
          status: 'pending',
          payment_status: 'unpaid',
          total_amount: newRoundTotal,
          grand_total: newRoundTotal
        }]).select().single();
        if (orderError) throw orderError;
        const orderItems = cart.map(item => ({
          order_id: order.id,
          menu_item_id: item.id,
          quantity: item.qty,
          unit_price: item.price,
          total_price: item.price * item.qty
        }));
        await supabase.from("order_items").insert(orderItems);
        await supabase.from("tables").update({ status: 'occupied' }).eq("id", selectedTable.id);
      }
      toast.success("Order Synchronized");

      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'refresh_kitchen',
          payload: { type: 'NEW_ORDER' }
        });
      }

      setCart([]);
      setSelectedTable(null);
      setActiveTab('tables');
      fetchData(profile.restaurant_id);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalCheckout = async () => {
    if (!selectedTable?.activeOrder) return;
    setIsProcessingPayment(true);
    try {
      const subtotal = selectedTable.activeOrder.total_amount || 0;
      const cgst = (subtotal * (restaurant?.cgst_percent || 2.5)) / 100;
      const sgst = (subtotal * (restaurant?.sgst_percent || 2.5)) / 100;
      const service = (subtotal * (restaurant?.service_charge_percent || 5)) / 100;
      const grandTotal = subtotal + cgst + sgst + service;

      const { error: orderError } = await supabase.from("orders").update({
        status: 'completed',
        payment_status: 'paid',
        grand_total: grandTotal,
        customer_email: customerEmail,
        settled_by: `STAFF: ${profile?.full_name || 'SYSTEM'}`,
        settled_at: new Date().toISOString()
      }).eq("id", selectedTable.activeOrder.id);

      if (orderError) throw orderError;

      await supabase.from("tables").update({ status: 'available' }).eq("id", selectedTable.id);

      if (customerEmail) {
        await sendReceiptEmail({
          email: customerEmail,
          orderId: selectedTable.activeOrder.id,
          customerName: customer.name || "GUEST",
          items: selectedTable.activeOrder.order_items,
          total: grandTotal,
          restaurantName: restaurant?.name || "BHOJAN"
        });
        toast.success("Receipt Transmission Success");
      }

      toast.success("Transaction Complete");
      setIsCheckoutOpen(false);
      setSelectedTable(null);
      setActiveTab('tables');
      fetchData(profile.restaurant_id);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleDownloadReceipt = () => {
    if (!selectedTable?.activeOrder) return;
    const order = selectedTable.activeOrder;
    const subtotal = order.total_amount || 0;
    const cgst = (subtotal * (restaurant?.cgst_percent || 2.5)) / 100;
    const sgst = (subtotal * (restaurant?.sgst_percent || 2.5)) / 100;
    const service = (subtotal * (restaurant?.service_charge_percent || 5)) / 100;
    const grandTotal = subtotal + cgst + sgst + service;

    generateReceipt({
      id: order.id,
      customer_name: customer.name || "Guest",
      customer_phone: customer.phone || "",
      table_number: selectedTable.table_number,
      items: order.order_items,
      subtotal: subtotal,
      cgst: cgst,
      sgst: sgst,
      serviceCharge: service,
      total: grandTotal
    }, restaurant);
    toast.success("Receipt Generated");
  };

  const filteredMenu = selectedCategory === "All" ? menu : menu.filter(item => item.category === selectedCategory);
  const activeOrders = tables.filter(t => t.activeOrder);

  return (
    <div className="w-full flex flex-col h-[calc(100vh-40px)] relative overflow-hidden bg-white rounded-[40px] border border-slate-200 shadow-[0_10px_50px_rgba(0,0,0,0.05)]">
      
      {/* Dynamic Background Elements - Light Edition */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#ff5a2c]/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-slate-100/50 blur-[100px] rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      {/* Connection Status Badge - Professional Light */}
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "absolute top-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3 border shadow-xl backdrop-blur-md transition-all duration-500",
            isLive ? 'bg-white border-emerald-100 text-emerald-600' : 'bg-red-50 border-red-100 text-red-500'
          )}
        >
          <div className={cn("w-2 h-2 rounded-full", isLive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-red-500 animate-ping')} />
          {isLive ? 'SYSTEM SYNCHRONIZED' : 'CONNECTION OFFLINE'}
        </motion.div>
      </AnimatePresence>

      {/* Notifications - High Impact Light */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center p-8 bg-white/20 backdrop-blur-sm"
          >
            <div className={cn(
              "backdrop-blur-3xl border-8 p-12 md:p-24 rounded-[80px] flex flex-col items-center gap-8 shadow-[0_40px_100px_rgba(0,0,0,0.1)] relative overflow-hidden",
              notification.type === 'COOKED' ? 'bg-emerald-50 border-emerald-200' : 'bg-[#ff5a2c]/5 border-[#ff5a2c]/20'
            )}>
              <div className="text-9xl md:text-[14rem] animate-bounce filter drop-shadow-2xl">
                {notification.type === 'COOKED' ? '🍲' : '🍳'}
              </div>
              <div className="text-center relative z-10">
                <h2 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter text-slate-900 leading-none mb-4">
                  {notification.type === 'COOKED' ? 'ORDER READY' : 'PREPARING'}
                </h2>
                <div className="inline-flex items-center gap-4 px-10 py-4 bg-slate-900 rounded-[32px] text-2xl md:text-3xl font-black uppercase tracking-[0.2em] text-white italic shadow-2xl">
                  STATION T-{notification.table}
                </div>
              </div>
              <div className="absolute inset-0 bg-white/40 animate-pulse mix-blend-overlay" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="px-8 md:px-16 py-10 md:py-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-slate-100 shrink-0 relative z-10">
        <div className="flex items-center gap-8">
          {selectedTable ? (
            <button 
              onClick={() => setSelectedTable(null)} 
              className="h-16 w-16 rounded-[28px] bg-white border border-slate-200 flex items-center justify-center hover:bg-[#ff5a2c] hover:text-white transition-all active:scale-95 shadow-lg group"
            >
              <ChevronLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
            </button>
          ) : (
            <div className="h-16 w-16 rounded-[28px] bg-[#ff5a2c] flex items-center justify-center shadow-[0_10px_30px_rgba(255,90,44,0.3)]">
               <ChefHat className="w-8 h-8 text-white" />
            </div>
          )}
          <div className="flex flex-col">
            <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase leading-none text-slate-900">
              {selectedTable ? (
                <>Station <span className="text-[#ff5a2c]">T-{selectedTable.table_number}</span></>
              ) : (
                <>Service <span className="text-[#ff5a2c]">Control</span></>
              )}
            </h1>
            <div className="flex items-center gap-3 mt-4">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
              <span className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 italic leading-none">OPERATOR: {profile?.full_name || 'SYSTEM GUEST'}</span>
            </div>
          </div>
        </div>

        <div className="flex bg-slate-50 p-2 rounded-[32px] border border-slate-200 w-full lg:w-auto overflow-x-auto no-scrollbar shadow-sm">
          {(['tables', 'menu', 'orders'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab !== 'menu') setSelectedTable(null);
              }}
              className={cn(
                "px-10 md:px-14 py-4 rounded-[24px] text-[11px] font-black uppercase tracking-[0.2em] transition-all flex-1 md:flex-none whitespace-nowrap relative overflow-hidden group",
                activeTab === tab ? 'bg-white text-slate-900 shadow-xl scale-105 border border-slate-100' : 'text-slate-400 hover:text-slate-900'
              )}
            >
              <span className="relative z-10">{tab}</span>
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 p-8 md:p-16 overflow-hidden flex flex-col relative z-10">
        <AnimatePresence mode="wait">
          {activeTab === 'tables' && (
            <motion.div 
              key="tables-grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col"
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-6 md:gap-10 overflow-y-auto pr-4 custom-scrollbar no-scrollbar">
                {tables.map((table) => {
                  const status = table.activeOrder?.status;
                  const isReady = status === 'ready';
                  const isOccupied = table.status === 'occupied';
                  return (
                    <motion.button
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      key={table.id}
                      onClick={() => handleTableClick(table)}
                      className={cn(
                        "relative aspect-square rounded-[48px] md:rounded-[64px] border-4 transition-all duration-500 flex flex-col items-center justify-center gap-2 group shadow-lg",
                        isOccupied
                          ? isReady
                            ? 'border-emerald-100 bg-emerald-50/50 shadow-emerald-500/10'
                            : 'border-[#ff5a2c]/20 bg-[#ff5a2c]/5 shadow-[#ff5a2c]/10'
                          : 'border-slate-50 bg-white hover:border-[#ff5a2c]/30 hover:shadow-2xl'
                      )}
                    >
                      {isOccupied && (
                        <div className="absolute top-6 right-6">
                          {isReady ? (
                            <Bell className="w-8 h-8 text-emerald-500 animate-bounce" />
                          ) : (
                            <Flame className="w-8 h-8 text-[#ff5a2c] animate-pulse" />
                          )}
                        </div>
                      )}
                      
                      <span className={cn(
                        "text-5xl md:text-7xl font-black italic tracking-tighter transition-all duration-500 leading-none",
                        isOccupied ? 'text-slate-900' : 'text-slate-200 group-hover:text-[#ff5a2c]'
                      )}>
                        {table.table_number}
                      </span>
                      
                      <div className="flex flex-col items-center gap-1 mt-2">
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-[0.3em] italic",
                          isOccupied ? (isReady ? 'text-emerald-600' : 'text-[#ff5a2c]') : 'text-slate-300'
                        )}>
                          {table.status}
                        </span>
                        {isOccupied && (
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[100px]">{table.activeOrder.customer_name}</span>
                        )}
                      </div>

                      <div className={cn(
                        "absolute bottom-0 left-1/4 right-1/4 h-1.5 rounded-full transition-all duration-500 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100",
                        isOccupied ? (isReady ? 'bg-emerald-500' : 'bg-[#ff5a2c]') : 'bg-[#ff5a2c]/30'
                      )} />
                    </motion.button>
                  );
                })}
              </div>

              {/* Install PWA Widget - Professional Light */}
              <div className="mt-16 p-12 rounded-[64px] bg-slate-50 border border-slate-100 flex flex-col md:flex-row items-center gap-12 max-w-5xl shadow-sm relative overflow-hidden group">
                <div className="w-24 h-24 rounded-[32px] bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-xl">
                   <Smartphone className="w-10 h-10 text-[#ff5a2c]" />
                </div>
                
                <div className="flex-1 text-center md:text-left">
                   <h3 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 leading-tight">Sync Your Workflow</h3>
                   <p className="text-base font-medium text-slate-500 mt-3 italic">Install the service terminal as a standalone app for maximum performance.</p>
                </div>

                <div className="grid grid-cols-2 gap-6 w-full md:w-auto shrink-0">
                   <div className="px-8 py-6 rounded-[32px] bg-white border border-slate-100 flex flex-col gap-2 hover:shadow-xl transition-all">
                      <span className="text-[11px] font-black text-slate-900 uppercase italic tracking-widest leading-none">iOS PLATFORM</span>
                      <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest leading-none">Share → Home Screen</span>
                   </div>
                   <div className="px-8 py-6 rounded-[32px] bg-white border border-slate-100 flex flex-col gap-2 hover:shadow-xl transition-all">
                      <span className="text-[11px] font-black text-slate-900 uppercase italic tracking-widest leading-none">ANDROID HUB</span>
                      <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest leading-none">Menu → Install App</span>
                   </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'menu' && (
            <motion.div 
              key="menu-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col lg:flex-row gap-12 flex-1 overflow-hidden relative h-full"
            >
              <div className="flex-1 flex flex-col gap-10 overflow-hidden h-full">
                <div className="flex items-center gap-4 shrink-0 overflow-x-auto no-scrollbar py-2">
                  <div className="p-1 bg-slate-100 rounded-full flex items-center gap-1">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={cn(
                          "px-10 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                          selectedCategory === cat 
                            ? 'bg-white text-slate-900 shadow-xl' 
                            : 'text-slate-400 hover:text-slate-600'
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 overflow-y-auto pr-6 pb-24 custom-scrollbar no-scrollbar">
                  {filteredMenu.map((item) => (
                    <motion.div
                      whileHover={{ scale: 1.02, shadow: "0 20px 40px rgba(0,0,0,0.05)" }}
                      whileTap={{ scale: 0.98 }}
                      key={item.id}
                      onClick={() => addToCart(item)}
                      className="bg-white border border-slate-100 rounded-[40px] p-6 flex items-center gap-6 relative group hover:border-[#ff5a2c]/40 transition-all duration-500 cursor-pointer shadow-sm"
                    >
                      <div className={cn(
                        "absolute top-6 right-6 w-2.5 h-2.5 rounded-full", 
                        item.is_veg ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]' : 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                      )} />
                      
                      <div className="w-20 h-20 rounded-[28px] bg-slate-50 border border-slate-100 flex-shrink-0 flex items-center justify-center text-3xl font-black text-[#ff5a2c] uppercase italic shadow-sm group-hover:bg-[#ff5a2c]/5 transition-colors">
                        {item.name.charAt(0)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xl font-black uppercase italic tracking-tighter leading-tight text-slate-900 group-hover:text-[#ff5a2c] transition-all mb-1">{item.name}</h4>
                        <div className="flex items-center gap-4">
                          <span className="text-2xl font-black text-slate-900 italic tracking-tighter">₹{item.price}</span>
                          <div className="w-10 h-10 rounded-[14px] bg-[#ff5a2c]/5 flex items-center justify-center group-hover:bg-[#ff5a2c] group-hover:text-white transition-all border border-[#ff5a2c]/10">
                            <Plus className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Bucket Sidebar - White/Orange Masterpiece */}
              {selectedTable && (
                <div className="w-full lg:w-[450px] flex flex-col gap-6 h-[50vh] lg:h-full animate-in slide-in-from-right duration-700 pb-4 shrink-0">
                  <div className={cn(
                    "flex-1 bg-white rounded-[56px] lg:rounded-[80px] border-2 flex flex-col shadow-[0_30px_100px_rgba(0,0,0,0.08)] overflow-hidden transition-all duration-500 h-full relative",
                    isBucketPulsing ? 'border-[#ff5a2c] scale-[1.02]' : 'border-slate-50'
                  )}>
                    <div className="px-10 pt-12 pb-8 border-b border-slate-50 space-y-8 relative z-10">
                      <div className="flex items-center justify-between">
                         <div className="inline-flex items-center gap-3 px-6 py-3 bg-[#ff5a2c]/5 border border-[#ff5a2c]/10 rounded-full">
                            <ShoppingCart className="w-5 h-5 text-[#ff5a2c]" />
                            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-900 italic">CART TERMINAL</span>
                         </div>
                         <div className="text-xl font-black text-[#ff5a2c] uppercase tracking-tighter italic">T-{selectedTable.table_number}</div>
                      </div>

                      <div className="space-y-4">
                        <div className="relative group">
                          <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[#ff5a2c] transition-colors" />
                          <input
                            type="text"
                            placeholder="CUSTOMER IDENTITY"
                            value={customer.name}
                            onChange={(e) => setCustomer(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-100 rounded-[24px] pl-16 pr-6 py-5 text-[11px] font-black tracking-[0.2em] text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-[#ff5a2c] outline-none transition-all uppercase italic"
                          />
                        </div>
                        <div className="relative group">
                          <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[#ff5a2c] transition-colors" />
                          <input
                            type="text"
                            placeholder="CONTACT FREQUENCY"
                            value={customer.phone}
                            onChange={(e) => setCustomer(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-100 rounded-[24px] pl-16 pr-6 py-5 text-[11px] font-black tracking-[0.2em] text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-[#ff5a2c] outline-none transition-all uppercase"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-10 py-8 space-y-6 custom-scrollbar no-scrollbar relative z-10">
                      {cart.length === 0 && !selectedTable.activeOrder && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-100 gap-6">
                           <UtensilsCrossed size={80} />
                           <p className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-300 italic">Station standby</p>
                        </div>
                      )}

                      {cart.map((item) => (
                        <div key={item.id} className="flex items-center justify-between group/item">
                          <div className="flex-1 min-w-0 pr-4">
                            <p className="font-black uppercase italic text-xl text-slate-900 leading-none truncate group-hover/item:text-[#ff5a2c] transition-colors">{item.name}</p>
                            <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest leading-none italic">RATE: ₹{item.price}</p>
                          </div>
                          <div className="flex items-center gap-4 bg-slate-50 rounded-[28px] p-2.5 border border-slate-100 shadow-sm">
                            <button onClick={() => updateQty(item.id, -1)} className="w-10 h-10 flex items-center justify-center hover:text-red-500 transition-colors"><Minus className="w-4 h-4" /></button>
                            <span className="font-black text-slate-900 text-xl tracking-tighter min-w-[25px] text-center italic">{item.qty}</span>
                            <button onClick={() => updateQty(item.id, 1)} className="w-10 h-10 flex items-center justify-center hover:text-[#ff5a2c] transition-colors"><Plus className="w-4 h-4" /></button>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="ml-5 text-slate-200 hover:text-red-500 transition-all active:scale-90"><Trash2 className="w-6 h-6" /></button>
                        </div>
                      ))}

                      {selectedTable.activeOrder && (
                        <div className="pt-10 border-t border-slate-50 space-y-6">
                          <div className="inline-flex items-center gap-3 text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] italic">
                             <Clock size={12} className="text-[#ff5a2c]" /> ACTIVE LOG
                          </div>
                          <div className="space-y-4">
                            {selectedTable.activeOrder.order_items.map((item: any) => (
                              <div key={item.id} className="flex justify-between items-center text-sm font-black uppercase italic tracking-tight">
                                <span className="text-slate-500 truncate max-w-[200px]">{item.quantity}x {item.menu_items?.name}</span>
                                <span className="text-slate-900">₹{item.total_price}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="px-12 py-12 bg-slate-50 border-t border-slate-100 space-y-8 relative z-10">
                      <div className="flex justify-between items-end">
                        <div className="space-y-2">
                          <p className="text-[12px] font-black text-[#ff5a2c] uppercase tracking-[0.4em] italic leading-none">Grand Valuation</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none italic">Operational Net</p>
                        </div>
                        <p className="text-6xl lg:text-7xl font-black text-slate-900 italic tracking-tighter leading-none">₹{cart.reduce((acc, curr) => acc + (curr.price * curr.qty), selectedTable.activeOrder?.total_amount || 0)}</p>
                      </div>
                      <div className="flex flex-col gap-5">
                        <Button 
                          onClick={handlePlaceOrder} 
                          disabled={isLoading || cart.length === 0} 
                          className="w-full h-24 rounded-[32px] bg-[#ff5a2c] text-white font-black uppercase tracking-[0.3em] text-[13px] shadow-[0_20px_40px_rgba(255,90,44,0.3)] hover:bg-[#ea580c] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 italic"
                        >
                          {isLoading ? <Loader2 className="animate-spin" /> : <><Send size={22} /> TRANSMIT SEQUENCE</>}
                        </Button>
                        {selectedTable.activeOrder && (
                          <Button 
                            onClick={() => setIsCheckoutOpen(true)} 
                            className="w-full h-16 rounded-[28px] bg-white text-slate-900 font-black uppercase text-[11px] tracking-[0.3em] border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center gap-4 italic shadow-sm"
                          >
                            <CreditCard size={22} className="text-[#ff5a2c]" /> PROCESS PAYLINK
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'orders' && (
            <motion.div 
              key="orders-log"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex-1 flex flex-col gap-10 overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-10 md:gap-14 overflow-y-auto pr-6 pb-24 custom-scrollbar no-scrollbar">
                {activeOrders.length === 0 && (
                  <div className="col-span-full h-[60vh] flex flex-col items-center justify-center space-y-10">
                    <div className="w-32 h-32 bg-slate-50 rounded-[48px] flex items-center justify-center border border-slate-100">
                      <UtensilsCrossed className="w-16 h-16 text-slate-200" />
                    </div>
                    <div className="text-center space-y-4">
                      <p className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Sector Standby</p>
                      <p className="text-[12px] font-black text-slate-300 uppercase tracking-[0.5em] italic">No operational units detected</p>
                    </div>
                  </div>
                )}
                {activeOrders.map(table => (
                  <motion.div 
                    whileHover={{ y: -12, shadow: "0 40px 80px rgba(0,0,0,0.1)" }}
                    key={table.id} 
                    className="bg-white border border-slate-100 rounded-[64px] p-12 flex flex-col gap-10 transition-all group shadow-sm relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-48 h-48 bg-[#ff5a2c]/5 blur-[80px] rounded-full -translate-y-24 translate-x-24" />
                    
                    <div className="flex justify-between items-start relative z-10">
                      <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-[32px] bg-slate-50 border border-slate-100 flex items-center justify-center text-5xl font-black text-slate-900 italic shadow-sm group-hover:text-[#ff5a2c] group-hover:bg-[#ff5a2c]/5 transition-all duration-500">
                          {table.table_number}
                        </div>
                        <div>
                          <h4 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 leading-none mb-3 truncate max-w-[180px]">{table.activeOrder.customer_name}</h4>
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3 italic">
                            <Clock className="w-5 h-5 text-[#ff5a2c]" /> {new Date(table.activeOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <div className={cn(
                        "px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-[0.2em] border-2 transition-all duration-500 italic",
                        table.activeOrder.status === 'ready' ? 'bg-emerald-50 border-emerald-100 text-emerald-600 shadow-lg shadow-emerald-500/10' : 'bg-orange-50 border-orange-100 text-[#ff5a2c] shadow-lg shadow-[#ff5a2c]/10'
                      )}>
                        {table.activeOrder.status}
                      </div>
                    </div>

                    <div className="space-y-6 flex-1 relative z-10">
                      <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em] italic mb-4">LOG SEQUENCE</p>
                      <div className="space-y-4">
                        {table.activeOrder.order_items.map((item: any) => (
                          <div key={item.id} className="flex justify-between items-center text-base font-black uppercase italic tracking-tight">
                            <span className="text-slate-500 leading-none">{item.quantity}x {item.menu_items?.name}</span>
                            <span className="text-slate-900 leading-none">₹{item.total_price}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-12 border-t border-slate-50 flex justify-between items-end relative z-10">
                      <div className="space-y-2">
                        <p className="text-[11px] font-black text-[#ff5a2c] uppercase tracking-widest italic leading-none">Aggregate</p>
                        <p className="text-6xl font-black text-slate-900 italic tracking-tighter leading-none mt-2">₹{table.activeOrder.total_amount}</p>
                      </div>
                      <button 
                        onClick={() => handleTableClick(table)} 
                        className="h-20 w-20 rounded-[32px] bg-slate-900 text-white hover:bg-[#ff5a2c] flex items-center justify-center transition-all shadow-2xl active:scale-90"
                      >
                        <ChevronRight className="w-10 h-10" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Checkout Terminal - High Definition Light UI */}
      <AnimatePresence>
        {isCheckoutOpen && selectedTable?.activeOrder && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 md:p-12 bg-white/60 backdrop-blur-3xl overflow-y-auto custom-scrollbar">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.05, y: 40 }}
              className="bg-white w-full max-w-7xl md:min-h-[800px] rounded-[80px] border border-slate-100 shadow-[0_50px_150px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col md:flex-row relative"
            >
              {/* Left Side: Summary Log */}
              <div className="flex-1 p-16 md:p-24 overflow-y-auto space-y-12 border-r border-slate-50 relative z-10 custom-scrollbar no-scrollbar">
                <div className="flex justify-between items-start">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-4 px-6 py-3 bg-slate-50 border border-slate-100 rounded-full text-[11px] font-black text-slate-900 uppercase tracking-[0.5em] italic">
                       SETTLEMENT-PROTOCOL
                    </div>
                    <h3 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Order <span className="text-slate-200">Receipt</span></h3>
                    <div className="flex items-center gap-6 mt-6">
                       <span className="px-5 py-2 bg-[#ff5a2c] text-white text-[12px] font-black rounded-full italic">STATION T-{selectedTable.table_number}</span>
                       <span className="text-slate-400 font-bold uppercase tracking-widest text-xs italic">{selectedTable.activeOrder.customer_name}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsCheckoutOpen(false)} 
                    className="w-20 h-20 rounded-[32px] bg-slate-50 border border-slate-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-90"
                  >
                    <X className="w-10 h-10" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Button
                    onClick={handleDownloadReceipt}
                    className="w-full h-16 rounded-[28px] bg-slate-900 text-white font-black uppercase text-[12px] tracking-[0.3em] hover:bg-[#ff5a2c] transition-all flex items-center justify-center gap-5 italic"
                  >
                    <Download className="w-6 h-6" /> Export Resource (PDF)
                  </Button>
                  <Button
                    className="w-full h-16 rounded-[28px] bg-slate-50 text-slate-900 font-black uppercase text-[12px] tracking-[0.3em] border border-slate-100 hover:bg-slate-100 transition-all flex items-center justify-center gap-5 italic"
                  >
                    <Printer className="w-6 h-6" /> Print Hardcopy
                  </Button>
                </div>

                <div className="space-y-8">
                  <p className="text-[12px] font-black text-slate-300 uppercase tracking-[0.6em] italic border-b border-slate-50 pb-6">SEQUENCE AUDIT LOG</p>
                  <div className="space-y-6">
                    {selectedTable.activeOrder.order_items.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center font-black uppercase italic text-2xl tracking-tighter group transition-all">
                        <span className="text-slate-400 group-hover:text-slate-900">{item.quantity}x {item.menu_items?.name}</span>
                        <span className="text-slate-900">₹{item.total_price}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-12 border-t border-slate-100 space-y-8 bg-slate-50/50 p-12 rounded-[56px]">
                  {(() => {
                    const subtotal = selectedTable.activeOrder.total_amount || 0;
                    const cgst = (subtotal * (restaurant?.cgst_percent || 2.5)) / 100;
                    const sgst = (subtotal * (restaurant?.sgst_percent || 2.5)) / 100;
                    const service = (subtotal * (restaurant?.service_charge_percent || 5)) / 100;
                    const grandTotal = subtotal + cgst + sgst + service;
                    return (
                      <div className="space-y-6">
                        <div className="flex justify-between text-sm font-black text-slate-400 uppercase tracking-[0.4em] italic"><span>Subtotal Asset</span><span>₹{subtotal.toFixed(2)}</span></div>
                        <div className="flex justify-between text-sm font-black text-slate-400 uppercase tracking-[0.4em] italic"><span>State Levies (GST)</span><span>₹{(cgst + sgst).toFixed(2)}</span></div>
                        <div className="flex justify-between text-sm font-black text-slate-400 uppercase tracking-[0.4em] italic"><span>Service Charges</span><span>₹{service.toFixed(2)}</span></div>
                        <div className="flex justify-between items-end pt-12 border-t border-slate-200 mt-8">
                          <div className="space-y-3">
                            <span className="text-3xl font-black text-[#ff5a2c] italic uppercase tracking-tighter leading-none block">Grand Valuation</span>
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] italic">Operational Clearance Final</span>
                          </div>
                          <span className="text-7xl md:text-9xl font-black italic tracking-tighter text-slate-900 leading-none">₹{grandTotal.toFixed(0)}</span>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>

              {/* Right Side: Payment Matrix */}
              <div className="w-full md:w-[550px] bg-slate-50/30 p-16 md:p-24 flex flex-col justify-between items-center relative z-10 shrink-0">
                <div className="space-y-16 w-full relative z-10">
                  <div className="text-center space-y-6">
                    <div className="w-24 h-24 bg-white border border-slate-100 rounded-[36px] flex items-center justify-center mx-auto mb-8 text-[#ff5a2c] shadow-2xl">
                       <CreditCard size={48} />
                    </div>
                    <p className="text-[14px] font-black uppercase tracking-[0.7em] text-[#ff5a2c] italic">Paylink Gateway</p>
                    <h4 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Terminal Active</h4>
                  </div>

                  <div className="w-full aspect-square bg-white rounded-[72px] p-12 flex items-center justify-center shadow-2xl relative group transition-all duration-700 hover:rotate-1 hover:scale-[1.03]">
                    {restaurant?.merchant_qr_url ? (
                      <img src={restaurant.merchant_qr_url} className="w-full h-full object-contain filter grayscale hover:grayscale-0 transition-all duration-700" alt="QR" />
                    ) : (
                      <div className="flex flex-col items-center gap-6 opacity-10">
                         <QrCode className="w-32 h-32 text-black" />
                         <span className="text-[12px] font-black uppercase tracking-widest text-black">NO GATEWAY DETECTED</span>
                      </div>
                    )}
                    {/* Corners */}
                    <div className="absolute top-10 left-10 w-16 h-16 border-t-8 border-l-8 border-[#ff5a2c]/20 rounded-tl-[40px]" />
                    <div className="absolute bottom-10 right-10 w-16 h-16 border-b-8 border-r-8 border-[#ff5a2c]/20 rounded-br-[40px]" />
                  </div>

                  <div className="space-y-6">
                    <label className="text-[12px] font-black uppercase tracking-[0.5em] text-[#ff5a2c] italic ml-3">Digital Forwarding</label>
                    <div className="relative group">
                      <Mail className="absolute left-8 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-[#ff5a2c] transition-colors" />
                      <input
                        placeholder="RECIPIENT EMAIL ADDRESS"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full bg-white border border-slate-100 rounded-[32px] pl-20 pr-10 py-7 text-[12px] font-black uppercase tracking-[0.2em] text-slate-900 placeholder:text-slate-200 focus:border-[#ff5a2c] outline-none transition-all italic shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="w-full pt-16 relative z-10">
                  <Button 
                    onClick={handleFinalCheckout} 
                    disabled={isProcessingPayment} 
                    className="w-full h-28 rounded-[40px] bg-[#ff5a2c] text-white font-black uppercase tracking-[0.4em] text-[14px] shadow-[0_25px_60px_rgba(255,90,44,0.4)] hover:bg-[#ea580c] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-6 italic"
                  >
                    {isProcessingPayment ? <Loader2 className="animate-spin w-10 h-10" /> : <><Zap size={32} /> Authorize Transaction</>}
                  </Button>
                  <p className="text-center text-[10px] font-bold text-slate-300 mt-8 uppercase tracking-[0.6em] italic leading-none">Authentication sequence required</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
