"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Minus, 
  Plus, 
  Check,
  ShoppingBag,
  Info
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

interface DishDetailModalProps {
  item: any;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: any) => void;
}

export function DishDetailModal({ item, isOpen, onClose, onAddToCart }: DishDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("Regular");
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setSelectedSize("Regular");
      setSelectedAddons([]);
      setNotes("");
    }
  }, [isOpen, item]);

  if (!item) return null;

  const sizes = ["Small", "Regular", "Large"];
  const addons = [
    { name: "Extra Cheese", price: 30 },
    { name: "Spicy Dip", price: 20 },
    { name: "Grilled Veggies", price: 40 }
  ];

  const totalPrice = (item.price + (selectedSize === "Large" ? 50 : selectedSize === "Small" ? -20 : 0) + 
    selectedAddons.reduce((acc, name) => acc + (addons.find(a => a.name === name)?.price || 0), 0)) * quantity;

  const handleAdd = () => {
    onAddToCart({
      ...item,
      quantity,
      selectedSize,
      selectedAddons,
      notes,
      uniqueId: `${item.id}-${selectedSize}-${selectedAddons.join(',')}`
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[110] bg-white rounded-t-[40px] max-h-[92vh] overflow-y-auto no-scrollbar shadow-2xl"
          >
            {/* Grab Handle */}
            <div className="w-full flex justify-center py-4 sticky top-0 bg-white z-10">
              <div className="w-12 h-1.5 bg-slate-100 rounded-full" />
            </div>

            <div className="px-6 pb-40">
              {/* Close Button */}
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 z-20"
              >
                <X size={20} />
              </button>

              {/* Hero Image */}
              <motion.div 
                layoutId={`image-${item.id}`}
                className="relative aspect-square rounded-[32px] overflow-hidden shadow-xl mb-8"
              >
                <img 
                  src={item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800"} 
                  className="w-full h-full object-cover"
                  alt={item.name}
                />
              </motion.div>

              {/* Title & Price */}
              <div className="flex justify-between items-start gap-4 mb-3">
                <h2 className="text-2xl font-bold text-[#1a1c2e] leading-tight">
                  {item.name}
                </h2>
                <span className="text-xl font-black text-[#1a1c2e]">
                  ₹{item.price}.00
                </span>
              </div>
              
              <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">
                {item.description || "A masterfully prepared dish combining traditional techniques with modern flavors."}
              </p>

              {/* Advanced Options Sections */}
              <div className="space-y-10">
                {/* Sizes */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Select Size</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {sizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`h-12 rounded-xl border-2 font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                          selectedSize === size 
                            ? 'border-[#ff5a2c] bg-orange-50 text-[#ff5a2c]' 
                            : 'border-slate-50 bg-slate-50 text-slate-500 hover:border-slate-200'
                        }`}
                      >
                        {size}
                        {selectedSize === size && <Check size={12} />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Add-ons */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Extras</h3>
                  <div className="space-y-2">
                    {addons.map(addon => (
                      <label 
                        key={addon.name}
                        className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                          selectedAddons.includes(addon.name)
                            ? 'border-[#ff5a2c] bg-orange-50'
                            : 'border-slate-50 bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                            selectedAddons.includes(addon.name) ? 'bg-[#ff5a2c] text-white' : 'bg-slate-200'
                          }`}>
                            {selectedAddons.includes(addon.name) && <Check size={12} />}
                          </div>
                          <span className={`font-bold text-xs ${selectedAddons.includes(addon.name) ? 'text-[#ff5a2c]' : 'text-slate-600'}`}>
                            {addon.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-black text-slate-400">+ ₹{addon.price}</span>
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

                {/* Instructions */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Special Instructions</h3>
                  <textarea 
                    placeholder="E.g. No onions, extra spicy..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full h-24 bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-xs focus:border-[#ff5a2c] focus:bg-white outline-none transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Sticky Bottom Actions */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/90 backdrop-blur-xl border-t border-slate-50 z-[120]">
              <div className="max-w-xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 bg-slate-50 p-2 rounded-2xl">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400 hover:text-[#ff5a2c]"
                    >
                      <Minus size={18} />
                    </button>
                    <span className="text-base font-black w-4 text-center">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400 hover:text-[#ff5a2c]"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Price</p>
                    <p className="text-2xl font-black text-[#1a1c2e]">₹{totalPrice}.00</p>
                  </div>
                </div>
                
                <button 
                  onClick={handleAdd}
                  className="w-full h-16 bg-[#ff5a2c] hover:bg-[#ea580c] text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-orange-500/20 transition-all active:scale-95"
                >
                  <ShoppingBag size={20} />
                  Add to Bucket
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
