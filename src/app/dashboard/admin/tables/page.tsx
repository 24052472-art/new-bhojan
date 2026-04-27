"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { 
  Plus, 
  QrCode, 
  User, 
  Users, 
  Trash2, 
  Settings2, 
  Download, 
  Edit2,
  Loader2,
  CheckCircle2,
  Zap,
  X,
  Flame,
  LayoutGrid,
  Maximize2
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { createClient } from "@/lib/supabase/client";
import { auth as firebaseAuth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function TableManagement() {
  const [tables, setTables] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [staff, setStaff] = useState<any[]>([]);

  const [newTable, setNewTable] = useState({
    number: "",
    capacity: 4
  });

  const supabase = createClient();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user?.uid) {
        fetchInitialData(user.uid);
      }
    });

    return () => {
      unsubscribeAuth();
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  async function fetchInitialData(uid: string) {
    if (!uid) return;
    setIsLoading(true);
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*, restaurants(*)")
        .eq("id", uid)
        .single();
      
      if (error) throw error;

      if (profile?.restaurants) {
        setRestaurant(profile.restaurants);
        fetchTables(profile.restaurants.id);
        fetchStaff(profile.restaurants.id);
        
        if (channelRef.current) {
          await supabase.removeChannel(channelRef.current);
        }

        const channel = supabase
          .channel(`tables-live-${profile.restaurants.id}-${Date.now()}`)
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'tables',
            filter: `restaurant_id=eq.${profile.restaurants.id}`
          }, (payload) => {
            fetchTables(profile.restaurants.id);
          })
          .subscribe();

        channelRef.current = channel;
      } else {
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error("Initial data fetch error:", err);
      setIsLoading(false);
    }
  }

  const fetchTables = async (resId: string) => {
    try {
      const { data, error } = await supabase
        .from("tables")
        .select("*, profiles!assigned_waiter_id(full_name)")
        .eq("restaurant_id", resId)
        .order("table_number", { ascending: true });
      
      if (error) throw error;
      setTables(data || []);
    } catch (err: any) {
      console.error("Fetch tables error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetStatus = async (tableId: string) => {
    const { error } = await supabase
      .from("tables")
      .update({ status: 'available' })
      .eq("id", tableId);

    if (error) {
      toast.error("Failed to reset table.");
    } else {
      toast.success("Station Released!");
    }
  };

  async function fetchStaff(restaurantId: string) {
    const { data } = await supabase.from("profiles").select("*").eq("restaurant_id", restaurantId).eq("role", "waiter");
    setStaff(data || []);
  }

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.from("tables").insert([{
        restaurant_id: restaurant.id,
        table_number: newTable.number,
        capacity: newTable.capacity,
        status: 'available'
      }]);
      if (error) throw error;
      toast.success(`Table ${newTable.number} Added!`);
      setIsAdding(false);
      setNewTable({ number: "", capacity: 4 });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this table? This will disrupt any active orders.")) return;
    try {
      const { error } = await supabase.from("tables").delete().eq("id", id);
      if (error) throw error;
      toast.success("Table Purged.");
      setSelectedTable(null);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "occupied": return "bg-[#ff5a2c]/5 text-[#ff5a2c] border-[#ff5a2c]/10";
      case "reserved": return "bg-blue-50 text-blue-600 border-blue-100";
      default: return "bg-slate-50 text-slate-400 border-slate-100";
    }
  };

  const downloadQRCode = (id: string, fileName: string) => {
    const svg = document.getElementById(id);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `${fileName}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
      toast.success(`${fileName} Kit Ready!`);
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="w-full space-y-10 pb-20 bg-slate-50/50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff5a2c]/10 border border-[#ff5a2c]/20 text-[10px] font-black text-[#ff5a2c] uppercase tracking-widest">
            <LayoutGrid className="w-3 h-3" /> Seating Logic
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none italic">
            Floor <span className="text-slate-300">Map</span>
          </h2>
          <p className="text-slate-400 text-sm font-medium tracking-tight">Configure your restaurant's digital stations and access points.</p>
        </div>
        <Button 
          onClick={() => setIsAdding(true)} 
          className="h-16 px-10 rounded-[28px] gap-3 font-black uppercase tracking-tighter shadow-2xl shadow-orange-500/20 text-white bg-[#ff5a2c] hover:bg-[#ea580c] transition-all active:scale-95"
        >
          <Plus className="w-6 h-6" /> Add New Table
        </Button>
      </div>

      {/* Universal QR Gateway - Premium Redesign */}
      <Card className="bg-white border-slate-100 rounded-[48px] p-8 md:p-12 overflow-hidden relative group shadow-xl shadow-slate-200/50">
         <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
            <Zap className="w-64 h-64 text-[#ff5a2c]" />
         </div>
         <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16 relative z-10">
            <div className="relative">
              <div className="bg-white p-6 rounded-[44px] shadow-2xl border border-slate-50 shrink-0 relative z-10">
                 <QRCodeSVG 
                    id="universal-qr"
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/scan/${restaurant?.slug || restaurant?.id}`} 
                    size={160}
                    className="md:w-[180px] md:h-[180px]"
                    level="H"
                 />
              </div>
              <div className="absolute inset-0 bg-[#ff5a2c]/10 blur-3xl rounded-full translate-y-4 scale-90" />
            </div>

            <div className="flex-1 text-center md:text-left space-y-6 min-w-0">
               <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">
                  <Flame size={12} className="text-[#ff5a2c] fill-[#ff5a2c]" />
                  Master Gateway
               </div>
               <h3 className="text-3xl md:text-5xl font-black text-slate-900 uppercase italic tracking-tighter">Universal <span className="text-[#ff5a2c]">QR Access</span></h3>
               <p className="text-slate-500 text-sm md:text-base max-w-xl font-medium leading-relaxed">
                  The central hub for your restaurant. Guests scan this to <span className="text-slate-900 font-bold italic underline decoration-[#ff5a2c]/30">Choose their Table</span> and begin ordering directly from their devices.
               </p>
               <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                  <Button 
                    onClick={() => downloadQRCode('universal-qr', 'Universal_QR_Kit')}
                    variant="outline" 
                    className="h-14 px-8 rounded-2xl border-slate-200 text-slate-600 hover:bg-slate-50 font-black uppercase text-[11px] tracking-widest gap-2 shadow-sm"
                  >
                     <Download className="w-5 h-5" /> Download Digital Kit
                  </Button>
               </div>
            </div>
         </div>
      </Card>

      {/* Main Grid Content */}
      <div className="grid gap-10 grid-cols-1 lg:grid-cols-3 px-2">
        {/* Tables Grid */}
        <div className="lg:col-span-2 grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {tables.map((table) => (
            <motion.div 
              key={table.id} 
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "cursor-pointer group relative transition-all rounded-[40px] p-1",
                selectedTable?.id === table.id ? 'bg-gradient-to-br from-[#ff5a2c] to-orange-400 shadow-2xl shadow-orange-500/30' : 'bg-transparent'
              )}
              onClick={() => setSelectedTable(table)}
            >
              <Card 
                className={cn(
                  "bg-white border-slate-100 rounded-[38px] p-8 transition-all h-full relative overflow-hidden",
                  selectedTable?.id === table.id ? 'border-transparent' : 'hover:border-orange-100'
                )}
              >
                {selectedTable?.id === table.id && (
                  <div className="absolute inset-0 bg-white/5 opacity-50" />
                )}

                <div className="flex justify-between items-start mb-10 relative z-10">
                  <div className={cn(
                    "w-16 h-16 rounded-[24px] flex items-center justify-center text-3xl font-black italic transition-all",
                    selectedTable?.id === table.id ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-900"
                  )}>
                    {table.table_number.padStart(2, '0')}
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(table.status)}`}>
                    {table.status === 'available' ? 'FREE' : table.status}
                  </div>
                </div>
                
                <div className="space-y-5 relative z-10">
                  <div className="flex items-center gap-4 text-slate-400 font-bold text-[11px] uppercase tracking-widest">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300">
                      <User size={14} />
                    </div>
                    <span className="truncate">{table.profiles?.full_name || "Self Service"}</span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-400 font-bold text-[11px] uppercase tracking-widest">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300">
                      <Users size={14} />
                    </div>
                    <span>{table.capacity} Seating Capacity</span>
                  </div>
                </div>

                <div className="mt-10 h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                   <div className={cn(
                     "h-full transition-all duration-1000",
                     table.status === 'available' ? 'w-full bg-emerald-400' : 
                     table.status === 'occupied' ? 'w-full bg-[#ff5a2c]' : 'w-full bg-blue-400'
                   )} />
                </div>
              </Card>
            </motion.div>
          ))}
          
          {tables.length === 0 && (
             <div className="col-span-full py-24 text-center border-2 border-dashed border-slate-200 rounded-[48px] bg-white space-y-6">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                  <Maximize2 size={32} />
                </div>
                <div className="space-y-2">
                  <p className="text-slate-900 font-black uppercase tracking-widest text-lg">Floor Map is empty</p>
                  <p className="text-slate-400 text-sm font-medium">Add your first table to begin managing orders.</p>
                </div>
                <Button onClick={() => setIsAdding(true)} className="rounded-2xl h-14 px-10 font-black uppercase text-[11px] tracking-widest text-white bg-[#ff5a2c] hover:bg-[#ea580c] shadow-lg shadow-orange-500/20">
                  Create First Table
                </Button>
             </div>
          )}
        </div>

        {/* Side Panel Details - Redesigned as a Premium Card */}
        <div className={cn(
          "lg:block",
          selectedTable ? "fixed inset-x-0 bottom-0 z-[110] lg:static lg:z-0 lg:block" : "hidden lg:block"
        )}>
          {selectedTable && (
            <div className="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[109]" onClick={() => setSelectedTable(null)} />
          )}
          
          <Card className={cn(
            "bg-white border-slate-100 lg:rounded-[48px] lg:sticky lg:top-24 overflow-hidden shadow-2xl transition-all duration-500 min-h-[500px]",
            selectedTable ? "rounded-t-[40px] translate-y-0" : "translate-y-full lg:translate-y-0"
          )}>
            {selectedTable ? (
              <>
                <CardHeader className="p-8 md:p-12 pb-0 flex flex-row items-center justify-between space-y-0">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                      Station Identity
                    </div>
                    <CardTitle className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
                      Table {selectedTable.table_number.padStart(2, '0')}
                    </CardTitle>
                  </div>
                  <Button variant="ghost" className="w-12 h-12 rounded-2xl hover:bg-slate-50 text-slate-400" onClick={() => setSelectedTable(null)}>
                     <X className="w-6 h-6" />
                  </Button>
                </CardHeader>

                <CardContent className="p-8 md:p-12 space-y-10">
                  {/* Premium QR Display */}
                  <div className="flex flex-col items-center justify-center p-10 bg-slate-50 rounded-[44px] border border-slate-100 relative group/qr">
                    <div className="bg-white p-6 rounded-[36px] shadow-xl transition-transform group-hover/qr:scale-105 duration-500 border border-slate-50">
                      <QRCodeSVG 
                        id={`table-qr-${selectedTable.table_number}`}
                        value={`${window.location.origin}/menu/${restaurant?.slug}/${selectedTable.table_number}`} 
                        size={180}
                        className="md:w-[200px] md:h-[200px]"
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                    <p className="mt-8 text-[11px] text-slate-400 font-black uppercase tracking-[0.3em] text-center w-full">
                      Digital Station Ready
                    </p>
                    <Button 
                      onClick={() => downloadQRCode(`table-qr-${selectedTable.table_number}`, `Table_${selectedTable.table_number}_QR`)}
                      variant="outline" 
                      className="mt-10 gap-3 w-full h-16 rounded-2xl border-slate-200 hover:bg-slate-900 hover:text-white font-black uppercase text-[11px] tracking-widest transition-all"
                    >
                      <Download className="w-5 h-5" /> Download QR Kit
                    </Button>
                  </div>

                  <div className="space-y-6">
                    <div className="flex justify-between items-center bg-slate-50 p-5 rounded-2xl border border-slate-100">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Live Status</span>
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(selectedTable.status)}`}>
                        {selectedTable.status === 'available' ? 'FREE' : selectedTable.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 p-5 rounded-2xl border border-slate-100">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Max Occupancy</span>
                      <span className="text-base font-black text-slate-900 tracking-tight italic">{selectedTable.capacity} Guests</span>
                    </div>
                  </div>

                  <div className="pt-10 border-t border-slate-100 grid grid-cols-2 gap-4 pb-4">
                    <Button 
                      variant="outline" 
                      onClick={() => handleDelete(selectedTable.id)}
                      className="h-16 rounded-2xl border-slate-200 text-red-500 hover:bg-red-50 hover:border-red-100 font-black uppercase text-[11px] tracking-widest gap-2"
                    >
                      <Trash2 className="w-5 h-5" /> Delete
                    </Button>
                    <Button 
                      onClick={() => handleResetStatus(selectedTable.id)}
                      className="h-16 rounded-2xl font-black uppercase text-[11px] tracking-widest gap-2 text-white bg-slate-900 hover:bg-slate-800"
                    >
                      <CheckCircle2 className="w-5 h-5" /> Release
                    </Button>
                  </div>
                </CardContent>
              </>
            ) : (
              <div className="h-[600px] flex flex-col items-center justify-center text-center p-12 space-y-8">
                <div className="w-28 h-28 rounded-[40px] bg-slate-50 flex items-center justify-center relative border border-slate-100">
                  <QrCode className="w-12 h-12 text-slate-200" />
                  <div className="absolute inset-0 bg-[#ff5a2c]/5 blur-3xl -z-10 animate-pulse" />
                </div>
                <div className="space-y-3">
                  <h3 className="font-black text-3xl text-slate-900 uppercase tracking-tighter leading-none italic">Select <br /> Station</h3>
                  <p className="text-sm text-slate-400 font-medium max-w-[200px] mx-auto leading-relaxed">Choose a table from the map to manage its digital gateway and status.</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Add Table Modal - Premium Redesign */}
      {isAdding && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-500">
           <motion.div
             initial={{ scale: 0.95, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="w-full max-w-lg"
           >
             <Card className="p-10 md:p-14 bg-white rounded-[48px] border-slate-100 shadow-2xl space-y-12 relative overflow-hidden">
                <button onClick={() => setIsAdding(false)} className="absolute top-10 right-10 p-3 rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors">
                  <X className="w-6 h-6" />
                </button>
                
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-[#ff5a2c]/10 rounded-[28px] flex items-center justify-center mx-auto mb-6 border border-[#ff5a2c]/20 text-[#ff5a2c]">
                     <Plus className="w-10 h-10" />
                  </div>
                  <h3 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Expand <span className="text-[#ff5a2c]">Floor</span></h3>
                  <p className="text-slate-400 font-medium text-base">Add a new seating zone to your restaurant.</p>
                </div>

                <form onSubmit={handleAddTable} className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-6">Table Identity (e.g. T-01)</label>
                    <input 
                      required 
                      value={newTable.number} 
                      onChange={e => setNewTable({...newTable, number: e.target.value})}
                      placeholder="T-00" 
                      className="w-full bg-slate-50 border border-slate-100 rounded-[32px] px-10 py-8 text-slate-900 outline-none focus:border-[#ff5a2c] font-black text-3xl italic tracking-tighter placeholder:text-slate-200 transition-all" 
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-6">Guest Capacity</label>
                    <input 
                      required 
                      type="number"
                      value={newTable.capacity || ""}
                      onChange={e => setNewTable({...newTable, capacity: e.target.value === "" ? 0 : parseInt(e.target.value)})}
                      placeholder="4" 
                      className="w-full bg-slate-50 border border-slate-100 rounded-[32px] px-10 py-8 text-slate-900 outline-none focus:border-[#ff5a2c] font-black text-3xl italic tracking-tighter placeholder:text-slate-200 transition-all" 
                    />
                  </div>

                  <div className="pt-6 flex gap-4">
                    <Button variant="outline" type="button" onClick={() => setIsAdding(false)} className="flex-1 h-20 rounded-[32px] border-slate-200 bg-white text-slate-500 uppercase font-black tracking-widest text-[11px] hover:bg-slate-50">Cancel</Button>
                    <Button type="submit" disabled={isLoading} className="flex-[2] h-20 rounded-[32px] text-2xl font-black uppercase tracking-tighter text-white bg-[#ff5a2c] hover:bg-[#ea580c] shadow-2xl shadow-orange-500/20 active:scale-95 transition-all">
                      {isLoading ? <Loader2 className="w-8 h-8 animate-spin" /> : "Deploy Table"}
                    </Button>
                  </div>
                </form>
             </Card>
           </motion.div>
        </div>
      )}
    </div>
  );
}
