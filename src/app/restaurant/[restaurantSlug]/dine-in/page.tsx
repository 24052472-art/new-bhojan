"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Menu as MenuIcon, 
  Loader2, 
  ShoppingBag, 
  Search, 
  MapPin, 
  Clock, 
  Star,
  ChevronRight,
  UtensilsCrossed,
  Sparkles
} from "lucide-react";
import { SidebarDrawer } from "@/components/SidebarDrawer";
import { toast } from "react-hot-toast";

export default function DineInMenuPage() {
  const { restaurantSlug } = useParams();
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const supabase = createClient();

  useEffect(() => {
    // Load session
    const savedSession = localStorage.getItem('bhojan_session');
    if (savedSession) {
      setSession(JSON.parse(savedSession));
    }

    fetchInitialData();
  }, [restaurantSlug]);

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

      // Fetch actual menu categories from the hierarchy table
      const { data: catData, error: catError } = await supabase
        .from("menu_categories")
        .select("*")
        .eq("restaurant_id", resData.id)
        .order('created_at', { ascending: true });
      
      if (catError) throw catError;

      // Fallback: If no categories in menu_categories, try extracting from items (legacy support)
      if (!catData || catData.length === 0) {
        const { data: items } = await supabase.from("menu_items").select("category").eq("restaurant_id", resData.id);
        const uniqueCats = Array.from(new Set(items?.map(i => i.category))).filter(Boolean);
        setCategories(uniqueCats.map(name => ({ name, image_url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400" })));
      } else {
        setCategories(catData);
      }

    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  const handleCategoryClick = (category: any) => {
    const catName = typeof category === 'string' ? category : category.name;
    if (session?.table_number) {
      router.push(`/menu/${restaurantSlug}/${session.table_number}?category=${encodeURIComponent(catName)}`);
    } else {
      router.push(`/scan/${restaurantSlug}`);
    }
  };

  const callWaiter = () => {
    toast.success("Waiter notified! Someone will be with you shortly.", { 
      icon: "🔔",
      style: {
        borderRadius: '16px',
        background: '#fff',
        color: '#111827',
        border: '1px solid #e5e7eb',
        fontSize: '14px',
        fontWeight: 'bold'
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-orange-100 border-t-[#ff5a2c] rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Preparing Menu...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-[#111827]">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-all"
            >
              <MenuIcon size={20} />
            </button>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Dine-in at</span>
              <span className="text-sm font-black text-slate-900 leading-none">{restaurant?.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <button onClick={callWaiter} className="p-2.5 rounded-xl bg-orange-50 text-[#ff5a2c] hover:bg-orange-100 transition-all">
                <ShoppingBag size={20} />
             </button>
             {session?.table_number && (
               <div className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">
                 T-{session.table_number}
               </div>
             )}
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto pb-20">
        {/* Hero Section */}
        <header className="px-6 py-10 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#ff5a2c]">
              <Sparkles size={16} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Premium Dining Experience</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">
              What's on your <br /> 
              <span className="text-[#ff5a2c]">Mind Today?</span>
            </h1>
          </div>

          {/* Search Bar */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#ff5a2c] transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search for pizza, burger, pasta..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 bg-white border border-slate-100 rounded-2xl pl-12 pr-4 text-sm font-medium outline-none focus:border-[#ff5a2c] focus:ring-4 focus:ring-orange-500/5 transition-all shadow-sm"
            />
          </div>
        </header>

        {/* Categories Section */}
        <section className="px-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Main Categories</h3>
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 italic">
               <span>Scroll to explore</span>
               <ChevronRight size={10} />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map((cat, index) => (
              <motion.button
                key={cat.id || cat.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleCategoryClick(cat)}
                className="group relative bg-white border border-slate-100 rounded-[24px] p-2 hover:border-[#ff5a2c] hover:shadow-xl hover:shadow-orange-500/10 transition-all flex flex-col gap-3"
              >
                <div className="aspect-[4/3] rounded-[20px] overflow-hidden bg-slate-50">
                  <img 
                    src={cat.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400"} 
                    alt={cat.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="px-2 pb-2 flex items-center justify-between">
                  <span className="text-sm font-black text-slate-900 uppercase tracking-tighter truncate">{cat.name}</span>
                  <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-orange-50 group-hover:text-[#ff5a2c] transition-all">
                    <ChevronRight size={14} />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {categories.length === 0 && !isLoading && (
            <div className="py-20 text-center bg-white rounded-[32px] border border-dashed border-slate-200">
               <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                  <UtensilsCrossed size={32} />
               </div>
               <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No categories found</p>
            </div>
          )}
        </section>

        {/* Featured / Recommended */}
        <section className="px-6 mt-12 space-y-6">
           <div className="flex items-center justify-between">
             <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Chef's Special</h3>
             <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-[8px] font-black uppercase tracking-widest">Recommended</span>
           </div>
           
           <div className="flex gap-4 overflow-x-auto no-scrollbar px-1 pb-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="min-w-[280px] bg-white rounded-[32px] p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all space-y-4">
                   <div className="relative aspect-video rounded-[24px] overflow-hidden">
                      <img src={`https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=${i}`} className="w-full h-full object-cover" />
                      <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[10px] font-black flex items-center gap-1 shadow-sm">
                         <Star size={10} className="fill-orange-400 text-orange-400" />
                         <span>4.9</span>
                      </div>
                   </div>
                   <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-900">Signature Dish {i}</h4>
                        <p className="text-xs text-slate-400 font-medium">Bestseller in Italian</p>
                      </div>
                      <span className="text-sm font-black text-[#ff5a2c]">₹499</span>
                   </div>
                </div>
              ))}
           </div>
        </section>
      </main>

      {/* Floating Action Button for Call Waiter */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={callWaiter}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 bg-[#ff5a2c] text-white rounded-full font-black uppercase tracking-widest shadow-2xl shadow-orange-500/40 flex items-center gap-3 border-4 border-white"
      >
        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
        Call Waiter
      </motion.button>

      {/* Sidebar Drawer */}
      <SidebarDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        restaurant={restaurant}
      />
    </div>
  );
}
