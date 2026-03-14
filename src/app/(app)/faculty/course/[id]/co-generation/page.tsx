"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  Bot,
  CheckCircle2,
  ChevronRight,
  FileText,
  Loader2,
  Minus,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import {
  CO_PO_MAPPING,
  CODefinition,
  PROGRAM_OUTCOMES,
  PROGRAM_SPECIFIC_OUTCOMES,
  useDataStore,
} from "@/lib/dataStore";
import { AccessGate } from "@/components/auth/AccessGate";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";
import jsPDF from "jspdf";
import { BLOOMS_LEVELS, detectBloomsLevel } from "@/lib/computations";

const PO_LIST = PROGRAM_OUTCOMES.map((p) => p.id);
const PSO_LIST = PROGRAM_SPECIFIC_OUTCOMES.map((p) => p.id);

type ChatRole = "ai" | "user";

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  ts: string;
};

type ExtCO = CODefinition & {
  poMap: Record<string, number>;
  psoMap: Record<string, number>;
  status: "ai" | "edited" | "saved" | "unsaved";
  verb?: string;
};

const charLimit = 5000;

function nowLabel() {
  return new Date().toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function makeCOId(index: number) {
  return `CO${index + 1}`;
}

export default function FacultyCOGenerationPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const courses = useDataStore((s) => s.courses);
  const course = useMemo(
    () => courses.find((c) => c.id === courseId),
    [courses, courseId],
  );

  const existingCOs = useDataStore((s) => s.cos[courseId] || []);
  const setCOs = useDataStore((s) => s.setCOs);
  const coLibrary = useDataStore((s) => s.coLibrary);
  const submissions = useDataStore((s) => s.submissions);
  const ay = useDataStore((s) => s.ay);

  const [step, setStep] = useState(1);
  const [syllabus, setSyllabus] = useState("");
  const [coCount, setCoCount] = useState<4 | 5 | 6>(5);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [split, setSplit] = useState(45); // % for left pane
  const [autoStick, setAutoStick] = useState(true);
  const [showBackToLatest, setShowBackToLatest] = useState(false);
  const [uploadName, setUploadName] = useState<string | null>(null);

  const [rows, setRows] = useState<ExtCO[]>([]);
  const [pendingSave, setPendingSave] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editingDesc, setEditingDesc] = useState("");
  const [openPoPicker, setOpenPoPicker] = useState<string | null>(null);
  const [openPsoPicker, setOpenPsoPicker] = useState<string | null>(null);

  const chatBodyRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  // initialise chat + rows
  useEffect(() => {
    const baseIntro: ChatMessage[] = [
      {
        id: "m1",
        role: "ai",
        text: `Hi! I'm your CO design assistant for ${
          course?.code || "this course"
        }. We'll go step‑by‑step to generate strong COs aligned with PO/PSO.`,
        ts: nowLabel(),
      },
      {
        id: "m2",
        role: "ai",
        text: "Step 1 of 7 · Paste your syllabus (max 5000 chars) or upload a .docx/.txt file. Then we’ll confirm PO/PSOs and generate COs.",
        ts: nowLabel(),
      },
    ];
    setMessages(baseIntro);

    if (existingCOs.length) {
      const withMaps: ExtCO[] = existingCOs.map((c, idx) => {
        const map = CO_PO_MAPPING[c.co] || {};
        const poMap: Record<string, number> = {};
        const psoMap: Record<string, number> = {};
        Object.entries(map).forEach(([k, v]) => {
          if (k.startsWith("PO")) poMap[k] = v;
          if (k.startsWith("PSO")) psoMap[k] = v;
        });
        return {
          ...c,
          co: c.co || makeCOId(idx),
          poMap,
          psoMap,
          status: "saved",
          verb: detectBloomsLevel(c.desc).verb,
        };
      });
      setRows(withMaps);
      setStep(7);
    }
  }, [course?.code, existingCOs]);

  // scroll management
  useEffect(() => {
    if (!chatBodyRef.current) return;
    const el = chatBodyRef.current;
    if (autoStick) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isThinking, autoStick]);

  const handleChatScroll = () => {
    const el = chatBodyRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setAutoStick(nearBottom);
    setShowBackToLatest(!nearBottom);
  };

  const pushMessage = (m: Omit<ChatMessage, "id" | "ts">) => {
    setMessages((prev) => [
      ...prev,
      { ...m, id: Math.random().toString(36).slice(2), ts: nowLabel() },
    ]);
  };

  const regenerateFromSyllabus = async (countOverride?: number) => {
    const count = (countOverride || coCount) as 4 | 5 | 6;
    if (!syllabus.trim()) return;
    setIsThinking(true);
    await new Promise((r) => setTimeout(r, 1200));

    const units = syllabus
      .split(/\n|,/)
      .map((s) => s.trim())
      .filter(Boolean);

    const newRows: ExtCO[] = Array.from({ length: count }).map((_, i) => {
      const coId = makeCOId(i);
      const topic = units[i] || "course concepts";
      const desc = `At the end of the course, students will be able to ${topic.toLowerCase()}.`;
      const bloomInfo = detectBloomsLevel(desc);

      const fromMap = CO_PO_MAPPING[coId] || {};
      const poMap: Record<string, number> = {};
      const psoMap: Record<string, number> = {};
      Object.entries(fromMap).forEach(([k, v]) => {
        if (k.startsWith("PO")) poMap[k] = v;
        if (k.startsWith("PSO")) psoMap[k] = v;
      });

      return {
        co: coId,
        desc,
        bloom: bloomInfo.name,
        bloomCode: bloomInfo.code,
        poMap,
        psoMap,
        status: "ai",
        verb: bloomInfo.verb,
      };
    });

    setRows(newRows);
    setPendingSave(true);
    setIsThinking(false);
    setStep(6);

    pushMessage({
      role: "ai",
      text: `I’ve drafted ${count} COs with Bloom’s levels and PO/PSO suggestions. Review them in the right panel — you can edit statements, BT level, and mappings.`,
    });
  };

  const handleSuggested = (kind: "why" | "improve" | "regenerate") => {
    if (kind === "why") {
      pushMessage({
        role: "user",
        text: "Why did you choose these Bloom’s levels and mappings?",
      });
      pushMessage({
        role: "ai",
        text: "I assigned Bloom’s levels based on the action verbs and cognitive demand in each statement. Higher‑order verbs like analyse/evaluate/create map to L4–L6 and typically contribute more strongly (2/3) to relevant POs and PSOs.",
      });
    } else if (kind === "improve") {
      pushMessage({
        role: "user",
        text: "Rewrite CO2 with a stronger, more measurable verb.",
      });
      if (rows[1]) {
        const updated = [...rows];
        const base = updated[1];
        const improved = base.desc.replace(
          /understand|know|learn/gi,
          "analyse",
        );
        updated[1] = {
          ...base,
          desc: improved,
          status: "edited",
        };
        setRows(updated);
        setPendingSave(true);
      }
      pushMessage({
        role: "ai",
        text: "I strengthened CO2 by using a higher‑order verb and clarifying the performance expectation. Review and tweak further if needed.",
      });
    } else {
      pushMessage({
        role: "user",
        text: `Regenerate all ${coCount} COs from the same syllabus.`,
      });
      regenerateFromSyllabus();
    }
  };

  const handleUserSend = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    pushMessage({ role: "user", text });

    const whyCoMatch = text.match(/why\s+is\s+CO(\d+)/i);
    if (whyCoMatch && rows.length) {
      const index = parseInt(whyCoMatch[1], 10) - 1;
      const row = rows[index];
      if (row) {
        const level = BLOOMS_LEVELS.find((b) => b.code === row.bloomCode);
        const verb = row.verb || detectBloomsLevel(row.desc).verb;
        pushMessage({
          role: "ai",
          text:
            `CO${index + 1} is tagged as ${level?.code} — ${level?.name} because its wording ` +
            `uses the verb "${verb}", which belongs to the ${level?.name} level in Bloom’s taxonomy. ` +
            `This indicates the expected cognitive effort (from simple recall at L1 up to creation at L6). ` +
            `You can raise or lower the level by changing the verb and updating the BT level dropdown.`,
        });
        return;
      }
    }

    const redoMatch = text.match(/redo\s*CO(\d+)/i);
    if (redoMatch && rows.length) {
      const index = parseInt(redoMatch[1], 10) - 1;
      if (rows[index]) {
        setIsThinking(true);
        await new Promise((r) => setTimeout(r, 800));
        const unit = syllabus.split(/\n|,/)[index] || "this outcome";
        const desc = `Design and justify solutions related to ${unit.toLowerCase()} using higher‑order thinking skills.`;
        const bloomInfo = detectBloomsLevel(desc);
        const updated = [...rows];
        updated[index] = {
          ...rows[index],
          desc,
          bloom: bloomInfo.name,
          bloomCode: bloomInfo.code,
          verb: bloomInfo.verb,
          status: "ai",
        };
        setRows(updated);
        setPendingSave(true);
        setIsThinking(false);
        pushMessage({
          role: "ai",
          text: `I rewrote CO${index + 1} with a sharper verb and clearer performance focus. Review it on the right.`,
        });
        return;
      }
    }

    if (/why|reason/i.test(text) && rows.length) {
      pushMessage({
        role: "ai",
        text: "Each CO’s Bloom level is inferred from verbs like apply/analyse/create. POs/PSOs are chosen based on topic keywords (programming, communication, ethics, etc.). You can override any of these — edits are fully respected in later attainment.",
      });
      return;
    }

    pushMessage({
      role: "ai",
      text: "I’ve noted this as a comment on your CO design. I’ll use it to refine wording or mappings when you regenerate.",
    });
  };

  const handleStartOver = () => {
    if (!confirm("This will clear the current chat and CO draft. Continue?"))
      return;
    setStep(1);
    setSyllabus("");
    setRows([]);
    setPendingSave(false);
    setUploadName(null);
    setMessages([
      {
        id: "r1",
        role: "ai",
        text: "Workspace reset. Paste a fresh syllabus or upload a new file to begin again.",
        ts: nowLabel(),
      },
    ]);
  };

  const handleLoadDefaultCOs = () => {
    const lib = coLibrary.find((l) => l.status === "active");
    if (!lib) {
      alert("No active CO library found for this program.");
      return;
    }
    if (!confirm(`Load default COs from "${lib.name}" and overwrite current draft?`))
      return;
    const withMaps: ExtCO[] = lib.cos.map((c, idx) => {
      const coId = c.co || makeCOId(idx);
      const map = CO_PO_MAPPING[coId] || {};
      const poMap: Record<string, number> = {};
      const psoMap: Record<string, number> = {};
      Object.entries(map).forEach(([k, v]) => {
        if (k.startsWith("PO")) poMap[k] = v;
        if (k.startsWith("PSO")) psoMap[k] = v;
      });
      const detected = detectBloomsLevel(c.desc || "");
      return {
        ...c,
        co: coId,
        bloom: detected.name,
        bloomCode: c.bloomCode || detected.code,
        poMap,
        psoMap,
        status: "ai",
      };
    });
    setRows(withMaps);
    setPendingSave(true);
    setStep(6);
    pushMessage({
      role: "ai",
      text: `Loaded ${withMaps.length} default COs from the library. Adjust them to your syllabus and then save.`,
    });
  };

  const handleSaveAll = () => {
    const payload: CODefinition[] = rows.map((r) => ({
      co: r.co,
      desc: r.desc,
      bloom: r.bloom,
      bloomCode: r.bloomCode,
    }));
    setCOs(courseId, payload);
    setRows((prev) => prev.map((r) => ({ ...r, status: "saved" })));
    setPendingSave(false);
    pushMessage({
      role: "ai",
      text: "All COs are saved for this course. You can proceed to Exam Configuration anytime.",
    });
    setStep(7);
  };

  const handleAddRow = () => {
    const idx = rows.length;
    const desc = "Describe the new measurable course outcome here.";
    const bloomInfo = detectBloomsLevel(desc);
    const coId = makeCOId(idx);
    const map = CO_PO_MAPPING[coId] || {};
    const poMap: Record<string, number> = {};
    const psoMap: Record<string, number> = {};
    Object.entries(map).forEach(([k, v]) => {
      if (k.startsWith("PO")) poMap[k] = v;
      if (k.startsWith("PSO")) psoMap[k] = v;
    });
    setRows((prev) => [
      ...prev,
      {
        co: coId,
        desc,
        bloom: bloomInfo.name,
        bloomCode: bloomInfo.code,
        poMap,
        psoMap,
        status: "unsaved",
        verb: bloomInfo.verb,
      },
    ]);
    setPendingSave(true);
  };

  const handleDeleteRow = (index: number) => {
    const hasMarks =
      (submissions[courseId] || []).some((s) => s.students.length > 0);
    if (hasMarks) return;
    setRows((prev) => prev.filter((_, i) => i !== index));
    setPendingSave(true);
  };

  const coverage = useMemo(() => {
    if (!rows.length || !syllabus.trim())
      return { coverage: 0, low: [] as string[], units: [] as string[] };
    const units = syllabus
      .split(/\n|,/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!units.length)
      return { coverage: 0, low: [] as string[], units: [] as string[] };
    const hit = units.filter((u) =>
      rows.some((r) => r.desc.toLowerCase().includes(u.toLowerCase())),
    );
    const pct = Math.round((hit.length / units.length) * 100);
    const low = units.filter(
      (u) =>
        !rows.some((r) => r.desc.toLowerCase().includes(u.toLowerCase())),
    );
    return { coverage: pct, low, units };
  }, [rows, syllabus]);

  const bloomDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    rows.forEach((r) => {
      dist[r.bloomCode] = (dist[r.bloomCode] || 0) + 1;
    });
    return dist;
  }, [rows]);

  const allLowBloom = useMemo(() => {
    const codes = Object.keys(bloomDistribution);
    if (!codes.length) return false;
    return codes.every((c) => c === "L1" || c === "L2");
  }, [bloomDistribution]);

  const handleExportPdf = () => {
    if (!rows.length) return;
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text(
      `${course?.code || courseId} - ${course?.name || "Course"} COs`,
      10,
      15,
    );
    doc.setFontSize(9);
    doc.text(
      `Sem ${course?.semester ?? "-"}  Section ${course?.section ?? "-"}  AY ${
        ay.ay
      }`,
      10,
      22,
    );
    let y = 30;
    doc.setFontSize(8);
    rows.forEach((r) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(`${r.co} (${r.bloomCode}) - ${r.bloom}`, 10, y);
      y += 4;
      const descLines = doc.splitTextToSize(r.desc, 180);
      doc.text(descLines, 10, y);
      y += descLines.length * 4;
      const poList = Object.keys(r.poMap).filter((k) => r.poMap[k] > 0);
      const psoList = Object.keys(r.psoMap).filter((k) => r.psoMap[k] > 0);
      doc.text(
        `POs: ${poList.length ? poList.join(", ") : "—"}`,
        10,
        y,
      );
      y += 4;
      doc.text(
        `PSOs: ${psoList.length ? psoList.join(", ") : "—"}`,
        10,
        y,
      );
      y += 6;
    });
    doc.save(`${course?.code || courseId}-COs.pdf`);
  };

  const handleMouseDownDivider = () => {
    draggingRef.current = true;
  };
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const bounds = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const pct = ((e.clientX - bounds.left) / bounds.width) * 100;
    const clamped = Math.min(65, Math.max(30, pct));
    setSplit(clamped);
  };
  const handleMouseUp = () => {
    draggingRef.current = false;
  };

  return (
    <AccessGate feature="co_generation" deny="lock">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="flex flex-col h-[calc(100vh-64px)] bg-cosmic"
      >
        {/* Context + step bar */}
        <motion.div
          variants={fadeSlideUp}
          className="px-6 py-3 border-b border-white/10 flex items-center justify-between gap-4 bg-black/30 backdrop-blur"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/faculty/course/${courseId}/co-attainment`)}
              className="inline-flex items-center gap-1.5 text-[10px] font-mono text-white/40 hover:text-white"
            >
              <ArrowLeft className="w-3 h-3" /> Back
            </button>
            <div>
              <p className="text-xs text-white/60">
                {course?.code || "Course"} · CO Generation (AI Assisted)
              </p>
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
                {course?.name || "Course Outcomes Workspace"}
              </p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {course && (
                  <span className="rounded-full border border-white/20 px-2 py-0.5 text-[9px] font-mono text-white/60">
                    Sem {course.semester}
                  </span>
                )}
                {course?.section && (
                  <span className="rounded-full border border-white/20 px-2 py-0.5 text-[9px] font-mono text-white/60">
                    Section {course.section}
                  </span>
                )}
                <span className="rounded-full border border-white/20 px-2 py-0.5 text-[9px] font-mono text-white/60">
                  AY {ay.ay}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-1 text-[9px] font-mono text-white/30 uppercase tracking-widest">
              {[1, 2, 3, 4, 5, 6, 7].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 w-5 rounded-full ${
                    s <= step ? "bg-brand" : "bg-white/15"
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest border border-white/15 px-2 py-0.5">
              Step {step} / 7
            </span>
          </div>
        </motion.div>

        {/* Split layout */}
        <div
          className="flex-1 flex overflow-hidden select-none"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Left – chatbot */}
          <div
            style={{ width: `${split}%` }}
            className="flex flex-col border-r border-white/10 bg-black/40"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-brand/20 flex items-center justify-center text-brand">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="leading-tight">
                  <p className="text-xs text-white">CO Design Assistant</p>
                  <p className="text-[9px] text-emerald-400 font-mono uppercase tracking-widest">
                    Live · Bloom & PO aware
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <button
                  onClick={handleStartOver}
                  className="text-[9px] font-mono text-white/40 hover:text-white flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Start Over
                </button>
                <button
                  onClick={handleLoadDefaultCOs}
                  className="text-[9px] font-mono text-white/40 hover:text-brand flex items-center gap-1"
                >
                  <FileText className="w-3 h-3" /> Load Default COs
                </button>
              </div>
            </div>

            <div
              ref={chatBodyRef}
              className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
              onScroll={handleChatScroll}
            >
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`group flex ${
                    m.role === "ai" ? "justify-start" : "justify-end"
                  }`}
                >
                  <div
                    className={`max-w-[90%] rounded-xl px-3 py-2 text-xs leading-relaxed relative ${
                      m.role === "ai"
                        ? "bg-white/5 text-white/75"
                        : "bg-brand text-white"
                    }`}
                  >
                    {m.text}
                    <span className="absolute -bottom-4 right-2 text-[9px] text-white/30 opacity-0 group-hover:opacity-100 transition-opacity">
                      {m.ts}
                    </span>
                  </div>
                </div>
              ))}
              {isThinking && (
                <div className="flex justify-start">
                  <div className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs text-white/40">
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:-0.2s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:-0.1s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" />
                    </span>
                    Thinking…
                  </div>
                </div>
              )}
            </div>

            {showBackToLatest && (
              <button
                onClick={() => {
                  if (!chatBodyRef.current) return;
                  chatBodyRef.current.scrollTop =
                    chatBodyRef.current.scrollHeight;
                  setAutoStick(true);
                  setShowBackToLatest(false);
                }}
                className="mx-auto mb-1 rounded-full bg-black/60 px-3 py-1 text-[9px] font-mono text-white/60 hover:text-white"
              >
                Back to latest
              </button>
            )}

            {/* syllabus + suggestions + input */}
            <div className="border-t border-white/10 p-3 space-y-2 bg-black/40">
              {step === 1 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-white/40">
                    <span>Syllabus / unit‑wise topics</span>
                    <span>
                      {syllabus.length}/{charLimit}
                    </span>
                  </div>
                  <textarea
                    value={syllabus}
                    maxLength={charLimit}
                    onChange={(e) => setSyllabus(e.target.value)}
                    placeholder="Paste unit‑wise topics here. I’ll use them to align COs and POs/PSOs."
                    className="h-20 w-full resize-none rounded-md border border-white/15 bg-black/40 px-2 py-1.5 text-xs text-white outline-none focus:border-brand"
                  />
                  <label className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-white/20 px-2 py-1.5 text-[10px] font-mono text-white/40 hover:border-brand/40 hover:text-white cursor-pointer">
                    <Upload className="w-3 h-3" />
                    <span>
                      {uploadName
                        ? `Attached: ${uploadName}`
                        : "Upload .docx or .txt syllabus"}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadName(file.name);
                        if (
                          file.type === "text/plain" ||
                          file.name.toLowerCase().endsWith(".txt")
                        ) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            const text = String(reader.result || "");
                            setSyllabus((prev) =>
                              prev ? `${prev}\n${text}` : text,
                            );
                            pushMessage({
                              role: "ai",
                              text:
                                "I’ve parsed the uploaded syllabus file and merged it into the text area. " +
                                "You can review and edit the topics before generating COs.",
                            });
                          };
                          reader.readAsText(file);
                        } else {
                          pushMessage({
                            role: "user",
                            text: `Uploaded syllabus file: ${file.name}`,
                          });
                          pushMessage({
                            role: "ai",
                            text:
                              "I’ve recorded your syllabus file. For richer parsing, please also paste key topics into the text box so I can align COs precisely.",
                          });
                        }
                      }}
                    />
                  </label>
                  <button
                    disabled={!syllabus.trim()}
                    onClick={async () => {
                      pushMessage({
                        role: "user",
                        text: "Syllabus pasted. Please analyse and move to PO/PSO confirmation.",
                      });
                      setIsThinking(true);
                      await new Promise((r) => setTimeout(r, 900));
                      setIsThinking(false);
                      pushMessage({
                        role: "ai",
                        text: "Great. I’ve extracted key themes from your syllabus. Next we’ll confirm PO/PSOs and CO count.",
                      });
                      setStep(3);
                    }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-white disabled:opacity-40"
                  >
                    Analyse syllabus <Sparkles className="w-3 h-3" />
                  </button>
                </div>
              )}

              {step >= 3 && (
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => handleSuggested("why")}
                    className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] text-white/60 hover:border-brand hover:text-brand"
                  >
                    Why these Bloom levels?
                  </button>
                  <button
                    onClick={() => handleSuggested("improve")}
                    className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] text-white/60 hover:border-brand hover:text-brand"
                  >
                    Improve CO2 wording
                  </button>
                  <button
                    onClick={() => handleSuggested("regenerate")}
                    className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] text-white/60 hover:border-brand hover:text-brand"
                  >
                    Regenerate all COs
                  </button>
                </div>
              )}

              {step >= 3 && (
                <div className="flex items-center justify-between rounded-md bg-white/5 px-2 py-1.5">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">
                      CO Count
                    </span>
                    <div className="flex gap-1">
                      {[4, 5, 6].map((n) => (
                        <button
                          key={n}
                          onClick={() => setCoCount(n as 4 | 5 | 6)}
                          className={`h-6 w-8 rounded border text-[10px] font-mono ${
                            coCount === n
                              ? "border-brand bg-brand/20 text-brand"
                              : "border-white/20 text-white/50 hover:border-brand/40 hover:text-brand"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => regenerateFromSyllabus()}
                    disabled={!syllabus.trim()}
                    className="inline-flex items-center gap-1 rounded-md bg-brand px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-white disabled:opacity-40"
                  >
                    Generate {coCount} COs <Sparkles className="w-3 h-3" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-1.5 rounded-md border border-white/15 bg-black/60 px-2 py-1.5">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={1}
                  placeholder='Ask, e.g. "why is CO3 L4?" or "redo CO2".'
                  className="flex-1 resize-none bg-transparent text-[11px] text-white outline-none"
                />
                <button
                  onClick={handleUserSend}
                  className="rounded-full bg-brand px-2 py-1 text-white disabled:opacity-40"
                  disabled={!input.trim()}
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div
            onMouseDown={handleMouseDownDivider}
            className="w-1 cursor-col-resize bg-gradient-to-b from-transparent via-white/20 to-transparent"
          />

          {/* Right – CO table & analytics */}
          <div className="flex-1 flex flex-col bg-black/40">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-3">
              <div className="space-y-0.5">
                <p className="text-xs text-white/70">
                  CO Statements, Bloom Levels & PO/PSO Mapping
                </p>
                <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
                  {rows.length ? `${rows.length} COs in draft` : "No COs yet"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    router.push(`/faculty/course/${courseId}/correlations`)
                  }
                  className="text-[10px] font-mono text-white/40 hover:text-brand underline-offset-4 hover:underline"
                >
                  Edit Correlations
                </button>
                {pendingSave && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest text-amber-300">
                    <AlertCircle className="w-3 h-3" /> Unsaved changes
                  </span>
                )}
                {!pendingSave && rows.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" /> Saved
                  </span>
                )}
                <button
                  disabled={!rows.length || rows.some(r => !r.desc.trim() || !r.bloomCode)}
                  onClick={handleSaveAll}
                  className="inline-flex items-center gap-1 rounded-md bg-brand px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-white disabled:opacity-40"
                >
                  Save all COs
                </button>
                <button
                  disabled={!rows.length}
                  onClick={handleExportPdf}
                  className="inline-flex items-center gap-1 rounded-md border border-white/20 px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-white/70 disabled:opacity-40"
                >
                  Export PDF <FileText className="w-3 h-3" />
                </button>
                <button
                  disabled={!rows.length}
                  onClick={() =>
                    router.push(`/faculty/course/${courseId}/exam-config`)
                  }
                  className="inline-flex items-center gap-1 rounded-md border border-white/20 px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-white/70 disabled:opacity-40"
                >
                  Exam config <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              {rows.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-white/40">
                  <Sparkles className="h-10 w-10 animate-pulse text-brand" />
                  <p className="text-sm">
                    Generate COs from the left panel or load defaults to start.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4 p-4">
                  <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/40">
                    <table className="min-w-[900px] w-full border-collapse text-left text-xs">
                      <thead className="bg-white/[0.03]">
                        <tr>
                          <th className="px-4 py-2 text-[9px] font-mono uppercase tracking-widest text-white/30">
                            CO
                          </th>
                          <th className="px-4 py-2 text-[9px] font-mono uppercase tracking-widest text-white/30">
                            Statement
                          </th>
                          <th className="px-4 py-2 text-[9px] font-mono uppercase tracking-widest text-white/30">
                            BT Verb
                          </th>
                          <th className="px-4 py-2 text-[9px] font-mono uppercase tracking-widest text-white/30">
                            BT Level
                          </th>
                          <th className="px-4 py-2 text-[9px] font-mono uppercase tracking-widest text-white/30">
                            Code
                          </th>
                          <th className="px-4 py-2 text-[9px] font-mono uppercase tracking-widest text-white/30">
                            PO Mapping
                          </th>
                          <th className="px-4 py-2 text-[9px] font-mono uppercase tracking-widest text-white/30">
                            PSO Mapping
                          </th>
                          <th className="px-4 py-2 text-[9px] font-mono uppercase tracking-widest text-white/30">
                            Status
                          </th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r, idx) => (
                          <tr
                            key={r.co}
                            className="border-t border-white/10 align-top hover:bg-white/[0.02]"
                          >
                            <td className="px-4 py-3">
                              <span className="rounded-md bg-brand/10 px-2 py-1 text-[11px] font-mono text-brand">
                                {r.co}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {editingIdx === idx ? (
                                <textarea
                                  value={editingDesc}
                                  onChange={(e) => setEditingDesc(e.target.value)}
                                  onBlur={() => {
                                    const val = editingDesc.trim();
                                    if (!val) {
                                      setEditingIdx(null);
                                      setEditingDesc("");
                                      return;
                                    }
                                    setRows((prev) => {
                                      const copy = [...prev];
                                      copy[idx] = {
                                        ...copy[idx],
                                        desc: val,
                                        status:
                                          copy[idx].status === "saved"
                                            ? "edited"
                                            : copy[idx].status,
                                      };
                                      return copy;
                                    });
                                    setPendingSave(true);
                                    setEditingIdx(null);
                                    setEditingDesc("");
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Escape") {
                                      e.preventDefault();
                                      setEditingIdx(null);
                                      setEditingDesc("");
                                    }
                                    if (e.key === "Enter" && !e.shiftKey) {
                                      e.preventDefault();
                                      (e.currentTarget as HTMLTextAreaElement).blur();
                                    }
                                  }}
                                  autoFocus
                                  className="w-full resize-none rounded-md border border-white/30 bg-black/60 px-2 py-1 text-[11px] text-white outline-none"
                                  rows={3}
                                />
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingIdx(idx);
                                    setEditingDesc(r.desc);
                                  }}
                                  className="w-full text-left rounded-md border border-transparent px-2 py-1 text-[11px] text-white/80 hover:border-white/20"
                                >
                                  <span className="line-clamp-3 whitespace-pre-wrap">
                                    {r.desc}
                                  </span>
                                </button>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {(() => {
                                const level = BLOOMS_LEVELS.find(
                                  (b) => b.code === r.bloomCode,
                                );
                                const verbsHint = level?.verbs.join(", ");
                                return (
                                  <input
                                    value={r.verb || ""}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setRows((prev) => {
                                        const copy = [...prev];
                                        copy[idx] = {
                                          ...copy[idx],
                                          verb: val,
                                          status:
                                            copy[idx].status === "saved"
                                              ? "edited"
                                              : copy[idx].status,
                                        };
                                        return copy;
                                      });
                                      setPendingSave(true);
                                    }}
                                    placeholder="e.g. apply / analyse"
                                    title={
                                      verbsHint
                                        ? `Typical verbs for ${level?.name}: ${verbsHint}`
                                        : undefined
                                    }
                                    className="w-32 rounded-md border border-white/20 bg-black/40 px-2 py-1 text-[11px] text-white/80 outline-none"
                                  />
                                );
                              })()}
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={r.bloomCode}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setRows((prev) => {
                                    const copy = [...prev];
                                    const level = BLOOMS_LEVELS.find(
                                      (b) => b.code === val,
                                    );
                                    copy[idx] = {
                                      ...copy[idx],
                                      bloomCode: val,
                                      bloom: level?.name || copy[idx].bloom,
                                      verb:
                                        level?.verbs[0] ||
                                        copy[idx].verb ||
                                        level?.name,
                                      status:
                                        copy[idx].status === "saved"
                                          ? "edited"
                                          : copy[idx].status,
                                    };
                                    return copy;
                                  });
                                  setPendingSave(true);
                                }}
                                className="w-32 rounded-md border border-white/20 bg-black/40 px-2 py-1 text-[11px] text-white/80 outline-none"
                              >
                                {BLOOMS_LEVELS.map((lvl) => (
                                  <option
                                    key={lvl.code}
                                    value={lvl.code}
                                    className="bg-[#050509]"
                                  >
                                    {lvl.code} — {lvl.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <span className="rounded-md bg-white/5 px-2 py-1 text-[10px] font-mono text-white/60">
                                {r.bloomCode}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {(() => {
                                const selected = PO_LIST.filter(
                                  (po) => (r.poMap[po] || 0) > 0,
                                );
                                return (
                                  <div className="relative">
                                    <button
                                      onClick={() =>
                                        setOpenPoPicker(
                                          openPoPicker === r.co ? null : r.co,
                                        )
                                      }
                                      className="w-full rounded-md border border-white/20 bg-black/40 px-2 py-1 text-left text-[10px] text-white/70"
                                    >
                                      {selected.length
                                        ? selected.join(", ")
                                        : "Select POs"}
                                    </button>
                                    {openPoPicker === r.co && (
                                      <div className="absolute z-10 mt-1 max-h-40 w-52 overflow-y-auto rounded-md border border-white/20 bg-[#050509]/95 p-2 shadow-lg">
                                        {PO_LIST.map((po) => {
                                          const checked =
                                            (r.poMap[po] || 0) > 0;
                                          return (
                                            <label
                                              key={po}
                                              className="flex cursor-pointer items-center gap-2 py-0.5 text-[10px] text-white/70"
                                            >
                                              <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={(e) => {
                                                  const isChecked =
                                                    e.target.checked;
                                                  setRows((prev) => {
                                                    const copy = [...prev];
                                                    const nextMap = {
                                                      ...copy[idx].poMap,
                                                    };
                                                    nextMap[po] = isChecked
                                                      ? nextMap[po] || 3
                                                      : 0;
                                                    copy[idx] = {
                                                      ...copy[idx],
                                                      poMap: nextMap,
                                                      status:
                                                        copy[idx].status ===
                                                        "saved"
                                                          ? "edited"
                                                          : copy[idx].status,
                                                    };
                                                    return copy;
                                                  });
                                                  setPendingSave(true);
                                                }}
                                                className="h-3 w-3 accent-brand"
                                              />
                                              <span className="font-mono">
                                                {po}
                                              </span>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </td>
                            <td className="px-4 py-3">
                              {(() => {
                                const selected = PSO_LIST.filter(
                                  (p) => (r.psoMap[p] || 0) > 0,
                                );
                                return (
                                  <div className="relative">
                                    <button
                                      onClick={() =>
                                        setOpenPsoPicker(
                                          openPsoPicker === r.co ? null : r.co,
                                        )
                                      }
                                      className="w-full rounded-md border border-white/20 bg-black/40 px-2 py-1 text-left text-[10px] text-white/70"
                                    >
                                      {selected.length
                                        ? selected.join(", ")
                                        : "Select PSOs"}
                                    </button>
                                    {openPsoPicker === r.co && (
                                      <div className="absolute z-10 mt-1 max-h-40 w-52 overflow-y-auto rounded-md border border-white/20 bg-[#050509]/95 p-2 shadow-lg">
                                        {PSO_LIST.map((pso) => {
                                          const checked =
                                            (r.psoMap[pso] || 0) > 0;
                                          return (
                                            <label
                                              key={pso}
                                              className="flex cursor-pointer items-center gap-2 py-0.5 text-[10px] text-white/70"
                                            >
                                              <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={(e) => {
                                                  const isChecked =
                                                    e.target.checked;
                                                  setRows((prev) => {
                                                    const copy = [...prev];
                                                    const nextMap = {
                                                      ...copy[idx].psoMap,
                                                    };
                                                    nextMap[pso] = isChecked
                                                      ? nextMap[pso] || 3
                                                      : 0;
                                                    copy[idx] = {
                                                      ...copy[idx],
                                                      psoMap: nextMap,
                                                      status:
                                                        copy[idx].status ===
                                                        "saved"
                                                          ? "edited"
                                                          : copy[idx].status,
                                                    };
                                                    return copy;
                                                  });
                                                  setPendingSave(true);
                                                }}
                                                className="h-3 w-3 accent-brand"
                                              />
                                              <span className="font-mono">
                                                {pso}
                                              </span>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-mono uppercase tracking-widest ${
                                  r.status === "saved"
                                    ? "bg-emerald-500/10 text-emerald-300"
                                    : r.status === "ai"
                                    ? "bg-brand/10 text-brand"
                                    : r.status === "edited"
                                    ? "bg-amber-500/10 text-amber-300"
                                    : "bg-white/10 text-white/60"
                                }`}
                              >
                                {r.status === "saved" && (
                                  <CheckCircle2 className="w-3 h-3" />
                                )}
                                {r.status === "ai" && (
                                  <Sparkles className="w-3 h-3" />
                                )}
                                {r.status === "edited" && (
                                  <AlertCircle className="w-3 h-3" />
                                )}
                                {r.status}
                              </span>
                            </td>
                            <td className="px-2 py-3">
                              <button
                                onClick={() => handleDeleteRow(idx)}
                                className="rounded-full border border-red-500/40 p-1 text-red-400 hover:bg-red-500/20"
                                title="Delete CO row"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* coverage + BT distribution */}
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-white/10 bg-black/50 px-3 py-3">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-white/40">
                        Syllabus coverage by COs
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-white">
                        {coverage.coverage}%
                      </p>
                      {coverage.units.length > 0 && (
                        <div className="mt-2 max-h-32 space-y-1 overflow-y-auto pr-1 text-[11px]">
                          {coverage.units.map((u) => {
                            const covered = !coverage.low.includes(u);
                            return (
                              <p
                                key={u}
                                className={
                                  covered
                                    ? "text-emerald-300/80"
                                    : "text-amber-300"
                                }
                              >
                                {covered ? "✓" : "•"} {u}
                              </p>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/50 px-3 py-3">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-white/40">
                        Bloom level distribution
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-white/70">
                        {Object.entries(bloomDistribution).map(
                          ([code, count]) => (
                            <span
                              key={code}
                              className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 font-mono"
                            >
                              {code}: {count}
                            </span>
                          ),
                        )}
                      </div>
                      {allLowBloom && (
                        <p className="mt-2 text-[11px] text-amber-300">
                          All COs are currently at lower Bloom levels (L1–L2). Consider
                          upgrading at least some outcomes to L3–L6 for better cognitive
                          coverage.
                        </p>
                      )}
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/50 px-3 py-3 flex flex-col justify-between">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-white/40">
                        Actions
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          onClick={handleAddRow}
                          className="inline-flex items-center gap-1 rounded-md border border-white/20 px-2 py-1 text-[10px] text-white/80 hover:border-brand hover:text-brand"
                        >
                          <Plus className="w-3 h-3" /> Add CO
                        </button>
                        <button
                          disabled={!rows.length || rows.some(r => !r.desc.trim() || !r.bloomCode)}
                          onClick={handleSaveAll}
                          className="inline-flex items-center gap-1 rounded-md border border-brand/40 bg-brand/10 px-2 py-1 text-[10px] text-brand disabled:opacity-40"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Save all
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AccessGate>
  );
}
