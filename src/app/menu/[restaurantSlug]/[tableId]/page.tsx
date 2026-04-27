"use client";

import { useState, useEffect, useRef, use } from "react";
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
  Flame
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { FeedbackModal } from "@/components/FeedbackModal";
import { MessageSquareQuote } from "lucide-react";

export default function PublicMenu({ params: paramsPromise }: { params: Promise<{ restaurantSlug: string, tableId: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { restaurantSlug, tableId } = params;
  const [restaurant, setRestaurant] = useState<any>(null);
  const [menu, setMenu] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState<any[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [isLive, setIsLive] = useState(false);
  const [notification, setNotification] = useState<{ type: 'COOKED' | 'PREPARING', id: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  const supabase = createClient();
  const channelRef = useRef<any>(null);
  const buzzerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchData();
    buzzerRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
  }, []);

  async function fetchData() {
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
        .select(`
          *,
          menu_item_groups (
            name,
            menu_subcategories (
              name
            )
          )
        `)
        .eq("restaurant_id", resData.id)
        .eq("is_available", true);
      
      const items = (menuData || []).map((item: any) => ({
        ...item,
        // Fallback to item.category if join fails (legacy support)
        display_category: item.menu_item_groups?.menu_subcategories?.name || item.category || "General"
      }));
      
      setMenu(items);
      const cats = ["All", ...Array.from(new Set(items.map((i: any) => i.display_category)))];
      setCategories(cats);

      const savedOrderId = localStorage.getItem(`order_${restaurantSlug}_${tableId}`);
      if (savedOrderId) {
        const { data: orderData } = await supabase
          .from("orders")
          .select("*, order_items(*, menu_items(*))")
          .eq("id", savedOrderId)
          .single();
        
        if (orderData && orderData.status !== 'completed') {
          setCurrentOrder(orderData);
        } else {
          localStorage.removeItem(`order_${restaurantSlug}_${tableId}`);
        }
      }

      setupRealtime(resData.id, savedOrderId);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function setupRealtime(resId: string, orderId?: string | null) {
    try {
      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      const channelName = `cust-${resId}-${orderId?.slice(-5) || 'no-order'}-${Math.random().toString(36).slice(2, 7)}`;
      const channel = supabase.channel(channelName, { config: { broadcast: { self: true } } });
      channel
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: orderId ? `id=eq.${orderId}` : undefined }, (payload: any) => {
          const newStatus = payload.new?.status;
          if (newStatus === 'preparing') triggerNotification('PREPARING');
          else if (newStatus === 'ready') triggerNotification('COOKED');
          if (newStatus === 'completed') {
            localStorage.removeItem(`order_${restaurantSlug}_${tableId}`);
            setCurrentOrder(null);
          } else {
            setCurrentOrder((prev: any) => prev ? { ...prev, status: newStatus } : null);
          }
        })
        .on('broadcast', { event: 'refresh_customer' }, (payload: any) => {
          const { type, orderId: bOrderId } = payload.payload;
          if (bOrderId === orderId) {
            triggerNotification(type);
            setCurrentOrder((prev: any) => prev ? { ...prev, status: type === 'PREPARING' ? 'preparing' : 'ready' } : null);
          }
        })
        .subscribe((status) => setIsLive(status === 'SUBSCRIBED'));
      channelRef.current = channel;
    } catch (err) { console.error("Realtime Setup Failed:", err); }
  }

  function triggerNotification(type: 'COOKED' | 'PREPARING') {
    if (type === 'COOKED' && buzzerRef.current) buzzerRef.current.play().catch(() => {});
    setNotification({ id: Math.random().toString(), type });
    setTimeout(() => setNotification(null), type === 'PREPARING' ? 3000 : 6000);
  }

  const addToCart = (item: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) return prev.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1 }];
    });
    toast.success(`${item.name} added`, { duration: 800, position: 'bottom-center' });
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
      const { data: order, error: orderError } = await supabase.from("orders").insert([{
        restaurant_id: restaurant.id, table_id: tableData.id, status: 'pending', payment_status: 'unpaid',
        total_amount: cart.reduce((acc, i) => acc + (i.price * i.quantity), 0), customer_name: "Public Guest"
      }]).select().single();
      if (orderError) throw orderError;
      const orderItems = cart.map(item => ({ order_id: order.id, menu_item_id: item.id, quantity: item.quantity, unit_price: item.price, total_price: item.price * item.quantity }));
      await supabase.from("order_items").insert(orderItems);
      await supabase.from("tables").update({ status: 'occupied' }).eq("id", tableData.id);
      if (channelRef.current) {
        channelRef.current.send({ type: 'broadcast', event: 'refresh_kitchen', payload: { type: 'NEW_ORDER' } });
        channelRef.current.send({ type: 'broadcast', event: 'refresh_waiter', payload: { type: 'NEW_ORDER' } });
      }
      localStorage.setItem(`order_${restaurantSlug}_${tableId}`, order.id);
      setCurrentOrder(order);
      setCart([]);
      setShowCheckout(false);
      toast.success("Order Placed!");
      setupRealtime(restaurant.id, order.id);
    } catch (err: any) { toast.error(err.message); } finally { setIsPlacingOrder(false); }
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = subtotal * 0.05;
  const grandTotal = subtotal + tax;

  const filteredMenu = menu.filter(i => {
    const matchesCat = selectedCategory === "All" || i.display_category === selectedCategory;
    const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  if (isLoading) return (
    <div className="min-h-screen bg-[#f8f9fb] flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-orange-100 border-t-[#ff5a2c] rounded-full animate-spin" />
        <UtensilsCrossed className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#ff5a2c] w-6 h-6" />
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Synchronizing Kitchen...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-slate-900 font-sans selection:bg-orange-100">
      {/* Realtime Status */}
      <div className={cn(
        "fixed top-4 right-6 z-[100] px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border transition-all duration-500 shadow-sm bg-white/80 backdrop-blur-md",
        isLive ? 'border-emerald-100 text-emerald-500' : 'border-red-100 text-red-500 animate-pulse'
      )}>
        <Wifi size={14} className={isLive ? "" : "animate-bounce"} />
        {isLive ? 'System Active' : 'Connecting...'}
      </div>

      {/* Main Header (Admin Style) */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-2xl border-b border-slate-100 px-6 py-6 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => router.back()}
              className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-[#ff5a2c] hover:bg-orange-50 transition-all border border-transparent hover:border-orange-100"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900 leading-none">BHOJAN</h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 bg-orange-100 text-[#ff5a2c] text-[8px] font-black rounded-md uppercase tracking-widest border border-orange-200">{tableId}</span>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Live Menu</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsFeedbackOpen(true)}
              className="hidden md:flex items-center gap-3 px-6 py-3 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-[#ff5a2c] hover:border-[#ff5a2c] transition-all group"
            >
               <MessageSquareQuote size={18} className="group-hover:rotate-12 transition-transform" />
               <span className="text-[10px] font-black uppercase tracking-widest">Feedback</span>
            </button>
            <div className="hidden md:flex relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-[#ff5a2c] transition-colors" />
              <input 
                type="text" 
                placeholder="Search flavors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-200 transition-all w-64 font-medium"
              />
            </div>
            <button onClick={() => setShowCheckout(true)} className="relative w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg hover:shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all">
              <ShoppingBag size={22} />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-[#ff5a2c] text-white text-[10px] font-black flex items-center justify-center rounded-full border-4 border-white">
                  {cart.reduce((a,b) => a+b.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto py-8">
        {/* Category Pills (Premium Style) */}
        <div className="px-6 mb-12 flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-7 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap flex items-center gap-3 border shadow-sm",
                selectedCategory === cat 
                  ? "bg-[#ff5a2c] text-white border-[#ff5a2c] shadow-orange-500/20 scale-105" 
                  : "bg-white text-slate-400 border-slate-100 hover:bg-slate-50"
              )}
            >
              <Layers size={14} className={cn(selectedCategory === cat ? "text-orange-200" : "text-slate-200")} />
              {cat}
            </button>
          ))}
        </div>

        {/* Hero Section (Stripe Style) */}
        {!searchQuery && (
          <section className="px-4 md:px-6 mb-8 md:mb-16">
            <div className="relative h-48 md:h-64 rounded-[32px] md:rounded-[40px] overflow-hidden group shadow-xl">
               <img src={restaurant?.banner_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[5s]" />
               <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/40 to-transparent" />
               <div className="absolute inset-0 p-6 md:p-12 flex flex-col justify-center">
                  <div className="flex items-center gap-2 md:gap-3 text-orange-400 text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] mb-2 md:mb-4">
                     <Sparkles size={12} /> Chef's Selection
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter italic leading-none max-w-xs md:max-w-lg mb-4 md:mb-6">
                    TASTE THE <span className="text-orange-500">EXCELLENCE</span>
                  </h2>
                  <div className="flex items-center gap-3 md:gap-6">
                    <div className="flex items-center gap-2 text-white/60 text-[8px] md:text-[9px] font-bold uppercase tracking-widest px-3 md:px-4 py-1.5 md:py-2 bg-white/10 backdrop-blur-md rounded-lg md:rounded-xl border border-white/10">
                       <Clock size={10} className="text-orange-400" /> 15-20 Min
                    </div>
                    <div className="flex items-center gap-2 text-white/60 text-[8px] md:text-[9px] font-bold uppercase tracking-widest px-3 md:px-4 py-1.5 md:py-2 bg-white/10 backdrop-blur-md rounded-lg md:rounded-xl border border-white/10">
                       <Flame size={10} className="text-orange-400" /> Hot & Fresh
                    </div>
                  </div>
               </div>
            </div>
          </section>
        )}

        {/* Categories Bar - Horizontal Scroll on Mobile */}
        <section className="px-4 md:px-6 mb-8 overflow-x-auto no-scrollbar">
           <div className="flex items-center gap-2 md:gap-3">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-6 md:px-8 py-3 md:py-4 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2",
                    selectedCategory === cat 
                      ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/10" 
                      : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                  )}
                >
                  {cat}
                </button>
              ))}
           </div>
        </section>

        {/* Menu Grid/List */}
        <section className="px-4 md:px-6 pb-48">
          <div className="flex items-center justify-between mb-8 md:mb-10">
            <div>
              <h3 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-slate-900">{searchQuery ? 'Results' : selectedCategory}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Selected Delicacies</p>
            </div>
            <div className="h-px flex-1 bg-slate-100 mx-6 md:mx-10 hidden sm:block" />
            <p className="hidden sm:block text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">{filteredMenu.length} Options</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {filteredMenu.map((item, idx) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={item.id} 
                className="group relative bg-white rounded-[32px] border border-slate-100 p-4 md:p-6 flex gap-4 md:gap-6 hover:border-orange-200 hover:shadow-2xl hover:shadow-orange-500/5 transition-all duration-500 overflow-hidden"
              >
                <div className="relative w-24 h-24 md:w-44 md:h-44 rounded-[24px] md:rounded-[28px] overflow-hidden bg-slate-100 shrink-0 border border-slate-100 shadow-sm">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl md:text-4xl font-black text-slate-200 uppercase bg-slate-50">
                      {item.name.substring(0, 2)}
                    </div>
                  )}
                  {item.is_best_seller && (
                    <div className="absolute top-2 left-2 md:top-3 md:left-3 px-2 py-1 bg-[#ff5a2c] shadow-lg rounded-lg flex items-center gap-1 md:gap-1.5 border border-white/20">
                       <Flame size={10} className="text-white fill-white" />
                       <span className="text-[7px] md:text-[8px] font-black text-white uppercase">Best Seller</span>
                    </div>
                  )}
                </div>
                
                <div className="relative flex-1 flex flex-col justify-between py-1 md:py-2">
                  <div>
                    <div className="flex items-center justify-between mb-2 md:mb-3">
                       <div className="flex items-center gap-2">
                          <div className={cn("w-2.5 h-2.5 md:w-3 md:h-3 rounded-[3px] border-2", item.is_veg ? "bg-emerald-500 border-emerald-100" : "bg-red-500 border-red-100")} />
                          <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.is_veg ? 'Pure Veg' : 'Non-Veg'}</span>
                       </div>
                       <button className="text-slate-200 hover:text-red-400 transition-colors"><Heart size={16} /></button>
                    </div>
                    <h4 className="text-base md:text-xl font-black uppercase tracking-tighter text-slate-900 leading-tight group-hover:text-[#ff5a2c] transition-colors pr-6 md:pr-8">{item.name}</h4>
                    <p className="text-[10px] md:text-xs text-slate-400 font-medium line-clamp-2 mt-2 leading-relaxed italic">{item.description || 'A masterpiece crafted for refined palates.'}</p>
                  </div>
                  
                  <div className="flex justify-between items-end mt-4 md:mt-6">
                    <div className="flex flex-col">
                       <span className="hidden md:block text-[9px] font-black text-orange-400 uppercase tracking-widest mb-1">Price Per Serve</span>
                       <span className="text-xl md:text-2xl font-black text-slate-900 italic tracking-tighter">₹{item.price}</span>
                    </div>
                    
                    {cart.find(i => i.id === item.id) ? (
                      <div className="flex items-center gap-4 md:gap-5 bg-slate-900 text-white px-4 md:px-5 py-2.5 md:py-3 rounded-2xl shadow-xl transition-all">
                        <button onClick={() => removeFromCart(item.id)} className="hover:text-red-400 transition-colors"><Minus size={16} /></button>
                        <span className="text-base md:text-lg font-black italic w-4 text-center">{cart.find(i => i.id === item.id).quantity}</span>
                        <button onClick={() => addToCart(item)} className="hover:text-emerald-400 transition-colors"><Plus size={16} /></button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => addToCart(item)}
                        className="bg-white border-2 border-slate-100 text-slate-900 px-6 md:px-8 py-2.5 md:py-3 rounded-2xl text-[9px] md:text-[11px] font-black uppercase tracking-widest hover:bg-[#ff5a2c] hover:text-white hover:border-[#ff5a2c] transition-all shadow-sm active:scale-95 flex items-center gap-2"
                      >
                        <Plus size={12} /> ADD ITEM
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredMenu.length === 0 && (
            <div className="py-24 md:py-32 text-center bg-white rounded-[40px] md:rounded-[48px] border-2 border-dashed border-slate-100">
               <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search size={28} className="text-slate-200" />
               </div>
               <h4 className="text-lg md:text-xl font-black uppercase tracking-tighter text-slate-900">No Matches Found</h4>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Try exploring our other categories</p>
            </div>
          )}
        </section>
      </main>

      {/* Persistent Order Status (Admin Theme) */}
      <AnimatePresence>
        {currentOrder && !showCheckout && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-32 left-6 right-6 z-50 max-w-md mx-auto"
          >
             <div className="bg-slate-900 rounded-[30px] p-6 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10">
                <div className="flex items-center gap-5">
                   <div className="w-14 h-14 rounded-2xl bg-orange-500/20 flex items-center justify-center text-orange-500 border border-orange-500/20">
                      {currentOrder.status === 'preparing' ? <ChefHat size={28} className="animate-bounce" /> : <CheckCircle2 size={28} />}
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Status: {currentOrder.status}</p>
                      <h4 className="text-lg font-black text-white uppercase italic tracking-tighter">
                        {currentOrder.status === 'pending' ? 'Order Secured' : currentOrder.status === 'preparing' ? 'Crafting Flavor' : 'Served & Ready'}
                      </h4>
                   </div>
                </div>
                <button onClick={() => router.push(`/order/${restaurantSlug}/${currentOrder.id}/status`)} className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white hover:bg-white/20 transition-all">
                  <ChevronRight size={24} />
                </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Premium Cart Bar */}
      <AnimatePresence>
        {cart.length > 0 && !showCheckout && (
          <motion.div 
            initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
            className="fixed bottom-8 left-6 right-6 z-[60] max-w-5xl mx-auto"
          >
            <button 
              onClick={() => setShowCheckout(true)}
              className="w-full h-20 bg-[#ff5a2c] rounded-[32px] flex items-center justify-between px-10 shadow-[0_20px_60px_rgba(255,90,44,0.3)] border-4 border-white overflow-hidden relative group"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <div className="flex items-center gap-6 relative">
                 <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">
                    <ShoppingBag size={22} />
                 </div>
                 <div className="text-left">
                    <p className="text-[10px] font-black text-white/70 uppercase tracking-[0.2em]">{cart.reduce((a,b) => a+b.quantity, 0)} Items Selected</p>
                    <p className="text-2xl font-black text-white italic leading-none mt-1">₹{subtotal}</p>
                 </div>
              </div>
              <div className="flex items-center gap-3 text-white font-black text-sm uppercase tracking-widest relative">
                VIEW BUCKET <ChevronRight size={20} className="group-hover:translate-x-2 transition-transform" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Sheet (Ultra-Premium SaaS Style) */}
      <AnimatePresence>
        {showCheckout && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCheckout(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100]" />
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[50px] z-[110] p-12 max-h-[90vh] overflow-y-auto no-scrollbar shadow-[0_-20px_80px_rgba(0,0,0,0.1)] border-t border-slate-100"
            >
              <div className="w-16 h-1.5 bg-slate-100 rounded-full mx-auto mb-12" />
              
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-12">
                  <div>
                    <h3 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">MY <span className="text-[#ff5a2c]">BUCKET</span></h3>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-2">Confirm your selection & place order</p>
                  </div>
                  <button onClick={() => setShowCheckout(false)} className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all"><Plus size={28} className="rotate-45" /></button>
                </div>

                <div className="space-y-6 mb-12">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm group hover:border-orange-100 transition-colors">
                      <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100">
                           <img src={item.image_url} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-black uppercase italic text-lg text-slate-900 group-hover:text-[#ff5a2c] transition-colors">{item.name}</p>
                          <p className="text-xs font-black text-[#ff5a2c] mt-2 tracking-widest">₹{item.price} <span className="text-slate-300 mx-2">/</span> serve</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-5 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                        <button onClick={() => removeFromCart(item.id)} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors"><Minus size={18} /></button>
                        <span className="font-black text-slate-900 text-xl italic w-6 text-center">{item.quantity}</span>
                        <button onClick={() => addToCart(item)} className="w-10 h-10 flex items-center justify-center text-[#ff5a2c] hover:scale-110 transition-transform"><Plus size={18} /></button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 rounded-[40px] p-10 mb-12 border border-slate-100">
                  <div className="space-y-5">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                      <span>Bucket Subtotal</span>
                      <span className="text-slate-900 font-black">₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                      <span>Kitchen Service & Taxes (5%)</span>
                      <span className="text-slate-900 font-black">₹{tax.toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-slate-200 my-6" />
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-black uppercase italic text-slate-900 tracking-tighter">Grand Total</span>
                      <span className="text-5xl font-black italic text-[#ff5a2c] tracking-tighter">₹{grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder || cart.length === 0}
                  className="w-full h-24 rounded-[32px] bg-slate-900 text-white text-2xl font-black italic uppercase tracking-tighter shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-5 group disabled:opacity-50"
                >
                  {isPlacingOrder ? <Loader2 className="w-8 h-8 animate-spin" /> : (
                    <>
                      <UtensilsCrossed size={28} className="group-hover:rotate-12 transition-transform" />
                      SEND TO KITCHEN
                    </>
                  )}
                </button>
                <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-8 italic">Secure Dining Powered by Bhojan Next-Gen</p>
              </div>
            </motion.div>
          </>
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
