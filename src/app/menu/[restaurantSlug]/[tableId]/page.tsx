"use client";

import React, { useState, useEffect, useRef, use } from "react";
import { 
  ShoppingBag, 
  Search, 
  ChevronRight, 
  Star, 
  Minus, 
  Plus,
  Building,
  Loader2,
  ChefHat,
  Wifi,
  CheckCircle2,
  UtensilsCrossed,
  Sparkles,
  ArrowLeft,
  Layers,
  Heart,
  Clock,
  Flame,
  Zap,
  Info,
  ChevronDown,
  X,
  MessageSquare,
  User,
  Send,
  CreditCard,
  Mail,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { FeedbackModal } from "@/components/FeedbackModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function PublicMenu({ params: paramsPromise }: { params: Promise<{ restaurantSlug: string, tableId: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { restaurantSlug, tableId } = params;
  
  const [restaurant, setRestaurant] = useState<any>(null);
  const [menu, setMenu] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [chrono, setChrono] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setChrono(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'draft' | 'history'>('draft');
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [sessionOrders, setSessionOrders] = useState<any[]>([]);
  const [isIdentityOpen, setIsIdentityOpen] = useState(false);
  const [guestInfo, setGuestInfo] = useState({ name: "", phone: "" });

  const supabase = createClient();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    const savedName = localStorage.getItem("guest_name");
    const savedPhone = localStorage.getItem("guest_phone");
    if (!savedName) {
       setIsIdentityOpen(true);
    } else {
       setGuestInfo({ name: savedName, phone: savedPhone || "" });
    }
    fetchRestaurant();
    fetchSessionHistory();
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, []);

  const fetchSessionHistory = async () => {
    try {
      const { data: restaurant } = await supabase.from("restaurants").select("id").eq("slug", restaurantSlug).single();
      const { data: table } = await supabase.from("tables").select("id, status").eq("restaurant_id", restaurant?.id).eq("table_number", tableId).single();
      
      if (!restaurant || !table) return;

      // Session Purge Protocol: If table is released/available, wipe local identity for a fresh start
      if (table.status === 'available') {
         localStorage.removeItem("guest_name");
         localStorage.removeItem("guest_phone");
         setGuestInfo({ name: "", phone: "" });
         setCart([]);
         setIsIdentityOpen(true);
         setActiveOrder(null);
         setSessionOrders([]);
         return;
      }

      const { data: activeOrder } = await supabase
        .from("orders")
        .select(`*, order_items(*, menu_items(*))`)
        .eq("restaurant_id", restaurant.id)
        .eq("table_id", table.id)
        .not("status", "in", "(completed,cancelled)")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (activeOrder) {
        setActiveOrder(activeOrder);
        setSessionOrders(activeOrder.order_items || []);
      } else {
        setActiveOrder(null);
        setSessionOrders([]);
      }
    } catch (err) {
      console.error("Session Link Failure", err);
    }
  };

  async function fetchRestaurant() {
    setIsLoading(true);
    try {
      const { data: resData, error: resError } = await supabase
        .from("restaurants")
        .select("*")
        .eq("slug", restaurantSlug)
        .single();
      
      if (resError || !resData) throw new Error("Restaurant not found");
      setRestaurant(resData);

      const { data: menuData } = await supabase
        .from("menu_items")
        .select(`*, menu_item_groups (name, menu_subcategories (name))`)
        .eq("restaurant_id", resData.id)
        .eq("is_available", true);
      
      const items = (menuData || []).map((item: any) => ({
        ...item,
        display_category: item.menu_item_groups?.menu_subcategories?.name || item.category || "General"
      }));
      
      setMenu(items);
      setCategories(["All", ...Array.from(new Set(items.map((i: any) => i.display_category)))]);
      
      setupRealtime(resData.id);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  const [statusAnim, setStatusAnim] = useState<{ type: string, emoji: string } | null>(null);
  const activeOrderIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeOrderIdRef.current = activeOrder?.id || null;
  }, [activeOrder]);

  async function setupRealtime(resId: string) {
    const channelName = `bhojan-res-${resId}`;
    const channel = supabase.channel(channelName, { config: { broadcast: { self: true, ack: true } } });
    
    channel
      .on('broadcast', { event: 'refresh_customer' }, (payload) => {
        const { type, orderId, tableNum } = payload.payload || {};
        
        // Match by Order ID (using Ref to avoid stale closure) OR Table Number fallback
        if (orderId === activeOrderIdRef.current || (tableNum && tableNum.toString() === tableId.toString())) {
           const emoji = type === 'PREPARING' ? '👨‍🍳' : type === 'COOKED' ? '🥘' : '🍽️';
           setStatusAnim({ type, emoji });
           setTimeout(() => setStatusAnim(null), 3500);
           fetchSessionHistory(); 
        }
      })
      .on('broadcast', { event: 'refresh_waiter' }, (payload) => {
         const { tableNum } = payload.payload || {};
         if (tableNum && tableNum.toString() === tableId.toString()) fetchSessionHistory();
      })
      .subscribe();

    channelRef.current = channel;
  }

  const addToCart = (item: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) return prev.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1 }];
    });
    toast.success(`${item.name} Secured`, { duration: 800, icon: '🎯' });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === id);
      if (existing?.quantity === 1) return prev.filter((i) => i.id !== id);
      return prev.map((i) => i.id === id ? { ...i, quantity: i.quantity - 1 } : i);
    });
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0 || !restaurant) return;
    setIsPlacingOrder(true);
    try {
      const { data: tableData } = await supabase.from("tables").select("id").eq("restaurant_id", restaurant.id).eq("table_number", tableId).single();
      if (!tableData) throw new Error("Table invalid");

      let orderId = activeOrder?.id;
      let currentTotal = activeOrder?.total_amount || 0;
      const batchTotal = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);

      if (!orderId) {
        const { data: order, error: orderError } = await supabase.from("orders").insert([{
          restaurant_id: restaurant.id, 
          table_id: tableData.id, 
          status: 'pending', 
          payment_status: 'unpaid',
          total_amount: batchTotal,
          grand_total: batchTotal,
          customer_name: guestInfo.name,
          customer_phone: guestInfo.phone
        }]).select().single();
        if (orderError) throw orderError;
        orderId = order.id;
      } else {
        await supabase.from("orders").update({ 
            total_amount: currentTotal + batchTotal,
            grand_total: (activeOrder.grand_total || 0) + batchTotal,
            status: 'pending',
            customer_name: guestInfo.name,
            customer_phone: guestInfo.phone
        }).eq("id", orderId);
      }

      const orderItems = cart.map(item => ({ 
        order_id: orderId, 
        menu_item_id: item.id, 
        quantity: item.quantity, 
        unit_price: item.price, 
        total_price: item.price * item.quantity 
      }));
      
      await supabase.from("order_items").insert(orderItems);
      await supabase.from("tables").update({ status: 'occupied' }).eq("id", tableData.id);

      if (channelRef.current) {
        channelRef.current.send({ type: 'broadcast', event: 'refresh_kitchen', payload: { type: 'NEW_BATCH', tableNum: tableId, guest: guestInfo.name, phone: guestInfo.phone } });
        channelRef.current.send({ type: 'broadcast', event: 'refresh_waiter', payload: { type: 'UPDATE', tableNum: tableId } });
      }

      toast.success("Batch Transmitted to Kitchen");
      setCart([]); 
      fetchSessionHistory(); 
      setViewMode('history');
    } catch (err: any) { 
      toast.error(err.message); 
    } finally { 
      setIsPlacingOrder(false); 
    }
  };

  const handleSettleBill = async () => {
    if (!activeOrder || !restaurant) return;
    setIsPlacingOrder(true);
    try {
      const subtotalAmt = activeOrder.total_amount || 0;
      const sc_percent = restaurant.service_charge_percent || 0;
      const tax_percent = restaurant.tax_percent || 0;
      
      const sc_amount = subtotalAmt * sc_percent / 100;
      const taxable_amount = subtotalAmt + sc_amount;
      const tax_amount = taxable_amount * tax_percent / 100;
      const grand_total = taxable_amount + tax_amount;

      // 1. Update Order State
      const { error: orderError } = await supabase.from("orders").update({
        status: 'completed',
        payment_status: 'paid',
        tax_amount: tax_amount,
        service_charge_amount: sc_amount,
        grand_total: grand_total,
        updated_at: new Date().toISOString()
      }).eq("id", activeOrder.id);
      if (orderError) throw orderError;

      // 2. Release Neural Station (Table)
      const { data: tableData } = await supabase.from("tables").select("id").eq("restaurant_id", restaurant.id).eq("table_number", tableId).single();
      if (tableData) {
        await supabase.from("tables").update({ status: 'available' }).eq("id", tableData.id);
      }

      // 3. Enroll into Customer Directory
      await supabase.from("customers").insert([{
        restaurant_id: restaurant.id,
        name: guestInfo.name,
        phone: guestInfo.phone
      }]);

      // 4. Neural Broadcast to Staff
      if (channelRef.current) {
        channelRef.current.send({ type: 'broadcast', event: 'refresh_waiter', payload: { type: 'SETTLED', tableNum: tableId } });
        channelRef.current.send({ type: 'broadcast', event: 'refresh_admin', payload: { type: 'SETTLED' } });
      }

      toast.success("Session Finalized. Thank you for visiting!");
      setIsCheckoutOpen(false);
      
      // Purge local session and reset UI
      localStorage.removeItem("guest_name");
      localStorage.removeItem("guest_phone");
      setGuestInfo({ name: "", phone: "" });
      setCart([]);
      setIsIdentityOpen(true);
      setActiveOrder(null);
      setSessionOrders([]);
      
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const generateReceipt = () => {
    if (!activeOrder || !restaurant) return;
    
    const doc = new jsPDF();
    const subtotalAmt = activeOrder.total_amount || 0;
    const sc_percent = restaurant.service_charge_percent || 0;
    const tax_percent = restaurant.tax_percent || 0;
    const sc_amount = subtotalAmt * sc_percent / 100;
    const taxable_amount = subtotalAmt + sc_amount;
    const tax_amount = taxable_amount * tax_percent / 100;
    const grand_total = taxable_amount + tax_amount;

    // Header
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(restaurant.name.toUpperCase(), 105, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(restaurant.address || "Restaurant Address", 105, 28, { align: "center" });
    doc.text(`Phone: ${restaurant.phone || "N/A"}`, 105, 33, { align: "center" });
    
    doc.line(20, 40, 190, 40);

    // Customer Info
    doc.setFontSize(10);
    doc.text(`Guest: ${guestInfo.name || "Public Guest"}`, 20, 50);
    doc.text(`Phone: ${guestInfo.phone || "N/A"}`, 20, 55);
    doc.text(`Station: T-${tableId}`, 150, 50);
    doc.text(`Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 150, 55);

    // Table
    const tData = sessionOrders.map((item: any) => [
      item.menu_items?.name,
      item.quantity,
      `INR ${item.unit_price}`,
      `INR ${item.total_price}`
    ]);

    autoTable(doc, {
      startY: 65,
      head: [['Dish Name', 'Qty', 'Price', 'Total']],
      body: tData,
      theme: 'striped',
      headStyles: { fillColor: [255, 90, 44] }
    });

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text(`Subtotal:`, 140, finalY);
    doc.text(`INR ${subtotalAmt.toFixed(2)}`, 190, finalY, { align: "right" });
    
    doc.text(`Service Fee (${sc_percent}%):`, 140, finalY + 6);
    doc.text(`INR ${sc_amount.toFixed(2)}`, 190, finalY + 6, { align: "right" });
    
    doc.text(`GST (${tax_percent}%):`, 140, finalY + 12);
    doc.text(`INR ${tax_amount.toFixed(2)}`, 190, finalY + 12, { align: "right" });
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`Grand Total:`, 140, finalY + 22);
    doc.text(`INR ${grand_total.toFixed(0)}`, 190, finalY + 22, { align: "right" });

    // Footer
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("Thank you for dining with us!", 105, finalY + 40, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.text("POWERED BY BHOJAN", 105, finalY + 45, { align: "center" });

    doc.save(`Receipt_T${tableId}_${Date.now()}.pdf`);
  };

  const saveIdentity = () => {
    if (!guestInfo.name) {
       toast.error("Identity Required for Station Access");
       return;
    }
    localStorage.setItem("guest_name", guestInfo.name);
    localStorage.setItem("guest_phone", guestInfo.phone);
    setIsIdentityOpen(false);
    toast.success(`Identity Confirmed: ${guestInfo.name}`);
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  
  const groupedMenu = categories.slice(1).map(cat => ({
    name: cat,
    items: menu.filter(item => item.display_category === cat && item.name.toLowerCase().includes(searchQuery.toLowerCase()))
  })).filter(group => group.items.length > 0);

  if (isLoading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6">
       <div className="w-16 h-16 border-4 border-slate-100 border-t-orange-500 rounded-full animate-spin" />
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] italic">Accessing Feed</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex flex-col relative">
       {/* Status Animation Overlay */}
       <AnimatePresence>
         {statusAnim && (
           <motion.div 
             initial={{ opacity: 0, y: 100, scale: 0.5 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
             className="fixed inset-x-0 top-32 z-[200] flex justify-center pointer-events-none px-6"
           >
              <div className="bg-white/90 backdrop-blur-2xl px-10 py-6 rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.15)] border-4 border-white flex items-center gap-6">
                 <div className="text-5xl sm:text-6xl animate-bounce drop-shadow-2xl">{statusAnim.emoji}</div>
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic mb-1">STATION UPDATE</p>
                    <p className="text-xl sm:text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
                       {statusAnim.type === 'PREPARING' ? 'Chef is Cooking' : statusAnim.type === 'COOKED' ? 'Ready for Pickup' : 'Served at Table'}
                    </p>
                 </div>
              </div>
           </motion.div>
         )}
       </AnimatePresence>

       <header className="sticky top-0 z-[100] bg-white/80 backdrop-blur-2xl border-b border-slate-100 px-6 sm:px-12 py-6 sm:py-8 shadow-sm">
          <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-6">
             <div className="flex items-center gap-4 sm:gap-8">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[20px] sm:rounded-[24px] bg-[#ff5a2c] flex items-center justify-center text-white shadow-xl shadow-orange-500/20 shrink-0">
                   <UtensilsCrossed size={24} className="sm:w-7 sm:h-7" />
                </div>
                <div className="min-w-0">
                   <h1 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter text-slate-900 leading-none truncate">{restaurant?.name}</h1>
                   <p className="text-[8px] sm:text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mt-1.5 sm:mt-2 italic truncate">STATION TERMINAL T-{tableId}</p>
                </div>
             </div>
 
             <div className="hidden md:flex items-center gap-6 flex-1 max-w-xl mx-8">
                <div className="relative w-full group">
                   <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4 group-focus-within:text-[#ff5a2c] transition-colors" />
                   <input 
                     placeholder="SCAN FLAVORS..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full pl-16 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:bg-white focus:border-[#ff5a2c] transition-all italic shadow-inner"
                   />
                </div>
             </div>
 
             <div className="flex items-center gap-3 sm:gap-6 shrink-0">
                <button 
                  onClick={() => setIsFeedbackOpen(true)}
                  className="h-12 px-4 sm:h-14 sm:px-8 bg-emerald-50 text-emerald-600 rounded-2xl sm:rounded-3xl flex items-center gap-2 sm:gap-3 border border-emerald-100 hover:bg-emerald-100 transition-all group"
                >
                   <MessageSquare size={18} className="group-hover:scale-110 transition-transform" />
                   <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest italic">Feedback</span>
                </button>
                <button onClick={() => setIsCheckoutOpen(true)} className="relative h-12 w-12 sm:h-16 sm:w-auto sm:px-6 bg-slate-900 rounded-2xl sm:rounded-3xl flex items-center justify-center sm:gap-4 text-white shadow-2xl hover:scale-105 active:scale-95 transition-all">
                   <ShoppingBag size={20} className="sm:w-6 sm:h-6" />
                   <span className="hidden sm:inline text-[11px] font-black italic tracking-tighter">₹{subtotal}</span>
                   {cart.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-[#ff5a2c] text-white text-[8px] sm:text-[9px] font-black rounded-full flex items-center justify-center border-2 sm:border-4 border-white animate-bounce">{cart.reduce((a,b)=>a+b.quantity,0)}</span>}
                </button>
             </div>
          </div>
          <div className="mt-4 md:hidden relative group">
             <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-3.5 h-3.5" />
             <input 
               placeholder="SEARCH FLAVORS..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full pl-14 pr-6 h-12 bg-slate-50 border border-slate-100 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] outline-none focus:bg-white transition-all italic"
             />
          </div>
       </header>

      <main className="flex-1 max-w-[1400px] mx-auto w-full px-8 py-12 flex flex-col lg:flex-row gap-16 relative">
         <div className="flex-1 space-y-16">
             <section className="flex items-center gap-3 sm:gap-4 overflow-x-auto no-scrollbar pb-2 sticky top-32 md:top-36 z-40 bg-[#f8f9fb]/80 backdrop-blur-xl">
                {categories.map((cat) => (
                  <button
                    key={cat} onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-6 sm:px-10 h-16 sm:h-20 rounded-2xl sm:rounded-[28px] flex flex-col items-center justify-center gap-2 transition-all border-2 sm:border-4 italic shrink-0",
                      selectedCategory === cat ? "bg-white border-[#ff5a2c] text-slate-900 shadow-xl shadow-orange-500/5 scale-105" : "bg-white border-slate-50 text-slate-300 hover:border-slate-100"
                    )}
                  >
                     <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.2em]">{cat}</span>
                     <div className={cn("w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full", selectedCategory === cat ? "bg-[#ff5a2c]" : "bg-transparent")} />
                  </button>
                ))}
             </section>

             <div className="space-y-16 sm:space-y-24 pb-48">
                {selectedCategory === "All" ? (
                  groupedMenu.map((group) => (
                    <div key={group.name} className="space-y-8 sm:space-y-10">
                       <div className="flex items-center gap-4 sm:gap-6 px-2">
                          <h3 className="text-2xl sm:text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">{group.name}</h3>
                          <div className="h-px flex-1 bg-slate-200/40" />
                       </div>
                       <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8 md:gap-10">
                          {group.items.map(item => <ItemCard key={item.id} item={item} addToCart={addToCart} removeFromCart={removeFromCart} cart={cart} />)}
                       </div>
                    </div>
                  ))
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8 md:gap-10">
                     {menu.filter(i => i.display_category === selectedCategory && i.name.toLowerCase().includes(searchQuery.toLowerCase())).map(item => <ItemCard key={item.id} item={item} addToCart={addToCart} removeFromCart={removeFromCart} cart={cart} />)}
                  </div>
                )}
             </div>
         </div>

         <aside className="hidden xl:block w-[450px] shrink-0 sticky top-48 h-[calc(100vh-250px)]">
            <div className="h-full bg-white rounded-[60px] border border-slate-100 shadow-2xl flex flex-col overflow-hidden">
               <div className="p-12 border-b border-slate-50 space-y-6">
                  <div className="flex justify-between items-center">
                     <h4 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">BUCKET <span className="text-[#ff5a2c]">LIST</span></h4>
                     <div className="px-6 py-2 bg-slate-900 text-white text-[10px] font-black rounded-full italic tracking-[0.3em]">T-{tableId}</div>
                  </div>
               </div>
               <div className="flex-1 overflow-y-auto p-12 space-y-8 no-scrollbar">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-10 gap-6 grayscale">
                       <ShoppingBag size={80} />
                       <p className="text-xs font-black uppercase tracking-widest italic">EMPTY SEQUENCE</p>
                    </div>
                  ) : (
                    cart.map(item => (
                      <div key={item.id} className="flex items-center justify-between group">
                         <div className="flex-1 min-w-0 pr-6">
                            <p className="font-black uppercase italic text-xl text-slate-900 truncate leading-none mb-3 group-hover:text-[#ff5a2c] transition-colors">{item.name}</p>
                            <p className="text-[11px] font-black text-orange-500 italic tracking-widest">₹{item.price}</p>
                         </div>
                         <div className="flex items-center gap-5 bg-slate-50 rounded-2xl p-2 border border-slate-100 shadow-inner">
                            <button onClick={() => removeFromCart(item.id)} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors"><Minus size={18} /></button>
                            <span className="font-black text-slate-900 italic min-w-[24px] text-center text-xl">{item.quantity}</span>
                            <button onClick={() => addToCart(item)} className="w-10 h-10 flex items-center justify-center text-[#ff5a2c] hover:scale-110 transition-transform"><Plus size={18} /></button>
                         </div>
                      </div>
                    ))
                  )}
               </div>
               <div className="p-12 bg-slate-50/50 space-y-8">
                  <div className="flex justify-between items-end">
                     <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] italic">TOTAL AGGREGATE</span>
                     <span className="text-6xl font-black text-slate-900 italic tracking-tighter leading-none">₹{subtotal}</span>
                  </div>
                  <button 
                    onClick={handlePlaceOrder} disabled={isPlacingOrder || cart.length === 0}
                    className="w-full h-24 bg-[#ff5a2c] rounded-[40px] text-white text-xl font-black italic uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(255,90,44,0.3)] hover:bg-orange-600 active:scale-95 transition-all flex items-center justify-center gap-6"
                  >
                     {isPlacingOrder ? <Loader2 className="animate-spin w-8 h-8" /> : <>TRANSMIT <Send size={28} /></>}
                  </button>
               </div>
            </div>
         </aside>
      </main>

      <AnimatePresence>
         {isIdentityOpen && (
           <div className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-3xl flex items-center justify-center p-8">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="bg-white w-full max-w-lg rounded-[64px] p-12 md:p-16 space-y-12 shadow-[0_40px_100px_rgba(0,0,0,0.4)]"
              >
                 <div className="space-y-4 text-center">
                    <div className="w-20 h-20 bg-[#ff5a2c] rounded-[28px] flex items-center justify-center text-white mx-auto shadow-2xl shadow-orange-500/30 mb-8"><User size={40} /></div>
                    <h3 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">IDENTITY <span className="text-orange-500">REQUIRED</span></h3>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] italic">Station Initialization in Progress</p>
                 </div>

                 <div className="space-y-6">
                    <div className="space-y-3">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic ml-4">GUEST NAME (MANDATORY)</span>
                       <input 
                          value={guestInfo.name} onChange={(e) => setGuestInfo({...guestInfo, name: e.target.value})}
                          placeholder="WHO ARE WE SERVING?" 
                          className="w-full h-20 bg-slate-50 border-2 border-slate-100 rounded-[32px] px-10 text-[11px] font-black uppercase tracking-widest italic outline-none focus:border-[#ff5a2c] focus:bg-white transition-all shadow-inner"
                       />
                    </div>
                    <div className="space-y-3">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic ml-4">PHONE LINK (OPTIONAL)</span>
                       <input 
                          value={guestInfo.phone} onChange={(e) => setGuestInfo({...guestInfo, phone: e.target.value})}
                          placeholder="FOR ORDER UPDATES..." 
                          className="w-full h-20 bg-slate-50 border-2 border-slate-100 rounded-[32px] px-10 text-[11px] font-black uppercase tracking-widest italic outline-none focus:border-[#ff5a2c] focus:bg-white transition-all shadow-inner"
                       />
                    </div>
                 </div>

                 <button 
                   onClick={saveIdentity}
                   className="w-full h-24 bg-slate-900 rounded-[32px] text-white text-[11px] font-black uppercase tracking-[0.4em] italic shadow-2xl hover:bg-[#ff5a2c] transition-all flex items-center justify-center gap-6"
                 >
                    CONFIRM IDENTITY <ChevronRight size={20} />
                 </button>
              </motion.div>
           </div>
         )}
      </AnimatePresence>

      <AnimatePresence>
         {isCheckoutOpen && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500] bg-slate-900/40 backdrop-blur-3xl flex items-end md:items-center justify-center">
              <motion.div 
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                className="bg-white w-full max-w-4xl max-h-[90vh] rounded-t-[60px] md:rounded-[80px] shadow-[0_50px_150px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden relative"
              >
                 <div className="p-12 md:p-16 border-b border-slate-50 flex flex-col gap-8">
                    <div className="flex items-center justify-between">
                       <div className="space-y-4">
                          <h3 className="text-5xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">SESSION <span className="text-orange-500">HUB</span></h3>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] italic">STATION T-{tableId} • GUEST: {guestInfo.name}</p>
                       </div>
                       <button onClick={() => setIsCheckoutOpen(false)} className="w-16 h-16 rounded-[28px] bg-slate-50 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"><X size={32} /></button>
                    </div>
                    
                    <div className="flex bg-slate-50 p-2 rounded-[32px] border border-slate-100">
                       <button 
                         onClick={() => setViewMode('draft')}
                         className={cn(
                           "flex-1 py-4 rounded-[24px] text-[10px] font-black uppercase tracking-widest italic transition-all flex items-center justify-center gap-3",
                           viewMode === 'draft' ? "bg-white text-slate-900 shadow-sm" : "text-slate-300"
                         )}
                       >
                          <ShoppingBag size={14} /> Draft Bucket ({cart.length})
                       </button>
                       <button 
                         onClick={() => setViewMode('history')}
                         className={cn(
                           "flex-1 py-4 rounded-[24px] text-[10px] font-black uppercase tracking-widest italic transition-all flex items-center justify-center gap-3",
                           viewMode === 'history' ? "bg-white text-slate-900 shadow-sm" : "text-slate-300"
                         )}
                       >
                          <Clock size={14} /> Session History ({sessionOrders.length})
                       </button>
                    </div>
                 </div>

                 <div className="flex-1 overflow-y-auto px-6 md:px-12 py-8 space-y-6 no-scrollbar bg-slate-50/30">
                    {viewMode === 'draft' ? (
                       cart.length === 0 ? (
                         <div className="h-96 flex flex-col items-center justify-center text-slate-200 gap-6">
                            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-inner"><ShoppingBag size={64} strokeWidth={1} /></div>
                            <p className="text-[11px] font-black uppercase tracking-[0.5em] italic">Bucket is Currently Clean</p>
                            <button onClick={() => setIsCheckoutOpen(false)} className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest italic">Return to Menu</button>
                         </div>
                       ) : (
                         <div className="space-y-6">
                            <div className="flex items-center gap-4 px-4 mb-4">
                               <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Active Draft Sequence</span>
                            </div>
                            {cart.map(item => (
                              <div key={item.id} className="bg-white rounded-[32px] p-6 sm:p-8 border border-slate-100/50 shadow-sm flex items-start gap-6 group transition-all hover:shadow-md">
                                 <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-lg shadow-slate-900/10"><span className="text-sm font-black italic">{item.quantity}x</span></div>
                                 <div className="flex-1 min-w-0 space-y-2">
                                    <div className="flex justify-between items-start gap-4">
                                       <h4 className="text-lg sm:text-xl font-bold text-slate-900 uppercase italic tracking-tighter leading-tight break-words">{item.name}</h4>
                                       <span className="text-lg sm:text-xl font-black text-slate-900 italic tracking-tighter shrink-0">₹{item.price * item.quantity}</span>
                                    </div>
                                    <div className="flex items-center justify-between pt-2">
                                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Rate: ₹{item.price}</span>
                                       <div className="flex items-center gap-4 bg-slate-50 rounded-xl p-1 border border-slate-100 pointer-events-auto">
                                          <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors"><Minus size={14} /></button>
                                          <span className="font-black text-slate-900 italic min-w-[16px] text-center">{item.quantity}</span>
                                          <button onClick={() => addToCart(item)} className="w-8 h-8 flex items-center justify-center text-[#ff5a2c] hover:scale-110 transition-transform"><Plus size={14} /></button>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                            ))}
                         </div>
                       )
                    ) : (
                       sessionOrders.length === 0 ? (
                          <div className="h-96 flex flex-col items-center justify-center text-slate-200 gap-6">
                             <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-inner text-slate-100"><Zap size={64} /></div>
                             <p className="text-[11px] font-black uppercase tracking-[0.5em] italic">Session is Clean • No History Found</p>
                          </div>
                       ) : (
                          <div className="space-y-4">
                             <div className="flex items-center gap-4 px-4 mb-8">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Synchronized Session Audit</span>
                             </div>
                             {sessionOrders.map((item, idx) => (
                                <div key={idx} className="bg-white rounded-[32px] p-6 sm:p-8 border border-slate-100 shadow-sm flex items-center justify-between group transition-all hover:shadow-md">
                                   <div className="flex items-center gap-6">
                                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black italic text-sm shadow-inner shrink-0">
                                         {item.quantity}x
                                      </div>
                                      <div className="min-w-0">
                                         <p className="text-lg font-black italic uppercase text-slate-900 tracking-tighter leading-tight truncate">
                                            {item.menu_items?.name || 'Unknown Item'}
                                         </p>
                                         <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1 italic">PREPARED & SERVED</p>
                                      </div>
                                   </div>
                                   <div className="text-right shrink-0">
                                      <p className="text-xl font-black italic text-slate-900 tracking-tighter">₹{item.total_price}</p>
                                      <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] mt-1 italic">✓ CRAFTED</p>
                                   </div>
                                </div>
                             ))}
                          </div>
                       )
                    )}
                 </div>

                 <div className="p-8 md:p-12 bg-white border-t border-slate-100 shadow-[0_-20px_50px_rgba(0,0,0,0.02)] space-y-8 z-20">
                    <div className="flex justify-between items-end px-4">
                       <div className="space-y-1">
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] italic">
                             {viewMode === 'draft' ? "Draft Batch Valuation" : "Final Settlement Evaluation"}
                          </span>
                          <p className="text-lg font-bold text-slate-400 italic">Inclusive of Neural Levies</p>
                       </div>
                       <div className="text-right">
                           <span className={cn(
                              "text-6xl font-black italic tracking-tighter leading-none",
                              viewMode === 'draft' ? "text-slate-900" : "text-emerald-600"
                           )}>
                              ₹{viewMode === 'draft' ? subtotal : (activeOrder?.total_amount + (activeOrder?.total_amount * (restaurant?.service_charge_percent || 0) / 100) + ((activeOrder?.total_amount + (activeOrder?.total_amount * (restaurant?.service_charge_percent || 0) / 100)) * (restaurant?.tax_percent || 0) / 100)).toFixed(0)}
                           </span>
                        </div>
                    </div>
                    
                    {viewMode === 'draft' ? (
                       <button 
                         onClick={handlePlaceOrder} 
                         disabled={isPlacingOrder || cart.length === 0}
                         className="w-full h-28 bg-orange-500 rounded-[48px] text-white text-3xl font-black italic uppercase tracking-[0.2em] shadow-2xl hover:bg-orange-600 transition-all flex items-center justify-center gap-8"
                       >
                          {isPlacingOrder ? <Loader2 className="animate-spin w-12 h-12" /> : <><Send size={48} /> TRANSMIT TO KITCHEN</>}
                       </button>
                    ) : (
                        <div className="space-y-6">
                           <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 space-y-3">
                              <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest italic">
                                 <span>Subtotal</span>
                                 <span>₹{activeOrder?.total_amount}</span>
                              </div>
                              <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest italic">
                                 <span>Service Fee ({restaurant?.service_charge_percent || 0}%)</span>
                                 <span>GST ({restaurant?.tax_percent || 0}%)</span>
                                 <span>₹{((activeOrder?.total_amount + (activeOrder?.total_amount * (restaurant?.service_charge_percent || 0) / 100)) * (restaurant?.tax_percent || 0) / 100).toFixed(2)}</span>
                              </div>
                           </div>
                        </div>
                    )}
                 </div>
              </motion.div>
           </motion.div>
          )}
       </AnimatePresence>

       <AnimatePresence>
         {isBillModalOpen && (
           <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
             className="fixed inset-0 z-[500] bg-slate-900/80 backdrop-blur-2xl flex flex-col items-center justify-end md:justify-center p-0 md:p-8"
           >
              <motion.div 
                initial={{ y: "100%", opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }} 
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="w-full md:max-w-[480px] bg-white rounded-t-[40px] md:rounded-[48px] flex flex-col h-[92vh] md:h-auto md:max-h-[85vh] overflow-hidden shadow-[0_-20px_80px_rgba(0,0,0,0.3)]"
              >
                 {/* STICKY HEADER */}
                 <div className="p-8 md:p-10 border-b border-slate-50 flex items-center justify-between bg-white/80 backdrop-blur-xl sticky top-0 z-10">
                    <div className="space-y-1">
                       <div className="flex items-center gap-2">
                          <div className="w-1.5 h-4 bg-[#ff5a2c] rounded-full" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic">Checkout</span>
                       </div>
                       <h2 className="text-3xl font-black italic tracking-tighter uppercase text-slate-900 leading-none">STATION <span className="text-[#ff5a2c]">{tableId}</span></h2>
                       <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">{guestInfo.name} • {chrono}</p>
                    </div>
                    <button 
                      onClick={() => setIsBillModalOpen(false)}
                      className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
                    >
                       <X size={24} />
                    </button>
                 </div>

                 {/* SCROLLABLE CONTENT */}
                 <div className="flex-1 overflow-y-auto no-scrollbar p-8 md:p-10 space-y-12">
                    <div className="space-y-8">
                       <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.5em] italic">Itemized Audit</p>
                       <div className="space-y-8">
                          {sessionOrders.map((item: any, idx: number) => (
                             <div key={idx} className="flex items-start justify-between gap-6 group">
                                <div className="flex items-start gap-5">
                                   <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-900 border border-slate-100 italic shadow-inner">
                                      {item.quantity}x
                                   </div>
                                   <div className="space-y-1">
                                      <p className="text-lg font-black text-slate-900 uppercase italic tracking-tighter leading-[1.2] break-words">
                                         {item.menu_items?.name}
                                      </p>
                                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">VALUATION: ₹{item.unit_price}</p>
                                   </div>
                                </div>
                                <p className="text-xl font-black text-slate-900 italic tracking-tighter shrink-0">₹{item.total_price}</p>
                             </div>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-4 pt-12 border-t border-slate-50">
                       <div className="flex justify-between text-xs font-black text-slate-400 uppercase tracking-widest italic">
                          <span>Subtotal</span>
                          <span>₹{activeOrder?.total_amount}</span>
                       </div>
                       <div className="flex justify-between text-xs font-black text-slate-400 uppercase tracking-widest italic">
                          <span>Service Fee ({restaurant?.service_charge_percent || 0}%)</span>
                          <span>₹{(activeOrder?.total_amount * (restaurant?.service_charge_percent || 0) / 100).toFixed(2)}</span>
                       </div>
                       <div className="flex justify-between text-xs font-black text-slate-400 uppercase tracking-widest italic">
                          <span>GST ({restaurant?.tax_percent || 0}%)</span>
                          <span>₹{((activeOrder?.total_amount + (activeOrder?.total_amount * (restaurant?.service_charge_percent || 0) / 100)) * (restaurant?.tax_percent || 0) / 100).toFixed(2)}</span>
                       </div>
                    </div>

                    <button 
                      onClick={generateReceipt}
                      className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-slate-100 hover:text-slate-900 transition-all flex items-center justify-center gap-4 italic"
                    >
                       <Download size={16} /> Archive Receipt (PDF)
                    </button>
                    
                    <div className="flex flex-col items-center gap-4 text-center pb-8">
                       <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center text-white">
                          <Zap size={24} className="text-[#ff5a2c]" />
                       </div>
                       <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.5em] italic">Powered by Bhojan Platform</p>
                    </div>
                 </div>

                 {/* STICKY FOOTER */}
                 <div className="p-8 md:p-10 border-t border-slate-50 bg-white space-y-6">
                    <div className="flex items-center justify-between">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] italic">Aggregate Total</p>
                       <p className="text-4xl font-black text-slate-900 italic tracking-tighter leading-none">
                          ₹{(activeOrder?.total_amount + (activeOrder?.total_amount * (restaurant?.service_charge_percent || 0) / 100) + ((activeOrder?.total_amount + (activeOrder?.total_amount * (restaurant?.service_charge_percent || 0) / 100)) * (restaurant?.tax_percent || 0) / 100)).toFixed(0)}
                       </p>
                    </div>
                    <motion.button 
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSettleBill}
                      disabled={isPlacingOrder}
                      className="w-full h-24 bg-slate-900 rounded-[32px] text-white text-2xl font-black italic uppercase tracking-[0.3em] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-6 active:scale-95 disabled:opacity-50"
                    >
                       {isPlacingOrder ? <Loader2 className="animate-spin" /> : <><CreditCard /> Pay & Settle</>}
                    </motion.button>
                 </div>
              </motion.div>
           </motion.div>
         )}
       </AnimatePresence>

      <FeedbackModal 
        isOpen={isFeedbackOpen} 
        onClose={() => setIsFeedbackOpen(false)} 
        restaurantId={restaurant?.id} 
      />

    </div>
  );
}

function ItemCard({ item, addToCart, removeFromCart, cart }: any) {
   const qty = cart.find((i: any) => i.id === item.id)?.quantity || 0;
   return (
      <motion.div 
         className="bg-white rounded-[32px] sm:rounded-[56px] border border-slate-100 overflow-hidden shadow-sm transition-all duration-500 group relative flex flex-col pointer-events-none select-none"
      >
         <div className="relative aspect-square sm:aspect-product overflow-hidden bg-slate-50">
            {item.image_url ? (
              <img src={item.image_url} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl sm:text-7xl font-black text-slate-100 italic uppercase select-none">{item.name.charAt(0)}</div>
            )}
            <div className="absolute top-4 left-4 sm:top-8 sm:left-8 flex flex-col gap-3">
               <div className={cn("w-2.5 h-2.5 sm:w-3 h-3 rounded-[3px] border-2 bg-white", item.is_veg ? "border-emerald-500" : "border-red-500")}>
                  <div className={cn("w-full h-full rounded-full", item.is_veg ? "bg-emerald-500" : "bg-red-500")} />
               </div>
            </div>
            {item.is_best_seller && (
               <div className="absolute bottom-4 left-4 sm:bottom-8 sm:left-8 px-4 py-1.5 sm:px-6 sm:py-2 bg-slate-900/90 backdrop-blur-md text-white text-[7px] sm:text-[9px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] rounded-full shadow-2xl italic flex items-center gap-2">
                  <Flame size={10} className="text-orange-500 sm:w-3 sm:h-3" /> BEST SELLER
               </div>
            )}
         </div>
         
         <div className="p-5 sm:p-10 flex flex-col flex-1 gap-6 sm:gap-8">
            <div className="space-y-2 sm:space-y-3 flex-1">
               <h4 className="text-sm sm:text-2xl font-black uppercase italic tracking-tighter text-slate-900 leading-tight">{item.name}</h4>
               <p className="text-[9px] sm:text-[11px] font-medium text-slate-300 italic leading-relaxed">{item.description || "Masterfully prepared."}</p>
            </div>
            
            <div className="flex items-center justify-between pt-4 sm:pt-6 border-t border-slate-100 pointer-events-auto">
               <div className="space-y-0.5 sm:space-y-1">
                  <span className="text-[7px] sm:text-[8px] font-black text-slate-200 uppercase tracking-widest italic leading-none">VALUATION</span>
                  <p className="text-lg sm:text-3xl font-black text-slate-900 italic tracking-tighter leading-none">₹{item.price}</p>
               </div>
               
               {qty > 0 ? (
                 <div className="flex items-center gap-2 sm:gap-4 bg-slate-900 text-white p-1.5 sm:p-2 rounded-xl sm:rounded-2xl shadow-xl">
                    <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center hover:text-red-400 transition-colors"><Minus size={14} className="sm:w-5 sm:h-5" /></button>
                    <span className="font-black italic min-w-[16px] sm:min-w-[20px] text-center text-sm sm:text-xl">{qty}</span>
                    <button onClick={() => addToCart(item)} className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center hover:text-orange-400 transition-colors"><Plus size={14} className="sm:w-5 sm:h-5" /></button>
                 </div>
               ) : (
                 <button 
                   onClick={() => addToCart(item)}
                   className="h-10 sm:h-16 px-4 sm:px-8 bg-[#ff5a2c] text-white rounded-xl sm:rounded-[24px] text-[8px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-orange-500/20 italic active:scale-95"
                 >
                    ADD <span className="hidden sm:inline">ITEM</span>
                 </button>
               )}
            </div>
         </div>
      </motion.div>
   );
 }
