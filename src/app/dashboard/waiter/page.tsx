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
  ChevronLeft
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
    const staffSessionStr = localStorage.getItem("staff_session");
    if (staffSessionStr) {
      const staff = JSON.parse(staffSessionStr);
      setProfile(staff);
      fetchInitialData(staff.restaurant_id);
      setupRealtime(staff.restaurant_id);
    } else {
      const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
        if (user) getProfile(user.uid);
      });
      return () => {
        unsubscribe();
        if (channelRef.current) supabase.removeChannel(channelRef.current);
      };
    }
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

    // If we already have a healthy channel for this ID, don't recreate it
    if (channelRef.current) {
      if (channelRef.current.topic === `realtime:${channelName}` && 
          (channelRef.current.state === 'joined' || channelRef.current.state === 'joining')) {
        console.log("WAITER: Channel already active or connecting, skipping re-setup");
        return;
      }

      console.log("WAITER: Cleaning up old or broken channel...");
      supabase.removeChannel(channelRef.current);
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
          // Try to recover after a delay
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

      // Broadcast to Kitchen
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
    <div className="w-full flex flex-col h-[calc(100vh-40px)] relative overflow-hidden bg-[#05070a] rounded-[40px] border border-white/5 shadow-[0_0_80px_rgba(0,0,0,0.5)]">
      
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#ff5a2c]/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/5 blur-[100px] rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      {/* Connection Status Badge */}
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "absolute top-8 left-1/2 -translate-x-1/2 z-[100] px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 border shadow-2xl backdrop-blur-xl transition-all duration-500",
            isLive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-500'
          )}
        >
          <div className={cn("w-2 h-2 rounded-full", isLive ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]' : 'bg-red-500 animate-ping')} />
          {isLive ? 'SYSTEM SYNCHRONIZED' : 'SYNC DISCONNECTED'}
        </motion.div>
      </AnimatePresence>

      {/* Cooking/Preparing Notification Animation */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center p-8"
          >
            <div className={cn(
              "backdrop-blur-2xl border-4 p-12 md:p-20 rounded-[64px] flex flex-col items-center gap-8 shadow-[0_0_150px_rgba(0,0,0,0.5)] relative overflow-hidden",
              notification.type === 'COOKED' ? 'bg-emerald-500/90 border-emerald-400/30' : 'bg-[#ff5a2c]/90 border-orange-400/30'
            )}>
              <div className="text-9xl md:text-[12rem] animate-bounce filter drop-shadow-2xl">
                {notification.type === 'COOKED' ? '🍳' : '🔥'}
              </div>
              <div className="text-center relative z-10">
                <h2 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter text-black leading-none mb-4">
                  {notification.type === 'COOKED' ? 'ORDER READY' : 'PREPARING'}
                </h2>
                <div className="inline-flex items-center gap-4 px-8 py-3 bg-black rounded-full text-2xl md:text-3xl font-black uppercase tracking-[0.2em] text-white italic">
                  STATION T-{notification.table}
                </div>
              </div>
              {/* Radial pulse animation */}
              <div className="absolute inset-0 bg-white/20 animate-pulse mix-blend-overlay" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="px-8 md:px-16 py-8 md:py-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-white/[0.03] shrink-0 relative z-10">
        <div className="flex items-center gap-8">
          {selectedTable ? (
            <button 
              onClick={() => setSelectedTable(null)} 
              className="h-16 w-16 rounded-[24px] bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#ff5a2c] hover:text-white transition-all active:scale-90 shadow-xl"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          ) : (
            <div className="h-16 w-16 rounded-[24px] bg-[#ff5a2c] flex items-center justify-center shadow-[0_0_30px_rgba(255,90,44,0.3)]">
               <ChefHat className="w-8 h-8 text-white" />
            </div>
          )}
          <div className="flex flex-col">
            <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase leading-none text-white">
              {selectedTable ? `Station <span className="text-[#ff5a2c]">T-${selectedTable.table_number}</span>` : 'Service <span className="text-[#ff5a2c]">Control</span>'}
            </h1>
            <div className="flex items-center gap-3 mt-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 italic leading-none">Operator: {profile?.full_name || 'System Guest'}</span>
            </div>
          </div>
        </div>

        <div className="flex bg-white/5 p-2 rounded-[28px] border border-white/10 w-full lg:w-auto overflow-x-auto no-scrollbar shadow-2xl backdrop-blur-md">
          {(['tables', 'menu', 'orders'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab !== 'menu') setSelectedTable(null);
              }}
              className={cn(
                "px-8 md:px-12 py-4 rounded-[20px] text-[11px] font-black uppercase tracking-[0.2em] transition-all flex-1 md:flex-none whitespace-nowrap relative overflow-hidden group",
                activeTab === tab ? 'bg-white text-black shadow-2xl scale-105' : 'text-slate-500 hover:text-white'
              )}
            >
              <span className="relative z-10">{tab}</span>
              {activeTab === tab && (
                <div className="absolute inset-0 bg-gradient-to-tr from-white to-slate-200" />
              )}
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
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-6 md:gap-8 overflow-y-auto pr-4 custom-scrollbar no-scrollbar">
                {tables.map((table) => {
                  const status = table.activeOrder?.status;
                  const isReady = status === 'ready';
                  const isOccupied = table.status === 'occupied';
                  return (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      key={table.id}
                      onClick={() => handleTableClick(table)}
                      className={cn(
                        "relative aspect-square rounded-[40px] md:rounded-[56px] border-4 transition-all duration-500 flex flex-col items-center justify-center gap-2 group shadow-2xl overflow-hidden",
                        isOccupied
                          ? isReady
                            ? 'border-emerald-500/40 bg-emerald-500/5 shadow-[0_0_50px_rgba(16,185,129,0.1)]'
                            : 'border-[#ff5a2c]/40 bg-[#ff5a2c]/5 shadow-[0_0_50px_rgba(255,90,44,0.1)]'
                          : 'border-white/5 bg-white/[0.02] hover:border-[#ff5a2c]/50 hover:bg-[#ff5a2c]/5'
                      )}
                    >
                      {/* Background Pattern */}
                      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                         <div className="absolute inset-0 bg-grid-white/[0.2]" />
                      </div>

                      {isOccupied && (
                        <div className="absolute top-6 right-6">
                          {isReady ? (
                            <div className="relative">
                              <Bell className="w-8 h-8 text-emerald-400 animate-bounce" />
                              <div className="absolute inset-0 bg-emerald-400/20 blur-xl animate-pulse rounded-full" />
                            </div>
                          ) : (
                            <div className="relative">
                              <Flame className="w-8 h-8 text-[#ff5a2c] animate-pulse" />
                              <div className="absolute inset-0 bg-[#ff5a2c]/20 blur-xl animate-pulse rounded-full" />
                            </div>
                          )}
                        </div>
                      )}
                      
                      <span className={cn(
                        "text-5xl md:text-6xl font-black italic tracking-tighter transition-all duration-500 leading-none",
                        isOccupied ? 'text-white' : 'text-slate-800 group-hover:text-[#ff5a2c]'
                      )}>
                        {table.table_number}
                      </span>
                      
                      <div className="flex flex-col items-center gap-1">
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-[0.3em] italic",
                          isOccupied ? (isReady ? 'text-emerald-400' : 'text-[#ff5a2c]') : 'text-slate-800'
                        )}>
                          {table.status}
                        </span>
                        {isOccupied && (
                          <span className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">{table.activeOrder.customer_name}</span>
                        )}
                      </div>

                      {/* Status indicator bar */}
                      <div className={cn(
                        "absolute bottom-0 left-0 right-0 h-2 transition-all duration-500",
                        isOccupied ? (isReady ? 'bg-emerald-400' : 'bg-[#ff5a2c]') : 'bg-transparent group-hover:bg-[#ff5a2c]/30'
                      )} />
                    </motion.button>
                  );
                })}
              </div>

              {/* Install PWA Widget - Enhanced */}
              <div className="mt-16 p-10 rounded-[56px] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 flex flex-col md:flex-row items-center gap-10 max-w-4xl shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff5a2c]/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-[#ff5a2c]/10 transition-all duration-700" />
                
                <div className="w-24 h-24 rounded-[32px] bg-white/[0.03] border border-white/10 flex items-center justify-center shrink-0 shadow-2xl">
                   <Smartphone className="w-10 h-10 text-[#ff5a2c]" />
                </div>
                
                <div className="flex-1 text-center md:text-left">
                   <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white leading-tight">Install Station Hub</h3>
                   <p className="text-sm font-medium text-slate-500 mt-2">Access the service terminal directly from your home screen for zero-latency operations.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                   <div className="px-6 py-5 rounded-[28px] bg-white/[0.02] border border-white/5 flex flex-col gap-2 hover:bg-white/[0.05] transition-all">
                      <span className="text-[10px] font-black text-white uppercase italic tracking-widest leading-none">iOS / Safari</span>
                      <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest leading-none">Share → Add to Home</span>
                   </div>
                   <div className="px-6 py-5 rounded-[28px] bg-white/[0.02] border border-white/5 flex flex-col gap-2 hover:bg-white/[0.05] transition-all">
                      <span className="text-[10px] font-black text-white uppercase italic tracking-widest leading-none">Android</span>
                      <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest leading-none">Menu → Install App</span>
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
              {/* Menu Section */}
              <div className="flex-1 flex flex-col gap-8 overflow-hidden h-full">
                <div className="flex items-center gap-4 shrink-0 overflow-x-auto no-scrollbar py-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "px-8 py-4 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap relative overflow-hidden",
                        selectedCategory === cat 
                          ? 'bg-[#ff5a2c] text-white border-[#ff5a2c] shadow-[0_0_30px_rgba(255,90,44,0.3)] scale-105' 
                          : 'bg-white/5 text-slate-600 border-white/5 hover:text-white'
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto pr-4 pb-20 custom-scrollbar no-scrollbar">
                  {filteredMenu.map((item) => (
                    <motion.div
                      whileHover={{ y: -5 }}
                      whileTap={{ scale: 0.98 }}
                      key={item.id}
                      onClick={() => addToCart(item)}
                      className="bg-white/[0.02] border border-white/[0.03] rounded-[36px] p-5 flex items-center gap-6 relative group hover:border-[#ff5a2c]/50 hover:bg-[#ff5a2c]/5 transition-all duration-500 cursor-pointer shadow-2xl"
                    >
                      <div className={cn(
                        "absolute top-5 right-5 w-2 h-2 rounded-full", 
                        item.is_veg ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                      )} />
                      
                      <div className="w-16 h-16 rounded-[24px] bg-white/5 border border-white/5 flex-shrink-0 flex items-center justify-center text-3xl font-black text-[#ff5a2c] uppercase italic shadow-2xl">
                        {item.name.charAt(0)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-black uppercase italic tracking-tighter leading-tight text-white group-hover:text-[#ff5a2c] transition-all mb-1">{item.name}</h4>
                        <div className="flex items-center gap-4">
                          <span className="text-2xl font-black text-white italic tracking-tighter">₹{item.price}</span>
                          <div className="w-8 h-8 rounded-[12px] bg-[#ff5a2c]/10 flex items-center justify-center group-hover:bg-[#ff5a2c] group-hover:text-white transition-all border border-[#ff5a2c]/20">
                            <Plus className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Bucket Section - Premium Sidebar */}
              {selectedTable && (
                <div className="w-full lg:w-[400px] flex flex-col gap-6 h-[50vh] lg:h-full animate-in slide-in-from-bottom lg:slide-in-from-right duration-700 pb-4 shrink-0">
                  <div className={cn(
                    "flex-1 bg-[#0b1118] rounded-[48px] lg:rounded-[64px] border-2 flex flex-col shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-500 h-full relative",
                    isBucketPulsing ? 'border-[#ff5a2c]/50 scale-[1.02] shadow-[#ff5a2c]/10' : 'border-white/5'
                  )}>
                    {/* Glass Overlay */}
                    <div className="absolute inset-0 bg-white/[0.01] pointer-events-none" />

                    <div className="px-8 pt-10 pb-6 border-b border-white/[0.03] space-y-6 relative z-10">
                      <div className="flex items-center justify-between">
                         <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
                            <ShoppingCart className="w-4 h-4 text-[#ff5a2c]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white italic">STATION-HUB</span>
                         </div>
                         <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">T-{selectedTable.table_number}</div>
                      </div>

                      <div className="space-y-4">
                        <div className="relative group">
                          <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-800 group-focus-within:text-[#ff5a2c] transition-colors" />
                          <input
                            type="text"
                            placeholder="CLIENT IDENTIFIER"
                            value={customer.name}
                            onChange={(e) => setCustomer(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full bg-black/40 border border-white/5 rounded-[20px] pl-14 pr-6 py-4 text-[10px] font-black tracking-[0.2em] text-white placeholder:text-slate-800 focus:border-[#ff5a2c]/50 outline-none transition-all uppercase italic"
                          />
                        </div>
                        <div className="relative group">
                          <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-800 group-focus-within:text-[#ff5a2c] transition-colors" />
                          <input
                            type="text"
                            placeholder="CONTACT SEQUENCE"
                            value={customer.phone}
                            onChange={(e) => setCustomer(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full bg-black/40 border border-white/5 rounded-[20px] pl-14 pr-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white placeholder:text-slate-800 focus:border-[#ff5a2c]/50 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-10 py-6 space-y-6 custom-scrollbar no-scrollbar relative z-10">
                      {cart.length === 0 && !selectedTable.activeOrder && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-800 gap-4 opacity-20">
                           <UtensilsCrossed size={64} />
                           <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">Bucket Standby</p>
                        </div>
                      )}

                      {cart.map((item) => (
                        <div key={item.id} className="flex items-center justify-between group/item">
                          <div className="flex-1 min-w-0 pr-4">
                            <p className="font-black uppercase italic text-lg text-white leading-none truncate group-hover/item:text-[#ff5a2c] transition-colors">{item.name}</p>
                            <p className="text-[8px] font-black text-slate-700 mt-1 uppercase tracking-widest leading-none italic">VAL: ₹{item.price}</p>
                          </div>
                          <div className="flex items-center gap-4 bg-black/60 rounded-[24px] p-2 border border-white/5 shadow-2xl">
                            <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 flex items-center justify-center hover:text-red-500 transition-colors"><Minus className="w-3.5 h-3.5" /></button>
                            <span className="font-black text-[#ff5a2c] text-lg tracking-tighter min-w-[20px] text-center italic">{item.qty}</span>
                            <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 flex items-center justify-center hover:text-[#ff5a2c] transition-colors"><Plus className="w-3.5 h-3.5" /></button>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="ml-4 text-red-500 opacity-20 hover:opacity-100 transition-all active:scale-90"><Trash2 className="w-5 h-5" /></button>
                        </div>
                      ))}

                      {selectedTable.activeOrder && (
                        <div className="pt-8 border-t border-white/[0.03] space-y-4">
                          <div className="inline-flex items-center gap-2 text-[9px] font-black text-slate-800 uppercase tracking-[0.3em] italic">
                             <Clock size={10} /> Live Sequence
                          </div>
                          <div className="space-y-3">
                            {selectedTable.activeOrder.order_items.map((item: any) => (
                              <div key={item.id} className="flex justify-between items-center text-[10px] font-black uppercase italic tracking-tight">
                                <span className="text-slate-600 truncate max-w-[180px]">{item.quantity}x {item.menu_items?.name}</span>
                                <span className="text-slate-800">₹{item.total_price}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="px-10 py-10 bg-black/60 border-t border-white/[0.03] space-y-6 relative z-10 shadow-[0_-20px_40px_rgba(0,0,0,0.4)]">
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-[#ff5a2c] uppercase tracking-[0.4em] italic leading-none">Aggregate Total</p>
                          <p className="text-[8px] font-black text-slate-800 uppercase tracking-widest leading-none">Net operational value</p>
                        </div>
                        <p className="text-5xl lg:text-6xl font-black text-white italic tracking-tighter leading-none shadow-2xl">₹{cart.reduce((acc, curr) => acc + (curr.price * curr.qty), selectedTable.activeOrder?.total_amount || 0)}</p>
                      </div>
                      <div className="flex flex-col gap-4">
                        <Button 
                          onClick={handlePlaceOrder} 
                          disabled={isLoading || cart.length === 0} 
                          className="w-full h-20 rounded-[28px] bg-[#ff5a2c] text-white font-black uppercase tracking-[0.2em] text-[11px] shadow-[0_0_30px_rgba(255,90,44,0.2)] hover:bg-[#ea580c] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                          {isLoading ? <Loader2 className="animate-spin" /> : <><Send size={18} /> Synchronize Order</>}
                        </Button>
                        {selectedTable.activeOrder && (
                          <Button 
                            onClick={() => setIsCheckoutOpen(true)} 
                            className="w-full h-14 rounded-[24px] bg-white text-black font-black uppercase text-[10px] tracking-[0.2em] border border-white/10 hover:bg-slate-100 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3 italic"
                          >
                            <CreditCard size={18} /> Process Checkout
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
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8 md:gap-12 overflow-y-auto pr-6 pb-20 custom-scrollbar no-scrollbar">
                {activeOrders.length === 0 && (
                  <div className="col-span-full h-[60vh] flex flex-col items-center justify-center space-y-10 opacity-30">
                    <div className="w-32 h-32 bg-white/5 rounded-[48px] flex items-center justify-center border border-white/10">
                      <UtensilsCrossed className="w-16 h-16 text-slate-700" />
                    </div>
                    <div className="text-center space-y-3">
                      <p className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none">No Operational Sequences</p>
                      <p className="text-[11px] font-black text-slate-800 uppercase tracking-[0.4em]">Service sector currently on standby</p>
                    </div>
                  </div>
                )}
                {activeOrders.map(table => (
                  <motion.div 
                    whileHover={{ y: -10 }}
                    key={table.id} 
                    className="bg-[#0b1118] border-2 border-white/[0.03] rounded-[56px] p-10 flex flex-col gap-10 hover:border-[#ff5a2c]/40 transition-all group shadow-[0_0_60px_rgba(0,0,0,0.5)] relative overflow-hidden"
                  >
                    {/* Background glow */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-[#ff5a2c]/5 blur-[60px] rounded-full -translate-y-20 translate-x-20 group-hover:bg-[#ff5a2c]/10 transition-all duration-700" />
                    
                    <div className="flex justify-between items-start relative z-10">
                      <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-[28px] bg-white/5 border border-white/10 flex items-center justify-center text-4xl font-black text-white italic shadow-2xl group-hover:text-[#ff5a2c] group-hover:border-[#ff5a2c]/20 transition-all duration-500">
                          {table.table_number}
                        </div>
                        <div>
                          <h4 className="text-2xl font-black uppercase italic tracking-tighter text-white leading-none mb-3 truncate max-w-[150px]">{table.activeOrder.customer_name}</h4>
                          <p className="text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-3 italic">
                            <Clock className="w-4 h-4 text-[#ff5a2c]" /> {new Date(table.activeOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <div className={cn(
                        "px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border-2 transition-all duration-500 italic",
                        table.activeOrder.status === 'ready' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-emerald-500/10' : 'bg-[#ff5a2c]/10 border-[#ff5a2c]/20 text-[#ff5a2c] shadow-[#ff5a2c]/10'
                      )}>
                        {table.activeOrder.status}
                      </div>
                    </div>

                    <div className="space-y-5 flex-1 relative z-10">
                      <p className="text-[10px] font-black text-slate-800 uppercase tracking-[0.3em] italic mb-2">Sequence Details</p>
                      <div className="space-y-4">
                        {table.activeOrder.order_items.map((item: any) => (
                          <div key={item.id} className="flex justify-between items-center text-sm font-black uppercase italic tracking-tight">
                            <span className="text-slate-500 leading-none">{item.quantity}x {item.menu_items?.name}</span>
                            <span className="text-slate-800 leading-none">₹{item.total_price}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-10 border-t border-white/[0.03] flex justify-between items-end relative z-10">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-[#ff5a2c] uppercase tracking-widest italic">Live Total</p>
                        <p className="text-5xl font-black text-white italic tracking-tighter leading-none shadow-2xl">₹{table.activeOrder.total_amount}</p>
                      </div>
                      <button 
                        onClick={() => handleTableClick(table)} 
                        className="h-16 w-16 rounded-[24px] bg-white/5 hover:bg-[#ff5a2c] hover:text-white border border-white/10 flex items-center justify-center transition-all shadow-2xl active:scale-90"
                      >
                        <ChevronRight className="w-8 h-8" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Settlement Modal (Enhanced ZapMenus UI) */}
      <AnimatePresence>
        {isCheckoutOpen && selectedTable?.activeOrder && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 md:p-12 bg-black/80 backdrop-blur-2xl overflow-y-auto custom-scrollbar">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.05, y: 40 }}
              className="bg-[#05070a] w-full max-w-6xl md:min-h-[700px] rounded-[64px] border border-white/10 shadow-[0_0_150px_rgba(0,0,0,1)] overflow-hidden flex flex-col md:flex-row relative"
            >
              {/* Dynamic light effects */}
              <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-[#ff5a2c]/5 blur-[100px] rounded-full -translate-y-1/2 -translate-x-1/2 pointer-events-none" />

              {/* Left Side: Order Summary */}
              <div className="flex-1 p-12 md:p-20 overflow-y-auto space-y-10 border-r border-white/[0.03] relative z-10 custom-scrollbar no-scrollbar">
                <div className="flex justify-between items-start">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-3 px-5 py-2 bg-[#ff5a2c]/10 border border-[#ff5a2c]/20 rounded-full text-[10px] font-black text-[#ff5a2c] uppercase tracking-[0.4em] italic">
                       TRANSACTION-TERMINAL
                    </div>
                    <h3 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-white leading-none">Final <span className="text-slate-700">Settlement</span></h3>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs italic">Station ID: T-{selectedTable.table_number} • {selectedTable.activeOrder.customer_name || 'Public Guest'}</p>
                  </div>
                  <button 
                    onClick={() => setIsCheckoutOpen(false)} 
                    className="w-16 h-16 rounded-[24px] bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-xl active:scale-90"
                  >
                    <X className="w-8 h-8" />
                  </button>
                </div>

                <Button
                  onClick={handleDownloadReceipt}
                  className="w-full h-16 rounded-[24px] bg-white/5 text-white font-black uppercase text-[11px] tracking-[0.3em] border border-white/10 hover:bg-white hover:text-black transition-all flex items-center justify-center gap-4 italic"
                >
                  <Download className="w-5 h-5" /> Generate Digital Resource (PDF)
                </Button>

                <div className="space-y-6">
                  <p className="text-[11px] font-black text-slate-800 uppercase tracking-[0.5em] italic border-b border-white/[0.03] pb-4">Sequence Log Entry</p>
                  <div className="space-y-5">
                    {selectedTable.activeOrder.order_items.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center font-black uppercase italic text-lg tracking-tighter group transition-all">
                        <span className="text-slate-500 group-hover:text-white">{item.quantity}x {item.menu_items?.name}</span>
                        <span className="text-white">₹{item.total_price}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-10 border-t border-white/[0.05] space-y-6 bg-gradient-to-t from-white/[0.01] to-transparent p-8 rounded-[40px]">
                  {(() => {
                    const subtotal = selectedTable.activeOrder.total_amount || 0;
                    const cgst = (subtotal * (restaurant?.cgst_percent || 2.5)) / 100;
                    const sgst = (subtotal * (restaurant?.sgst_percent || 2.5)) / 100;
                    const service = (subtotal * (restaurant?.service_charge_percent || 5)) / 100;
                    const grandTotal = subtotal + cgst + sgst + service;
                    return (
                      <div className="space-y-4">
                        <div className="flex justify-between text-xs font-black text-slate-700 uppercase tracking-[0.3em] italic"><span>Sector Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                        <div className="flex justify-between text-xs font-black text-slate-800 uppercase tracking-[0.3em] italic"><span>Operational Levies</span><span>₹{(cgst + sgst).toFixed(2)}</span></div>
                        <div className="flex justify-between text-xs font-black text-slate-800 uppercase tracking-[0.3em] italic"><span>Service Protocol</span><span>₹{service.toFixed(2)}</span></div>
                        <div className="flex justify-between items-end pt-10 border-t border-white/10 mt-6">
                          <div className="space-y-2">
                            <span className="text-2xl font-black text-[#ff5a2c] italic uppercase tracking-tighter leading-none block">Total Settlement</span>
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] italic">Inclusive of all taxes</span>
                          </div>
                          <span className="text-6xl md:text-8xl font-black italic tracking-tighter text-white leading-none shadow-2xl filter drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">₹{grandTotal.toFixed(0)}</span>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>

              {/* Right Side: Payment & QR */}
              <div className="w-full md:w-[450px] bg-white/[0.01] p-12 md:p-20 flex flex-col justify-between items-center relative z-10 overflow-hidden shrink-0">
                {/* Internal glow */}
                <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-blue-500/5 blur-[80px] rounded-full translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <div className="space-y-12 w-full relative z-10">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-[32px] flex items-center justify-center mx-auto mb-6 text-[#ff5a2c] shadow-2xl">
                       <CreditCard size={40} />
                    </div>
                    <p className="text-[12px] font-black uppercase tracking-[0.6em] text-[#ff5a2c] italic">Paylink Matrix</p>
                    <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter">Terminal Ready</h4>
                  </div>

                  <div className="w-full aspect-square bg-white rounded-[56px] p-10 flex items-center justify-center shadow-[0_0_100px_rgba(255,255,255,0.05)] relative group transition-transform duration-700 hover:scale-[1.02]">
                    {restaurant?.merchant_qr_url ? (
                      <img src={restaurant.merchant_qr_url} className="w-full h-full object-contain filter contrast-125" alt="QR" />
                    ) : (
                      <div className="flex flex-col items-center gap-4 opacity-20">
                         <QrCode className="w-24 h-24 text-black" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-black">NO GATEWAY FOUND</span>
                      </div>
                    )}
                    {/* Corner accents */}
                    <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-black/5 rounded-tl-[32px]" />
                    <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-black/5 rounded-br-[32px]" />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-primary italic ml-2">Digital Receipt Endpoint</label>
                    <div className="relative group">
                      <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-800 group-focus-within:text-[#ff5a2c] transition-colors" />
                      <input
                        placeholder="CLIENT EMAIL ADDRESS"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-[24px] pl-16 pr-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-white placeholder:text-slate-900 focus:border-[#ff5a2c] outline-none transition-all italic"
                      />
                    </div>
                  </div>
                </div>

                <div className="w-full pt-16 relative z-10">
                  <Button 
                    onClick={handleFinalCheckout} 
                    disabled={isProcessingPayment} 
                    className="w-full h-24 rounded-[32px] bg-[#ff5a2c] text-white font-black uppercase tracking-[0.3em] text-[12px] shadow-[0_0_50px_rgba(255,90,44,0.3)] hover:bg-[#ea580c] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-5 italic"
                  >
                    {isProcessingPayment ? <Loader2 className="animate-spin w-8 h-8" /> : <><Zap size={24} /> Authorize Settlement</>}
                  </Button>
                  <p className="text-center text-[9px] font-bold text-slate-800 mt-6 uppercase tracking-[0.5em] italic">Final verification required</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
