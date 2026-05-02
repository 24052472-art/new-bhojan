"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { auth as firebaseAuth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "react-hot-toast";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  ChevronRight,
  Upload,
  User,
  Loader2,
  Package,
  Layers,
  ShoppingBag,
  Image as ImageIcon,
  X,
  Flame,
  ArrowLeft
} from "lucide-react";
import { AdminDrawer } from "@/components/AdminDrawer";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function AdminMenuPage() {
  // State
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [itemGroups, setItemGroups] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const [selectedItemGroupId, setSelectedItemGroupId] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [mobileView, setMobileView] = useState<0 | 1 | 2>(0);
  
  // Drawer State
  const [drawer, setDrawer] = useState<{
    isOpen: boolean;
    type: 'subcategory' | 'group' | 'item' | 'mass-upload' | null;
    editingId: string | null;
  }>({
    isOpen: false,
    type: null,
    editingId: null
  });

  const supabase = createClient();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (restaurantId) {
      const channel = supabase.channel(`bhojan-res-${restaurantId}`);
      channel.subscribe();
      channelRef.current = channel;
    }
  }, [restaurantId]);

  const transmitEvent = async (event: string, payload: any = {}) => {
    if (!channelRef.current) return;
    try {
      await channelRef.current.send({ type: 'broadcast', event, payload: payload || {} });
    } catch (e) { console.error(e); }
  };

  const downloadSampleCSV = () => {
    const headers = ["CategoryName", "SubCategoryName", "ItemGroupName", "ItemName", "Price", "Description", "ImageURL", "ItemType"];
    const sampleData = [
      ["Main Course", "Burgers", "Classic Burgers", "Cheese Burger", "199", "Delicious cheese burger", "https://example.com/burger.jpg", "Veg"],
      ["Main Course", "Pizza", "Classic Pizzas", "Margherita", "299", "Cheesy margherita pizza", "https://example.com/pizza.jpg", "Veg"]
    ];
    const csvContent = [headers, ...sampleData].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "bhojan_menu_sample.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user?.uid) {
        const { getProfileByAuth } = await import('@/app/(auth)/actions');
        const { profile } = await getProfileByAuth(user.uid, user.email || "");

        if (profile?.restaurant_id) {
          setRestaurantId(profile.restaurant_id);
          fetchInitialData(profile.restaurant_id);
        } else {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  async function fetchInitialData(resId: string) {
    if (!resId) return;
    setIsLoading(true);
    try {
      const { getAdminMenuData } = await import('@/app/dashboard/admin/actions');
      const { categories, subcategories, itemGroups, items, error } = await getAdminMenuData(resId);
      
      if (error) throw new Error(error);

      setCategories(categories);
      setSubcategories(subcategories);
      setItemGroups(itemGroups);
      setItems(items);

    } catch (err: any) {
      toast.error("Failed to sync menu: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  // Filtered Data
  const filteredSubcategories = useMemo(() => {
    const raw = subcategories.filter(sub => 
      (selectedCategory === "All" || sub.category_id === selectedCategory) &&
      sub.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const unique = [];
    const seen = new Set();
    for (const sub of raw) {
      if (!seen.has(sub.name)) {
        seen.add(sub.name);
        unique.push(sub);
      }
    }
    return unique;
  }, [subcategories, selectedCategory, searchQuery]);

  const filteredItemGroups = useMemo(() => {
    if (!selectedSubcategoryId) return [];
    return itemGroups.filter(group => group.subcategory_id === selectedSubcategoryId);
  }, [itemGroups, selectedSubcategoryId]);

  const filteredItems = useMemo(() => {
    if (!selectedItemGroupId) return [];
    return items.filter(item => item.item_group_id === selectedItemGroupId);
  }, [items, selectedItemGroupId]);

  // Actions
  const openDrawer = (type: 'subcategory' | 'group' | 'item' | 'mass-upload', id: string | null = null) => {
    setDrawer({ isOpen: true, type, editingId: id });
  };

  const closeDrawer = () => {
    setDrawer({ isOpen: false, type: null, editingId: null });
  };

  const handleDelete = async (table: string, id: string) => {
    if (!confirm("Are you sure you want to delete this?")) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted successfully");
      if (restaurantId) fetchInitialData(restaurantId);
    }
  };

  const handleResetMenu = async () => {
    if (!restaurantId) return;
    const confirmed = confirm("⚠️ DANGER: This will delete ALL your menu data. Are you sure?");
    if (!confirmed) return;
    setIsLoading(true);
    try {
      await supabase.from("menu_items").delete().eq("restaurant_id", restaurantId);
      await supabase.from("menu_item_groups").delete().eq("restaurant_id", restaurantId);
      await supabase.from("menu_subcategories").delete().eq("restaurant_id", restaurantId);
      await supabase.from("menu_categories").delete().eq("restaurant_id", restaurantId);
      toast.success("Menu reset successfully!");
      fetchInitialData(restaurantId);
    } catch (err: any) {
      toast.error("Failed to reset: " + err.message);
    } finally {
      setIsLoading(false);
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
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="space-y-2">
           <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Menu <span className="text-slate-300">Command</span></h2>
           <p className="text-slate-500 font-medium text-sm">Architect your dish hierarchy and availability.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => openDrawer('mass-upload')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
          >
            <Upload size={16} /> Mass Upload
          </button>
          <button 
            onClick={handleResetMenu}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-red-50 text-red-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100"
          >
            <Trash2 size={16} /> Reset
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-[32px] p-4 flex flex-col md:flex-row items-center gap-4 shadow-sm">
         <div className="relative flex-1 w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              type="text" placeholder="SEARCH SUB-CATEGORY, GROUPS OR ITEMS..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 bg-slate-50 rounded-2xl pl-14 pr-6 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 ring-orange-500/10 transition-all"
            />
         </div>
         <div className="w-full md:w-64">
            <select 
              value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-14 bg-white border border-slate-100 rounded-2xl px-6 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              {Array.from(new Set(categories.map(c => c.name))).filter(Boolean).sort().map(name => {
                const target = categories.find(c => c.name === name);
                return <option key={target.id} value={target.id}>{name}</option>
              })}
            </select>
         </div>
      </div>

      {/* Main Workspace (3 Panel System) */}
      <main className="p-0">
        {/* Mobile Level Indicator */}
        <div className="lg:hidden flex items-center gap-4 mb-6 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
           {mobileView > 0 && (
             <button 
               onClick={() => setMobileView((v) => (v - 1) as any)}
               className="w-12 h-12 flex items-center justify-center bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-900/20"
             >
                <ArrowLeft size={20} />
             </button>
           )}
           <div className="flex-1">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Step {mobileView + 1} of 3</p>
              <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-tighter leading-tight">
                {mobileView === 0 ? "Subcategories" : mobileView === 1 ? "Item Groups" : "Items List"}
              </h3>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-auto lg:h-[calc(100vh-280px)] min-h-[600px]">
          
          {/* Panel 1: Subcategories */}
          <section className={cn(
            "bg-white rounded-[40px] border border-slate-200 flex flex-col overflow-hidden shadow-sm transition-all duration-300",
            mobileView !== 0 ? "hidden lg:flex" : "flex"
          )}>
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 italic">
                <Layers size={16} /> Sub Categories
              </h2>
              <button 
                onClick={() => openDrawer('subcategory')}
                className="p-1.5 bg-[#ff5a2c] text-white rounded-xl hover:bg-[#ea580c] transition-all flex items-center gap-1 px-4 text-[9px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/20"
              >
                <Plus size={14} /> Add
              </button>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-2">
              {filteredSubcategories.map(sub => (
                <div
                  key={sub.id}
                  onClick={() => {
                    setSelectedSubcategoryId(sub.id);
                    setSelectedItemGroupId(null);
                    if (window.innerWidth < 1024) setMobileView(1);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-5 rounded-[28px] transition-all group cursor-pointer border",
                    selectedSubcategoryId === sub.id 
                      ? 'bg-slate-900 border-slate-900 shadow-xl' 
                      : 'bg-white hover:bg-slate-50 border-slate-100'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm",
                      selectedSubcategoryId === sub.id ? 'bg-[#ff5a2c] text-white' : 'bg-white text-slate-400'
                    )}>
                      <Layers size={22} />
                    </div>
                    <div className="text-left min-w-0">
                      <p className={cn("text-sm font-black uppercase italic tracking-tighter truncate", selectedSubcategoryId === sub.id ? 'text-white' : 'text-slate-900')}>{sub.name}</p>
                      <p className={cn("text-[9px] font-bold uppercase tracking-widest mt-1", selectedSubcategoryId === sub.id ? 'text-slate-500' : 'text-slate-400')}>
                        {itemGroups.filter(g => g.subcategory_id === sub.id).length} Active Groups
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); openDrawer('subcategory', sub.id); }} className={cn("p-2 rounded-xl transition-all", selectedSubcategoryId === sub.id ? 'text-white hover:bg-white/10' : 'text-slate-200 hover:text-[#ff5a2c]')}>
                      <Edit2 size={14} />
                    </button>
                    <ChevronRight size={18} className={selectedSubcategoryId === sub.id ? 'text-[#ff5a2c]' : 'text-slate-100'} />
                  </div>
                </div>
              ))}
              {filteredSubcategories.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center text-slate-200 gap-4 opacity-50">
                  <Package size={48} />
                  <p className="text-[10px] font-black uppercase tracking-widest">No Subcategories</p>
                </div>
              )}
            </div>
          </section>

          {/* Panel 2: Item Groups */}
          <section className={cn(
            "bg-white rounded-[40px] border border-slate-200 flex flex-col overflow-hidden shadow-sm transition-all duration-300",
            mobileView !== 1 ? "hidden lg:flex" : "flex"
          )}>
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 italic">
                <Package size={16} /> Item Groups
              </h2>
              {selectedSubcategoryId && (
                <button 
                  onClick={() => openDrawer('group')}
                  className="p-1.5 bg-[#ff5a2c] text-white rounded-xl hover:bg-[#ea580c] transition-all flex items-center gap-1 px-4 text-[9px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/20"
                >
                  <Plus size={14} /> Add
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-2">
              {filteredItemGroups.map(group => (
                <div
                  key={group.id}
                  onClick={() => {
                    setSelectedItemGroupId(group.id);
                    if (window.innerWidth < 1024) setMobileView(2);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-5 rounded-[28px] transition-all group cursor-pointer border",
                    selectedItemGroupId === group.id 
                      ? 'bg-slate-900 border-slate-900 shadow-xl' 
                      : 'bg-white hover:bg-slate-50 border-slate-100'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm",
                      selectedItemGroupId === group.id ? 'bg-[#ff5a2c] text-white' : 'bg-white text-slate-400'
                    )}>
                      <Package size={22} />
                    </div>
                    <p className={cn("text-sm font-black uppercase italic tracking-tighter truncate", selectedItemGroupId === group.id ? 'text-white' : 'text-slate-900')}>{group.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); openDrawer('group', group.id); }} className={cn("p-2 rounded-xl transition-all", selectedItemGroupId === group.id ? 'text-white hover:bg-white/10' : 'text-slate-200 hover:text-[#ff5a2c]')}>
                      <Edit2 size={14} />
                    </button>
                    <ChevronRight size={18} className={selectedItemGroupId === group.id ? 'text-[#ff5a2c]' : 'text-slate-100'} />
                  </div>
                </div>
              ))}
              {!selectedSubcategoryId ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-200 gap-2 opacity-50">
                  <p className="text-[10px] font-black uppercase tracking-widest">Select Subcategory First</p>
                </div>
              ) : filteredItemGroups.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center text-slate-200 gap-2 opacity-50">
                  <p className="text-[10px] font-black uppercase tracking-widest">No Groups Found</p>
                </div>
              )}
            </div>
          </section>

          {/* Panel 3: Items */}
          <section className={cn(
            "bg-white rounded-[40px] border border-slate-200 flex flex-col overflow-hidden shadow-sm transition-all duration-300",
            mobileView !== 2 ? "hidden lg:flex" : "flex"
          )}>
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 italic">
                <ShoppingBag size={16} /> Items List
              </h2>
              {selectedItemGroupId && (
                <button 
                  onClick={() => openDrawer('item')}
                  className="p-1.5 bg-[#ff5a2c] text-white rounded-xl hover:bg-[#ea580c] transition-all flex items-center gap-1 px-4 text-[9px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/20"
                >
                  <Plus size={14} /> Add
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
              {filteredItems.map(item => (
                <div
                  key={item.id}
                  className="w-full bg-white rounded-[32px] border border-slate-100 hover:border-slate-200 transition-all p-5 flex flex-col gap-6 relative group overflow-hidden shadow-sm"
                >
                   {item.is_best_seller && (
                     <div className="absolute top-0 right-0 px-4 py-1.5 bg-orange-500 text-white text-[8px] font-black uppercase tracking-widest rounded-bl-2xl">
                        Best Seller
                     </div>
                   )}
                   <div className="flex items-center gap-4">
                      <div className="w-24 h-24 rounded-3xl bg-slate-50 overflow-hidden shrink-0 border border-slate-100 relative shadow-sm">
                         {item.image_url ? <img src={item.image_url} className="w-full h-full object-cover" /> : <Package className="w-10 h-10 text-slate-200 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
                         <div className={cn("absolute bottom-2 right-2 w-4 h-4 rounded-full border-2 border-white shadow-sm", item.item_type === 'Veg' ? 'bg-emerald-500' : 'bg-red-500')} />
                      </div>
                      <div className="flex-1 min-w-0">
                         <h4 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter truncate leading-tight">{item.name}</h4>
                         <p className="text-[10px] font-bold text-slate-400 line-clamp-1 mt-1 uppercase tracking-widest">{item.description}</p>
                         <div className="flex items-center gap-3 mt-4">
                            <span className="text-2xl font-black text-slate-900 italic">₹{item.price}</span>
                            {item.discounted_price && (
                               <span className="text-sm font-bold text-slate-300 line-through italic">₹{item.discounted_price}</span>
                            )}
                         </div>
                      </div>
                   </div>

                   <div className="pt-5 border-t border-slate-50 flex items-center justify-between gap-3">
                      <button 
                        onClick={() => openDrawer('item', item.id)}
                        className="flex-1 flex items-center justify-center gap-2 py-4 bg-slate-50 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                      >
                         <Edit2 size={14} /> Edit Item
                      </button>
                      <button 
                        onClick={() => handleDelete('menu_items', item.id)}
                        className="w-14 h-14 flex items-center justify-center bg-white border border-slate-200 text-slate-300 hover:text-red-500 hover:border-red-200 rounded-2xl transition-all shadow-sm"
                      >
                         <Trash2 size={18} />
                      </button>
                   </div>
                </div>
              ))}
              {!selectedItemGroupId ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-200 gap-2 opacity-50">
                  <p className="text-[10px] font-black uppercase tracking-widest">Select Group First</p>
                </div>
              ) : filteredItems.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center text-slate-200 gap-2 opacity-50">
                  <p className="text-[10px] font-black uppercase tracking-widest">No Items Found</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Drawers */}
      <AdminDrawer 
        isOpen={drawer.isOpen} 
        onClose={closeDrawer}
        title={`${drawer.editingId ? 'Edit' : 'Add New'} ${drawer.type === 'subcategory' ? 'Sub Category' : drawer.type === 'group' ? 'Item Group' : 'Item'}`}
      >
        {drawer.type === 'subcategory' && (
          <SubcategoryForm 
            restaurantId={restaurantId} 
            categories={categories}
            editingId={drawer.editingId}
            onSuccess={() => { 
              closeDrawer(); 
              if (restaurantId) {
                fetchInitialData(restaurantId); 
                transmitEvent('refresh_waiter', { type: 'MENU_UPDATE' });
              }
            }}
          />
        )}
        {drawer.type === 'group' && (
          <ItemGroupForm 
            restaurantId={restaurantId} 
            subcategoryId={selectedSubcategoryId}
            editingId={drawer.editingId}
            onSuccess={() => { 
              closeDrawer(); 
              if (restaurantId) {
                fetchInitialData(restaurantId); 
                transmitEvent('refresh_waiter', { type: 'MENU_UPDATE' });
              }
            }}
          />
        )}
        {drawer.type === 'item' && (
          <ItemForm 
            restaurantId={restaurantId} 
            itemGroupId={selectedItemGroupId}
            editingId={drawer.editingId}
            onSuccess={() => { 
              closeDrawer(); 
              if (restaurantId) {
                fetchInitialData(restaurantId); 
                transmitEvent('refresh_waiter', { type: 'MENU_UPDATE' });
              }
            }}
          />
        )}
        {drawer.type === 'mass-upload' && (
          <MassUploadForm 
            restaurantId={restaurantId} 
            categories={categories}
            subcategories={subcategories}
            itemGroups={itemGroups}
            onDownloadSample={downloadSampleCSV}
            onSuccess={() => { 
              closeDrawer(); 
              if (restaurantId) {
                fetchInitialData(restaurantId); 
                transmitEvent('refresh_waiter', { type: 'MENU_UPDATE' });
              }
            }}
          />
        )}
      </AdminDrawer>
    </div>
  );
}

// --- FORMS (Optimized for Responsiveness) ---

function MassUploadForm({ restaurantId, categories, subcategories, itemGroups, onDownloadSample, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        const headers = lines[0].split(',').map(h => h.trim());
        const dataRows = lines.slice(1);

        for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i];
          const values = row.split(',').map(v => v.trim());
          const item: any = {};
          headers.forEach((h, i) => { item[h] = values[i]; });

          const categoryName = item.CategoryName?.trim();
          if (!categoryName) continue;
          
          let category = categories.find((c: any) => c.name?.trim().toLowerCase() === categoryName.toLowerCase());
          if (!category) {
            const { data: existing } = await supabase.from('menu_categories').select('*').eq('restaurant_id', restaurantId).ilike('name', categoryName).maybeSingle();
            category = existing;
          }
          if (!category) {
            const { data } = await supabase.from('menu_categories').insert([{ name: categoryName, restaurant_id: restaurantId }]).select().single();
            category = data;
          }

          const subcategoryName = item.SubCategoryName?.trim() || categoryName;
          let subcategory = subcategories.find((s: any) => s.name?.trim().toLowerCase() === subcategoryName.toLowerCase() && s.category_id === category.id);
          if (!subcategory) {
            const { data: existing } = await supabase.from('menu_subcategories').select('*').eq('restaurant_id', restaurantId).eq('category_id', category.id).ilike('name', subcategoryName).maybeSingle();
            subcategory = existing;
          }
          if (!subcategory) {
            const { data } = await supabase.from('menu_subcategories').insert([{ name: subcategoryName, restaurant_id: restaurantId, category_id: category.id }]).select().single();
            subcategory = data;
          }

          const groupName = item.ItemGroupName?.trim() || subcategoryName;
          let group = itemGroups.find((g: any) => g.name?.trim().toLowerCase() === groupName.toLowerCase() && g.subcategory_id === subcategory.id);
          if (!group) {
            const { data: existing } = await supabase.from('menu_item_groups').select('*').eq('restaurant_id', restaurantId).eq('subcategory_id', subcategory.id).ilike('name', groupName).maybeSingle();
            group = existing;
          }
          if (!group) {
            const { data } = await supabase.from('menu_item_groups').insert([{ name: groupName, restaurant_id: restaurantId, subcategory_id: subcategory.id }]).select().single();
            group = data;
          }

          await supabase.from('menu_items').insert([{
            restaurant_id: restaurantId,
            item_group_id: group.id,
            name: item.ItemName || "Unnamed",
            price: parseFloat(item.Price) || 0,
            description: item.Description || "",
            image_url: item.ImageURL || "",
            item_type: item.ItemType || "Veg",
            is_veg: item.ItemType === 'Veg'
          }]);
        }
        toast.success("Mass upload complete!");
        onSuccess();
      } catch (err: any) {
        toast.error("Upload failed: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8">
      <div className="p-6 bg-orange-50 rounded-3xl border border-orange-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
           <h4 className="text-sm font-black text-[#ff5a2c] uppercase tracking-widest">CSV PROTOCOL</h4>
           <p className="text-[10px] text-orange-600 font-bold opacity-80 uppercase tracking-widest mt-1">Use the sample file for structure.</p>
        </div>
        <button onClick={onDownloadSample} className="w-full sm:w-auto px-6 py-3 bg-[#ff5a2c] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#ea580c] transition-all">
          Sample File
        </button>
      </div>

      <div className="border-2 border-dashed border-slate-200 rounded-[40px] p-12 flex flex-col items-center justify-center bg-slate-50 gap-6 group hover:border-[#ff5a2c] transition-all">
         <div className="w-16 h-16 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-sm text-slate-400 group-hover:text-[#ff5a2c] transition-all">
            <Upload size={32} />
         </div>
         <button onClick={() => fileInputRef.current?.click()} disabled={loading} className="px-10 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
            {loading ? "Processing..." : "Select CSV Source"}
         </button>
         <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
      </div>
    </div>
  );
}

