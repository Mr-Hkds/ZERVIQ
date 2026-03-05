import React from 'react';
import { ArrowRight, Sparkles, Zap, Gift, Play, ShieldAlert, Laptop, Clipboard, Terminal, Command, Crown, ShieldCheck } from 'lucide-react';

interface HeroSectionProps {
    url: string;
    setUrl: (url: string) => void;
    onAnalyze: () => void;
    onWatchDemo: () => void;
    loading: boolean;
    version: string;
    user?: import('../types').User | null;
    onShowPricing?: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = React.memo(({ url, setUrl, onAnalyze, onWatchDemo, loading, version, user, onShowPricing }) => {
    return (
        <section className="flex-1 flex flex-col items-center justify-center w-full max-w-[100vw] overflow-hidden animate-fade-in-up px-4 sm:px-6 relative z-10 min-h-[85vh] py-20 md:py-32">

            {/* 🛡️ PREMIUM ELITE WARNING BADGE */}
            <div className="w-full flex justify-center mb-8 animate-fade-in-up px-4">
                <div className="relative group inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-red-500/20 bg-red-500/[0.02] backdrop-blur-md transition-all duration-300 hover:bg-red-500/[0.05] hover:border-red-500/30">

                    {/* Pulsing Highlight Glow */}
                    <div className="absolute inset-0 rounded-full bg-red-500/[0.05] shadow-[0_0_20px_-3px_rgba(239,68,68,0.2)] animate-[pulse_3s_ease-in-out_infinite] pointer-events-none" />

                    <ShieldAlert className="w-3.5 h-3.5 text-red-500/90 relative z-10" />
                    <p className="text-[11px] md:text-xs font-mono text-slate-300 relative z-10">
                        <span className="font-bold tracking-[0.1em] text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-300 to-red-500 bg-[length:200%_auto] animate-text-shimmer uppercase">
                            Warning
                        </span>
                        <span className="mx-2.5 text-red-500/30">│</span>
                        Use only on your own forms. Spamming will result in immediate termination and IP ban.
                    </p>
                </div>
            </div>

            {/* Background Ambience */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none opacity-50 mix-blend-screen animate-pulse-slow" />

            {/* Hero Content */}
            <div className="max-w-5xl mx-auto text-center space-y-8 md:space-y-12 mb-8 md:mb-16 w-full px-2 relative z-10">

                {/* Badge: Dynamic Status */}
                {(() => {
                    const [isFirstTime, setIsFirstTime] = React.useState(false);
                    const [mounted, setMounted] = React.useState(false);

                    React.useEffect(() => {
                        const hasVisited = localStorage.getItem('zerviq_has_visited');
                        if (!hasVisited) {
                            setIsFirstTime(true);
                            localStorage.setItem('zerviq_has_visited', 'true');
                        }
                        setMounted(true);
                    }, []);

                    if (!mounted) return <div className="h-8 mb-4" />;

                    return (
                        <div className="flex flex-col items-center gap-4 mb-6">
                            {/* TOKEN STATUS FOR MOBILE (PROPERLY WRITTEN) */}
                            {user && (
                                <div className="md:hidden flex items-center gap-3 px-4 py-2 rounded-full glass-panel border border-amber-500/30 bg-amber-500/5 shadow-[0_0_20px_rgba(245,158,11,0.1)] active:scale-95 transition-transform" onClick={onShowPricing}>
                                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                                    <span className="text-[10px] font-mono font-bold text-amber-200 uppercase tracking-widest leading-none">
                                        Tokens: {user.tokens ?? 0}
                                    </span>
                                    <div className="w-px h-3 bg-white/10 mx-1" />
                                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest leading-none">
                                        Add Tokens
                                    </span>
                                </div>
                            )}

                            {isFirstTime ? (
                                // FIRST TIME GIFT BADGE
                                <div className="inline-flex flex-wrap items-center justify-center gap-2 px-6 py-2 rounded-full bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.2)] backdrop-blur-md animate-fade-in-down mx-auto cursor-default hover:bg-amber-500/20 transition-all hover:scale-105 active:scale-95 duration-500">
                                    <Gift className="w-4 h-4 text-amber-500 animate-bounce shrink-0" />
                                    <span className="text-xs font-mono font-bold text-amber-200 tracking-wide uppercase text-center">
                                        First Time Gift: <span className="text-amber-400">15 Free Tokens</span> Included
                                    </span>
                                </div>
                            ) : (
                                // RETURNING USER STATUS BADGE
                                <div className="inline-flex flex-wrap items-center justify-center gap-3 px-5 py-2 rounded-full glass-panel border border-white/5 shadow-2xl backdrop-blur-md animate-fade-in-down mx-auto hover:border-emerald-500/30 transition-all duration-500 group cursor-default">
                                    <div className="relative flex h-2 w-2 shrink-0">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </div>
                                    <span className="text-[10px] font-mono font-medium text-slate-400 tracking-[0.2em] uppercase text-center">
                                        <span className="hidden md:inline">System Status: <span className="text-emerald-500/80 group-hover:text-emerald-400 transition-colors">Neural Engine Operational</span></span>
                                        <span className="md:hidden text-emerald-500/80">Systems Online</span>
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })()}

                {/* Headline - Responsive Typography */}
                <div className="space-y-6 relative px-1 md:px-2">
                    <h1 className="font-serif font-medium tracking-tight leading-[1.1] md:leading-[1.05] relative z-10 break-words w-full select-none" style={{ fontSize: 'clamp(2.5rem, 8vw, 6.5rem)' }}>
                        <span className="block text-slate-400/60 font-sans font-light uppercase mb-4 animate-fade-in-up md:tracking-[0.2em] tracking-[0.1em] text-[clamp(0.65rem,2vw,1.25rem)]">
                            Precision Engineered
                        </span>
                        <span className="block bg-clip-text text-transparent bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] bg-[length:200%_auto] animate-text-shimmer drop-shadow-[0_0_35px_rgba(212,175,55,0.2)] pb-3 font-semibold" style={{ animationDelay: '200ms' }}>
                            Intelligent Automation.
                        </span>
                    </h1>

                    <p className="text-slate-300 max-w-2xl mx-auto font-mono text-sm md:text-base leading-relaxed tracking-wide animate-fade-in-up px-4 opacity-0 fill-mode-forwards" style={{ animationDelay: '400ms' }}>
                        Simulate statistically-valid, demographically-balanced responses for <span className="text-amber-200 font-bold">research, testing &amp; form validation</span> — powered by intelligent weightage distribution.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 pt-4 animate-fade-in-up opacity-0 fill-mode-forwards" style={{ animationDelay: '500ms' }}>
                        {[
                            { icon: Zap, label: "Instant Parse" },
                            { icon: ShieldCheck, label: "Research-Grade" },
                            { icon: Terminal, label: "Statistically Valid" }
                        ].map((feat, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-slate-500 text-xs font-mono uppercase tracking-wider">
                                <feat.icon className="w-3.5 h-3.5 text-amber-500/50" />
                                <span>{feat.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* COMMAND CAPSULE INPUT */}
                <div className="max-w-2xl mx-auto w-full relative z-20 animate-scale-in px-0 md:px-2 opacity-0 fill-mode-forwards" style={{ animationDelay: '600ms' }}>

                    {/* Floating Label */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0A0A0A] border border-white/10 px-3 py-0.5 rounded-full text-[9px] font-mono text-amber-500 uppercase tracking-widest z-30 shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                        Form Analysis Entry
                    </div>

                    <div className="relative bg-[#050505] border border-white/10 rounded-3xl p-2 flex flex-col md:flex-row items-stretch md:items-center gap-2 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7)] group transition-all duration-300 hover:border-amber-500/30 hover:shadow-[0_0_40px_rgba(245,158,11,0.15)] overflow-hidden">

                        {/* Shimmer Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer-flow pointer-events-none rounded-3xl" />

                        {/* Input Wrapper */}
                        <div className="flex items-center w-full flex-1 pl-4 pr-3 py-3 md:py-0 bg-transparent relative z-10">
                            {/* Command Icon */}
                            <div className="text-slate-600 group-focus-within:text-amber-500 transition-colors duration-300 mr-3">
                                <Command className="w-5 h-5" />
                            </div>

                            <input
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && url && !loading) {
                                        onAnalyze();
                                    }
                                }}
                                placeholder="https://docs.google.com/forms/d/e/1FAIpQL..."
                                className="flex-1 bg-transparent border-none text-white text-base md:text-lg placeholder:text-slate-700/80 focus:outline-none focus:ring-0 font-mono tracking-tight w-full"
                                spellCheck={false}
                            />

                            {/* Paste Button */}
                            <button
                                onClick={async () => {
                                    try {
                                        const text = await navigator.clipboard.readText();
                                        setUrl(text);
                                    } catch (err) {
                                        console.error('Failed to read clipboard:', err);
                                    }
                                }}
                                className="p-2 rounded-lg hover:bg-white/10 text-slate-600 hover:text-amber-400 transition-all active:scale-95"
                                title="Paste from clipboard"
                            >
                                <Clipboard className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Analyze Button */}
                        <button
                            onClick={onAnalyze}
                            disabled={loading || !url}
                            className="relative overflow-hidden w-full md:w-auto px-8 py-4 md:py-3.5 bg-gradient-to-r from-amber-600 to-amber-500 text-black font-bold text-sm uppercase tracking-wider rounded-2xl hover:from-amber-500 hover:to-amber-400 transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] active:scale-95 disabled:opacity-50 disabled:grayscale disabled:pointer-events-none z-10 group/btn"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Analyse Form</span>
                                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>


                    {/* Secondary Actions - Refactored */}
                    <div className="mt-8 flex items-center justify-center gap-4 opacity-0 fill-mode-forwards animate-fade-in" style={{ animationDelay: '700ms' }}>
                        <button
                            onClick={onWatchDemo}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 hover:border-amber-500/50 hover:bg-amber-500/10 transition-all group active:scale-95"
                        >
                            <Play className="w-3 h-3 fill-current text-slate-400 group-hover:text-amber-400" />
                            <span className="uppercase tracking-[0.2em] font-mono text-[10px] text-slate-400 group-hover:text-amber-200">Watch Demo</span>
                        </button>

                        <div className="w-1.5 h-1.5 rounded-full bg-white/10" />

                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em]">
                                {version} <span className="text-slate-600">STABLE</span>
                            </span>
                        </div>
                    </div>


                </div>


            </div>
        </section>
    );
});

export default HeroSection;
