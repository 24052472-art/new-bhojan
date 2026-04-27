"use client";

import { useEffect, useState, use } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Search, 
  ShoppingCart, 
  Plus, 
  Info,
  ChevronDown,
  Filter,
  MessageSquare,
  Loader2
} from "lucide-react";
import { SidebarDrawer } from "@/components/SidebarDrawer";
import { DishDetailModal } from "@/components/DishDetailModal";
import { toast } from "react-hot-toast";

export default function ProductListPage({ params: paramsPromise }: { params: Promise<{ restaurantSlug: string, categoryName: string }> }) {
  const params = use(paramsPromise);
  const { restaurantSlug, categoryName: encodedCategoryName } = params;
  const categoryName = decodeURIComponent(encodedCategoryName);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [cart, setCart] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchInitialData();
    // Hydrate cart from localStorage
    const savedCart = localStorage.getItem('bhojan_cart');
    if (savedCart) setCart(JSON.parse(savedCart));
  }, [restaurantSlug, categoryName]);

  async function fetchInitialData() {
    setIsLoading(true);
    try {
      // Fetch restaurant
      const { data: resData, error: resError } = await supabase
        .from("restaurants")
        .select("*")
        .eq("slug", restaurantSlug)
        .single();
      
      if (resError || !resData) throw new Error("Restaurant not found");
      setRestaurant(resData);

      // Fetch all items to get categories for the tab bar
      const { data: allItems, error: itemsError } = await supabase
        .from("menu_items")
        .select("category")
        .eq("restaurant_id", resData.id)
        .eq("is_available", true);
      
      if (itemsError) throw itemsError;
      const cats = Array.from(new Set(allItems?.map(i => i.category || "General") || []));
      setAllCategories(cats);

      // Fetch menu items for current category
      const { data: menuData, error: menuError } = await supabase
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", resData.id)
        .eq("category", categoryName)
        .eq("is_available", true);
      
      if (menuError) throw menuError;
      setItems(menuData || []);

    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  const handleAddToCart = (cartItem: any) => {
    setCart(prev => {
      let cart = [...prev];
      const existingIndex = cart.findIndex((i: any) => i.uniqueId === cartItem.uniqueId);
      if (existingIndex > -1) {
        cart[existingIndex].quantity += cartItem.quantity;
      } else {
        cart.push(cartItem);
      }
      localStorage.setItem('bhojan_cart', JSON.stringify(cart));
      return cart;
    });
    toast.success(`${cartItem.name} added to bucket`);
  };

  const handleQuickAdd = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    handleAddToCart({
      ...item,
      quantity: 1,
      selectedSize: "Regular",
      selectedAddons: [],
      uniqueId: `${item.id}-Regular-`
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#f97316] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] text-[#111827] font-sans pb-32">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push(`/restaurant/${restaurantSlug}/dine-in`)}
              className="p-2 hover:bg-slate-50 rounded-full transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center shadow-lg shadow-yellow-400/20">
              <div className="flex flex-col gap-1">
                <div className="w-4 h-0.5 bg-black rounded-full" />
                <div className="w-4 h-0.5 bg-black rounded-full" />
                <div className="w-4 h-0.5 bg-black rounded-full" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <button className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-widest">
                Feedback <MessageSquare size={14} className="fill-white" />
             </button>
             <button 
                onClick={() => router.push(`/restaurant/${restaurantSlug}/dine-in/checkout`)}
                className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 relative group"
              >
                <ShoppingCart size={20} className="text-slate-700" />
                {cart.length > 0 && (
                   <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#ff5a2c] text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                      {cart.reduce((a, b) => a + b.quantity, 0)}
                   </span>
                )}
             </button>
          </div>
        </div>

        {/* Horizontal Category Tabs */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar px-6 pb-4 pt-2">
           {allCategories.map(cat => (
              <button
                key={cat}
                onClick={() => router.push(`/restaurant/${restaurantSlug}/dine-in/category/${encodeURIComponent(cat)}`)}
                className={`whitespace-nowrap px-6 py-2.5 rounded-full text-xs font-bold transition-all ${
                  cat === categoryName 
                    ? 'bg-black text-white shadow-lg' 
                    : 'bg-white border border-slate-100 text-slate-500 hover:border-slate-200'
                }`}
              >
                {cat}
              </button>
           ))}
        </div>
      </header>

      {/* Product List */}
      <main className="px-6 py-8 max-w-2xl mx-auto space-y-10">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black uppercase tracking-tighter text-[#111827] italic">
            {categoryName}
          </h2>
          <ChevronDown size={24} className="text-slate-400" />
        </div>

        <div className="space-y-6">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
              className="bg-white p-4 rounded-[28px] shadow-sm border border-slate-50 flex gap-4 hover:shadow-xl hover:shadow-slate-200/50 transition-all cursor-pointer group"
              onClick={() => setSelectedItem(item)}
            >
              {/* Product Image with Shared Element Layout ID */}
              <motion.div 
                layoutId={`image-${item.id}`}
                className="w-28 h-28 md:w-32 md:h-32 rounded-[22px] overflow-hidden bg-slate-100 shrink-0 border border-slate-50"
              >
                <img 
                  src={item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400"} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  alt={item.name}
                />
              </motion.div>

              {/* Product Info */}
              <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                  <h3 className="text-lg font-bold text-[#1a1c2e] leading-tight group-hover:text-[#ff5a2c] transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium line-clamp-2 mt-2 leading-relaxed">
                    {item.description || "A delicious signature dish crafted with premium ingredients."}
                  </p>
                </div>
                
                <div className="flex justify-between items-center mt-3">
                  <span className="text-lg font-black text-[#1a1c2e]">
                    ₹{item.price}.00
                  </span>
                  <button 
                    onClick={(e) => handleQuickAdd(e, item)}
                    className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-colors"
                  >
                    <Plus size={14} /> ADD
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Floating Bottom Cart Bar */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-8 left-6 right-6 z-50 max-w-md mx-auto"
          >
            <button 
              onClick={() => router.push(`/restaurant/${restaurantSlug}/dine-in/checkout`)}
              className="w-full bg-[#ff5a2c] h-18 rounded-[24px] flex items-center justify-between px-6 shadow-2xl shadow-orange-500/30 text-white group"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ShoppingBag size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Check Out Bucket</p>
                  <p className="text-xl font-black italic">₹{cart.reduce((a, b) => a + (b.price * b.quantity), 0)}.00</p>
                </div>
              </div>
              <ArrowLeft className="w-6 h-6 rotate-180 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dish Detail Modal (Bottom Sheet) */}
      <DishDetailModal 
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}
