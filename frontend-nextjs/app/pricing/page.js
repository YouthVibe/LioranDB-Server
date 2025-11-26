"use client";
import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  School,
  Store,
  Building2,
  CheckCircle2,
  CreditCard,
  QrCode,
  Star,
  Crown,
  BadgePercent,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ================== PRICING DATA ==================
const PLANS = [
  {
    category: "School",
    icon: School,
    plans: [
      {
        id: "school-basic",
        title: "Starter School",
        priceMonthly: 99,
        tag: "Best for Beginners",
        description: "100 AI requests / month",
        features: ["AI Spreadsheet Autofill", "Fast Processing", "God Model Access"],
      },
      {
        id: "school-5",
        title: "5 Teacher Plan",
        priceMonthly: 500,
        tag: "Most Popular",
        highlight: true,
        description: "Ideal for small schools",
        features: ["5 Teachers", "Priority Processing", "Dedicated Support"],
      },
      {
        id: "school-30",
        title: "30 Teacher Plan",
        priceMonthly: 5000,
        tag: "Premium",
        description: "Large institution scale",
        features: ["30 Teachers", "Ultra AI Speed", "Advanced Analytics"],
      },
    ],
  },
  {
    category: "Shop",
    icon: Store,
    plans: [
      {
        id: "shop-basic",
        title: "Starter Shop",
        priceMonthly: 100,
        tag: "Simple",
        description: "For small stores",
        features: ["Invoice AI", "Inventory Tracking", "Basic Reports"],
      },
      {
        id: "shop-pro",
        title: "Pro Shop",
        priceMonthly: 500,
        tag: "Popular",
        highlight: true,
        description: "Growing shop solution",
        features: ["Multi-user Access", "Sales Prediction", "Smart Reports"],
      },
      {
        id: "shop-premium",
        title: "Premium Shop",
        priceMonthly: 2000,
        tag: "Advanced",
        description: "Multi outlet solution",
        features: ["Unlimited Users", "AI Insights", "Dedicated Manager"],
      },
    ],
  },
  {
    category: "Business",
    icon: Building2,
    plans: [
      {
        id: "biz-startup",
        title: "Startup",
        priceMonthly: 1000,
        tag: "Startup Pack",
        description: "Small business focus",
        features: ["Core AI Tools", "Standard Support", "Basic Integrations"],
      },
      {
        id: "biz-mid",
        title: "Mid Business",
        priceMonthly: 5000,
        tag: "Growth",
        highlight: true,
        description: "Scalable solution",
        features: ["Advanced AI", "Team Dashboard", "Priority SLA"],
      },
      {
        id: "biz-custom",
        title: "Custom Startup Deal",
        priceMonthly: null,
        tag: "Contact Required",
        description: "Custom tailored plan",
        features: ["Custom AI Models", "Dedicated Architect", "Flexible Pricing"],
      },
    ],
  },
];

const PURCHASE_OPTIONS = [
  { months: 1, label: "1 Month" },
  { months: 12, label: "1 Year" },
  { months: 24, label: "2 Years" },
];

const GST = 0.18;
const YEARLY_DISCOUNT = 0.1;
const formatINR = v => `₹${v.toLocaleString("en-IN")}`;

