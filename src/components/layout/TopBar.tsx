"use client";

import { Bell, Search, Settings, HelpCircle, Wifi } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { auth as firebaseAuth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { Bell as BellIcon, Search as SearchIcon, Menu as MenuIcon } from "lucide-react";

interface TopBarProps {
  onMenuClick?: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const [profile, setProfile] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const staffSessionStr = localStorage.getItem("staff_session");
    if (staffSessionStr) {
      try {
        const staff = JSON.parse(staffSessionStr);
        setProfile({ full_name: staff.name, role: staff.role });
      } catch (e) {}
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user) {
        const { getProfileByAuth } = await import('@/app/(auth)/actions');
        const { profile } = await getProfileByAuth(user.uid, user.email || "");
        if (profile) setProfile(profile);
      }
    });
    return () => unsubscribe();
  }, []);

  const displayName = profile?.full_name || "Operator";
  
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Platform Owner';
      case 'owner': return 'Restaurant Owner';
      case 'waiter': return 'Service Waiter';
      case 'kitchen': return 'Kitchen Staff';
      default: return 'Station Staff';
    }
  };

  const displayRole = getRoleLabel(profile?.role || 'staff');
  const displayAvatar = profile?.avatar_url || `https://ui-avatars.com/api/?name=${displayName.replace(/\s+/g, '+')}&background=00d4ff&color=fff&bold=true`;

  return (
    <header className="h-20 border-b border-slate-200 bg-white sticky top-0 z-[190] px-4 md:px-8 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:text-[#ff5a2c] transition-all"
        >
          <MenuIcon size={20} />
        </button>

        {/* Desktop Search */}
        <div className="hidden md:flex flex-1 max-w-lg">
          <div className="relative group w-full">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#ff5a2c] transition-colors" />
            <input 
              type="text" 
              placeholder="Search anything..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-[12px] pl-11 pr-4 py-2.5 text-sm outline-none focus:border-[#ff5a2c] focus:ring-4 focus:ring-orange-500/5 transition-all font-medium"
            />
          </div>
        </div>

        {/* Mobile Search Icon */}
        <button className="md:hidden p-2.5 text-slate-400">
           <SearchIcon size={20} />
        </button>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <button className="relative p-2.5 rounded-[12px] bg-slate-50 text-slate-400 hover:text-[#ff5a2c] hover:bg-orange-50 transition-all">
          <BellIcon size={20} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#ff5a2c] rounded-full border-2 border-white" />
        </button>
        
        <div className="flex items-center gap-3 md:pl-4 md:border-l md:border-slate-100">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black text-slate-900 leading-none uppercase italic tracking-tighter">{displayName}</p>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">{displayRole}</p>
          </div>
          <div className="w-10 h-10 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shadow-sm transition-transform hover:scale-105 cursor-pointer shrink-0">
            <img src={displayAvatar} alt="" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </header>
  );
}
