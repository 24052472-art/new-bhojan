"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, User, Phone, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/Button";

interface UserInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (name: string, phone: string) => void;
  tableNumber: string;
}

export function UserInfoModal({ isOpen, onClose, onContinue, tableNumber }: UserInfoModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-[24px] shadow-2xl overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>

          <div className="p-8 pt-10">
            <div className="space-y-1 mb-8">
              <h2 className="text-2xl font-bold text-[#1a1c2e]">Welcome!</h2>
              <p className="text-sm text-slate-500 font-medium">Please provide your information (optional)</p>
            </div>

            <div className="space-y-6">
              {/* Name Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#1a1c2e] ml-1">Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#f97316] transition-colors" />
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-4 text-sm focus:border-[#f97316] focus:bg-white outline-none transition-all text-slate-900"
                  />
                </div>
              </div>

              {/* Phone Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#1a1c2e] ml-1">Phone Number</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#f97316] transition-colors" />
                  <input
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-4 text-sm focus:border-[#f97316] focus:bg-white outline-none transition-all text-slate-900"
                  />
                </div>
              </div>

              <Button
                onClick={() => onContinue(name, phone)}
                className="w-full h-14 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 group"
              >
                Continue
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
            
            <p className="text-[10px] text-center text-slate-400 mt-6 font-medium">
              You are selecting Station <span className="text-[#f97316] font-bold">{tableNumber}</span>
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
