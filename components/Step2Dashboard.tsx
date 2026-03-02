import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import {
    ArrowLeft, ArrowRight, AlertCircle, Target, ShieldCheck,
    Zap, Sparkles, CheckCircle, Rocket, Sliders, ChevronDown,
    Edit3, RotateCcw, ChevronsUpDown, Bot, Wrench
} from 'lucide-react';
import { FormAnalysis, FormQuestion, QuestionType, User } from '../types';
import AIWeightageBridge from './AIWeightageBridge';

// ─── TYPES ──────────────────────────────────────────────────────────
interface Step2DashboardProps {
    analysis: FormAnalysis;
    setAnalysis: React.Dispatch<React.SetStateAction<FormAnalysis | null>>;
    user: User | null;
    targetCount: number;
    setTargetCount: (val: number) => void;
    speedMode: 'auto' | 'manual';
    setSpeedMode: (mode: 'auto' | 'manual') => void;
    delayMin: number;
    setDelayMin: (val: number) => void;
    nameSource: 'auto' | 'indian' | 'custom';
    setNameSource: (src: 'auto' | 'indian' | 'custom') => void;
    customNamesRaw: string;
    setCustomNamesRaw: (val: string) => void;
    customResponses: Record<string, string>;
    setCustomResponses: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    handleCompile: () => void;
    reset: () => void;
    setShowPricing: (show: boolean) => void;
    setShowRecommendationModal: (show: boolean) => void;
    checkBalanceAndRedirect: (val: number) => void;
    isLaunching: boolean;
    error: string | null;
    initialWizardStep?: 1 | 2 | 3 | 4;
    initialAiApplied?: boolean;
    onAiAppliedChange?: (applied: boolean) => void;
}

// ─── GOLD PALETTE COLORS ────────────────────────────────────────────
const GOLD_COLORS = [
    '#D4AF37', '#C5A028', '#B8962A', '#A8872D', '#987830',
    '#8A701C', '#F0D060', '#E8C84A', '#D9B83C', '#C9A832',
];

// ─── STEP INDICATOR ─────────────────────────────────────────────────
const WIZARD_STEPS = [
    { num: 1, label: 'Setup', icon: Sparkles },
    { num: 2, label: 'Review', icon: Sliders },
    { num: 3, label: 'Count', icon: Target },
    { num: 4, label: 'Launch', icon: Rocket },
];

const StepIndicator = ({ current, onStepClick }: { current: number; onStepClick?: (step: 1 | 2 | 3 | 4) => void }) => (
    <div className="flex items-center justify-center gap-0.5 sm:gap-1 mb-10 px-2">
        {WIZARD_STEPS.map((s, i) => {
            const isActive = s.num === current;
            const isDone = s.num < current;
            const Icon = s.icon;
            const isClickable = isDone && onStepClick;
            return (
                <React.Fragment key={s.num}>
                    {i > 0 && (
                        <div className={`h-px flex-1 max-w-12 transition-all duration-500 ${isDone ? 'bg-gradient-to-r from-amber-500/60 to-amber-500/30' : 'bg-white/[0.06]'
                            }`} />
                    )}
                    <div className="flex flex-col items-center gap-2 min-w-[56px]">
                        <button
                            type="button"
                            onClick={() => isClickable && onStepClick(s.num as 1 | 2 | 3 | 4)}
                            disabled={!isClickable && !isActive}
                            className={`
                            w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-400 border relative outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50
                            ${isActive
                                    ? 'bg-gradient-to-br from-amber-600/30 to-amber-800/20 border-amber-500/50 text-amber-400 shadow-[0_0_20px_rgba(212,175,55,0.2)]'
                                    : isDone
                                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20 hover:scale-105 active:scale-95 cursor-pointer'
                                        : 'bg-white/[0.02] border-white/[0.06] text-white/20 cursor-default'
                                }
                        `}>
                            {isDone ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                        </button>
                        <span className={`text-[9px] font-bold uppercase tracking-[0.15em] transition-colors duration-300 ${isActive ? 'text-amber-400' : isDone ? 'text-amber-500/50' : 'text-white/15'
                            }`}>
                            {s.label}
                        </span>
                    </div>
                </React.Fragment>
            );
        })}
    </div>
);

// ─── MINI STACKED BAR (collapsed preview) ───────────────────────────
const MiniStackedBar = ({ options }: { options: { value: string; weight?: number }[] }) => {
    const sorted = [...options].sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0));
    return (
        <div className="flex h-1.5 rounded-full overflow-hidden bg-white/[0.04] w-24">
            {sorted.map((opt, i) => {
                const w = opt.weight ?? 0;
                if (w <= 0) return null;
                const color = GOLD_COLORS[i % GOLD_COLORS.length];
                return (
                    <div
                        key={i}
                        className="h-full transition-all duration-300"
                        style={{
                            width: `${w}%`,
                            backgroundColor: color,
                            opacity: 0.5 + (0.5 * (1 - i / Math.max(sorted.length, 1)))
                        }}
                    />
                );
            })}
        </div>
    );
};

