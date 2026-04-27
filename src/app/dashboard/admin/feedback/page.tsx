"use client";

import { useState, useEffect } from "react";
import { 
  MessageSquareQuote, 
  Star, 
  Calendar, 
  User, 
  Search, 
  Loader2,
  Trash2,
  Filter,
  CheckCircle2,
  Flame,
  Zap,
  Heart,
  Smile
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { auth as firebaseAuth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRating, setFilterRating] = useState<number | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("restaurant_id").eq("id", user.uid).single();
        if (profile?.restaurant_id) {
          fetchFeedbacks(profile.restaurant_id);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchFeedbacks = async (resId: string) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("feedbacks")
      .select("*")
      .eq("restaurant_id", resId)
      .order("created_at", { ascending: false });
    
    if (!error) setFeedbacks(data || []);
    setIsLoading(false);
  };

  const deleteFeedback = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    const { error } = await supabase.from("feedbacks").delete().eq("id", id);
    if (!error) {
      toast.success("Feedback deleted");
      setFeedbacks(prev => prev.filter(f => f.id !== id));
    }
  };

  const filteredFeedbacks = feedbacks.filter(f => {
    const matchesSearch = f.comment?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         f.customer_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRating = filterRating ? f.rating === filterRating : true;
    return matchesSearch && matchesRating;
  });

  const getEmoji = (rating: number) => {
    switch(rating) {
      case 1: return "😠";
      case 2: return "😟";
      case 3: return "😐";
      case 4: return "🙂";
      case 5: return "🤩";
      default: return "😐";
    }
  };

  const getCategoryIcon = (cat: string) => {
     switch(cat) {
       case 'Food Quality': return <CheckCircle2 size={10} />;
       case 'Service': return <Zap size={10} />;
       case 'Ambience': return <Star size={10} />;
       case 'Beverage Quality': return <Heart size={10} />;
       default: return <Smile size={10} />;
     }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-[#ff5a2c]" />
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Customer <span className="text-[#ff5a2c]">Voice</span></h2>
           <p className="text-sm font-medium text-slate-400 mt-1">Review sentiments and feedback protocols.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setFilterRating(null)}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterRating === null ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              All
            </button>
            {[5, 4, 3, 2, 1].map(r => (
              <button 
                key={r} onClick={() => setFilterRating(r)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${filterRating === r ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                {getEmoji(r)} {r}
              </button>
            ))}
         </div>
         <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" placeholder="Search comments..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm outline-none focus:border-[#ff5a2c] transition-all shadow-sm"
            />
         </div>
      </div>

      {/* Feed */}
      <div className="space-y-4">
        {filteredFeedbacks.map((f) => (
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            key={f.id} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-8"
          >
             <div className="w-20 h-20 rounded-[24px] bg-slate-50 border border-slate-100 flex flex-col items-center justify-center shrink-0">
                <span className="text-4xl mb-1">{getEmoji(f.rating)}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{f.rating}/5</span>
             </div>

             <div className="flex-1 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                   <div>
                      <h4 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        {f.customer_name || 'Anonymous Guest'}
                      </h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                         <Calendar size={12} /> {new Date(f.created_at).toLocaleDateString()} at {new Date(f.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                   </div>
                   <div className="flex flex-wrap gap-2">
                      {f.categories?.map((cat: string) => (
                        <span key={cat} className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                           {getCategoryIcon(cat)} {cat}
                        </span>
                      ))}
                   </div>
                </div>

                <div className="relative">
                   <MessageSquareQuote className="absolute -left-6 -top-2 text-slate-100 w-12 h-12 -z-10" />
                   <p className="text-slate-600 font-medium leading-relaxed italic">
                     "{f.comment || 'No comment provided.'}"
                   </p>
                </div>
             </div>

             <div className="flex flex-row md:flex-col items-center justify-end gap-2">
                <button 
                  onClick={() => deleteFeedback(f.id)}
                  className="p-3 hover:bg-red-50 rounded-2xl text-slate-300 hover:text-red-500 transition-all"
                >
                   <Trash2 size={20} />
                </button>
             </div>
          </motion.div>
        ))}

        {filteredFeedbacks.length === 0 && (
          <div className="py-20 text-center bg-white rounded-[40px] border border-dashed border-slate-200">
             <MessageSquareQuote size={40} className="mx-auto text-slate-200 mb-4" />
             <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No feedback found</p>
          </div>
        )}
      </div>
    </div>
  );
}
