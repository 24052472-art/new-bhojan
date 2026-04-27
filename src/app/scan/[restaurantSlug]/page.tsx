"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  UtensilsCrossed, 
  Loader2,
  MapPin,
  ChevronLeft,
  LayoutGrid,
  Zap,
} from "lucide-react";
import { UserInfoModal } from "@/components/UserInfoModal";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function StationSelectionPage() {
  const { restaurantSlug } = useParams();
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [tables, setTables] = useState<any[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [tempTable, setTempTable] = useState<any>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchInitialData();
  }, [restaurantSlug]);

  async function fetchInitialData() {
    setIsPageLoading(true);
    try {
      let { data: resData, error: resError } = await supabase
        .from("restaurants")
        .select("*")
        .eq("slug", restaurantSlug)
        .single();

      if (resError || !resData) {
        const { data: resDataById } = await supabase
          .from("restaurants")
          .select("*")
          .eq("id", restaurantSlug)
          .single();
        
        if (resDataById) resData = resDataById;
        else throw new Error("Restaurant not found.");
      }
      
      setRestaurant(resData);

      const { data: tableData, error: tableError } = await supabase
        .from("tables")
        .select("*")
        .eq("restaurant_id", resData.id)
        .order("table_number", { ascending: true });

      if (tableError) throw tableError;
      setTables(tableData || []);

    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsPageLoading(false);
    }
  }

  const handleTableClick = (table: any) => {
    const savedSession = localStorage.getItem('bhojan_session');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        if (session.table_id === table.id && restaurant && session.restaurant_id === restaurant.id) {
          router.push(`/restaurant/${restaurantSlug}`);
          return;
        }
      } catch (e) {
        console.error("Session parse error", e);
      }
    }

    setTempTable(table);
    setShowModal(true);
  };

  const handleModalContinue = (name: string, phone: string) => {
    if (!tempTable) return;

    const sessionData = {
      table_id: tempTable.id,
      table_number: tempTable.table_number,
      guest_name: name || "Guest",
      guest_phone: phone || "",
      restaurant_id: restaurant.id,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('bhojan_session', JSON.stringify(sessionData));
    localStorage.setItem('bhojan_guest', JSON.stringify({ name, phone }));
    localStorage.setItem('bhojan_table', JSON.stringify(tempTable));

    setShowModal(false);
    router.push(`/restaurant/${restaurantSlug}`);
  };

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-[#ff5a2c] animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Loading Stations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-[#ff5a2c]/10 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-orange-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-lg mx-auto px-6 py-12 flex flex-col min-h-screen">
        
        {/* Header Section */}
        <header className="flex flex-col items-center text-center mb-16">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-8"
          >
             {restaurant?.logo_url ? (
                <div className="w-24 h-24 rounded-[32px] overflow-hidden shadow-2xl border-4 border-white p-1 bg-slate-50 rotate-3">
                  <img src={restaurant.logo_url} className="w-full h-full object-cover rounded-[24px]" alt="Logo" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-[28px] bg-[#ff5a2c] flex items-center justify-center shadow-2xl shadow-orange-500/20 rotate-3">
                  <UtensilsCrossed className="w-10 h-10 text-white" />
                </div>
              )}
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
              {restaurant?.name || 'BHOJAN'}
            </h1>
            <div className="flex items-center justify-center gap-3 mt-3">
               <div className="h-[1px] w-4 bg-slate-200" />
               <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">
                 Self-Service Station
               </p>
               <div className="h-[1px] w-4 bg-slate-200" />
            </div>
          </motion.div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-12"
          >
            <h2 className="text-5xl font-black italic uppercase tracking-tighter text-slate-900 leading-tight">
              Pick your <span className="text-[#ff5a2c]">Spot</span>
            </h2>
            <div className="mt-4 inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm">
               <Zap size={14} className="text-orange-500 fill-orange-500" />
               <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">
                 Live Table availability
               </p>
            </div>
          </motion.div>

          {/* Tables Grid */}
          <div className="grid grid-cols-2 gap-6 w-full mb-12">
            <AnimatePresence>
              {tables.map((table, index) => (
                <motion.button 
                  key={table.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + (index * 0.05) }}
                  onClick={() => handleTableClick(table)}
                  className={`aspect-square rounded-[44px] flex flex-col items-center justify-center transition-all duration-500 group relative overflow-hidden border-2 ${
                    table.status === 'occupied' 
                      ? 'border-orange-100 bg-orange-50/30' 
                      : 'border-white bg-white hover:border-orange-200 hover:shadow-2xl hover:shadow-orange-500/10'
                  }`}
                >
                  {/* Subtle Gradient Glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50 group-hover:from-orange-50 group-hover:to-white transition-all duration-500" />
                  
                  <div className="relative z-10 flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 group-hover:text-orange-400 transition-colors">Station</span>
                    <span className={`text-6xl font-black italic tracking-tighter transition-all duration-500 group-hover:scale-110 ${
                      table.status === 'occupied' ? 'text-orange-300' : 'text-slate-900'
                    }`}>
                      {table.table_number.padStart(2, '0')}
                    </span>
                    
                    <div className="mt-4 flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        table.status === 'occupied' ? 'bg-orange-300' : 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                      }`} />
                      <span className={`text-[9px] font-black uppercase tracking-widest ${
                        table.status === 'occupied' ? 'text-orange-300' : 'text-slate-500'
                      }`}>
                        {table.status}
                      </span>
                    </div>
                  </div>

                  {/* Corner Accent */}
                  <div className="absolute top-8 right-8 w-1.5 h-1.5 rounded-full bg-slate-100 group-hover:bg-orange-200 transition-colors" />
                </motion.button>
              ))}
            </AnimatePresence>
          </div>

          {/* Empty State */}
          {tables.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-20">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                <MapPin size={40} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">No active stations found</p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <footer className="mt-auto pt-12 flex flex-col items-center gap-4">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
            Powered by <span className="text-[#ff5a2c]">Bhojan</span>
          </p>
        </footer>
      </div>

      {/* Modal */}
      <UserInfoModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onContinue={handleModalContinue}
        tableNumber={tempTable ? `Station ${tempTable.table_number.padStart(2, '0')}` : ""}
      />
    </div>
  );
}
