"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Heart, Star, MessageSquare, Utensils, Zap, Smile, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  defaultName?: string;
}

export function FeedbackModal({ isOpen, onClose, restaurantId, defaultName }: FeedbackModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [name, setName] = useState(defaultName || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && defaultName) {
      setName(defaultName);
    }
  }, [isOpen, defaultName]);

  const categories = [
    { name: "Food Quality", icon: Utensils },
    { name: "Service", icon: Zap },
    { name: "Ambience", icon: Star },
    { name: "Beverage Quality", icon: Heart },
  ];

  const emojis = [
    { val: 1, img: "😠", label: "Very Bad" },
    { val: 2, img: "😟", label: "Bad" },
    { val: 3, img: "😐", label: "Average" },
    { val: 4, img: "🙂", label: "Good" },
    { val: 5, img: "🤩", label: "Loved it!" },
  ];

  const supabase = createClient();

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please provide a rating");
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("feedbacks").insert({
        restaurant_id: restaurantId,
        rating,
        categories: selectedCategories,
        comment,
        customer_name: name || "Guest"
      });
      if (error) throw error;
      toast.success("Feedback submitted! Thank you.");
      onClose();
      // Reset state
      setRating(0);
      setSelectedCategories([]);
      setComment("");
      setName("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:left-1/2 md:-translate-x-1/2 md:w-[480px] z-[210] bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-8 pb-4 flex items-center justify-between border-b border-slate-50">
               <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Voice your <span className="text-[#ff5a2c]">Thoughts</span></h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">It would mean a lot to us!</p>
               </div>
               <button onClick={onClose} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all">
                  <X size={20} />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-10">
               {/* Emojis */}
               <div className="space-y-6">
                  <p className="text-center text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 italic">How was your visit?</p>
                  <div className="flex justify-between items-center gap-2">
                     {emojis.map((e) => (
                       <button 
                         key={e.val} onClick={() => setRating(e.val)}
                         className={`flex flex-col items-center gap-2 transition-all ${rating === e.val ? 'scale-125' : 'grayscale opacity-40 hover:grayscale-0 hover:opacity-100'}`}
                       >
                          <span className="text-4xl">{e.img}</span>
                          <span className={`text-[8px] font-black uppercase tracking-widest ${rating === e.val ? 'text-[#ff5a2c]' : 'text-slate-400'}`}>{e.label}</span>
                       </button>
                     ))}
                  </div>
               </div>

               {/* Impact Categories */}
               <div className="space-y-6">
                  <p className="text-center text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 italic">What impacted your rating?</p>
                  <div className="grid grid-cols-2 gap-3">
                     {categories.map((cat) => (
                       <button 
                         key={cat.name} onClick={() => toggleCategory(cat.name)}
                         className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${selectedCategories.includes(cat.name) ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-[#ff5a2c]'}`}
                       >
                          <cat.icon size={14} className={selectedCategories.includes(cat.name) ? 'text-[#ff5a2c]' : ''} />
                          <span className="text-[9px] font-black uppercase tracking-widest">{cat.name}</span>
                       </button>
                     ))}
                  </div>
               </div>

               {/* Comment */}
               <div className="space-y-4">
                  <p className="text-left text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 italic">Would you like to add anything?</p>
                  <div className="space-y-4">
                     <input 
                       type="text" placeholder="Your Name (Optional)" value={name} onChange={(e) => setName(e.target.value)}
                       className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-6 text-[11px] font-bold outline-none focus:border-[#ff5a2c] transition-all"
                     />
                     <textarea 
                       placeholder="Tell us about your experience..." value={comment} onChange={(e) => setComment(e.target.value)}
                       className="w-full h-32 bg-slate-50 border border-slate-100 rounded-2xl p-6 text-[11px] font-bold outline-none focus:border-[#ff5a2c] transition-all resize-none"
                     />
                  </div>
               </div>
            </div>

            {/* Submit */}
            <div className="p-8 pt-0">
               <button 
                 onClick={handleSubmit} disabled={isSubmitting}
                 className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 hover:bg-[#ff5a2c] transition-all disabled:opacity-50 shadow-xl shadow-slate-200"
               >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <><Send size={16} /> Submit Protocol</>}
               </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
