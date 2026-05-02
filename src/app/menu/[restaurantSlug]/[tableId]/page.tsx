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
  Download,
  Key
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
  const [isAccessCodeOpen, setIsAccessCodeOpen] = useState(false);
  const [enteredCode, setEnteredCode] = useState("");
  const [guestInfo, setGuestInfo] = useState({ name: "", phone: "" });

  const supabase = createClient();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    const savedName = localStorage.getItem("guest_name");
    const savedPhone = localStorage.getItem("guest_phone");
    if (savedName) {
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

      if (table.status === 'available') {
         localStorage.removeItem("guest_name");
         localStorage.removeItem("guest_phone");
         localStorage.removeItem("access_code");
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
        
        const savedCode = localStorage.getItem("access_code");
        if (activeOrder.access_code && savedCode !== activeOrder.access_code) {
           setIsAccessCodeOpen(true);
           return;
        }

        if (activeOrder.customer_name) {
           localStorage.setItem("guest_name", activeOrder.customer_name);
           localStorage.setItem("guest_phone", activeOrder.customer_phone || "");
           if (activeOrder.access_code) localStorage.setItem("access_code", activeOrder.access_code);
           
           setGuestInfo({ 
             name: activeOrder.customer_name, 
             phone: activeOrder.customer_phone || "" 
           });
           setIsIdentityOpen(false);
           setIsAccessCodeOpen(false);
        }
      } else {
        setActiveOrder(null);
        setSessionOrders([]);
        if (!localStorage.getItem("guest_name")) {
          setIsIdentityOpen(true);
        }
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
      const { placeGuestOrder } = await import('./actions');
      const { data: tableData } = await supabase.from("tables").select("id").eq("restaurant_id", restaurant.id).eq("table_number", tableId).single();
      if (!tableData) throw new Error("Table invalid");

      const result = await placeGuestOrder(restaurant.id, tableData.id, guestInfo, cart, activeOrder?.id);

      if (!result.success) throw new Error(result.error);
      if (result.accessCode) localStorage.setItem("access_code", result.accessCode);

      if (channelRef.current) {
        channelRef.current.send({ type: 'broadcast', event: 'refresh_kitchen', payload: { type: 'NEW_BATCH', tableNum: tableId, guest: guestInfo.name, phone: guestInfo.phone, code: result.accessCode } });
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

      const { error: orderError } = await supabase.from("orders").update({
        status: 'completed', payment_status: 'paid', tax_amount, service_charge_amount: sc_amount, grand_total, updated_at: new Date().toISOString()
      }).eq("id", activeOrder.id);
      if (orderError) throw orderError;

      const { data: tableData } = await supabase.from("tables").select("id").eq("restaurant_id", restaurant.id).eq("table_number", tableId).single();
      if (tableData) await supabase.from("tables").update({ status: 'available' }).eq("id", tableData.id);

      await supabase.from("customers").insert([{ restaurant_id: restaurant.id, name: guestInfo.name, phone: guestInfo.phone }]);

      if (channelRef.current) {
        channelRef.current.send({ type: 'broadcast', event: 'refresh_waiter', payload: { type: 'SETTLED', tableNum: tableId } });
        channelRef.current.send({ type: 'broadcast', event: 'refresh_admin', payload: { type: 'SETTLED' } });
      }

      toast.success("Session Finalized. Thank you!");
      setIsCheckoutOpen(false);
      localStorage.removeItem("guest_name");
      localStorage.removeItem("guest_phone");
      localStorage.removeItem("access_code");
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

    doc.setFontSize(22); doc.setFont("helvetica", "bold"); doc.text(restaurant.name.toUpperCase(), 105, 20, { align: "center" });
    doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.text(restaurant.address || "Restaurant Address", 105, 28, { align: "center" });
    doc.text(`Phone: ${restaurant.phone || "N/A"}`, 105, 33, { align: "center" });
    doc.line(20, 40, 190, 40);
    doc.text(`Guest: ${guestInfo.name || "Public Guest"}`, 20, 50);
    doc.text(`Phone: ${guestInfo.phone || "N/A"}`, 20, 55);
    doc.text(`Station: T-${tableId}`, 150, 50);
    doc.text(`Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 150, 55);

    const tData = sessionOrders.map((item: any) => [item.menu_items?.name, item.quantity, `INR ${item.unit_price}`, `INR ${item.total_price}`]);
    autoTable(doc, { startY: 65, head: [['Dish Name', 'Qty', 'Price', 'Total']], body: tData, theme: 'striped', headStyles: { fillColor: [255, 90, 44] } });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text(`Subtotal:`, 140, finalY); doc.text(`INR ${subtotalAmt.toFixed(2)}`, 190, finalY, { align: "right" });
    doc.text(`Service Fee (${sc_percent}%):`, 140, finalY + 6); doc.text(`INR ${sc_amount.toFixed(2)}`, 190, finalY + 6, { align: "right" });
    doc.text(`GST (${tax_percent}%):`, 140, finalY + 12); doc.text(`INR ${tax_amount.toFixed(2)}`, 190, finalY + 12, { align: "right" });
    doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.text(`Grand Total:`, 140, finalY + 22); doc.text(`INR ${grand_total.toFixed(0)}`, 190, finalY + 22, { align: "right" });
    doc.save(`Receipt_T${tableId}_${Date.now()}.pdf`);
  };

  const saveIdentity = async () => {
    if (!guestInfo.name) { toast.error("Identity Required"); return; }
    localStorage.setItem("guest_name", guestInfo.name);
    localStorage.setItem("guest_phone", guestInfo.phone);
    
    // Enroll into Customer Directory Immediately
    if (restaurant?.id) {
       await supabase.from("customers").upsert([{
          restaurant_id: restaurant.id,
          name: guestInfo.name,
          phone: guestInfo.phone
       }], { onConflict: 'phone,restaurant_id' });
    }

    setIsIdentityOpen(false);
    toast.success(`Identity Confirmed: ${guestInfo.name}`);
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const groupedMenu = categories.slice(1).map(cat => ({
    name: cat, items: menu.filter(item => item.display_category === cat && item.name.toLowerCase().includes(searchQuery.toLowerCase()))
  })).filter(group => group.items.length > 0);

  if (isLoading) return <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6"><div className="w-16 h-16 border-4 border-slate-100 border-t-orange-500 rounded-full animate-spin" /><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] italic">Accessing Feed</p></div>;

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex flex-col relative">
       <AnimatePresence>
         {statusAnim && (
           <motion.div initial={{ opacity: 0, y: 100, scale: 0.5 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} className="fixed inset-x-0 top-32 z-[200] flex justify-center pointer-events-none px-6">
              <div className="bg-white/90 backdrop-blur-2xl px-10 py-6 rounded-[40px] shadow-2xl border-4 border-white flex items-center gap-6">
                 <div className="text-5xl animate-bounce">{statusAnim.emoji}</div>
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic mb-1">STATION UPDATE</p>
                    <p className="text-xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">{statusAnim.type === 'PREPARING' ? 'Chef is Cooking' : statusAnim.type === 'COOKED' ? 'Ready for Pickup' : 'Served at Table'}</p>
                 </div>
              </div>
           </motion.div>
         )}
       </AnimatePresence>

       <header className="sticky top-0 z-[100] bg-white/80 backdrop-blur-2xl border-b border-slate-100 px-6 sm:px-12 py-6 sm:py-8 shadow-sm">
          <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-6">
             <div className="flex items-center gap-4 sm:gap-8">
                <div className="w-12 h-12 rounded-[20px] bg-[#ff5a2c] flex items-center justify-center text-white shadow-xl shrink-0"><UtensilsCrossed size={24} /></div>
                <div className="min-w-0">
                   <h1 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter text-slate-900 leading-none truncate">{restaurant?.name}</h1>
                   <div className="flex items-center gap-3 mt-1.5">
                      <p className="text-[8px] sm:text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] italic">STATION TERMINAL T-{tableId}</p>
                      {guestInfo.name && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-orange-50 rounded-lg">
                           <User size={10} className="text-[#ff5a2c]" />
                           <p className="text-[8px] sm:text-[9px] font-black text-[#ff5a2c] uppercase tracking-widest italic">{guestInfo.name}</p>
                        </div>
                      )}
                      {activeOrder?.access_code && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-900 rounded-lg">
                           <Key size={8} className="text-orange-400" />
                           <p className="text-[8px] font-black text-white tracking-[0.2em]">{activeOrder.access_code}</p>
                        </div>
                      )}
                   </div>
                </div>
             </div>
             <div className="flex items-center gap-3 shrink-0">
                <button onClick={() => setIsFeedbackOpen(true)} className="h-12 px-4 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center gap-2 border border-emerald-100"><MessageSquare size={18} /><span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest italic">Feedback</span></button>
                <button onClick={() => setIsCheckoutOpen(true)} className="relative h-12 px-4 bg-slate-900 rounded-2xl flex items-center gap-4 text-white shadow-2xl">
                   <ShoppingBag size={20} /><span className="hidden sm:inline text-[11px] font-black italic">₹{subtotal > 0 ? subtotal : (activeOrder?.total_amount || 0)}</span>
                   {cart.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#ff5a2c] text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce">{cart.reduce((a,b)=>a+b.quantity,0)}</span>}
                </button>
             </div>
          </div>
       </header>

       <main className="flex-1 max-w-[1400px] mx-auto w-full px-8 py-12 flex flex-col lg:flex-row gap-16">
          <div className="flex-1 space-y-16">
              <section className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2 sticky top-32 z-40 bg-[#f8f9fb]/80 backdrop-blur-xl">
                 {categories.map((cat) => (
                   <button key={cat} onClick={() => setSelectedCategory(cat)} className={cn("px-6 h-16 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 italic shrink-0", selectedCategory === cat ? "bg-white border-[#ff5a2c] text-slate-900 shadow-xl" : "bg-white border-slate-50 text-slate-300")}>
                      <span className="text-[9px] font-black uppercase tracking-[0.2em]">{cat}</span>
                      <div className={cn("w-1.5 h-1.5 rounded-full", selectedCategory === cat ? "bg-[#ff5a2c]" : "bg-transparent")} />
                   </button>
                 ))}
              </section>
              <div className="space-y-16 pb-48">
                 {selectedCategory === "All" ? groupedMenu.map((group) => (
                    <div key={group.name} className="space-y-8">
                       <h3 className="text-2xl font-black italic uppercase text-slate-900 leading-none px-2">{group.name}</h3>
                       <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                          {group.items.map(item => <ItemCard key={item.id} item={item} addToCart={addToCart} removeFromCart={removeFromCart} cart={cart} />)}
                       </div>
                    </div>
                  )) : (
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                     {menu.filter(i => i.display_category === selectedCategory).map(item => <ItemCard key={item.id} item={item} addToCart={addToCart} removeFromCart={removeFromCart} cart={cart} />)}
                  </div>
                 )}
              </div>
          </div>
          <aside className="hidden xl:block w-[400px] shrink-0 sticky top-48 h-[calc(100vh-250px)]">
             <div className="h-full bg-white rounded-[48px] border border-slate-100 shadow-2xl flex flex-col overflow-hidden">
                <div className="p-10 border-b border-slate-50 flex justify-between items-center"><h4 className="text-2xl font-black italic uppercase text-slate-900">BUCKET <span className="text-[#ff5a2c]">LIST</span></h4><div className="px-4 py-1 bg-slate-900 text-white text-[9px] font-black rounded-full italic">T-{tableId}</div></div>
                <div className="flex-1 overflow-y-auto p-10 space-y-6 no-scrollbar">
                   {cart.length === 0 ? <div className="h-full flex flex-col items-center justify-center opacity-10 gap-4"><ShoppingBag size={64} /><p className="text-xs font-black uppercase tracking-widest italic">EMPTY SEQUENCE</p></div> : cart.map(item => (
                     <div key={item.id} className="flex items-center justify-between"><div className="flex-1 min-w-0 pr-4"><p className="font-black uppercase italic text-lg text-slate-900 truncate mb-1">{item.name}</p><p className="text-[10px] font-black text-orange-500 italic">₹{item.price}</p></div><div className="flex items-center gap-4 bg-slate-50 rounded-xl p-1.5 border border-slate-100"><button onClick={() => removeFromCart(item.id)} className="w-8 h-8 flex items-center justify-center text-slate-300"><Minus size={16} /></button><span className="font-black text-slate-900 italic min-w-[20px] text-center">{item.quantity}</span><button onClick={() => addToCart(item)} className="w-8 h-8 flex items-center justify-center text-[#ff5a2c]"><Plus size={16} /></button></div></div>
                   ))}
                </div>
                <div className="p-10 bg-slate-50/50 space-y-6"><div className="flex justify-between items-end"><span className="text-[10px] font-black text-slate-400 uppercase italic">TOTAL</span><span className="text-5xl font-black text-slate-900 italic">₹{subtotal}</span></div><button onClick={handlePlaceOrder} disabled={isPlacingOrder || cart.length === 0} className="w-full h-20 bg-[#ff5a2c] rounded-[32px] text-white text-lg font-black italic uppercase tracking-[0.2em] shadow-xl hover:bg-orange-600 disabled:opacity-50 transition-all flex items-center justify-center gap-4">{isPlacingOrder ? <Loader2 className="animate-spin" /> : <>TRANSMIT <Send size={24} /></>}</button></div>
             </div>
          </aside>
       </main>

       <AnimatePresence>
         {isIdentityOpen && (
           <div className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-3xl flex items-center justify-center p-8">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-lg rounded-[64px] p-12 md:p-16 space-y-12 shadow-2xl">
                 <div className="text-center space-y-4"><div className="w-20 h-20 bg-[#ff5a2c] rounded-[28px] flex items-center justify-center text-white mx-auto shadow-2xl mb-6"><User size={40} /></div><h3 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">IDENTITY <span className="text-orange-500">REQUIRED</span></h3><p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] italic">Station Initialization</p></div>
                 <div className="space-y-6"><div className="space-y-2"><span className="text-[9px] font-black text-slate-400 uppercase italic ml-4">GUEST NAME</span><input value={guestInfo.name} onChange={(e) => setGuestInfo({...guestInfo, name: e.target.value})} placeholder="WHO ARE WE SERVING?" className="w-full h-20 bg-slate-50 border-2 border-slate-100 rounded-[32px] px-10 text-[11px] font-black uppercase italic outline-none focus:border-[#ff5a2c]" /></div><div className="space-y-2"><span className="text-[9px] font-black text-slate-400 uppercase italic ml-4">PHONE LINK (OPTIONAL)</span><input value={guestInfo.phone} onChange={(e) => setGuestInfo({...guestInfo, phone: e.target.value})} placeholder="FOR UPDATES..." className="w-full h-20 bg-slate-50 border-2 border-slate-100 rounded-[32px] px-10 text-[11px] font-black uppercase italic outline-none focus:border-[#ff5a2c]" /></div></div>
                 <button onClick={saveIdentity} className="w-full h-24 bg-slate-900 rounded-[32px] text-white text-[11px] font-black uppercase tracking-[0.4em] italic shadow-2xl hover:bg-[#ff5a2c] transition-all">CONFIRM IDENTITY</button>
              </motion.div>
           </div>
         )}
       </AnimatePresence>

       <AnimatePresence>
          {isCheckoutOpen && (
            <div className="fixed inset-0 z-[400] bg-slate-900/60 backdrop-blur-3xl flex items-center justify-center p-4">
               <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-[480px] h-[90vh] rounded-[48px] shadow-2xl flex flex-col overflow-hidden">
                  <div className="p-8 border-b flex justify-between items-center"><h2 className="text-3xl font-black italic uppercase text-slate-900">SESSION <span className="text-[#ff5a2c]">HUB</span></h2><button onClick={() => setIsCheckoutOpen(false)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"><X size={24} /></button></div>
                  <div className="flex bg-slate-50 p-1.5 m-6 rounded-2xl border"><button onClick={() => setViewMode('draft')} className={cn("flex-1 py-3 rounded-xl text-[9px] font-black uppercase italic", viewMode === 'draft' ? "bg-white text-slate-900 shadow-sm" : "text-slate-300")}>DRAFT</button><button onClick={() => setViewMode('history')} className={cn("flex-1 py-3 rounded-xl text-[9px] font-black uppercase italic", viewMode === 'history' ? "bg-white text-slate-900 shadow-sm" : "text-slate-300")}>HISTORY</button></div>
                  <div className="flex-1 overflow-y-auto px-8 space-y-6">{viewMode === 'draft' ? (cart.length === 0 ? <div className="h-64 flex flex-col items-center justify-center text-slate-200"><ShoppingBag size={48} /><p className="text-[10px] font-black uppercase italic">Bucket is Empty</p></div> : cart.map(item => <div key={item.id} className="bg-white rounded-[32px] p-6 border flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-slate-950 text-white flex items-center justify-center shrink-0 font-black italic">{item.quantity}x</div><div className="flex-1"><div className="flex justify-between items-start gap-3"><h4 className="text-sm font-bold text-slate-900 uppercase italic leading-tight">{item.name}</h4><span className="text-sm font-black text-slate-900 italic">₹{item.price * item.quantity}</span></div></div></div>)) : (sessionOrders.length === 0 ? <div className="h-64 flex flex-col items-center justify-center text-slate-200"><Clock size={48} /><p className="text-[10px] font-black uppercase italic">No Active History</p></div> : sessionOrders.map((item, idx) => <div key={idx} className="bg-white rounded-[32px] p-6 border flex items-center justify-between transition-all hover:shadow-md"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black italic text-xs">{item.quantity}x</div><p className="text-sm font-black italic uppercase text-slate-900">{item.menu_items?.name}</p></div><p className="text-sm font-black italic text-slate-900">₹{item.total_price}</p></div>))}</div>
                  <div className="p-8 bg-white border-t space-y-6 shadow-inner"><div className="flex justify-between items-end"><div><span className="text-[9px] font-black text-slate-300 uppercase italic">Evaluation</span><p className="text-xs font-bold text-slate-400 italic">Inclusive of Levies</p></div><span className="text-4xl font-black italic text-slate-900">₹{viewMode === 'draft' ? subtotal : (activeOrder?.total_amount + (activeOrder?.total_amount * (restaurant?.service_charge_percent || 0) / 100) + ((activeOrder?.total_amount + (activeOrder?.total_amount * (restaurant?.service_charge_percent || 0) / 100)) * (restaurant?.tax_percent || 0) / 100)).toFixed(0)}</span></div>{viewMode === 'draft' ? <button onClick={handlePlaceOrder} disabled={isPlacingOrder || cart.length === 0} className="w-full h-20 bg-slate-900 rounded-[28px] text-white text-xl font-black italic uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-4">{isPlacingOrder ? <Loader2 className="animate-spin" /> : <><Send size={24} /> TRANSMIT</>}</button> : <button onClick={() => setIsBillModalOpen(true)} className="w-full h-20 bg-[#ff5a2c] rounded-[28px] text-white text-xl font-black italic uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-4">REQUEST BILL</button>}</div>
               </motion.div>
            </div>
          )}
       </AnimatePresence>

       <AnimatePresence>
         {isBillModalOpen && (
           <div className="fixed inset-0 z-[500] bg-slate-900/80 backdrop-blur-2xl flex flex-col items-center justify-center p-4">
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-[480px] bg-white rounded-[48px] flex flex-col h-[85vh] overflow-hidden shadow-2xl">
                  <div className="p-8 border-b flex items-center justify-between bg-white/80 sticky top-0 z-10"><h2 className="text-2xl font-black italic uppercase text-slate-900 leading-none">STATION <span className="text-[#ff5a2c]">{tableId}</span> BILL</h2><button onClick={() => setIsBillModalOpen(false)} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900"><X size={20} /></button></div>
                  <div className="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar">
                     <div className="space-y-6">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Itemized Audit</p>
                        {sessionOrders.map((item: any, idx: number) => <div key={idx} className="flex items-center justify-between gap-4"><div className="flex items-center gap-4"><div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-900 border">{item.quantity}x</div><p className="text-sm font-black italic uppercase text-slate-900">{item.menu_items?.name}</p></div><p className="text-sm font-black italic text-slate-900">₹{item.total_price}</p></div>)}
                     </div>
                     <div className="space-y-3 pt-6 border-t border-slate-50">
                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase italic"><span>Subtotal</span><span>₹{activeOrder?.total_amount}</span></div>
                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase italic"><span>Levies (SC/GST)</span><span>₹{((activeOrder?.total_amount * (restaurant?.service_charge_percent || 0) / 100) + ((activeOrder?.total_amount + (activeOrder?.total_amount * (restaurant?.service_charge_percent || 0) / 100)) * (restaurant?.tax_percent || 0) / 100)).toFixed(2)}</span></div>
                     </div>
                     <button onClick={generateReceipt} className="w-full h-14 bg-slate-50 border rounded-2xl text-slate-400 text-[9px] font-black uppercase hover:bg-slate-100 flex items-center justify-center gap-4 italic transition-all"><Download size={16} /> Archive Receipt (PDF)</button>
                  </div>
                  <div className="p-8 border-t bg-white space-y-6 shrink-0 shadow-inner">
                     <div className="flex items-center justify-between"><p className="text-[10px] font-black text-slate-400 uppercase italic">Final Total</p><p className="text-4xl font-black text-slate-900 italic">₹{(activeOrder?.total_amount + (activeOrder?.total_amount * (restaurant?.service_charge_percent || 0) / 100) + ((activeOrder?.total_amount + (activeOrder?.total_amount * (restaurant?.service_charge_percent || 0) / 100)) * (restaurant?.tax_percent || 0) / 100)).toFixed(0)}</p></div>
                     <button onClick={handleSettleBill} disabled={isPlacingOrder} className="w-full h-20 bg-slate-900 rounded-[32px] text-white text-xl font-black italic uppercase shadow-xl hover:bg-black transition-all flex items-center justify-center gap-4">{isPlacingOrder ? <Loader2 className="animate-spin" /> : <><CreditCard /> Pay & Settle</>}</button>
                  </div>
              </motion.div>
           </div>
         )}
       </AnimatePresence>

       <FeedbackModal 
          isOpen={isFeedbackOpen} 
          onClose={() => setIsFeedbackOpen(false)} 
          restaurantId={restaurant?.id} 
          defaultName={guestInfo.name}
       />

       <AnimatePresence>
         {isAccessCodeOpen && (
           <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-2xl">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-md rounded-[48px] p-12 shadow-2xl text-center relative overflow-hidden border-t-4 border-[#ff5a2c]">
                 <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#ff5a2c]"><Key size={32} /></div>
                 <h3 className="text-3xl font-black italic uppercase text-slate-900 mb-2">RESTORE <span className="text-[#ff5a2c]">SESSION</span></h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase italic mb-8">Enter the 4-digit code to join this table.</p>
                 <div className="space-y-6"><input type="text" maxLength={4} placeholder="----" value={enteredCode} onChange={(e) => setEnteredCode(e.target.value)} className="w-full h-20 bg-slate-50 border rounded-3xl text-center text-4xl font-black text-[#ff5a2c] outline-none italic" /><button onClick={() => { if (enteredCode === activeOrder?.access_code) { localStorage.setItem("access_code", enteredCode); setIsAccessCodeOpen(false); fetchSessionHistory(); toast.success("SUCCESS"); } else { toast.error("INVALID"); setEnteredCode(""); } }} className="w-full h-20 rounded-3xl bg-slate-900 text-white font-black uppercase text-xs italic">VERIFY & ENTER</button><button onClick={() => router.push(`/scan/${restaurantSlug}`)} className="text-[9px] font-black text-slate-300 uppercase hover:text-slate-900 transition-all italic">EXIT STATION</button></div>
              </motion.div>
           </div>
         )}
       </AnimatePresence>
    </div>
  );
}

function ItemCard({ item, addToCart, removeFromCart, cart }: any) {
   const qty = cart.find((i: any) => i.id === item.id)?.quantity || 0;
   return (
      <motion.div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col">
         <div className="relative aspect-square overflow-hidden bg-slate-50">
            {item.image_url ? <img src={item.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /> : <div className="w-full h-full flex items-center justify-center text-6xl font-black text-slate-100 italic uppercase">{item.name.charAt(0)}</div>}
            <div className="absolute top-4 left-4"><div className={cn("w-3 h-3 rounded-full border-2 bg-white", item.is_veg ? "border-emerald-500" : "border-red-500")}><div className={cn("w-full h-full rounded-full", item.is_veg ? "bg-emerald-500" : "bg-red-500")} /></div></div>
         </div>
         <div className="p-6 flex flex-col flex-1 gap-4">
            <div className="flex-1"><h4 className="text-lg font-black uppercase italic text-slate-900 leading-tight mb-1">{item.name}</h4><p className="text-[10px] font-medium text-slate-300 italic">{item.description || "Masterfully prepared."}</p></div>
            <div className="flex items-center justify-between pt-4 border-t border-slate-50"><div className="space-y-0.5"><span className="text-[8px] font-black text-slate-200 uppercase italic">Rate</span><p className="text-xl font-black text-slate-900 italic">₹{item.price}</p></div>{qty > 0 ? <div className="flex items-center gap-3 bg-slate-900 text-white p-1 rounded-xl shadow-lg"><button onClick={() => removeFromCart(item.id)} className="w-8 h-8 flex items-center justify-center"><Minus size={14} /></button><span className="font-black italic min-w-[16px] text-center">{qty}</span><button onClick={() => addToCart(item)} className="w-8 h-8 flex items-center justify-center"><Plus size={14} /></button></div> : <button onClick={() => addToCart(item)} className="h-10 px-6 bg-[#ff5a2c] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all italic shadow-lg shadow-orange-500/20">ADD</button>}</div>
         </div>
      </motion.div>
   );
}
