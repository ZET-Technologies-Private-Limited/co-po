"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, BrainCircuit, Loader2, RotateCcw, Save, BookOpen } from "lucide-react";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";
import { useDataStore, PROGRAM_OUTCOMES } from "@/lib/dataStore";
import { computeCOAttainmentFromMarks } from "@/lib/computations";
import {
  CHATBOT_FALLBACK_RESPONSES,
  formatCOGenerationPrompt,
  formatConfidenceScore,
  generateSuggestedReplies,
  getConfidenceColor,
  requestBTJustification,
  useChatbotMemory,
  useChatbotWorkflowDraft,
  type SuggestedReply,
} from "@/lib/chatbotUtils";
import { getAttainmentLevel } from "@/lib/statusIndicators";

type Message = {
  id: number;
  role: "user" | "ai";
  text: string;
  confidence?: number;
  suggestions?: SuggestedReply[];
  isFallback?: boolean;
};

const DEFAULT_SUGGESTIONS = [
  "Show CO attainment for DBMS",
  "Which CO has lowest attainment?",
  "Generate PO attainment summary",
  "List at-risk courses this semester",
  "Compare T1 and T2 performance",
];

const makeGreeting = (courseCode?: string) =>
  `Hello. I'm your Nexus AI assistant. Ask about CO or PO attainment, weak outcomes, Bloom justification, or generate a course-outcome prompt${courseCode ? ` for ${courseCode}` : ""}.`;

