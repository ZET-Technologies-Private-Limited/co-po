"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import ProfessionalAbstract3D from "@/components/landing/ProfessionalAbstract3D";

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`min-h-screen w-full flex flex-col justify-center relative z-10 ${className}`}>
      {children}
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="relative bg-cosmic selection:bg-brand/30 selection:text-white">
      
      {/* 3D Canvas - right-side only, behind text */}
      <div className="fixed inset-y-0 right-0 w-full md:w-3/5 z-0 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 9], fov: 50 }}>
          <Suspense fallback={null}>
            <ProfessionalAbstract3D />
          </Suspense>
        </Canvas>
        {/* Fade out the left edge so the text area stays clean */}
        <div className="absolute inset-0 bg-gradient-to-r from-cosmic via-cosmic/60 to-transparent" />
        {/* Vignette top/bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-cosmic/80 via-transparent to-cosmic/80" />
      </div>

      <div className="relative z-10">
        <LandingNavbar />

        <main className="w-full max-w-7xl mx-auto px-6 pb-24">
          
          {/* HERO */}
          <Section>
            <motion.div 
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 1 }}
               className="max-w-4xl"
            >
              <div className="mb-6 flex items-center gap-3 text-sm font-mono text-brand uppercase tracking-widest">
                <span className="w-8 h-[1px] bg-brand"></span>
                Academic Intelligence Platform
              </div>

              <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-display font-medium text-white leading-[1.05] tracking-tight mb-8">
                Precision mapping for <br />
                <span className="text-white/60">curriculum outcomes.</span>
              </h1>

              <p className="text-xl md:text-2xl text-white/50 max-w-2xl font-light leading-relaxed mb-16">
                A professional ecosystem designed for universities to automate, analyze, and attain complete CO-PO-PSO alignment using advanced neural extraction.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                <Link 
                  href="/login" 
                  className="px-8 py-4 bg-white text-black font-medium tracking-wide text-sm rounded-none hover:bg-white/90 transition-colors flex items-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                >
                  Access Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
                
                <div className="flex items-center gap-4 text-sm text-white/40 font-mono">
                  <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-attain" /> SOC2 Compliant</span>
                  <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-attain" /> NBA Ready</span>
                </div>
              </div>
            </motion.div>
          </Section>

          {/* PROBLEM */}
          <Section className="items-end text-right">
             <motion.div 
               initial={{ opacity: 0, x: 30 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ amount: 0.5 }}
               transition={{ duration: 1 }}
               className="max-w-3xl"
             >
                <div className="mb-6 flex items-center justify-end gap-3 text-sm font-mono text-alert uppercase tracking-widest">
                  The Compliance Burden
                  <span className="w-8 h-[1px] bg-alert"></span>
                </div>
                <h2 className="text-4xl md:text-6xl font-display text-white mb-8 leading-tight">
                   Manual mapping is <br/><span className="text-white/40">costly & error-prone.</span>
                </h2>
                <p className="text-lg md:text-xl text-white/50 font-light leading-relaxed">
                   Faculty spend hundreds of hours manually categorizing Bloom's Taxonomy levels and mapping course outcomes to program objectives. The result is often inconsistent, leading to accreditation hurdles.
                </p>
             </motion.div>
          </Section>

          {/* SOLUTION */}
          <Section>
             <motion.div 
               initial={{ opacity: 0, x: -30 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ amount: 0.5 }}
               transition={{ duration: 1 }}
               className="max-w-4xl"
             >
                <div className="mb-6 flex items-center gap-3 text-sm font-mono text-aurora uppercase tracking-widest">
                  <span className="w-8 h-[1px] bg-aurora"></span>
                  The Nexus Protocol
                </div>
                <h2 className="text-4xl md:text-6xl font-display text-white mb-8 leading-tight">
                   Neural networks do <br/><span className="text-white/40">the heavy lifting.</span>
                </h2>
                <div className="flex flex-col gap-12 mt-16 pl-8 border-l border-white/10">
                   <div className="group">
                      <h3 className="text-2xl font-display text-white mb-3 group-hover:text-aurora transition-colors duration-500">01. Intelligent Extraction</h3>
                      <p className="text-white/50 font-light text-lg">Upload PDF syllabi and let the engine instantly extract, classify, and format outcomes into a structured taxonomy.</p>
                   </div>
                   <div className="group">
                      <h3 className="text-2xl font-display text-white mb-3 group-hover:text-brand transition-colors duration-500">02. Multi-Dimensional Arrays</h3>
                      <p className="text-white/50 font-light text-lg">Visualize correlations through interactive matrices and D3.js force-directed graphs to ensure complete program coverage.</p>
                   </div>
                   <div className="group">
                      <h3 className="text-2xl font-display text-white mb-3 group-hover:text-insight transition-colors duration-500">03. Predictive Attainment</h3>
                      <p className="text-white/50 font-light text-lg">Cross-reference historical cohorts against real-time performance to identify at-risk outcomes before final examinations.</p>
                   </div>
                </div>
             </motion.div>
          </Section>

          {/* IMPACT & CTA */}
          <Section className="items-center text-center">
             <motion.div 
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ amount: 0.5 }}
               transition={{ duration: 1 }}
               className="max-w-3xl flex flex-col items-center"
             >
                <div className="mb-6 flex items-center justify-center gap-3 text-sm font-mono text-white/40 uppercase tracking-widest">
                  <span className="w-8 h-[1px] bg-white/20"></span>
                  20 Modules. 1 Platform.
                  <span className="w-8 h-[1px] bg-white/20"></span>
                </div>
                <h2 className="text-4xl md:text-6xl font-display text-white mb-8 leading-tight">
                   Engineered for <br/>accreditation excellence.
                </h2>
                <p className="text-lg text-white/50 font-light mb-12 leading-relaxed">
                   Join the institutions transforming their academic intelligence infrastructure. Prepare for your next NBA or ABET audit with an end-to-end, 20-module SaaS ecosystem.
                </p>
                <Link 
                  href="/login" 
                  className="px-10 py-5 bg-white text-black font-medium tracking-wide text-sm rounded-none hover:bg-white/90 transition-colors flex items-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                >
                  Enter the Platform <ArrowRight className="w-4 h-4" />
                </Link>
             </motion.div>
          </Section>
          
        </main>
      </div>
    </div>
  );
}
