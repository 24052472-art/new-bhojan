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
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { FeedbackModal } from "@/components/FeedbackModal";

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
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const supabase = createClient();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    fetchData();
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
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
        .select(`*, menu_item_groups (name, menu_subcategories (name))`)
        .eq("restaurant_id", resData.id)
        .eq("is_available", true);
      
      const items = (menuData || []).map((item: any) => ({
        ...item,
        display_category: item.menu_item_groups?.menu_subcategories?.name || item.category || "General"
      }));
      
      setMenu(items);
      setCategories(["All", ...Array.from(new Set(items.map((i: any) => i.display_category)))]);

      const savedOrderId = localStorage.getItem(`order_${restaurantSlug}_${tableId}`);
      if (savedOrderId) {
        const { data: orderData } = await supabase.from("orders").select("*").eq("id", savedOrderId).single();
        if (orderData && orderData.status !== 'completed' && orderData.status !== 'cancelled') {
          setCurrentOrder(orderData);
        }
      }
      setupRealtime(resData.id);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function setupRealtime(resId: string) {
    const channelName = `bhojan-sync-${resId}`;
    const channel = supabase.channel(channelName);
    channel.subscribe();
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

      const { data: order, error: orderError } = await supabase.from("orders").insert([{
        restaurant_id: restaurant.id, 
        table_id: tableData.id, 
        status: 'pending', 
        payment_status: 'unpaid',
        total_amount: cart.reduce((acc, i) => acc + (i.price * i.quantity), 0),
        customer_name: localStorage.getItem("guest_name") || "Public Guest"
      }]).select().single();

      if (orderError) throw orderError;

      const orderItems = cart.map(item => ({ order_id: order.id, menu_item_id: item.id, quantity: item.quantity, unit_price: item.price, total_price: item.price * item.quantity }));
      await supabase.from("order_items").insert(orderItems);
      await supabase.from("tables").update({ status: 'occupied' }).eq("id", tableData.id);

      if (channelRef.current) {
        channelRef.current.send({ type: 'broadcast', event: 'refresh_kitchen', payload: { type: 'NEW_ORDER', tableNum: tableId } });
      }

      localStorage.setItem(`order_${restaurantSlug}_${tableId}`, order.id);
      toast.success("Transmission Complete. Order Sent.");
      router.push(`/menu/${restaurantSlug}/${tableId}/status`);
    } catch (err: any) { 
      toast.error(err.message); 
    } finally { 
      setIsPlacingOrder(false); 
    }
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  
  // Grouping logic for "All"
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
    <div className="min-h-screen bg-[#f8f9fb] flex flex-col">
      
      {/* Premium Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-slate-100 px-8 py-8 shadow-sm">
         <div className="max-w-[1400px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-8">
               <div className="w-14 h-14 rounded-[24px] bg-[#ff5a2c] flex items-center justify-center text-white shadow-xl shadow-orange-500/20">
                  <UtensilsCrossed size={28} />
               </div>
               <div className="hidden sm:block">
                  <h1 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">{restaurant?.name}</h1>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2 italic">STATION TERMINAL T-{tableId}</p>
               </div>
            </div>

            <div className="flex items-center gap-6 flex-1 max-w-xl mx-8">
               <div className="relative w-full group">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4 group-focus-within:text-[#ff5a2c] transition-colors" />
                  <input 
                    placeholder="SCAN FLAVORS..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-16 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:bg-white focus:border-[#ff5a2c] transition-all italic"
                  />
               </div>
            </div>

            <button onClick={() => setIsCheckoutOpen(true)} className="relative h-16 px-6 bg-slate-900 rounded-3xl flex items-center gap-4 text-white shadow-2xl hover:scale-105 active:scale-95 transition-all">
               <ShoppingBag size={24} />
               <span className="text-[11px] font-black italic tracking-tighter">₹{subtotal}</span>
               {cart.length > 0 && <span className="absolute -top-1 -right-1 w-6 h-6 bg-[#ff5a2c] text-white text-[9px] font-black rounded-full flex items-center justify-center border-4 border-white animate-bounce">{cart.reduce((a,b)=>a+b.quantity,0)}</span>}
            </button>
         </div>
      </header>

      <main className="flex-1 max-w-[1400px] mx-auto w-full px-8 py-12 flex flex-col lg:flex-row gap-16 relative">
         
         {/* Main Menu Area */}
         <div className="flex-1 space-y-16">
            
            {/* Rectangle Fluid Tabs */}
            <section className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-4 sticky top-32 z-40 bg-[#f8f9fb]/80 backdrop-blur-xl">
               {categories.map((cat) => (
                 <button
                   key={cat} onClick={() => setSelectedCategory(cat)}
                   className={cn(
                     "min-w-[160px] h-24 rounded-[32px] flex flex-col items-center justify-center gap-2 transition-all border-4 italic shadow-sm",
                     selectedCategory === cat ? "bg-white border-[#ff5a2c] text-slate-900 shadow-xl shadow-orange-500/5 scale-105" : "bg-white border-slate-50 text-slate-300 hover:border-slate-100"
                   )}
                 >
                    <span className="text-[11px] font-black uppercase tracking-[0.2em]">{cat}</span>
                    <div className={cn("w-2 h-2 rounded-full", selectedCategory === cat ? "bg-[#ff5a2c]" : "bg-transparent")} />
                 </button>
               ))}
            </section>

            {/* Menu Grid with Grouping Support */}
            <div className="space-y-24 pb-48">
               {selectedCategory === "All" ? (
                 groupedMenu.map((group) => (
                   <div key={group.name} className="space-y-10">
                      <div className="flex items-center gap-6">
                         <h3 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">{group.name}</h3>
                         <div className="h-px flex-1 bg-slate-200/60" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                         {group.items.map(item => <ItemCard key={item.id} item={item} addToCart={addToCart} removeFromCart={removeFromCart} cart={cart} setSelectedItem={setSelectedItem} />)}
                      </div>
                   </div>
                 ))
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                    {menu.filter(i => i.display_category === selectedCategory && i.name.toLowerCase().includes(searchQuery.toLowerCase())).map(item => <ItemCard key={item.id} item={item} addToCart={addToCart} removeFromCart={removeFromCart} cart={cart} setSelectedItem={setSelectedItem} />)}
                 </div>
               )}
            </div>
         </div>

         {/* Smart Sticky Cart Panel (Desktop Only) */}
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

      {/* Mobile Bottom Sheet Cart Shortcut */}
      <AnimatePresence>
         {cart.length > 0 && (
           <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed bottom-10 left-8 right-8 z-[100] xl:hidden">
              <button onClick={() => setIsCheckoutOpen(true)} className="w-full h-24 bg-slate-900 rounded-[40px] flex items-center justify-between px-10 shadow-2xl border-b-8 border-orange-500">
                 <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white"><ShoppingBag size={24} /></div>
                    <div className="text-left">
                       <p className="text-[9px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">{cart.reduce((a,b)=>a+b.quantity,0)} ITEMS SECURED</p>
                       <p className="text-3xl font-black text-white italic tracking-tighter leading-none">₹{subtotal}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4 text-white font-black uppercase italic tracking-[0.2em] text-xs">REVIEW <ChevronRight size={20} /></div>
              </button>
           </motion.div>
         )}
      </AnimatePresence>

      {/* Dish Detail Modal (Premium) */}
      <AnimatePresence>
         {selectedItem && (
           <div className="fixed inset-0 z-[1000] flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-3xl">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 60 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 1.1 }}
                className="bg-white w-full max-w-5xl rounded-[80px] shadow-[0_80px_200px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row relative"
              >
                 <button onClick={() => setSelectedItem(null)} className="absolute top-10 right-10 z-[110] w-16 h-16 rounded-[28px] bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-xl"><X size={32} /></button>
                 
                 <div className="flex-1 aspect-square md:aspect-auto relative overflow-hidden bg-slate-50">
                    {selectedItem.image_url ? (
                      <img src={selectedItem.image_url} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[15rem] font-black text-slate-100 italic uppercase select-none">{selectedItem.name.charAt(0)}</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent md:hidden" />
                 </div>

                 <div className="flex-1 p-16 md:p-24 flex flex-col justify-between">
                    <div className="space-y-12">
                       <div className="space-y-6">
                          <div className="flex items-center gap-4">
                             <div className={cn("w-4 h-4 rounded-full border-4 bg-white shadow-sm", selectedItem.is_veg ? "border-emerald-500" : "border-red-500")}>
                                <div className={cn("w-full h-full rounded-full", selectedItem.is_veg ? "bg-emerald-500" : "bg-red-500")} />
                             </div>
                             <span className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 italic">CRAFTED EXTRACT</span>
                          </div>
                          <h2 className="text-6xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">{selectedItem.name}</h2>
                          <p className="text-lg font-medium text-slate-400 italic leading-relaxed">{selectedItem.description || "A masterfully balanced composition of flavors, optimized for your palate."}</p>
                       </div>

                       <div className="flex items-center gap-12">
                          <div className="space-y-2">
                             <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic leading-none">PREP TIME</p>
                             <div className="flex items-center gap-2 text-xl font-black italic tracking-tighter text-slate-900"><Clock size={18} className="text-orange-500" /> 15-20 MIN</div>
                          </div>
                          <div className="space-y-2">
                             <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic leading-none">VALUATION</p>
                             <p className="text-4xl font-black italic tracking-tighter text-orange-500 leading-none">₹{selectedItem.price}</p>
                          </div>
                       </div>
                    </div>

                    <div className="pt-16 mt-16 border-t border-slate-50 flex flex-col gap-6">
                       <div className="flex items-center gap-10">
                          <div className="flex-1 h-24 bg-slate-50 rounded-[36px] flex items-center justify-between px-10 border border-slate-100 shadow-inner">
                             <button onClick={() => removeFromCart(selectedItem.id)} className="w-12 h-12 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors"><Minus size={32} /></button>
                             <span className="text-4xl font-black italic text-slate-900">{cart.find(i => i.id === selectedItem.id)?.quantity || 0}</span>
                             <button onClick={() => addToCart(selectedItem)} className="w-12 h-12 flex items-center justify-center text-[#ff5a2c] hover:scale-125 transition-transform"><Plus size={32} /></button>
                          </div>
                          <button onClick={() => { addToCart(selectedItem); setSelectedItem(null); }} className="h-24 px-16 bg-slate-900 text-white rounded-[36px] text-xl font-black uppercase italic tracking-widest shadow-2xl hover:bg-orange-500 transition-all active:scale-95">SECURE ITEM</button>
                       </div>
                    </div>
                 </div>
              </motion.div>
           </div>
         )}
      </AnimatePresence>

      {/* Full Screen Checkout Protocol (Mobile Bottom Sheet / Desktop Modal Overlay) */}
      <AnimatePresence>
         {isCheckoutOpen && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500] bg-slate-900/40 backdrop-blur-3xl flex items-end md:items-center justify-center">
              <motion.div 
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                className="bg-white w-full max-w-4xl max-h-[90vh] rounded-t-[60px] md:rounded-[80px] shadow-[0_50px_150px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden relative"
              >
                 <div className="p-12 md:p-16 border-b border-slate-50 flex items-center justify-between">
                    <div className="space-y-4">
                       <h3 className="text-5xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">ORDER <span className="text-orange-500">BUCKET</span></h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] italic">STATION T-{tableId} EXTRACTION</p>
                    </div>
                    <button onClick={() => setIsCheckoutOpen(false)} className="w-16 h-16 rounded-[28px] bg-slate-50 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"><X size={32} /></button>
                 </div>
                 <div className="flex-1 overflow-y-auto p-12 md:p-16 space-y-8 no-scrollbar">
                    {cart.map(item => (
                      <div key={item.id} className="flex justify-between items-center group bg-slate-50/50 p-8 rounded-[48px] border border-slate-50">
                         <div className="flex items-center gap-10">
                            <div className="w-24 h-24 rounded-[32px] bg-white shadow-xl overflow-hidden flex items-center justify-center text-4xl font-black text-slate-100 italic">
                               {item.image_url ? <img src={item.image_url} className="w-full h-full object-cover" /> : item.name.charAt(0)}
                            </div>
                            <div className="space-y-2">
                               <p className="font-black uppercase italic text-3xl text-slate-900 tracking-tighter leading-none">{item.name}</p>
                               <p className="text-xl font-black text-orange-500 italic">₹{item.price}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-8 bg-slate-900 text-white p-3 rounded-[32px] shadow-2xl">
                            <button onClick={() => removeFromCart(item.id)} className="w-12 h-12 flex items-center justify-center hover:text-red-400 transition-colors"><Minus size={24} /></button>
                            <span className="font-black italic text-2xl min-w-[32px] text-center">{item.quantity}</span>
                            <button onClick={() => addToCart(item)} className="w-12 h-12 flex items-center justify-center hover:text-orange-400 transition-colors"><Plus size={24} /></button>
                         </div>
                      </div>
                    ))}
                 </div>
                 <div className="p-12 md:p-16 bg-slate-50/80 backdrop-blur-xl border-t border-slate-100 space-y-12">
                    <div className="flex justify-between items-end">
                       <span className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] italic">FINAL VALUATION</span>
                       <span className="text-7xl font-black text-slate-900 italic tracking-tighter leading-none">₹{subtotal}</span>
                    </div>
                    <button 
                      onClick={handlePlaceOrder} disabled={isPlacingOrder || cart.length === 0}
                      className="w-full h-28 bg-orange-500 rounded-[48px] text-white text-3xl font-black italic uppercase tracking-[0.2em] shadow-2xl hover:bg-orange-600 transition-all flex items-center justify-center gap-8"
                    >
                       {isPlacingOrder ? <Loader2 className="animate-spin w-12 h-12" /> : <><Send size={48} /> TRANSMIT TO KITCHEN</>}
                    </button>
                 </div>
              </motion.div>
           </motion.div>
         )}
      </AnimatePresence>

    </div>
  );
}