export default function ChatbotPage() {
  const courses = useDataStore(state => state.courses);
  const cos = useDataStore(state => state.cos);
  const submissions = useDataStore(state => state.submissions);
  const examConfigs = useDataStore(state => state.examConfigs);
  const thresholds = useDataStore(state => state.thresholds);

  const [selectedCourseId, setSelectedCourseId] = useState("");
  const draftCourseId = selectedCourseId || "global";
  const { memory, recordMessage, setCourseContext, clearMemory } = useChatbotMemory(draftCourseId);
  const { draft, isLoading, saveDraft, clearDraft } = useChatbotWorkflowDraft(draftCourseId, "validation");
  const restoreHandledRef = useRef(false);
  const [restoredAt, setRestoredAt] = useState<string | null>(null);

  const selectedCourse = useMemo(
    () => courses.find(course => course.id === selectedCourseId) || courses[0] || null,
    [courses, selectedCourseId]
  );

  const greeting = useMemo(() => ({ id: 1, role: "ai" as const, text: makeGreeting(selectedCourse?.code) }), [selectedCourse?.code]);
  const [messages, setMessages] = useState<Message[]>([greeting]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const courseInsights = useMemo(
    () =>
      courses
        .map(course => {
          const approved = (submissions[course.id] || []).filter(entry => entry.status === "approved");
          const students = approved.flatMap(entry => entry.students);
          const questions = (examConfigs[course.id] || []).flatMap(entry => entry.questions);
          if (!students.length || !questions.length) return null;

          const attainment = computeCOAttainmentFromMarks(students, questions, thresholds.targetPassPct);
          const outcomes = Object.entries(attainment)
            .map(([co, details]) => ({ co, pct: details.pct }))
            .sort((left, right) => left.pct - right.pct);
          if (!outcomes.length) return null;

          const overall = outcomes.reduce((sum, item) => sum + item.pct, 0) / outcomes.length;
          return {
            course,
            outcomes,
            weakest: outcomes[0],
            overall,
          };
        })
        .filter(Boolean),
    [courses, submissions, examConfigs, thresholds]
  );

  const selectedInsight = useMemo(() => {
    const direct = courseInsights.find(item => item?.course.id === selectedCourse?.id);
    return direct || courseInsights[0] || null;
  }, [courseInsights, selectedCourse]);

  const lowestCourse = useMemo(() => {
    const sorted = [...courseInsights].sort((left, right) => (left?.overall || 0) - (right?.overall || 0));
    return sorted[0] || null;
  }, [courseInsights]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (!courses.length || selectedCourseId) return;
    setSelectedCourseId(courses[0].id);
  }, [courses, selectedCourseId]);

  useEffect(() => {
    restoreHandledRef.current = false;
    setRestoredAt(null);
    setMessages([greeting]);
    setInput("");
  }, [draftCourseId, greeting]);

  useEffect(() => {
    if (!selectedCourse) return;
    setCourseContext(selectedCourse.name, selectedCourse.code, undefined, PROGRAM_OUTCOMES.map(outcome => outcome.id));
  }, [selectedCourse, setCourseContext]);

  useEffect(() => {
    if (!draft || restoreHandledRef.current) return;
    const data = draft.data || {};
    if (Array.isArray(data.messages) && data.messages.length) {
      setMessages(data.messages as Message[]);
    }
    if (typeof data.input === "string") {
      setInput(data.input);
    }
    restoreHandledRef.current = true;
    setRestoredAt(new Date(draft.savedAt).toLocaleString());
  }, [draft]);

  useEffect(() => {
    if (!selectedCourse) return;
    if (messages.length === 1 && !input.trim() && !restoredAt) return;
    const handle = window.setTimeout(() => {
      saveDraft(typing ? 2 : 1, { input, messages }, memory);
    }, 500);

    return () => window.clearTimeout(handle);
  }, [selectedCourse, input, messages, typing, saveDraft, memory, restoredAt]);

  const buildResponse = (query: string): Omit<Message, "id" | "role"> => {
    const lower = query.toLowerCase();
    const selectedCourseCOs = (selectedCourse && cos[selectedCourse.id]) || [];
    const weakestCO = selectedInsight?.weakest;

    if ((lower.includes("lowest") || lower.includes("risk")) && lowestCourse) {
      return {
        text: `Current risk snapshot:\n• Lowest course average: ${lowestCourse.course.code} - ${lowestCourse.course.name} at ${lowestCourse.overall.toFixed(1)}%\n• Weakest CO: ${lowestCourse.weakest.co} at ${lowestCourse.weakest.pct.toFixed(1)}% (${getAttainmentLevel(lowestCourse.weakest.pct)})\n• Recommended action: review the mapped questions for ${lowestCourse.weakest.co} and assign a remedial cycle before the next approval window.`,
        confidence: 91,
        suggestions: generateSuggestedReplies("risk", "feedback"),
      };
    }

    if ((lower.includes("attainment") || lower.includes("course")) && selectedInsight) {
      const lines = selectedInsight.outcomes
        .slice(0, 6)
        .map(item => `• ${item.co} - ${item.pct.toFixed(1)}% (${getAttainmentLevel(item.pct)})`)
        .join("\n");
      return {
        text: `CO attainment for ${selectedInsight.course.code} - ${selectedInsight.course.name}:\n${lines}\n\nAverage attainment: ${selectedInsight.overall.toFixed(1)}%\nWeakest mapped outcome: ${selectedInsight.weakest.co} at ${selectedInsight.weakest.pct.toFixed(1)}%.`,
        confidence: 89,
        suggestions: generateSuggestedReplies("attainment", "mapping"),
      };
    }

    if (lower.includes("po") || lower.includes("program")) {
      const baseline = courseInsights.length
        ? courseInsights.reduce((sum, item) => sum + (item?.overall || 0), 0) / courseInsights.length
        : 0;
      const poLines = PROGRAM_OUTCOMES.slice(0, 4)
        .map((po, index) => `• ${po.id} ${po.name} - ${Math.max(42, Math.min(92, Math.round(baseline + 8 - index * 4)))}%`)
        .join("\n");
      return {
        text: `Program outcome preview for the current dataset:\n${poLines}\n\nThis is a quick assistant summary for discussion. Use the PO attainment screen for the audited report and trace view.`,
        confidence: 73,
        suggestions: generateSuggestedReplies("po", "mapping"),
      };
    }

    if (lower.includes("bloom") || lower.includes("bt")) {
      const targetCO = selectedCourseCOs.find(item => item.co === weakestCO?.co) || selectedCourseCOs[0];
      if (!targetCO) {
        return {
          text: CHATBOT_FALLBACK_RESPONSES.unclear,
          confidence: 34,
          suggestions: generateSuggestedReplies("fallback", "feedback"),
          isFallback: true,
        };
      }

      return {
        text: requestBTJustification(`${targetCO.co}: ${targetCO.desc}`, targetCO.bloomCode || "App"),
        confidence: 78,
        suggestions: generateSuggestedReplies("bloom", "btm_justification"),
      };
    }

    if (lower.includes("generate") && lower.includes("co") && selectedCourse) {
      const existingCOs = Object.fromEntries(((cos[selectedCourse.id] || []).map(item => [item.co, item.desc])));
      return {
        text: formatCOGenerationPrompt({
          type: "partial",
          courseId: selectedCourse.id,
          courseCode: selectedCourse.code,
          courseSyllabus: `${selectedCourse.name} syllabus context`,
          existingCOs,
          targetCOs: Object.keys(existingCOs).slice(0, 2),
          programOutcomes: PROGRAM_OUTCOMES.slice(0, 5).map(outcome => outcome.id),
          context: "Keep the statements measurable and aligned to the current threshold scheme.",
        }),
        confidence: 76,
        suggestions: generateSuggestedReplies("generate", "co_generation"),
      };
    }

    if (lower.includes("history") || lower.includes("conversation")) {
      const history = memory.conversationHistory.slice(-6);
      if (!history.length) {
        return {
          text: "No stored session history yet. Ask a question and I will keep the context for this session and restore it from draft recovery.",
          confidence: 86,
          suggestions: DEFAULT_SUGGESTIONS.slice(0, 3).map(text => ({ text, action: "clarify" as const })),
        };
      }

      return {
        text: history.map(entry => `${entry.role === "assistant" ? "Nexus AI" : "You"}: ${entry.content}`).join("\n"),
        confidence: 82,
        suggestions: generateSuggestedReplies("history", "feedback"),
      };
    }

    return {
      text: CHATBOT_FALLBACK_RESPONSES.unclear,
      confidence: 32,
      suggestions: DEFAULT_SUGGESTIONS.slice(0, 4).map(text => ({ text, action: "clarify" as const })),
      isFallback: true,
    };
  };

  const send = (q: string) => {
    if (!q.trim()) return;
    const userMsg: Message = { id: Date.now(), role: "user", text: q };
    setMessages(prev => [...prev, userMsg]);
    recordMessage("user", q);
    setInput("");
    setTyping(true);
    const delay = 700 + q.length * 10;
    setTimeout(() => {
      const response = buildResponse(q);
      setTyping(false);
      recordMessage("assistant", response.text);
      setMessages(prev => [...prev, { id: Date.now() + 1, role: "ai", ...response }]);
    }, delay);
  };

  const visibleSuggestions = useMemo(() => {
    const lastAssistant = [...messages].reverse().find(message => message.role === "ai");
    if (lastAssistant?.suggestions?.length) {
      return lastAssistant.suggestions.map(item => item.text);
    }
    return DEFAULT_SUGGESTIONS;
  }, [messages]);

  const resetConversation = async () => {
    setMessages([greeting]);
    setInput("");
    clearMemory();
    await clearDraft();
    setRestoredAt(null);
  };

  return (
    <div className="w-full flex flex-col h-screen pb-0">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-3xl mx-auto w-full px-6 pt-12 flex flex-col h-full">

        {/* Header */}
        <motion.div variants={fadeSlideUp} className="mb-8 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 text-sm font-mono text-aurora uppercase tracking-widest mb-4">
                <BrainCircuit className="w-4 h-4" /> Nexus Intelligence
              </div>
              <h1 className="text-4xl font-display text-white">AI Assistant</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={() => void resetConversation()} className="flex items-center gap-2 border border-white/10 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-white/50 hover:border-white/30 hover:text-white transition-colors">
                <RotateCcw className="w-3.5 h-3.5" /> Clear session
              </button>
              <button onClick={() => saveDraft(typing ? 2 : 1, { input, messages }, memory)} className="flex items-center gap-2 border border-white/10 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-white/50 hover:border-white/30 hover:text-white transition-colors">
                <Save className="w-3.5 h-3.5" /> Save draft
              </button>
            </div>
          </div>
          <div className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-white/35">Course context</p>
              <div className="mt-2 flex items-center gap-3 text-sm text-white/70">
                <BookOpen className="h-4 w-4 text-brand" />
                <select
                  value={selectedCourse?.id || ""}
                  onChange={event => setSelectedCourseId(event.target.value)}
                  className="min-w-[240px] border border-white/10 bg-transparent px-3 py-2 text-sm text-white outline-none transition-colors hover:border-white/30"
                >
                  {courses.map(course => (
                    <option key={course.id} value={course.id} className="bg-[#0D1829]">
                      {course.code} - {course.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-white/30">
              <div>{memory.conversationHistory.length} messages in memory</div>
              {restoredAt && <div className="mt-2 text-attain">Draft restored at {restoredAt}</div>}
              {isLoading && <div className="mt-2 text-white/20">Loading saved draft...</div>}
            </div>
          </div>
        </motion.div>

        {/* Suggestion Chips */}
        <motion.div variants={fadeSlideUp} className="flex gap-3 flex-wrap mb-6 shrink-0">
          {visibleSuggestions.map(s => (
            <button key={s} onClick={() => send(s)}
              className="px-4 py-2 border border-white/10 text-white/50 text-xs font-mono hover:border-aurora/50 hover:text-aurora transition-colors uppercase tracking-wide">
              {s}
            </button>
          ))}
        </motion.div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-8 py-4 pr-2 mb-4">
          <AnimatePresence>
            {messages.map(msg => (
              <motion.div key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "ai" && (
                  <div className="w-8 h-8 rounded-full border border-aurora/50 flex items-center justify-center shrink-0 mt-1">
                    <Sparkles className="w-4 h-4 text-aurora" />
                  </div>
                )}
                <div className={`max-w-xl ${msg.role === "user" ? "text-right" : ""}`}>
                  <p className={`leading-relaxed whitespace-pre-line font-light text-lg ${msg.role === "ai" ? "text-white/80" : "text-white"}`}>
                    {msg.text}
                  </p>
                  <div className={`mt-2 flex flex-wrap gap-3 text-xs font-mono ${msg.role === "user" ? "justify-end text-white/20" : "text-white/20"}`}>
                    <span>{msg.role === "ai" ? "Nexus AI" : "You"}</span>
                    {typeof msg.confidence === "number" && <span className={getConfidenceColor(msg.confidence)}>{formatConfidenceScore(msg.confidence)}</span>}
                    {msg.isFallback && <span className="text-alert">Fallback guidance</span>}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          <AnimatePresence>
            {typing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full border border-aurora/50 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-aurora" />
                </div>
                <div className="flex gap-1 items-center h-8">
                  {[0, 1, 2].map(i => (
                    <motion.div key={i} className="w-2 h-2 rounded-full bg-aurora/60"
                      animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-white/10 pt-6 pb-8">
          <div className="flex items-center gap-4">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send(input)}
              placeholder="Ask about attainment, outcomes, or generate reports..."
              className="flex-1 bg-transparent border-b border-white/20 focus:border-white py-3 text-white placeholder-white/30 outline-none transition-colors text-lg"
            />
            <button onClick={() => send(input)} disabled={!input.trim() || typing}
              className="w-12 h-12 flex items-center justify-center border border-white/20 hover:border-white hover:bg-white hover:text-black text-white transition-all disabled:opacity-30 shrink-0">
              {typing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
