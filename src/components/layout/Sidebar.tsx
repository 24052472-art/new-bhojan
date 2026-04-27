"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { auth as firebaseAuth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { createClient } from "@/lib/supabase/client";
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  Table2, 
  ClipboardList, 
  Users, 
  BarChart3, 
  Settings, 
  ChefHat, 
  LogOut,
  CreditCard,
  QrCode,
  Clock,
  Phone,
  ChevronRight,
  MessageSquareQuote,
  HeartHandshake,
  Menu,
  X
} from "lucide-react";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
  role?: "super_admin" | "owner" | "waiter" | "kitchen";
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ role = "owner", isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user?.uid) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("restaurant_id")
          .eq("id", user.uid)
          .single();
        
        if (profile?.restaurant_id) {
          const { data } = await supabase
            .from("restaurants")
            .select("*")
            .eq("id", profile.restaurant_id)
            .single();
          setRestaurant(data);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const menuItems = {
    super_admin: [
      { name: "Overview", href: "/dashboard/super-admin", icon: LayoutDashboard },
      { name: "Restaurants", href: "/dashboard/super-admin/restaurants", icon: UtensilsCrossed },
      { name: "Subscriptions", href: "/dashboard/super-admin/subscriptions", icon: CreditCard },
      { name: "Users", href: "/dashboard/super-admin/users", icon: Users },
    ],
    owner: [
      { name: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
      { name: "Menu", href: "/dashboard/admin/menu", icon: UtensilsCrossed },
      { name: "Tables", href: "/dashboard/admin/tables", icon: Table2 },
      { name: "Orders", href: "/dashboard/admin/orders", icon: ClipboardList },
      { name: "Customers", href: "/dashboard/admin/customers", icon: HeartHandshake },
      { name: "Feedback", href: "/dashboard/admin/feedback", icon: MessageSquareQuote },
      { name: "Staff", href: "/dashboard/admin/staff", icon: Users },
      { name: "Analytics", href: "/dashboard/admin/analytics", icon: BarChart3 },
      { name: "Settings", href: "/dashboard/admin/settings", icon: Settings },
    ],
    waiter: [
      { name: "Tables", href: "/dashboard/waiter", icon: Table2 },
      { name: "Menu", href: "/dashboard/admin/menu", icon: UtensilsCrossed },
      { name: "Orders", href: "/dashboard/admin/orders", icon: ClipboardList },
    ],
    kitchen: [
      { name: "KDS Feed", href: "/dashboard/kitchen", icon: ChefHat },
      { name: "KDS Display", href: "/dashboard/kitchen/tv", icon: LayoutDashboard },
    ],
  };

  const currentMenu = menuItems[role] || menuItems.owner;

  const handleLogout = async () => {
    try {
      await firebaseAuth.signOut();
      localStorage.clear();
      window.location.assign("/");
    } catch (e) {
      window.location.assign("/");
    }
  };

  return (
    <>
      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Aside */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-[210] bg-white border-r border-slate-200 transition-all duration-300 flex flex-col",
        // Desktop: Full Width (xl:w-72)
        // Tablet: Icons Only (lg:w-20)
        // Mobile: Hidden/Drawer (w-0/translate)
        "xl:w-72 lg:w-20",
        isOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Header */}
        <div className="h-20 flex items-center px-6 border-b border-slate-50 shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
                <UtensilsCrossed size={20} className="text-[#ff5a2c]" />
             </div>
             <span className="text-xl font-black italic tracking-tighter text-slate-900 xl:block lg:hidden">BHOJAN</span>
          </div>
          <button onClick={onClose} className="lg:hidden ml-auto p-2 text-slate-400"><X size={20} /></button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-1">
          {currentMenu.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                onClick={() => onClose?.()}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-2xl font-bold transition-all group relative",
                  isActive 
                    ? "bg-slate-900 text-white shadow-lg shadow-slate-200" 
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                <item.icon size={20} className={cn("shrink-0", isActive ? "text-[#ff5a2c]" : "group-hover:scale-110 transition-transform")} />
                <span className="text-sm xl:block lg:hidden truncate">{item.name}</span>
                {isActive && (
                   <motion.div layoutId="active-nav-bg" className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-[#ff5a2c] rounded-r-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Operational Footer Panels */}
        <div className="p-4 space-y-4 border-t border-slate-50 shrink-0">
           {/* Timings Panel (Hide on Tablet) */}
           <div className="hidden xl:block bg-slate-50 rounded-3xl p-5 border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                 <div className="flex items-center gap-2">
                    <Clock size={14} className="text-slate-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Operations</span>
                 </div>
                 <div className="flex gap-1">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse delay-75" />
                 </div>
              </div>
              <div className="text-[11px] font-black text-slate-900 uppercase italic tracking-tighter">
                {restaurant?.opening_hours?.[new Date().getDay()]?.hours || "09:00 AM - 11:00 PM"}
              </div>
           </div>

           {/* Call Support (Icon only on Tablet) */}
           <a 
             href={`tel:${restaurant?.phone || '9749939797'}`}
             className="flex items-center gap-4 px-4 py-3.5 bg-slate-900 text-white rounded-2xl hover:bg-[#ff5a2c] transition-all group shadow-xl shadow-slate-200 lg:justify-center xl:justify-start"
           >
              <Phone size={18} className="text-[#ff5a2c] shrink-0" />
              <div className="xl:block lg:hidden min-w-0">
                 <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Concierge</p>
                 <p className="text-[10px] font-black uppercase italic tracking-tighter leading-none truncate">Call Support</p>
              </div>
           </a>

           {/* User Profile Summary (Tablet/Mobile Only) */}
           <div className="flex items-center gap-3 p-2 xl:hidden lg:justify-center">
              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                 <img src={`https://ui-avatars.com/api/?name=${role}&background=00d4ff&color=fff&bold=true`} className="w-full h-full object-cover" />
              </div>
           </div>

           {/* Logout */}
           <button 
             onClick={handleLogout}
             className="w-full flex items-center gap-4 px-4 py-3 text-slate-400 hover:text-red-500 transition-all font-bold lg:justify-center xl:justify-start"
           >
              <LogOut size={20} className="shrink-0" />
              <span className="text-sm xl:block lg:hidden">Sign Out Suite</span>
           </button>
        </div>
      </aside>
    </>
  );
}
