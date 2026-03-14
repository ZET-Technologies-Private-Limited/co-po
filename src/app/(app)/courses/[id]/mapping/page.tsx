"use client";

import { useState, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, Network, Flame, BrainCircuit, Check, X, ArrowRight, Zap, Info, TrendingUp } from "lucide-react";
import { staggerContainer, fadeSlideUp, spring } from "@/lib/animations";
import { MatrixGrid } from "@/components/courses/MatrixGrid";
import { NetworkGraph } from "@/components/courses/NetworkGraph";

const mockCOs = [
  { id: "co1", name: "CO1" }, { id: "co2", name: "CO2" }, { id: "co3", name: "CO3" },
  { id: "co4", name: "CO4" }, { id: "co5", name: "CO5" },
];

const mockPOs = [
  { id: "po1", name: "PO1" }, { id: "po2", name: "PO2" }, { id: "po3", name: "PO3" },
  { id: "po4", name: "PO4" }, { id: "po5", name: "PO5" }, { id: "po6", name: "PO6" },
  { id: "po7", name: "PO7" }, { id: "po8", name: "PO8" }, { id: "po9", name: "PO9" },
  { id: "po10", name: "PO10" }, { id: "po11", name: "PO11" }, { id: "po12", name: "PO12" },
];

const mockPSOs = [
  { id: "pso1", name: "PSO1" }, { id: "pso2", name: "PSO2" }, { id: "pso3", name: "PSO3" },
];

const emptyMapping: Record<string, Record<string, number>> = {};
mockCOs.forEach(co => {
  emptyMapping[co.id] = {};
  mockPOs.forEach(po => { emptyMapping[co.id][po.id] = 0; });
});