function SubcategoryForm({ restaurantId, categories, editingId, onSuccess }: any) {
  const [formData, setFormData] = useState<any>({ name: "", description: "", category_name: "", service_types: ["Dine-in", "Takeaway"], is_active: true, image_url: "" });
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (editingId) {
      supabase.from("menu_subcategories").select("*, menu_categories(name)").eq("id", editingId).single().then(({ data }) => {
        if (data) {
          setFormData({
            ...data,
            category_name: data.menu_categories?.name || ""
          });
        }
      });
    }
  }, [editingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { addAdminCategory, addAdminSubcategory, updateAdminSubcategory } = await import('@/app/dashboard/admin/actions');
      
      let finalCategoryId = "";
      const trimmedCategoryName = formData.category_name.trim();

      if (!trimmedCategoryName) throw new Error("Category name is required");

      // Find or create category
      const existingCategory = categories.find((c: any) => c.name.toLowerCase() === trimmedCategoryName.toLowerCase());
      
      if (existingCategory) {
        finalCategoryId = existingCategory.id;
      } else {
        const { data: newCat, error: catError } = await addAdminCategory(restaurantId, trimmedCategoryName);
        if (catError) throw new Error(catError);
        finalCategoryId = newCat.id;
      }

      const payload = { 
        name: formData.name, 
        description: formData.description, 
        category_id: finalCategoryId, 
        service_types: formData.service_types, 
        is_active: formData.is_active, 
        image_url: formData.image_url,
        restaurant_id: restaurantId 
      };

      const { error } = editingId 
        ? await updateAdminSubcategory(editingId, payload)
        : await addAdminSubcategory(payload);
      
      if (error) throw new Error(error);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-10">
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subcategory Name</label>
          <input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Italian Pizzas" className="w-full h-14 bg-white border border-slate-200 rounded-2xl px-6 text-sm font-bold outline-none focus:border-[#ff5a2c]" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Global Category</label>
          <div className="relative">
            <input 
              required 
              list="category-suggestions"
              value={formData.category_name} 
              onChange={(e) => setFormData({...formData, category_name: e.target.value})} 
              placeholder="Type or select a category (e.g. Main Course)"
              className="w-full h-14 bg-white border border-slate-200 rounded-2xl px-6 text-sm font-bold outline-none focus:border-[#ff5a2c]" 
            />
            <datalist id="category-suggestions">
              {categories.map((c: any) => <option key={c.id} value={c.name} />)}
            </datalist>
          </div>
        </div>
      </div>
      <button disabled={loading} type="submit" className="w-full h-16 bg-[#ff5a2c] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#ea580c] transition-all shadow-xl shadow-orange-500/10">
        {loading ? "Syncing..." : editingId ? "Update Subcategory" : "Create Subcategory"}
      </button>
    </form>
  );
}