function ItemCard({ item, addToCart, removeFromCart, cart, setSelectedItem }: any) {
   const qty = cart.find((i: any) => i.id === item.id)?.quantity || 0;
   return (
      <motion.div 
         whileHover={{ y: -10 }}
         className="bg-white rounded-[56px] border border-slate-100 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-orange-500/5 transition-all duration-500 group relative"
      >
         <div onClick={() => setSelectedItem(item)} className="relative aspect-product overflow-hidden bg-slate-50 cursor-pointer">
            {item.image_url ? (
              <img src={item.image_url} className="w-full h-full object-cover transition-transform duration-[4s] group-hover:scale-110" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-7xl font-black text-slate-100 italic uppercase select-none">{item.name.charAt(0)}</div>
            )}
            <div className="absolute top-8 left-8 flex flex-col gap-3">
               <div className={cn("w-3 h-3 rounded-[3px] border-2 bg-white", item.is_veg ? "border-emerald-500" : "border-red-500")}>
                  <div className={cn("w-full h-full rounded-full", item.is_veg ? "bg-emerald-500" : "bg-red-500")} />
               </div>
            </div>
            {item.is_best_seller && (
               <div className="absolute bottom-8 left-8 px-6 py-2 bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.4em] rounded-full shadow-2xl italic flex items-center gap-2">
                  <Flame size={12} className="text-orange-500" /> BEST SELLER
               </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
               <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-900 opacity-0 group-hover:opacity-100 transition-all scale-0 group-hover:scale-100 shadow-2xl">
                  <Plus size={32} />
               </div>
            </div>
         </div>
         
         <div className="p-10 space-y-8">
            <div className="space-y-3 cursor-pointer" onClick={() => setSelectedItem(item)}>
               <h4 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 group-hover:text-[#ff5a2c] transition-colors leading-none">{item.name}</h4>
               <p className="text-[11px] font-medium text-slate-400 line-clamp-2 italic leading-relaxed">{item.description || "A masterfully prepared delicacy."}</p>
            </div>
            
            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
               <div className="space-y-1">
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest italic leading-none">VALUATION</span>
                  <p className="text-3xl font-black text-slate-900 italic tracking-tighter leading-none">₹{item.price}</p>
               </div>
               
               {qty > 0 ? (
                 <div className="flex items-center gap-4 bg-slate-900 text-white p-2 rounded-2xl shadow-xl">
                    <button onClick={() => removeFromCart(item.id)} className="w-10 h-10 flex items-center justify-center hover:text-red-400 transition-colors"><Minus size={18} /></button>
                    <span className="font-black italic min-w-[20px] text-center text-xl">{qty}</span>
                    <button onClick={() => addToCart(item)} className="w-10 h-10 flex items-center justify-center hover:text-orange-400 transition-colors"><Plus size={18} /></button>
                 </div>
               ) : (
                 <button 
                   onClick={() => addToCart(item)}
                   className="h-16 px-8 bg-white border-2 border-slate-100 rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm italic active:scale-95"
                 >
                    SECURE ITEM
                 </button>
               )}
            </div>
         </div>
      </motion.div>
   );
}

function Send({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
    </svg>
  );
}
