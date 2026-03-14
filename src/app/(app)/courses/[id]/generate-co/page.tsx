"use client";

import { use, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, Send, BrainCircuit, Sparkles, 
  Save, Plus, Trash2, Edit3, Check, X, BookOpen,
  FileText, ListOrdered, CheckCircle2, RefreshCcw,
  Target, Activity, Zap
} from "lucide-react";
import Link from "next/link";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";
import { useDataStore, CODefinition } from "@/lib/dataStore";
import { useAuthStore } from "@/lib/authStore";
import { useUIStore } from "@/lib/uiStore";
import { detectBloomsLevel, BLOOMS_LEVELS } from "@/lib/computations";

type Message = { role: "user" | "ai"; text: string; step?: number };

const BLOOM_COLORS: Record<string, string> = {
  L1: "text-white/40", L2: "text-brand", L3: "text-aurora",
  L4: "text-insight", L5: "text-alert", L6: "text-attain",
};

export default function GenerateCOPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params);
  const { addToast }      = useUIStore();
  const { user }          = useAuthStore();
  const courses           = useDataStore(s => s.courses);
  const storedCOs         = useDataStore(s => s.cos[courseId] || []);
  const setCOs            = useDataStore(s => s.setCOs);
  const addAuditEntry     = useDataStore(s => s.addAuditEntry);
  const coLibrary         = useDataStore(s => s.coLibrary);

  const course = courses.find(c => c.id === courseId);

  // Conversation State
  const [step, setStep]         = useState(1);
  const [messages, setMessages] = useState<Message[]>([{
    role: "ai", 
    text: `Welcome to Phase 2 CO Generation. I'm your OBE Assistant.\n\n**Step 1:** Please confirm the course details: **${course?.name} (${course?.code})**. Is this correct?`,
    step: 1
  }]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);

  // Data state gathered during chat
  const [syllabus, setSyllabus] = useState("");
  const [coCount, setCoCount]   = useState(5);
  const [pendingCOs, setPendingCOs] = useState<CODefinition[]>([]);
  
  // Table editing state
  const [editingCO, setEditingCO] = useState<string | null>(null);
  const [editText, setEditText]   = useState("");
  const [editBloom, setEditBloom] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(p => [...p, { role: "user", text: userMsg }]);
    setLoading(true);

    await new Promise(r => setTimeout(r, 800));

    let aiResponse = "";
    let nextStep = step;

    if (step === 1) { // Confirm course info
      aiResponse = `Excellent. **Step 2:** Please paste your **syllabus unit-wise topics** or upload a PDF. I need this to extract key cognitive keywords.`;
      nextStep = 2;
    } else if (step === 2) { // Syllabus input
      setSyllabus(userMsg);
      aiResponse = `Syllabus received. I've detected core topics in Data Structures. **Step 3:** Confirm PO/PSO set. I'll use the **NBA 2024 Standards**. Is that alright?`;
      nextStep = 3;
    } else if (step === 3) { // PO confirm
      aiResponse = `Confirmed. **Step 4:** How many Course Outcomes (COs) should I generate? Recommended: 4, 5, or 6.`;
      nextStep = 4;
    } else if (step === 4) { // CO Count
      const count = parseInt(userMsg.match(/\d+/)?.[0] || "5");
      setCoCount(count);
      aiResponse = `Understood. Generating **${count} Course Outcomes** now based on your syllabus... This will take a few seconds.`;
      setMessages(p => [...p, { role: "ai", text: aiResponse }]);
      
      // Simulate Generation
      await new Promise(r => setTimeout(r, 2000));
      const generated = generateCOsLogic(syllabus, count, storedCOs.length);
      setPendingCOs(generated);
      
      aiResponse = `**Step 5:** COs are ready! Review them in the right-hand preview panel. You can edit any statement or Bloom's level before we finalize.`;
      nextStep = 5;
    } else if (step === 5) { // Final review
      aiResponse = `Great. **Step 6:** Shall I save these COs to **${course?.code}**? Say 'Save' or 'Finalize' to commit.`;
      nextStep = 6;
    } else if (step === 6) { // Finalize
       if (userMsg.toLowerCase().includes("save") || userMsg.toLowerCase().includes("yes")) {
           handleSave();
           aiResponse = `COs successfully saved and mapped! You can now proceed to **Exam Configuration**.`;
           nextStep = 7;
       } else {
           aiResponse = `No problem. I'm standing by if you'd like to adjust the COs further.`;
       }
    }

    setMessages(p => [...p, { role: "ai", text: aiResponse, step: nextStep }]);
    setStep(nextStep);
    setLoading(false);
  };

  const generateCOsLogic = (txt: string, count: number, offset: number): CODefinition[] => {
    const lines = txt.split(/[.\n]+/).map(l => l.trim()).filter(l => l.length > 10);
    const results: CODefinition[] = [];
    for (let i = 0; i < count; i++) {
        const seed = lines[i % lines.length] || "course topic";
        const bloom = detectBloomsLevel(seed);
        results.push({
            co: `CO${offset + i + 1}`,
            desc: `${bloom.verb.charAt(0).toUpperCase() + bloom.verb.slice(1)} ${seed.toLowerCase()}`,
            bloom: bloom.name,
            bloomCode: bloom.code
        });
    }
    return results;
  };

  const handleSave = () => {
    if (pendingCOs.length === 0) return;
    const combined = [...storedCOs, ...pendingCOs];
    setCOs(courseId, combined);
    addAuditEntry({
      type: "co_generate", userId: user?.id || "fac", role: "faculty",
      action: `AI Generated ${pendingCOs.length} COs for ${courseId.toUpperCase()}`,
      ip: "127.0.0.1"
    });
    addToast(`${pendingCOs.length} COs saved to course portfolio.`, "success");
    setPendingCOs([]);
  };

  const applyLibrary = (libId: string) => {
    const lib = coLibrary.find(l => l.id === libId);
    if (!lib) return;
    const mapped = lib.cos.map(c => ({
      co: c.co, desc: c.desc, bloomCode: c.bloomCode,
      bloom: BLOOMS_LEVELS.find(b => b.code === c.bloomCode)?.name || "Analyze"
    }));
    setPendingCOs(mapped);
    addToast(`Template "${lib.name}" loaded for review.`, "info");
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-[1600px] mx-auto pb-32">
      {/* Header */}
      <motion.div variants={fadeSlideUp} className="mb-8 flex justify-between items-center px-4">
        <div className="flex flex-col gap-1">
          <Link href={`/courses/${courseId}`} className="flex items-center gap-2 text-white/30 hover:text-white transition-colors text-[10px] font-mono uppercase tracking-widest mb-2">
            <ChevronLeft className="w-3.5 h-3.5" /> Back to Course
          </Link>
          <h1 className="text-3xl font-display text-white">AI CO Generator <span className="text-white/20 font-light">2.0</span></h1>
        </div>
        <div className="flex gap-4">
          <select onChange={e => e.target.value && applyLibrary(e.target.value)} defaultValue=""
            className="bg-white/5 border border-white/10 px-4 py-2 text-white/60 text-[10px] font-mono uppercase rounded outline-none hover:border-brand/30 transition-all">
            <option value="">Load Template library…</option>
            {coLibrary.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <button onClick={handleSave} disabled={pendingCOs.length === 0}
            className="px-6 py-2 bg-brand text-white text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 rounded hover:bg-brand/90 transition-all disabled:opacity-30">
            <Save className="w-3.5 h-3.5" /> Save COs
          </button>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-px bg-white/10 border-t border-b border-white/10">
        
        {/* LEFT: Chatbot Panel */}
        <div className="bg-[#0a0a0f] p-10 flex flex-col h-[700px]">
          <div className="flex-1 overflow-y-auto pr-4 mb-6 space-y-8">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'ai' && <div className="w-8 h-8 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center mr-4 shrink-0 mt-1"><Sparkles className="w-4 h-4 text-brand" /></div>}
                <div className={`max-w-[85%] p-5 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-brand/10 border border-brand/20 text-white font-light' : 'bg-white/[0.03] border border-white/5 text-white/70'}`}>
                   {m.text.split('\n').map((line, j) => <p key={j} className={j > 0 ? "mt-3" : ""}>{line}</p>)}
                </div>
              </div>
            ))}
            {loading && (
               <div className="flex gap-2 p-4 bg-white/[0.02] rounded-lg w-20 items-center justify-center">
                 <div className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce" />
                 <div className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce [animation-delay:0.2s]" />
                 <div className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce [animation-delay:0.4s]" />
               </div>
            )}
            <div ref={bottomRef} />
          </div>
          
          <div className="relative group">
            <div className="absolute inset-x-0 -top-6 h-6 bg-gradient-to-t from-[#0a0a0f] to-transparent pointer-events-none" />
            <div className="flex items-center gap-3">
              <textarea 
                value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                rows={2}
                placeholder="Type your syllabus or response..."
                className="flex-1 bg-white/5 border border-white/10 p-4 text-white text-sm outline-none focus:border-brand/50 transition-all rounded-xl resize-none font-light"
              />
              <button onClick={handleSend} disabled={!input.trim() || loading}
                className="p-4 bg-brand text-white rounded-xl hover:bg-brand/90 transition-all disabled:opacity-30">
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-[9px] text-white/20 font-mono mt-3 uppercase tracking-tighter text-center">AI generated content may require human validation</p>
          </div>
        </div>

        {/* RIGHT: Live Preview Panel */}
        <div className="bg-[#0c0c14] p-10 overflow-y-auto h-[700px]">
          <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
            <h3 className="text-sm font-mono text-white/40 uppercase tracking-widest flex items-center gap-3">
              <ListOrdered className="w-4 h-4" /> Live CO Preview Table
            </h3>
            <span className="text-[9px] font-mono bg-white/5 px-2 py-1 rounded text-white/30 uppercase">{pendingCOs.length} rows</span>
          </div>

          <div className="space-y-4">
            {pendingCOs.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-white/10 border border-dashed border-white/10 rounded-2xl">
                <Target className="w-8 h-8 mb-4 opacity-20" />
                <p className="text-xs uppercase tracking-widest font-mono">Chat with the AI to<br/>populate results</p>
              </div>
            ) : pendingCOs.map(co => (
               <motion.div key={co.co} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                 className="bg-white/[0.02] border border-white/5 rounded-xl transition-all hover:bg-white/[0.03]">
                 
                 {editingCO === co.co ? (
                   <div className="p-6 flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] font-bold text-brand uppercase">{co.co}</span>
                         <select value={editBloom} onChange={e => setEditBloom(e.target.value)}
                           className="bg-black/40 border border-white/10 text-[10px] px-2 py-1 rounded text-white outline-none">
                           {BLOOMS_LEVELS.map(l => <option key={l.code} value={l.code}>{l.code} — {l.name}</option>)}
                         </select>
                      </div>
                      <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={3}
                        className="bg-black/40 border border-white/10 p-3 text-white text-xs outline-none focus:border-brand/30 rounded resize-none" />
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => {
                          const lvl = BLOOMS_LEVELS.find(b => b.code === editBloom);
                          setPendingCOs(p => p.map(c => c.co === co.co ? { ...c, desc: editText, bloomCode: editBloom, bloom: lvl?.name || c.bloom } : c));
                          setEditingCO(null);
                        }} className="flex-1 py-1.5 bg-attain/20 border border-attain/30 text-attain text-[10px] font-mono uppercase rounded flex items-center justify-center gap-2">
                          <Check className="w-3 h-3" /> Confirm Change
                        </button>
                        <button onClick={() => setEditingCO(null)} className="px-4 py-1.5 border border-white/10 text-white/30 text-[10px] font-mono uppercase rounded">Cancel</button>
                      </div>
                   </div>
                 ) : (
                   <div className="p-6 flex gap-6 items-start group">
                     <div className="w-10 h-10 rounded bg-brand/5 border border-brand/10 flex items-center justify-center text-brand font-bold text-xs shrink-0">{co.co}</div>
                     <div className="flex-1">
                        <p className="text-sm text-white/80 leading-relaxed font-light mb-4">{co.desc}</p>
                        <div className="flex items-center gap-4">
                          <span className={`text-[10px] font-mono flex items-center gap-2 ${BLOOM_COLORS[co.bloomCode]}`}>
                            <Activity className="w-3 h-3" /> {co.bloomCode} — {co.bloom}
                          </span>
                          <span className="w-px h-3 bg-white/10" />
                          <span className="text-[10px] font-mono text-white/20 uppercase">Action: {co.desc.split(' ')[0]}</span>
                        </div>
                     </div>
                     <div className="flex flex-col gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                       <button onClick={() => { setEditingCO(co.co); setEditText(co.desc); setEditBloom(co.bloomCode); }} className="p-2 hover:bg-white/10 rounded text-white/40 hover:text-white transition-all"><Edit3 className="w-3.5 h-3.5" /></button>
                       <button onClick={() => setPendingCOs(p => p.filter(x => x.co !== co.co))} className="p-2 hover:bg-alert/10 rounded text-white/40 hover:text-alert transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                     </div>
                   </div>
                 )}
               </motion.div>
            ))}
          </div>

          {/* Current Saved Info */}
          {storedCOs.length > 0 && (
            <div className="mt-12 pt-8 border-t border-white/5">
              <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mb-4">Saved Portfolio ({storedCOs.length})</p>
              <div className="flex flex-wrap gap-2">
                 {storedCOs.map(co => (
                   <div key={co.co} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full flex items-center gap-2">
                     <CheckCircle2 className="w-3 h-3 text-attain" />
                     <span className="text-[10px] font-bold text-white/60">{co.co}</span>
                   </div>
                 ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