function ItemGroupForm({ restaurantId, subcategoryId, editingId, onSuccess }: any) {
  const [formData, setFormData] = useState<any>({ name: "", description: "", subcategory_id: subcategoryId, is_active: true });
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (editingId) {
      supabase.from("menu_item_groups").select("*").eq("id", editingId).single().then(({ data }) => {
        if (data) setFormData(data);
      });
    }
  }, [editingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { addAdminItemGroup, updateAdminItemGroup } = await import('@/app/dashboard/admin/actions');
      const payload = { ...formData, restaurant_id: restaurantId, subcategory_id: subcategoryId };
      
      const { error } = editingId 
        ? await updateAdminItemGroup(editingId, payload)
        : await addAdminItemGroup(payload);
      
      if (error) throw new Error(error);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-10">
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Group Name</label>
          <input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full h-14 bg-white border border-slate-200 rounded-2xl px-6 text-sm font-bold outline-none focus:border-[#ff5a2c]" />
        </div>
      </div>
      <button disabled={loading} type="submit" className="w-full h-16 bg-[#ff5a2c] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#ea580c] transition-all shadow-xl shadow-orange-500/10">
        {loading ? "Syncing..." : editingId ? "Update Group" : "Create Group"}
      </button>
    </form>
  );
}

function ItemForm({ restaurantId, itemGroupId, editingId, onSuccess }: any) {
  const [formData, setFormData] = useState<any>({ 
    name: "", description: "", price: 0, image_url: "", item_type: "Veg", is_available: true, is_best_seller: false 
  });
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (editingId) {
      supabase.from("menu_items").select("*").eq("id", editingId).single().then(({ data }) => {
        if (data) setFormData(data);
      });
    }
  }, [editingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { addAdminItem, updateAdminItem } = await import('@/app/dashboard/admin/actions');
      const payload = { ...formData, restaurant_id: restaurantId, item_group_id: itemGroupId, is_veg: formData.item_type === 'Veg' };
      
      const { error } = editingId 
        ? await updateAdminItem(editingId, payload)
        : await addAdminItem(payload);
      
      if (error) throw new Error(error);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-10">
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dish Name</label>
          <input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full h-14 bg-white border border-slate-200 rounded-2xl px-6 text-sm font-bold outline-none focus:border-[#ff5a2c]" />
        </div>
        <div className="grid grid-cols-2 gap-4">
           <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Base Price</label>
             <input 
               type="number" 
               required 
               value={formData.price ?? ""} 
               onChange={(e) => setFormData({...formData, price: e.target.value === "" ? "" : parseFloat(e.target.value)})} 
               className="w-full h-14 bg-white border border-slate-200 rounded-2xl px-6 text-sm font-bold outline-none focus:border-[#ff5a2c]" 
             />
           </div>
           <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dietary</label>
             <select value={formData.item_type} onChange={(e) => setFormData({...formData, item_type: e.target.value})} className="w-full h-14 bg-white border border-slate-200 rounded-2xl px-6 text-sm font-bold outline-none focus:border-[#ff5a2c]">
                <option value="Veg">Vegetarian</option>
                <option value="Non-Veg">Non-Vegetarian</option>
             </select>
           </div>
        </div>
        <div className="space-y-2">
           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Image URL</label>
           <input value={formData.image_url} onChange={(e) => setFormData({...formData, image_url: e.target.value})} className="w-full h-14 bg-white border border-slate-200 rounded-2xl px-6 text-sm font-bold outline-none focus:border-[#ff5a2c]" />
        </div>
        <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-2xl border border-orange-100">
           <input type="checkbox" checked={formData.is_best_seller} onChange={(e) => setFormData({...formData, is_best_seller: e.target.checked})} className="w-5 h-5 accent-orange-500" />
           <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Mark as Best Seller</span>
        </div>
      </div>
      <button disabled={loading} type="submit" className="w-full h-16 bg-[#ff5a2c] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#ea580c] transition-all shadow-xl shadow-orange-500/10">
        {loading ? "Syncing..." : editingId ? "Update Dish" : "Add Dish"}
      </button>
    </form>
  );
}
