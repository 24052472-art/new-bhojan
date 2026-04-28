"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";


export default function aboutPage() {
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
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6">About Bhojan</h1>
          <p className="text-xl text-slate-500 mb-12">Cloud Infrastructure for the worlds most innovative culinary brands.</p>
          
          
      <div className="prose prose-lg max-w-none text-slate-600">
        <p className="text-xl leading-relaxed mb-6">
          Bhojan was founded with a single mission: to provide modern restaurants with the operating system they need to scale without friction.
        </p>
        <p className="mb-6">
          The restaurant industry has historically relied on fragmented systems—a POS from one company, an analytics dashboard from another, and a completely disconnected QR ordering system. Bhojan unifies these into a single, cohesive ecosystem.
        </p>
        <div className="bg-slate-900 text-white p-8 rounded-3xl my-10">
          <h3 className="text-2xl font-black mb-4 text-white">Our Vision</h3>
          <p className="text-slate-300">To be the invisible infrastructure powering the world's most successful culinary operations, allowing chefs and owners to focus on what matters most: the food and the guest experience.</p>
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
