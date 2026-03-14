"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = () => {
    if (!email.includes("@")) { setError("Please enter a valid email address"); return; }
    setError("");
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-cosmic flex items-center justify-center px-4">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="w-full max-w-md">

        {!sent ? (
          <>
            <motion.div variants={fadeSlideUp} className="mb-12">
              <div className="flex items-center gap-3 text-sm font-mono text-white/40 uppercase tracking-widest mb-8">
                <span className="w-8 h-[1px] bg-white/20"></span>
                Account Recovery
              </div>
              <h1 className="text-4xl font-display text-white mb-4">Forgot your password?</h1>
              <p className="text-white/50 font-light text-lg leading-relaxed">
                Enter the email address associated with your account and we will send you a secure reset link.
              </p>
            </motion.div>

            <motion.div variants={fadeSlideUp} className="flex flex-col gap-6">
              <label className="flex flex-col gap-3">
                <span className="text-xs font-mono text-white/50 uppercase tracking-widest flex items-center gap-2">
                  <Mail className="w-3 h-3" /> Email Address
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && submit()}
                  placeholder="you@university.edu"
                  className="bg-transparent border-b border-white/20 focus:border-white py-3 text-white placeholder-white/30 outline-none transition-colors text-xl"
                />
                {error && <span className="text-alert text-sm font-mono">{error}</span>}
              </label>

              <button onClick={submit} className="flex items-center gap-3 text-white/80 hover:text-white group mt-4 transition-colors">
                Send reset link <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          </>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-8">
            <CheckCircle2 className="w-16 h-16 text-brand" />
            <h1 className="text-4xl font-display text-white">Check your inbox</h1>
            <p className="text-white/50 text-lg font-light leading-relaxed">
              A password reset link has been sent to <strong className="text-white font-medium">{email}</strong>. The link will expire in 15 minutes.
            </p>
            <button onClick={() => setSent(false)} className="text-white/40 hover:text-white transition-colors text-sm self-start">
              ← Try a different email
            </button>
          </motion.div>
        )}

        <motion.p variants={fadeSlideUp} className="mt-16 text-white/40 text-sm">
          Remember your password? <Link href="/login" className="text-white hover:underline">Sign in →</Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