export default function PricingPage() {
  const [activeCategory, setActiveCategory] = useState("School");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [duration, setDuration] = useState(PURCHASE_OPTIONS[0]);
  const [paymentMethod, setPaymentMethod] = useState("card");

  const plans = useMemo(() => PLANS.find(p => p.category === activeCategory), [activeCategory]);

  const pricing = useMemo(() => {
    if (!selectedPlan || !selectedPlan.priceMonthly) return { subtotal: 0, discount: 0, gst: 0, total: 0 };
    const base = selectedPlan.priceMonthly * duration.months;
    const discount = duration.months >= 12 ? base * YEARLY_DISCOUNT : 0;
    const subtotal = base - discount;
    const gst = subtotal * GST;
    return { subtotal, discount, gst, total: subtotal + gst };
  }, [selectedPlan, duration]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black text-white p-10">
      <motion.h1
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-5xl font-extrabold text-center mb-12"
      >
        Classic Pricing Plans
      </motion.h1>

      {/* CATEGORY SELECT */}
      <div className="flex justify-center gap-8 mb-14">
        {PLANS.map(cat => (
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
            key={cat.category}
            onClick={() => setActiveCategory(cat.category)}
            className={`flex items-center gap-3 px-6 py-3 rounded-full shadow-lg transition-all ${
              activeCategory === cat.category
                ? "bg-indigo-600 shadow-indigo-500/40"
                : "bg-zinc-800"
            }`}
          >
            <cat.icon /> {cat.category}
          </motion.button>
        ))}
      </div>

      {/* PLAN CARDS */}
      <div className="grid md:grid-cols-3 gap-10">
        {plans?.plans.map(plan => (
          <motion.div whileHover={{ y: -12 }} key={plan.id}>
            <Card className={`bg-zinc-900 border-zinc-700 ${plan.highlight ? "ring-2 ring-yellow-500" : ""}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  {plan.highlight ? <Crown className="text-yellow-400" /> : <Star />} {plan.title}
                </CardTitle>
                <span className="text-xs text-indigo-400 font-bold">{plan.tag}</span>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent>
                <div className="text-3xl font-bold mb-4">
                  {plan.priceMonthly ? formatINR(plan.priceMonthly) + " /mo" : "Custom"}
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex gap-2 text-sm font-semibold">
                      <BadgePercent className="text-green-400" size={18} /> {f}
                    </li>
                  ))}
                </ul>

                {plan.priceMonthly ? (
                  <Button onClick={() => setSelectedPlan(plan)}>Choose Plan</Button>
                ) : (
                  <Button variant="outline" onClick={() => alert("Contact only for Custom Startup Deals")}>Contact Sales</Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* COMPARISON TABLE */}
      <div className="mt-20">
        <h2 className="text-3xl font-bold mb-6 text-center">Compare Plans</h2>
        <table className="w-full border border-zinc-800 text-left">
          <thead className="bg-zinc-900">
            <tr>
              <th className="p-3">Feature</th>
              {plans?.plans.map(p => (
                <th key={p.id} className="p-3">{p.title}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {["AI Access", "Support", "Analytics"].map(feat => (
              <tr key={feat} className="border-t border-zinc-800">
                <td className="p-3">{feat}</td>
                {plans?.plans.map(p => (
                  <td key={p.id} className="p-3">
                    <CheckCircle2 className="text-green-500" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAYMENT MODAL */}
      {selectedPlan && selectedPlan.priceMonthly && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-zinc-900 p-8 rounded-2xl max-w-xl w-full">
            <h2 className="text-2xl font-bold mb-4">Pay for {selectedPlan.title}</h2>

            <div className="flex gap-2 mb-4">
              {PURCHASE_OPTIONS.map(opt => (
                <Button
                  key={opt.months}
                  variant={duration.months === opt.months ? "default" : "outline"}
                  onClick={() => setDuration(opt)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>

            <div className="flex gap-4 mb-6">
              <Button onClick={() => setPaymentMethod("card")} variant={paymentMethod === "card" ? "default" : "outline"}>
                <CreditCard /> Card
              </Button>
              <Button onClick={() => setPaymentMethod("upi")} variant={paymentMethod === "upi" ? "default" : "outline"}>
                <QrCode /> UPI
              </Button>
            </div>

            {paymentMethod === "upi" && (
              <div className="text-center">
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=FAKE-UPI-DEMO"
                  alt="Fake QR"
                  className="mx-auto mb-4"
                />
                <p className="text-sm text-zinc-400">Scan to simulate UPI demo payment</p>
              </div>
            )}

            {paymentMethod === "card" && (
              <div className="space-y-3">
                <Input placeholder="Card Number" />
                <div className="flex gap-2">
                  <Input placeholder="MM/YY" />
                  <Input placeholder="CVV" />
                </div>
              </div>
            )}

            <div className="mt-6 space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(pricing.subtotal)}</span></div>
              <div className="flex justify-between"><span>Discount</span><span>-{formatINR(pricing.discount)}</span></div>
              <div className="flex justify-between"><span>GST</span><span>{formatINR(pricing.gst)}</span></div>
              <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{formatINR(pricing.total)}</span></div>
            </div>

            <Button className="w-full mt-6" onClick={() => { alert("Dummy Payment Successful ✅"); setSelectedPlan(null); }}>
              Pay {formatINR(pricing.total)}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* REQUIRED PACKAGES
npm install framer-motion lucide-react
shadcn-ui init
*/