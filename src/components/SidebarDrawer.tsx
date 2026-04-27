"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, Clock, ChevronRight, UtensilsCrossed, ExternalLink, Calendar, Globe } from "lucide-react";
import { Button } from "./ui/Button";

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: any;
}

export function SidebarDrawer({ isOpen, onClose, restaurant }: SidebarDrawerProps) {
  const openingHours = restaurant?.opening_hours || [
    { day: "Monday", hours: "09:00 AM - 11:00 PM" },
    { day: "Tuesday", hours: "09:00 AM - 11:00 PM" },
    { day: "Wednesday", hours: "09:00 AM - 11:00 PM" },
    { day: "Thursday", hours: "09:00 AM - 11:00 PM" },
    { day: "Friday", hours: "09:00 AM - 12:00 AM" },
    { day: "Saturday", hours: "10:00 AM - 12:00 AM" },
    { day: "Sunday", hours: "10:00 AM - 10:00 PM" },
  ];

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
            className="fixed inset-0 z-[110] bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 z-[120] w-[340px] max-w-[85vw] bg-white shadow-[20px_0_60px_rgba(0,0,0,0.1)] flex flex-col"
          >
            {/* Header */}
            <div className="p-8 pb-6 flex items-center justify-between border-b border-slate-50">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#ff5a2c] flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                     <UtensilsCrossed size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 uppercase italic tracking-tighter leading-none">{restaurant?.name || "BHOJAN"}</h2>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Premium Dining</p>
                  </div>
               </div>
               <button
                  onClick={onClose}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors"
                >
                  <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-8 pt-10 space-y-12">
              
              {/* Primary Actions */}
              <div className="space-y-4">
                <button 
                  onClick={() => window.location.href = `tel:${restaurant?.phone || ''}`}
                  className="w-full flex items-center justify-between p-6 rounded-[28px] bg-slate-900 text-white shadow-xl shadow-slate-200/50 group active:scale-95 transition-all"
                >
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-[#ff5a2c]">
                        <Phone className="w-6 h-6 fill-[#ff5a2c]" />
                      </div>
                      <div className="text-left">
                        <span className="block text-sm font-black uppercase tracking-tighter italic">Call Us Directly</span>
                        <span className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mt-0.5">Instant Concierge</span>
                      </div>
                   </div>
                   <ChevronRight size={18} className="text-white/20 group-hover:text-[#ff5a2c] group-hover:translate-x-1 transition-all" />
                </button>
              </div>

              {/* Timing Panel */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-[#ff5a2c]">
                       <Clock size={16} />
                    </div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 italic">Opening Hours</h3>
                  </div>
                  <Calendar size={14} className="text-slate-200" />
                </div>
                
                <div className="bg-slate-50 rounded-[32px] p-6 border border-slate-100 space-y-4">
                  {openingHours.map((item) => (
                    <div key={item.day} className="flex justify-between items-center group">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">{item.day}</span>
                      <div className="flex-1 border-b border-dashed border-slate-200 mx-3 opacity-20" />
                      <span className="text-[10px] font-black text-slate-900 italic">{item.hours}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Extras Section */}
              <div className="space-y-4">
                 <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300 ml-2">Digital Info</p>
                 <div className="grid grid-cols-2 gap-4">
                    <button className="flex flex-col items-center justify-center p-6 rounded-[28px] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl transition-all group">
                       <Globe size={18} className="text-slate-400 group-hover:text-[#ff5a2c] mb-2" />
                       <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">Website</span>
                    </button>
                    <button className="flex flex-col items-center justify-center p-6 rounded-[28px] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl transition-all group">
                       <ExternalLink size={18} className="text-slate-400 group-hover:text-blue-500 mb-2" />
                       <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">Socials</span>
                    </button>
                 </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 pt-0 mt-auto">
              <div className="p-6 rounded-[24px] bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                   <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Managed by</p>
                   <p className="text-sm font-black text-slate-900 tracking-tighter uppercase italic">BHOJAN <span className="text-[#ff5a2c]">SUITE</span></p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#ff5a2c] rotate-45 shadow-sm">
                   <UtensilsCrossed size={14} className="-rotate-45" />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