export default function MappingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params);
  const [view, setView] = useState<"matrix" | "network" | "heatmap">("matrix");
  const [targetType, setTargetType] = useState<"po" | "pso">("po");
  const [isAiMode, setIsAiMode] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [mappingData, setMappingData] = useState(emptyMapping);

  const handleAiAutoMap = () => {
    setIsAiLoading(true);
    setTimeout(() => {
      const genMapping: Record<string, Record<string, number>> = {};
      mockCOs.forEach(co => {
        genMapping[co.id] = {};
        mockPOs.forEach(po => {
           const rand = Math.random();
           genMapping[co.id][po.id] = rand > 0.8 ? 3 : rand > 0.6 ? 2 : rand > 0.3 ? 1 : 0;
        });
      });
      setMappingData(genMapping);
      setIsAiLoading(false);
      setIsAiMode(true);
    }, 2000);
  };

  const acceptAiMapping = () => setIsAiMode(false);
  const rejectAiMapping = () => { setMappingData(emptyMapping); setIsAiMode(false); };

  return (
    <div className="w-full min-h-screen pb-32 pt-4">
      <motion.div initial="hidden" animate="visible" className="max-w-6xl mx-auto flex flex-col gap-20">
        
        {/* ── HERO SECTION ── */}
        <motion.section variants={fadeSlideUp} className="flex flex-col gap-8">
          <div className="flex items-center gap-3 text-sm font-mono text-insight uppercase tracking-widest">
            <span className="w-8 h-[1px] bg-insight" /> Linkage Architecture
          </div>
          <div className="flex items-end justify-between flex-wrap gap-8">
            <div className="flex-1 min-w-[300px]">
              <h1 className="text-6xl md:text-7xl font-display font-medium text-white leading-tight tracking-tight">
                CO-PO<br />
                <span className="text-white/30">Mapping.</span>
              </h1>
              <p className="text-xl text-white/50 font-light mt-6 max-w-xl">
                 Defining the correlation matrix for <span className="text-white">{courseId.toUpperCase()}</span>.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-8 bg-white/[0.03] border border-white/10 px-8 py-6">
                <div>
                   <p className="text-3xl font-mono text-attain">86%</p>
                   <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mt-1">PO Coverage</p>
                </div>
                <div className="w-[1px] h-10 bg-white/10" />
                <div>
                   <p className="text-3xl font-mono text-alert">42%</p>
                   <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mt-1">PSO Coverage</p>
                </div>
            </div>
          </div>
        </motion.section>

        {/* ── CONTROLS STRIP ── */}
        <motion.section variants={fadeSlideUp} className="flex flex-col md:flex-row items-center justify-between gap-12 border-b border-white/10 pb-10">
           <div className="flex items-center gap-12">
              <div className="flex gap-8">
                {[["matrix", LayoutGrid], ["network", Network], ["heatmap", Flame]].map(([id, Icon]: any) => (
                  <button key={id} onClick={() => setView(id)}
                    className={`flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest transition-all ${view === id ? "text-white" : "text-white/20 hover:text-white/50"}`}>
                    <Icon className="w-3 h-3" /> {id}
                  </button>
                ))}
              </div>
              <div className="w-[1px] h-6 bg-white/10" />
              <div className="flex gap-8">
                {[["po", "Program Outcomes"], ["pso", "Program Specific"]].map(([id, label]) => (
                  <button key={id} onClick={() => setTargetType(id as any)}
                    className={`text-[10px] font-mono uppercase tracking-widest transition-all ${targetType === id ? "text-brand" : "text-white/20 hover:text-white/50"}`}>
                    {label}
                  </button>
                ))}
              </div>
           </div>

           <button 
              onClick={handleAiAutoMap}
              disabled={isAiLoading || isAiMode}
              className="group flex items-center gap-6 px-8 py-4 bg-white text-black font-medium text-xs uppercase tracking-widest font-mono hover:bg-white/95 transition-all disabled:opacity-50"
            >
              <BrainCircuit className={`w-4 h-4 ${isAiLoading ? 'animate-pulse' : ''}`} />
              {isAiLoading ? 'Synchronizing...' : 'Execute AI Mapping'}
              {!isAiLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </button>
        </motion.section>

        {/* ── AI NOTIFICATION (FLAT) ── */}
        <AnimatePresence>
          {isAiMode && (
            <motion.section 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="px-10 py-6 border border-insight/30 bg-insight/5 flex items-center justify-between"
            >
               <div className="flex items-center gap-6">
                  <div className="w-2 h-2 rounded-full bg-insight animate-pulse" />
                  <p className="text-sm font-light text-white/70">
                     <span className="text-white font-medium">Predictive Mapping Enabled.</span> AI has populated the matrix based on Bloom's levels and syllabus keywords.
                  </p>
               </div>
               <div className="flex items-center gap-8">
                  <button onClick={rejectAiMapping} className="text-[10px] font-mono text-white/30 hover:text-white transition-colors uppercase tracking-widest">Discard</button>
                  <button onClick={acceptAiMapping} className="px-8 py-3 bg-insight text-white text-[10px] font-mono uppercase tracking-widest hover:bg-insight/90 transition-all">Confirm Mappings</button>
               </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ── MAIN CONTENT (GRID/GRAPH) ── */}
        <motion.section variants={fadeSlideUp} className="w-full relative min-h-[500px]">
           <AnimatePresence mode="wait">
             <motion.div
               key={view + targetType}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               className="w-full"
             >
                {view === 'matrix' || view === 'heatmap' ? (
                   <MatrixGrid 
                     cos={mockCOs} 
                     pos={targetType === 'po' ? mockPOs : mockPSOs} 
                     initialMapping={mappingData} 
                     isHeatmap={view === 'heatmap'} 
                   />
                ) : (
                   <NetworkGraph
                     cos={mockCOs}
                     pos={targetType === 'po' ? mockPOs : mockPSOs}
                     mapping={mappingData}
                   />
                )}
             </motion.div>
           </AnimatePresence>
        </motion.section>

        {/* ── DIAGNOSTIC STRIP ── */}
        <motion.section variants={fadeSlideUp} className="grid grid-cols-1 md:grid-cols-2 gap-20 py-12 border-t border-white/10">
           <div className="flex flex-col gap-6">
              <h3 className="text-xl font-display text-white">Diagnostic Feedback</h3>
              <p className="text-white/40 text-sm font-light leading-relaxed">
                 Critical deficits detected in <span className="text-alert">PO4</span> and <span className="text-alert">PO7</span> coverage. 
                 The current curriculum mapping fails to address professional ethics and conduct investigation parameters.
              </p>
              <div className="flex gap-4">
                 {["PO4", "PO7"].map(p => (
                   <span key={p} className="px-3 py-1 border border-alert/20 text-alert text-[10px] font-mono uppercase tracking-widest bg-alert/5">{p} Unmapped</span>
                 ))}
              </div>
           </div>
           <div className="flex flex-col gap-6">
              <h3 className="text-xl font-display text-white">AI Optimization</h3>
              <p className="text-white/40 text-sm font-light leading-relaxed">
                 Updating <span className="text-white">CO4 (Indexing Techniques)</span> module to include "Security and Ethical Data Access" will automatically satisfy PO7 requirements.
              </p>
              <button className="flex items-center gap-2 text-brand text-xs font-mono uppercase tracking-widest hover:translate-x-2 transition-transform">
                 Apply Curriculum Recommendation <TrendingUp className="w-4 h-4" />
              </button>
           </div>
        </motion.section>

      </motion.div>
    </div>
  );
}