// ─── CONFETTI ───────────────────────────────────────────────────────
const Confetti = ({ active }: { active: boolean }) => {
    if (!active) return null;
    const particles = Array.from({ length: 40 }, (_, i) => {
        const x = Math.random() * 100;
        const delay = Math.random() * 0.8;
        const dur = 1.2 + Math.random() * 1;
        const size = 4 + Math.random() * 6;
        const rotation = Math.random() * 360;
        const colors = ['#D4AF37', '#F0D060', '#C5A028', '#FDE68A', '#ffffff', '#E8C84A'];
        const color = colors[i % colors.length];
        return (
            <div
                key={i}
                className="absolute rounded-sm pointer-events-none"
                style={{
                    left: `${x}%`,
                    top: '-5%',
                    width: `${size}px`,
                    height: `${size * 0.6}px`,
                    backgroundColor: color,
                    transform: `rotate(${rotation}deg)`,
                    animation: `confetti-fall ${dur}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delay}s forwards`,
                    opacity: 0,
                }}
            />
        );
    });
    return <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-none">{particles}</div>;
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────────
const Step2Dashboard = React.memo((props: Step2DashboardProps) => {
    const {
        analysis, setAnalysis, user,
        targetCount, setTargetCount,
        speedMode, setSpeedMode,
        delayMin, setDelayMin,
        nameSource, setNameSource,
        customNamesRaw, setCustomNamesRaw,
        customResponses, setCustomResponses,
        handleCompile, reset,
        setShowPricing, setShowRecommendationModal,
        checkBalanceAndRedirect,
        isLaunching, error,
        initialWizardStep = 1,
        initialAiApplied = false,
        onAiAppliedChange
    } = props;

    const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(initialWizardStep);
    const [setupMode, setSetupMode] = useState<null | 'ai' | 'manual'>(
        initialWizardStep > 1 ? (initialAiApplied ? 'ai' : 'manual') : null
    );
    const [customCountActive, setCustomCountActive] = useState(false);
    const [aiApplied, setAiApplied] = useState(initialAiApplied);
    const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
    const [allExpanded, setAllExpanded] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    // Sync state for initialWizardStep if it changes while mounted
    useEffect(() => {
        setWizardStep(initialWizardStep);
        if (initialWizardStep > 1) {
            setSetupMode(initialAiApplied ? 'ai' : 'manual');
        } else if (initialWizardStep === 1) {
            setSetupMode(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialWizardStep]);

    useEffect(() => {
        setAiApplied(initialAiApplied);
    }, [initialAiApplied]);

    // Auto-scroll on step change
    useEffect(() => {
        if (contentRef.current) {
            const yOffset = -24;
            const y = contentRef.current.getBoundingClientRect().top + window.scrollY + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    }, [wizardStep, setupMode]);

    // AI apply callback
    const handleApplyAIWeightages = useCallback((combinedData: any[]) => {
        setAnalysis(prev => {
            if (!prev) return prev;
            const newQuestions = [...prev.questions];
            combinedData.forEach(aiItem => {
                const qIndex = newQuestions.findIndex(q => q.id === aiItem.id);
                if (qIndex === -1) return;
                if (aiItem.options && Array.isArray(aiItem.options)) {
                    const optMap = new Map(aiItem.options.map((o: any) => [o.value, o.weight]));
                    newQuestions[qIndex] = {
                        ...newQuestions[qIndex],
                        options: newQuestions[qIndex].options.map(opt => ({
                            ...opt,
                            weight: optMap.has(opt.value) ? Number(optMap.get(opt.value)) : opt.weight
                        }))
                    };
                }
                if (aiItem.samples && Array.isArray(aiItem.samples)) {
                    setCustomResponses(prevSamples => ({
                        ...prevSamples,
                        [aiItem.id]: aiItem.samples.join(', ')
                    }));
                }
            });
            return { ...prev, questions: newQuestions };
        });
        setAiApplied(true);
        if (onAiAppliedChange) onAiAppliedChange(true);
        setWizardStep(2);
    }, [setAnalysis, setCustomResponses, onAiAppliedChange]);

    // Smart weight redistribution
    const handleWeightChange = useCallback((questionId: string, changedIndex: number, newWeight: number) => {
        setAnalysis(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                questions: prev.questions.map(q => {
                    if (q.id !== questionId) return q;
                    const opts = [...q.options];
                    const clampedNew = Math.max(0, Math.min(100, newWeight));
                    const remaining = 100 - clampedNew;
                    const othersSum = opts.reduce((s, o, i) => i === changedIndex ? s : s + (o.weight ?? 0), 0);

                    const newOpts = opts.map((o, i) => {
                        if (i === changedIndex) return { ...o, weight: clampedNew };
                        if (othersSum === 0) {
                            return { ...o, weight: Math.round(remaining / (opts.length - 1)) };
                        }
                        return { ...o, weight: Math.round(remaining * ((o.weight ?? 0) / othersSum)) };
                    });

                    // Fix rounding drift
                    const total = newOpts.reduce((s, o) => s + (o.weight ?? 0), 0);
                    if (total !== 100 && newOpts.length > 1) {
                        const diff = 100 - total;
                        let maxIdx = -1, maxW = -1;
                        newOpts.forEach((o, i) => { if (i !== changedIndex && (o.weight ?? 0) > maxW) { maxW = o.weight ?? 0; maxIdx = i; } });
                        if (maxIdx >= 0) newOpts[maxIdx] = { ...newOpts[maxIdx], weight: (newOpts[maxIdx].weight ?? 0) + diff };
                    }
                    return { ...q, options: newOpts };
                })
            } as FormAnalysis;
        });
    }, [setAnalysis]);

    // Reset to equal weights
    const resetToEqual = useCallback((questionId: string) => {
        setAnalysis(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                questions: prev.questions.map(q => {
                    if (q.id !== questionId) return q;
                    const count = q.options.length;
                    if (count === 0) return q;
                    const base = Math.floor(100 / count);
                    const remainder = 100 - (base * count);
                    return {
                        ...q,
                        options: q.options.map((o, i) => ({
                            ...o,
                            weight: base + (i < remainder ? 1 : 0)
                        }))
                    };
                })
            } as FormAnalysis;
        });
    }, [setAnalysis]);

    // Toggle single expanded
    const toggleExpanded = useCallback((id: string) => {
        setExpandedQuestions(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    }, []);

    // Expand / Collapse all
    const toggleAll = useCallback(() => {
        if (allExpanded) {
            setExpandedQuestions(new Set());
            setAllExpanded(false);
        } else {
            setExpandedQuestions(new Set(optionQuestions.map(q => q.id)));
            setAllExpanded(true);
        }
    }, [allExpanded]);

    // Handle launch with confetti
    const handleLaunchWithConfetti = useCallback(() => {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
        handleCompile();
    }, [handleCompile]);

    // Helpers
    const presets = [5, 10, 25, 50, 100, 200];
    const isPreset = presets.includes(targetCount);
    const speedLabel = delayMin === 0 ? 'Warp' : delayMin <= 100 ? 'Intensive' : delayMin <= 500 ? 'Efficient' : 'Realistic';

    const optionQuestions = useMemo(() =>
        analysis.questions.filter(q =>
            q.type === QuestionType.MULTIPLE_CHOICE ||
            q.type === QuestionType.CHECKBOXES ||
            q.type === QuestionType.DROPDOWN ||
            q.type === QuestionType.LINEAR_SCALE ||
            q.type === QuestionType.GRID
        ), [analysis.questions]);

    const textQuestions = useMemo(() =>
        analysis.questions.filter(q =>
            q.type === QuestionType.SHORT_ANSWER || q.type === QuestionType.PARAGRAPH
        ), [analysis.questions]);

    const otherQuestions = useMemo(() =>
        analysis.questions.filter(q =>
            q.type === QuestionType.DATE ||
            q.type === QuestionType.TIME ||
            q.type === QuestionType.UNKNOWN
        ), [analysis.questions]);

    const goNext = useCallback(() => setWizardStep(prev => Math.min(prev + 1, 4) as 1 | 2 | 3 | 4), []);
    const goBack = useCallback(() => {
        if (wizardStep === 2 && setupMode !== null) {
            // Going back from review → reset to setup choice
            setSetupMode(null);
            setWizardStep(1);
        } else {
            setWizardStep(prev => Math.max(prev - 1, 1) as 1 | 2 | 3 | 4);
        }
    }, [wizardStep, setupMode]);

    const handleStepClick = useCallback((step: 1 | 2 | 3 | 4) => {
        if (step >= wizardStep) return;

        if (step === 1 && setupMode !== null) {
            setSetupMode(null);
        }
        setWizardStep(step);
    }, [wizardStep, setupMode]);

    return (
        <section ref={contentRef} className="w-full pb-8 max-w-3xl mx-auto scroll-mt-8">
            <Confetti active={showConfetti} />

            {/* Confetti keyframes */}
            <style>{`
                @keyframes confetti-fall {
                    0% { transform: translateY(0) rotate(0deg) scale(0); opacity: 1; }
                    10% { opacity: 1; transform: translateY(10vh) rotate(90deg) scale(1); }
                    100% { transform: translateY(100vh) rotate(720deg) scale(0.5); opacity: 0; }
                }
            `}</style>

            {/* BACK */}
            <div className="mb-6">
                <button onClick={reset} className="group flex items-center gap-2 text-[11px] text-slate-600 hover:text-white font-semibold uppercase tracking-[0.15em] transition-all duration-200 active:scale-95">
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                    Back to Home
                </button>
            </div>

            {/* HEADER */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500/80 font-mono">Configure</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight truncate">{analysis.title}</h2>
                <p className="text-xs text-slate-600 mt-1.5 font-medium">{analysis.questions.length} fields · Step {wizardStep} of 4</p>
            </div>

            {/* ERROR */}
            {error && (
                <div className="mb-6 flex items-center gap-3 text-red-200 bg-red-950/60 border border-red-500/20 px-5 py-3.5 rounded-xl text-sm font-medium">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="flex-1">{error}</span>
                </div>
            )}

            <StepIndicator current={wizardStep} onStepClick={handleStepClick} />

            {/* ═══════════════════════════════════════════════════════ */}
            {/* STEP 1 — SETUP CHOICE                                 */}
            {/* ═══════════════════════════════════════════════════════ */}
            {wizardStep === 1 && setupMode === null && (
                <div className="animate-fade-in-up">
                    <div className="text-center mb-8">
                        <h3 className="text-lg font-serif font-semibold text-white mb-1.5">How do you want to set up?</h3>
                        <p className="text-xs text-slate-500">Choose your preferred way to configure response weights</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* AI Option */}
                        <button
                            onClick={() => setSetupMode('ai')}
                            className="group glass-panel rounded-2xl p-6 text-left transition-all duration-300 hover:border-amber-500/20 hover:shadow-[0_0_30px_rgba(212,175,55,0.06)] active:scale-[0.98]"
                        >
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600/20 to-amber-800/10 border border-amber-500/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                                <Bot className="w-6 h-6 text-amber-400" />
                            </div>
                            <h4 className="text-base font-semibold text-white mb-1.5">AI Auto-Adjust</h4>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Let AI generate realistic weight distributions and text samples automatically via ChatGPT.
                            </p>
                            <div className="mt-4 flex items-center gap-1.5 text-[10px] text-amber-500/70 font-bold uppercase tracking-wider">
                                <Sparkles className="w-3 h-3" />
                                Recommended
                            </div>
                        </button>

                        {/* Manual Option */}
                        <button
                            onClick={() => { setSetupMode('manual'); setWizardStep(2); }}
                            className="group glass-panel rounded-2xl p-6 text-left transition-all duration-300 hover:border-white/10 active:scale-[0.98]"
                        >
                            <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                                <Wrench className="w-6 h-6 text-slate-400" />
                            </div>
                            <h4 className="text-base font-semibold text-white mb-1.5">Manual Setup</h4>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Adjust weight sliders yourself. All options start with equal distribution.
                            </p>
                            <div className="mt-4 flex items-center gap-1.5 text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                                <Sliders className="w-3 h-3" />
                                Full Control
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 1 — AI MODE (after choosing AI) */}
            {wizardStep === 1 && setupMode === 'ai' && (
                <div className="animate-fade-in-up">
                    <AIWeightageBridge
                        questions={analysis.questions}
                        onApplyWeightages={handleApplyAIWeightages}
                        onClose={() => setSetupMode(null)}
                    />
                    <div className="mt-6 flex justify-center">
                        <button
                            onClick={() => setSetupMode(null)}
                            className="group flex items-center gap-2 text-[12px] text-slate-600 hover:text-white transition-all duration-200 active:scale-95 px-5 py-3 rounded-xl border border-white/[0.06] hover:border-amber-500/20"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Choose different method
                        </button>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════ */}
            {/* STEP 2 — REVIEW & EDIT WEIGHTS                        */}
            {/* ═══════════════════════════════════════════════════════ */}
            {wizardStep === 2 && (
                <div className="animate-fade-in-up">
                    <div className="text-center mb-6">
                        <h3 className="text-lg font-serif font-semibold text-white mb-1.5">Review & Edit Weights</h3>
                        <p className="text-xs text-slate-500">Drag sliders to adjust · Weights auto-balance to 100%</p>
                    </div>

                    {/* Toolbar: Expand All + Reset visible in review */}
                    {optionQuestions.length > 0 && (
                        <div className="flex items-center justify-end gap-2 mb-4">
                            <button
                                onClick={toggleAll}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-500 hover:text-white hover:border-white/10 transition-all active:scale-95 text-[10px] font-bold uppercase tracking-wider"
                            >
                                <ChevronsUpDown className="w-3 h-3" />
                                {allExpanded ? 'Collapse All' : 'Expand All'}
                            </button>
                        </div>
                    )}

                    {/* Option questions */}
                    {optionQuestions.length > 0 && (
                        <div className="space-y-2">
                            {optionQuestions.map(q => {
                                const isOpen = expandedQuestions.has(q.id);
                                const total = q.options.reduce((s, o) => s + (o.weight ?? 0), 0);
                                return (
                                    <div key={q.id} className={`glass-panel rounded-xl transition-all duration-300 overflow-hidden ${isOpen ? 'shadow-[0_0_25px_rgba(212,175,55,0.06)] border-amber-500/15' : ''
                                        }`}>
                                        {/* Header */}
                                        <button
                                            onClick={() => toggleExpanded(q.id)}
                                            className="w-full flex items-center justify-between px-5 py-4 group text-left"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-3">
                                                    {q.required && <span className="text-amber-500 text-sm">●</span>}
                                                    <span className="text-sm font-medium text-slate-200 truncate">{q.title}</span>
                                                </div>
                                                {/* Brief weight summary on collapsed cards */}
                                                {!isOpen && (() => {
                                                    const sorted = [...q.options].sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0));
                                                    const top = sorted.slice(0, 3);
                                                    const rest = sorted.length - 3;
                                                    return (
                                                        <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                                                            {top.map((o, i) => (
                                                                <span key={i} className="text-[10px] text-slate-500 font-medium">
                                                                    <span className="text-slate-400">{o.value.length > 18 ? o.value.slice(0, 18) + '…' : o.value}</span>
                                                                    <span className="text-amber-500/70 font-mono font-bold ml-0.5">{o.weight ?? 0}%</span>
                                                                    {i < top.length - 1 && <span className="text-slate-700 ml-1">·</span>}
                                                                </span>
                                                            ))}
                                                            {rest > 0 && <span className="text-[9px] text-slate-600 font-mono ml-0.5">+{rest} more</span>}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                            <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                                                {!isOpen && <MiniStackedBar options={q.options} />}
                                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${total === 100
                                                    ? 'text-emerald-400/70 bg-emerald-500/5 border-emerald-500/10'
                                                    : 'text-amber-400/70 bg-amber-500/5 border-amber-500/10'
                                                    }`}>
                                                    {total}%
                                                </span>
                                                <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform duration-300 ${isOpen ? 'rotate-180 text-amber-500' : ''}`} />
                                            </div>
                                        </button>

                                        {/* Expanded sliders */}
                                        {isOpen && (
                                            <div className="px-5 pb-5 animate-fade-in-up" style={{ animationDuration: '250ms' }}>
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="h-px flex-1 bg-white/[0.04]" />
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); resetToEqual(q.id); }}
                                                        className="flex items-center gap-1.5 ml-3 px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.06] text-slate-500 hover:text-amber-400 hover:border-amber-500/20 transition-all active:scale-95 text-[9px] font-bold uppercase tracking-wider"
                                                    >
                                                        <RotateCcw className="w-2.5 h-2.5" />
                                                        Equal
                                                    </button>
                                                </div>
                                                <div className="space-y-3">
                                                    {q.options.map((opt, i) => (
                                                        <div key={i} className="group">
                                                            <div className="flex items-center justify-between mb-1.5">
                                                                <span className="text-xs text-slate-400 truncate max-w-[60%]" title={opt.value}>{opt.value}</span>
                                                                <span className="text-xs font-mono font-bold text-amber-400/80 tabular-nums">{opt.weight ?? 0}%</span>
                                                            </div>
                                                            <div className="relative h-2 bg-white/[0.04] rounded-full overflow-visible">
                                                                <div
                                                                    className="absolute top-0 left-0 h-full rounded-full transition-all duration-150"
                                                                    style={{
                                                                        width: `${Math.min(opt.weight ?? 0, 100)}%`,
                                                                        background: 'linear-gradient(90deg, #8A701C, #D4AF37)'
                                                                    }}
                                                                />
                                                                <input
                                                                    type="range"
                                                                    min={0}
                                                                    max={100}
                                                                    value={opt.weight ?? 0}
                                                                    onChange={(e) => handleWeightChange(q.id, i, Number(e.target.value))}
                                                                    className="absolute inset-0 w-full h-full cursor-pointer"
                                                                    style={{ opacity: 0, zIndex: 2 }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Text samples */}
                    {textQuestions.length > 0 && (
                        <div className="mt-6 space-y-2">
                            <p className="text-[10px] text-slate-600 uppercase tracking-[0.15em] font-bold px-1 mb-3 font-mono">Text Samples</p>
                            {textQuestions.map(q => {
                                const samples = customResponses[q.id];
                                return (
                                    <div key={q.id} className="glass-panel rounded-xl p-4">
                                        <h4 className="text-sm font-medium text-slate-300 mb-2.5 flex items-center gap-2">
                                            {q.required && <span className="text-amber-500 text-sm">●</span>}
                                            {q.title}
                                        </h4>
                                        {samples ? (
                                            <div className="flex flex-wrap gap-1.5">
                                                {samples.split(',').slice(0, 6).map((s, i) => (
                                                    <span key={i} className="px-2.5 py-1 bg-amber-500/5 text-amber-300/80 text-[10px] rounded-lg border border-amber-500/10 font-medium">
                                                        {s.trim()}
                                                    </span>
                                                ))}
                                                {samples.split(',').length > 6 && (
                                                    <span className="px-2 py-1 text-[10px] text-slate-600 font-mono">+{samples.split(',').length - 6}</span>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-[11px] text-slate-600 italic">Auto-generated responses will be used</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Date / Time / Other fields */}
                    {otherQuestions.length > 0 && (
                        <div className="mt-6 space-y-2">
                            <p className="text-[10px] text-slate-600 uppercase tracking-[0.15em] font-bold px-1 mb-3 font-mono">Other Fields</p>
                            {otherQuestions.map(q => (
                                <div key={q.id} className="glass-panel rounded-xl p-4">
                                    <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                        {q.required && <span className="text-amber-500 text-sm">●</span>}
                                        {q.title}
                                    </h4>
                                    <p className="text-[11px] text-slate-600 mt-1.5 italic">Auto-generated {q.type === QuestionType.DATE ? 'dates' : q.type === QuestionType.TIME ? 'times' : 'responses'} will be used</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {optionQuestions.length === 0 && textQuestions.length === 0 && otherQuestions.length === 0 && (
                        <div className="text-center py-16">
                            <CheckCircle className="w-8 h-8 mx-auto mb-3 text-amber-500/40" />
                            <p className="text-sm text-slate-500">All fields use default distributions.</p>
                        </div>
                    )}

                    <WizardNav onBack={goBack} onNext={goNext} nextLabel="Looks Good" />
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════ */}
            {/* STEP 3 — RESPONSE COUNT                               */}
            {/* ═══════════════════════════════════════════════════════ */}
            {wizardStep === 3 && (
                <div className="animate-fade-in-up">
                    <div className="text-center mb-8">
                        <h3 className="text-lg font-serif font-semibold text-white mb-1.5">How many responses?</h3>
                        <p className="text-xs text-slate-500">Select a preset or enter a custom amount</p>
                    </div>

                    <div className="glass-panel rounded-2xl p-6">
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 mb-6">
                            {presets.map(preset => (
                                <button
                                    key={preset}
                                    onClick={() => {
                                        checkBalanceAndRedirect(preset);
                                        setTargetCount(preset);
                                        setCustomCountActive(false);
                                    }}
                                    className={`py-4 rounded-xl text-lg font-mono font-bold transition-all duration-200 active:scale-95 border text-center ${targetCount === preset && !customCountActive
                                        ? 'gold-button rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.2)]'
                                        : 'bg-white/[0.03] text-slate-500 hover:bg-white/[0.06] hover:text-white border-white/[0.06] hover:border-white/10'
                                        }`}
                                >
                                    {preset}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center justify-center gap-4">
                            <span className="text-[11px] text-slate-600 uppercase tracking-[0.15em] font-bold font-mono">Custom:</span>
                            <input
                                type="number"
                                min={1}
                                max={500}
                                value={customCountActive || !isPreset ? (isNaN(targetCount) ? '' : targetCount) : ''}
                                placeholder="—"
                                onClick={() => setCustomCountActive(true)}
                                onChange={(e) => {
                                    setCustomCountActive(true);
                                    if (e.target.value === '') { setTargetCount(NaN); return; }
                                    const val = Math.min(Number(e.target.value), 500);
                                    checkBalanceAndRedirect(val);
                                    setTargetCount(val);
                                }}
                                className={`w-24 bg-black/40 text-center outline-none font-mono text-lg font-bold py-3.5 rounded-xl border-2 transition-all duration-200 placeholder:text-slate-700 [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${customCountActive
                                    ? 'border-amber-500/30 text-amber-400 focus:ring-4 focus:ring-amber-500/10 shadow-[0_0_15px_rgba(212,175,55,0.1)]'
                                    : 'border-white/[0.06] text-slate-400 focus:border-amber-500/30 focus:ring-4 focus:ring-amber-500/10'
                                    }`}
                            />
                        </div>

                        <div className="flex justify-center mt-5">
                            <button
                                onClick={() => setShowRecommendationModal(true)}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500/[0.06] border border-amber-500/10 text-amber-500/70 hover:bg-amber-500/10 hover:text-amber-400 transition-all active:scale-95 text-[10px] font-bold uppercase tracking-wider"
                            >
                                <ShieldCheck className="w-3 h-3" />
                                How many should I use?
                            </button>
                        </div>

                        {user && targetCount > (user.tokens || 0) && (
                            <div className="mt-5 bg-red-950/40 text-red-200/80 text-xs px-4 py-3 rounded-xl border border-red-500/15 animate-fade-in flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-red-400" />
                                    Insufficient Tokens (Balance: {user.tokens})
                                </span>
                                <button onClick={() => setShowPricing(true)} className="bg-red-500/80 text-white px-3 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-red-400 transition-colors">
                                    Refill
                                </button>
                            </div>
                        )}
                    </div>

                    <WizardNav onBack={goBack} onNext={goNext} nextLabel="Next" nextDisabled={isNaN(targetCount) || targetCount <= 0} />
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════ */}
            {/* STEP 4 — CONFIRMATION + LAUNCH                        */}
            {/* ═══════════════════════════════════════════════════════ */}
            {wizardStep === 4 && (
                <div className="animate-fade-in-up">
                    <div className="text-center mb-8">
                        <h3 className="text-lg font-serif font-semibold text-white mb-1.5">Ready to Launch</h3>
                        <p className="text-xs text-slate-500">Confirm your configuration</p>
                    </div>

                    <div className="glass-panel rounded-2xl overflow-hidden">
                        <div className="divide-y divide-white/[0.04]">
                            <SummaryRow label="Form" value={analysis.title} />
                            <SummaryRow label="Fields" value={`${analysis.questions.length}`} />
                            <SummaryRow label="Weights" value={aiApplied ? 'AI-Optimized' : setupMode === 'manual' ? 'Manual' : 'Default'} badge={aiApplied ? 'ai' : undefined} />
                            <SummaryRow label="Responses" value={`${isNaN(targetCount) ? '—' : targetCount}`} highlight />
                            <SummaryRow label="Speed" value={speedMode === 'auto' ? 'Auto (Recommended)' : speedLabel} />
                        </div>
                    </div>

                    {user && (
                        <div className={`mt-4 flex items-center justify-between text-xs px-5 py-3.5 rounded-xl border ${(user.tokens || 0) >= targetCount
                            ? 'bg-emerald-500/[0.04] border-emerald-500/10 text-emerald-400/80'
                            : 'bg-red-950/40 border-red-500/15 text-red-200/80'
                            }`}>
                            <span className="flex items-center gap-2 font-medium">
                                {(user.tokens || 0) >= targetCount ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                Token Balance: {user.tokens || 0}
                            </span>
                            {(user.tokens || 0) < targetCount && (
                                <button onClick={() => setShowPricing(true)} className="bg-red-500/80 text-white px-3 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-red-400 transition-colors">
                                    Refill
                                </button>
                            )}
                        </div>
                    )}

                    <div className="mt-4 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] text-[10px] text-slate-600 leading-relaxed font-mono flex items-start gap-2">
                        <ShieldCheck className="w-3 h-3 text-slate-600 mt-0.5 flex-shrink-0" />
                        <span>To maintain account integrity, avoid exceeding 500 responses per session per IP.</span>
                    </div>

                    {/* LAUNCH NAV */}
                    <div className="flex items-center justify-between pt-8">
                        <button onClick={goBack} className="flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-all duration-200 active:scale-95 px-5 py-3 rounded-xl border border-white/[0.06] hover:border-white/10 hover:bg-white/[0.02]">
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>
                        <div className="relative">
                            <div className="absolute -inset-3 rounded-2xl blur-xl bg-amber-500/15 animate-pulse pointer-events-none" />
                            <button
                                onClick={handleLaunchWithConfetti}
                                disabled={isLaunching || isNaN(targetCount) || targetCount <= 0}
                                className={`gold-button relative group flex items-center gap-3 px-8 py-4 rounded-xl shadow-2xl transition-all duration-300 ${isLaunching ? 'scale-95 brightness-75 cursor-wait' : 'hover:scale-[1.03] active:scale-[0.97]'
                                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                            >
                                <Rocket className="w-5 h-5 drop-shadow-md" />
                                <span className="text-sm tracking-[0.12em] font-extrabold uppercase drop-shadow-md">Launch Mission</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
});

// ─── WIZARD NAV ─────────────────────────────────────────────────────
function WizardNav({ onBack, onNext, nextLabel = 'Next', nextDisabled }: {
    onBack: () => void; onNext: () => void; nextLabel?: string; nextDisabled?: boolean;
}) {
    return (
        <div className="flex items-center justify-between pt-8">
            <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-all duration-200 active:scale-95 px-5 py-3 rounded-xl border border-white/[0.06] hover:border-white/10 hover:bg-white/[0.02]">
                <ArrowLeft className="w-4 h-4" />
                Back
            </button>
            <button
                onClick={onNext}
                disabled={nextDisabled}
                className="gold-button group flex items-center gap-2 text-sm font-bold px-6 py-3 rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
                {nextLabel}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
        </div>
    );
}

// ─── SUMMARY ROW ────────────────────────────────────────────────────
function SummaryRow({ label, value, highlight, badge }: {
    label: string; value: string; highlight?: boolean; badge?: 'ai';
}) {
    return (
        <div className="flex items-center justify-between px-5 py-4">
            <span className="text-[11px] text-slate-600 uppercase tracking-[0.15em] font-bold font-mono">{label}</span>
            <div className="flex items-center gap-2.5">
                {badge === 'ai' && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/[0.06] border border-amber-500/10 text-amber-400/80 text-[9px] font-bold uppercase tracking-wider">
                        <Sparkles className="w-2.5 h-2.5" /> AI
                    </span>
                )}
                <span className={`font-semibold truncate max-w-[200px] ${highlight ? 'text-amber-400 font-mono text-xl' : 'text-slate-300 text-sm'
                    }`}>
                    {value}
                </span>
            </div>
        </div>
    );
}

export default Step2Dashboard;
