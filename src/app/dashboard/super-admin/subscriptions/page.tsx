"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Plus, CreditCard, CheckCircle2, TrendingUp, ShieldCheck } from "lucide-react";

export default function SubscriptionsPage() {
  return (
    <div className="max-w-[1400px] mx-auto space-y-12 pb-20 animate-fade-in px-4">
      {/* Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ff5a2c]/10 text-[#ff5a2c] text-[11px] font-bold uppercase tracking-widest">
           <ShieldCheck className="w-4 h-4" /> Monetization Engine
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
              Platform <span className="text-[#ff5a2c]">Plans.</span>
            </h2>
            <p className="text-slate-500 font-medium max-w-xl text-lg md:text-xl leading-relaxed mt-4">
              Configure tiers, adjust pricing, and manage recurring revenue for the Bhojan ecosystem.
            </p>
          </div>
          <Button className="h-14 px-8 rounded-full bg-[#ff5a2c] text-white font-bold flex items-center gap-2 hover:bg-[#ff5a2c]/90 transition-all shadow-lg shadow-[#ff5a2c]/20 group">
            <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" /> Create New Plan
          </Button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8">
        {[
          { name: "Starter", price: "₹999", color: "text-slate-700", bg: "bg-white", border: "border-slate-100 hover:border-slate-300", features: ["Up to 5 Tables", "2 Staff Members", "Basic Analytics"] },
          { name: "Pro", price: "₹2,499", color: "text-[#ff5a2c]", bg: "bg-white", border: "border-[#ff5a2c] shadow-xl shadow-[#ff5a2c]/10", features: ["Unlimited Tables", "10 Staff Members", "Advanced Analytics", "QR Payments"], popular: true },
          { name: "Enterprise", price: "₹4,999", color: "text-slate-900", bg: "bg-slate-50", border: "border-slate-200", features: ["Custom Branded App", "Unlimited Staff", "API Access", "Priority Support"] },
        ].map((plan) => (
          <Card key={plan.name} className={`relative overflow-hidden group rounded-[32px] ${plan.bg} border-2 ${plan.border} transition-all duration-300`}>
            <div className={`absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity text-slate-900`}>
              <CreditCard className="w-40 h-40" />
            </div>
            
            {plan.popular && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#ff5a2c] text-white px-6 py-1.5 rounded-b-2xl text-[10px] font-bold uppercase tracking-widest shadow-md">
                Most Popular
              </div>
            )}

            <div className={`space-y-8 p-10 relative z-10`}>
              <div className={plan.popular ? "pt-6" : ""}>
                <h3 className={`text-3xl font-black tracking-tight ${plan.color}`}>{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-4">
                  <span className="text-5xl font-black tracking-tighter text-slate-900">{plan.price}</span>
                  <span className={`text-sm font-bold text-slate-500 uppercase tracking-widest`}>/month</span>
                </div>
              </div>
              
              <div className="space-y-4 pt-8 border-t border-slate-200">
                {plan.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-4 text-slate-700 font-bold">
                    <CheckCircle2 className={`w-5 h-5 shrink-0 ${plan.popular ? 'text-[#ff5a2c]' : 'text-emerald-500'}`} />
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              <div className="pt-8">
                <Button 
                  variant="outline" 
                  className={`w-full h-14 rounded-xl font-bold transition-all
                    ${plan.popular 
                      ? 'bg-[#ff5a2c] text-white border-transparent hover:bg-[#ff5a2c]/90 shadow-lg shadow-[#ff5a2c]/20' 
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                >
                  Edit Plan Details
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Analytics Card */}
      <Card className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-xl shadow-slate-200/40">
        <CardHeader className="p-10 pb-6 border-b border-slate-100">
          <CardTitle className="text-2xl font-black tracking-tight text-slate-900">Revenue Tracking</CardTitle>
          <CardDescription className="text-slate-500 font-bold uppercase tracking-widest mt-2 text-xs">Monthly recurring revenue (MRR) projection.</CardDescription>
        </CardHeader>
        <CardContent className="p-10 bg-slate-50/50">
          <div className="h-80 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[24px] text-slate-400 bg-white">
            <TrendingUp className="w-12 h-12 mb-4 opacity-30 text-[#ff5a2c]" />
            <p className="font-bold text-sm text-center max-w-md">
              Revenue visualization engine will initialize once active subscriptions exceed the threshold.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
