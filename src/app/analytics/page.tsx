"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

export default function analyticsPage() {
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
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6">Analytics & Reporting</h1>
          <p className="text-xl text-slate-500 mb-12">Gain deep insights into your business with our advanced analytics.</p>
          
          
      <div className="space-y-12">
        <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1 space-y-4">
            <h3 className="text-3xl font-black">Real-time Telemetry</h3>
            <p className="text-slate-500 text-lg">Watch your revenue grow in real-time. Our dashboard provides up-to-the-second synchronization of all transactions across your restaurant.</p>
            <ul className="space-y-2 mt-4">
              <li className="flex items-center gap-2 text-slate-700"><CheckCircle2 size={20} className="text-[#ff5a2c]"/> Live daily revenue tracking</li>
              <li className="flex items-center gap-2 text-slate-700"><CheckCircle2 size={20} className="text-[#ff5a2c]"/> Active table status</li>
              <li className="flex items-center gap-2 text-slate-700"><CheckCircle2 size={20} className="text-[#ff5a2c]"/> Average preparation time monitoring</li>
            </ul>
          </div>
          <div className="flex-1 bg-slate-50 p-6 rounded-2xl border border-slate-100 w-full">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
              <span className="font-bold">Daily Revenue</span>
              <span className="text-emerald-500 font-bold">+12.5%</span>
            </div>
            <div className="h-32 bg-gradient-to-t from-orange-100 to-transparent rounded-lg border-b-2 border-[#ff5a2c]"></div>
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
