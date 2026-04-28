"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Smartphone } from "lucide-react";

export default function qrorderingPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fb] text-[#111827] font-sans selection:bg-[#ff5a2c]/10">
      <nav className="px-6 md:px-12 py-6 flex items-center justify-between border-b border-slate-100 bg-white sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          <h1 className="text-2xl font-black text-[#ff5a2c] tracking-tighter italic">BHOJAN</h1>
        </Link>
        <Link href="/" className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-20 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6">QR Ordering System</h1>
          <p className="text-xl text-slate-500 mb-12">Seamless and contact-free ordering experience for your customers.</p>
          
          
      <div className="space-y-8">
        <div className="bg-[#ff5a2c] text-white p-8 md:p-12 rounded-3xl shadow-xl shadow-orange-500/20 text-center">
          <Smartphone size={48} className="mx-auto mb-6 opacity-80" />
          <h3 className="text-3xl md:text-4xl font-black mb-4">The Digital Matrix</h3>
          <p className="text-orange-100 text-lg max-w-2xl mx-auto">Transform your guest experience with instant, zero-latency ordering directly from their smartphones.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100">
            <h4 className="font-bold text-xl mb-2">Instant Menus</h4>
            <p className="text-slate-500">Update prices and items instantly across all digital touchpoints.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100">
            <h4 className="font-bold text-xl mb-2">Direct to Kitchen</h4>
            <p className="text-slate-500">Orders flow directly to the Kitchen Display System without waiter intervention.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100">
            <h4 className="font-bold text-xl mb-2">Smart Upselling</h4>
            <p className="text-slate-500">Automated recommendations based on order history and pairings.</p>
          </div>
        </div>
      </div>
    
        </motion.div>
      </main>
      
      <footer className="py-12 px-6 border-t border-slate-100 bg-white mt-20 text-center">
        <p className="text-sm text-slate-400 font-medium">© 2026 Bhojan Cloud Infrastructure. All rights reserved.</p>
      </footer>
    </div>
  );
}
