"use client";

import { useEffect, useState, use } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Minus, 
  Plus, 
  Check,
  ShoppingBag,
  Loader2,
  ChevronRight
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function DishDetailPage({ params: paramsPromise }: { params: Promise<{ restaurantSlug: string, categoryName: string, itemId: string }> }) {
  const params = use(paramsPromise);
  const { restaurantSlug, itemId } = params;
  
  const router = useRouter();
  const [item, setItem] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState("Regular");
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const supabase = createClient();

  useEffect(() => {
    fetchItem();
  }, [itemId]);

  async function fetchItem() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("id", itemId)
        .single();
      
      if (error) throw error;
      setItem(data);
    } catch (err: any) {
      toast.error(err.message);
      router.back();
    } finally {
      setIsLoading(false);
    }
  }

  const addToCart = () => {
    const cartItem = {
      ...item,
      quantity,
      selectedSize,
      selectedAddons,
      notes,
      uniqueId: `${item.id}-${selectedSize}-${selectedAddons.join(',')}`
    };

    const savedCart = localStorage.getItem('bhojan_cart');
    let cart = savedCart ? JSON.parse(savedCart) : [];
    
    // Check if identical item already in cart
    const existingIndex = cart.findIndex((i: any) => i.uniqueId === cartItem.uniqueId);
    if (existingIndex > -1) {
      cart[existingIndex].quantity += quantity;
    } else {
      cart.push(cartItem);
    }

    localStorage.setItem('bhojan_cart', JSON.stringify(cart));
    toast.success("Added to cart!");
    router.back();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#f97316] animate-spin" />
      </div>
    );
  }

  const sizes = ["Small", "Regular", "Large"];
  const addons = [
    { name: "Extra Cheese", price: 30 },
    { name: "Spicy Dip", price: 20 },
    { name: "Grilled Veggies", price: 40 }
  ];

  const totalPrice = (item.price + (selectedSize === "Large" ? 50 : selectedSize === "Small" ? -20 : 0) + 
    selectedAddons.reduce((acc, name) => acc + (addons.find(a => a.name === name)?.price || 0), 0)) * quantity;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="min-h-screen bg-white text-[#111827] font-sans pb-40"
    >
      {/* Top Nav */}
      <header className="px-6 py-6 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <button 
          onClick={() => router.back()}
          className="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Details</span>
        <div className="w-11" /> {/* Spacer */}
      </header>

      <main className="max-w-xl mx-auto px-6">
        {/* Hero Image */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative aspect-square rounded-[40px] overflow-hidden shadow-2xl mb-10 border border-slate-100"
        >
          <img 
            src={item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800"} 
            className="w-full h-full object-cover"
            alt={item.name}
          />
        </motion.div>

        {/* Title & Info */}
        <div className="flex justify-between items-start gap-4 mb-4">
          <h1 className="text-3xl font-bold tracking-tight text-[#1a1c2e] leading-tight">
            {item.name}
          </h1>
          <span className="text-2xl font-black text-[#1a1c2e]">
            ₹{item.price}.00
          </span>
        </div>
        
        <p className="text-slate-500 font-medium leading-relaxed mb-10">
          {item.description || "A masterfully prepared dish combining traditional techniques with modern flavors. Crafted using only the finest locally sourced ingredients for an unforgettable dining experience."}
        </p>

        {/* Size Selection */}
        <div className="space-y-4 mb-10">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Select Size</h3>
          <div className="grid grid-cols-3 gap-3">
            {sizes.map(size => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`h-14 rounded-2xl border-2 font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  selectedSize === size 
                    ? 'border-[#ff5a2c] bg-orange-50 text-[#ff5a2c]' 
                    : 'border-slate-50 bg-slate-50 text-slate-500 hover:border-slate-200'
                }`}
              >
                {size}
                {selectedSize === size && <Check size={14} />}
              </button>
            ))}
          </div>
        </div>

        {/* Add-ons */}
        <div className="space-y-4 mb-10">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Extras & Add-ons</h3>
          <div className="space-y-3">
            {addons.map(addon => (
              <label 
                key={addon.name}
                className={`flex items-center justify-between p-5 rounded-[24px] border-2 transition-all cursor-pointer ${
                  selectedAddons.includes(addon.name)
                    ? 'border-[#ff5a2c] bg-orange-50'
                    : 'border-slate-50 bg-slate-50 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                    selectedAddons.includes(addon.name) ? 'bg-[#ff5a2c] text-white' : 'bg-slate-200'
                  }`}>
                    {selectedAddons.includes(addon.name) && <Check size={14} />}
                  </div>
                  <span className={`font-bold text-sm ${selectedAddons.includes(addon.name) ? 'text-[#ff5a2c]' : 'text-slate-600'}`}>
                    {addon.name}
                  </span>
                </div>
                <span className="text-xs font-black text-slate-400">+ ₹{addon.price}</span>
                <input 
                  type="checkbox"
                  className="hidden"
                  checked={selectedAddons.includes(addon.name)}
                  onChange={() => {
                    setSelectedAddons(prev => 
                      prev.includes(addon.name) 
                        ? prev.filter(a => a !== addon.name)
                        : [...prev, addon.name]
                    )
                  }}
                />
              </label>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-4 mb-10">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Special Instructions</h3>
          <textarea 
            placeholder="E.g. No onions, make it extra spicy, etc."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full h-32 bg-slate-50 border-2 border-slate-50 rounded-[24px] p-6 text-sm focus:border-[#ff5a2c] focus:bg-white outline-none transition-all resize-none"
          />
        </div>

        {/* Quantity Stepper (Sticky-ish) */}
        <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[32px] border border-slate-100">
          <span className="text-sm font-bold text-[#1a1c2e]">Quantity</span>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400 hover:text-[#ff5a2c] transition-colors"
            >
              <Minus size={18} />
            </button>
            <span className="text-lg font-black w-4 text-center">{quantity}</span>
            <button 
              onClick={() => setQuantity(quantity + 1)}
              className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400 hover:text-[#ff5a2c] transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
      </main>

      {/* Sticky Bottom Bar */}
      <footer className="fixed bottom-0 left-0 right-0 p-8 bg-white/80 backdrop-blur-xl border-t border-slate-50 z-[60]">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Price</span>
            <span className="text-2xl font-black text-[#1a1c2e]">₹{totalPrice}.00</span>
          </div>
          <button 
            onClick={addToCart}
            className="flex-1 h-16 bg-[#ff5a2c] hover:bg-[#ea580c] text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-orange-500/20 transition-all active:scale-95"
          >
            <ShoppingBag size={20} />
            Add to Bucket
          </button>
        </div>
      </footer>
    </motion.div>
  );
}
