"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";


export default function contactPage() {
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
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6">Contact Us</h1>
          <p className="text-xl text-slate-500 mb-12">Get in touch with our team for support, enterprise pricing, or general inquiries.</p>
          
          
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-xl font-bold mb-4">Email Support</h3>
            <p className="text-slate-500 mb-6">For general queries, billing, and technical support.</p>
            <a href="mailto:abhi.kush047@gmail.com" className="inline-flex items-center gap-2 font-bold text-[#ff5a2c] hover:underline">
              abhi.kush047@gmail.com
            </a>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-xl font-bold mb-4">WhatsApp Direct</h3>
            <p className="text-slate-500 mb-6">For immediate assistance and sales inquiries.</p>
            <a href="https://wa.me/9779749939797" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-bold text-emerald-600 hover:underline">
              +977 9749939797
            </a>
          </div>
        </div>
        <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl">
          <h3 className="text-2xl font-black mb-6">Global Operations</h3>
          <p className="text-slate-400 mb-8">While our software powers restaurants globally, our core team operates from our primary headquarters.</p>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Location</p>
              <p className="font-medium">Kathmandu, Nepal</p>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Hours</p>
              <p className="font-medium">24/7 Support Available</p>
            </div>
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
