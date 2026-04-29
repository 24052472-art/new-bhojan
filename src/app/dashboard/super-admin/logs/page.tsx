"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { 
  ClipboardList, 
  Search, 
  Filter, 
  Download,
  AlertCircle,
  ShieldCheck,
  User,
  Building2,
  Lock,
  Activity,
  History,
  Zap,
  ArrowRight,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";

const mockLogs = [
  { id: 1, event: "Plan Override", target: "The Blue Frog", actor: "Super Admin", time: "2 mins ago", status: "success", detail: "Changed plan to Enterprise (Custom)" },
  { id: 2, event: "Access Revoked", target: "John Doe", actor: "Super Admin", time: "15 mins ago", status: "warning", detail: "Revoked admin access due to policy violation" },
  { id: 3, event: "Tenant Onboarded", target: "Spicy Fusion", actor: "Super Admin", time: "1 hour ago", status: "success", detail: "New restaurant onboarded via automated link" },
  { id: 4, event: "System Backup", target: "Supabase Global", actor: "Automated", time: "3 hours ago", status: "success", detail: "Daily snapshot completed (2.4 TB)" },
  { id: 5, event: "Security Breach Attempt", target: "Login Endpoint", actor: "IP 182.xx.xx.xx", time: "5 hours ago", status: "error", detail: "Blocked 45 failed login attempts" },
  { id: 6, event: "Menu Update", target: "Cafe Mocha", actor: "Restaurant Owner", time: "6 hours ago", status: "success", detail: "Updated 12 seasonal dishes" },
  { id: 7, event: "Refund Issued", target: "Order #8421", actor: "Support Admin", time: "8 hours ago", status: "warning", detail: "Refunded ₹450 to customer (Payment Failure)" },
];

export default function SuperAdminLogs() {
  const [filter, setFilter] = useState("all");

  return (
    <div className="max-w-[1400px] mx-auto space-y-12 pb-20 animate-fade-in px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 py-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest">
             <History className="w-4 h-4 text-[#ff5a2c]" /> Ledger 2.0
          </div>
          <h2 className="text-6xl font-black text-slate-900 tracking-tight leading-[0.9]">
            System <span className="text-[#ff5a2c]">Audit.</span>
          </h2>
          <p className="text-slate-500 font-bold max-w-xl text-lg leading-relaxed mt-4 uppercase tracking-tight opacity-70">
            Immutable tracking of platform-level events and security protocols.
          </p>
        </div>
        <div className="flex gap-4">
           <Button variant="outline" className="h-14 px-8 rounded-full border-2 border-slate-200 text-slate-900 font-black flex items-center gap-2">
             <Filter className="w-5 h-5" /> Filter Logs
           </Button>
           <Button className="h-14 px-8 rounded-full bg-[#ff5a2c] text-white font-black flex items-center gap-2 hover:bg-[#ff5a2c]/90 transition-all shadow-lg shadow-[#ff5a2c]/20">
             <Download className="w-5 h-5" /> Export Ledger
           </Button>
        </div>
      </div>

      {/* Stats Quick Look */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Events", value: "12,842", icon: ClipboardList, color: "text-[#ff5a2c]" },
          { label: "Critical Warnings", value: "14", icon: AlertCircle, color: "text-amber-500" },
          { label: "Security Blocks", value: "342", icon: Lock, color: "text-red-500" },
        ].map((stat, i) => (
          <Card key={i} className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 opacity-5 text-slate-900 group-hover:scale-110 transition-transform">
               <stat.icon className="w-16 h-16" />
             </div>
             <div className="space-y-2 relative z-10">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
               <h3 className={`text-4xl font-black ${stat.color} tracking-tighter`}>{stat.value}</h3>
             </div>
          </Card>
        ))}
      </div>

      {/* Main Logs Table */}
      <Card className="bg-white border border-slate-100 rounded-[48px] overflow-hidden shadow-2xl shadow-slate-200/40">
         <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Activity Stream</h3>
            <div className="flex items-center gap-4">
               <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input placeholder="Search events..." className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-full text-sm font-bold outline-none focus:border-[#ff5a2c] transition-all w-64" />
               </div>
            </div>
         </div>
         
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50">
                     <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Event Type</th>
                     <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Target Entity</th>
                     <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Authorized Actor</th>
                     <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Timestamp</th>
                     <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Status</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {mockLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer group">
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                               log.status === 'success' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' : 
                               log.status === 'warning' ? 'bg-amber-50 text-amber-500 border-amber-100' : 
                               'bg-red-50 text-red-500 border-red-100'
                             }`}>
                                <Activity className="w-5 h-5" />
                             </div>
                             <div>
                                <p className="text-sm font-black text-slate-900 tracking-tight">{log.event}</p>
                                <p className="text-[10px] font-bold text-slate-400 mt-0.5">{log.detail}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-2">
                             <Building2 className="w-4 h-4 text-slate-300" />
                             <span className="text-sm font-bold text-slate-600">{log.target}</span>
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">
                                {log.actor[0]}
                             </div>
                             <span className="text-sm font-bold text-slate-600">{log.actor}</span>
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-2 text-slate-400">
                             <Clock className="w-4 h-4" />
                             <span className="text-xs font-bold">{log.time}</span>
                          </div>
                       </td>
                       <td className="px-8 py-6 text-right">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                             log.status === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                             log.status === 'warning' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                             'bg-red-50 text-red-600 border-red-100'
                          }`}>
                             {log.status === 'success' ? <CheckCircle2 className="w-3 h-3" /> : log.status === 'warning' ? <Zap className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                             {log.status}
                          </span>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>

         <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-center">
            <Button variant="outline" className="h-12 px-10 rounded-xl font-black text-xs uppercase tracking-widest text-slate-500 hover:text-slate-900 border-slate-200">
               Load Historical Data
            </Button>
         </div>
      </Card>
    </div>
  );
}
