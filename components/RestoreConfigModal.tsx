import React from 'react';
import { History, RotateCcw, Sparkles, X, Clock, Target, Zap, Trash2 } from 'lucide-react';
import { SavedFormConfig } from '../utils/formHistory';

interface RestoreConfigModalProps {
    config: SavedFormConfig;
    onRestore: () => void;
    onStartFresh: () => void;
    onDelete: () => void;
}

function timeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
}

const RestoreConfigModal: React.FC<RestoreConfigModalProps> = ({ config, onRestore, onStartFresh, onDelete }) => {
    const weightCount = Object.keys(config.questionWeights).length;

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onStartFresh}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md animate-fade-in-up">
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-emerald-500/10 to-amber-500/20 rounded-2xl blur-xl" />

                <div className="relative bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                    {/* Top accent bar */}
                    <div className="h-1 bg-gradient-to-r from-amber-500 via-emerald-500 to-amber-500" />

                    {/* Close button */}
                    <button
                        onClick={onStartFresh}
                        className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors z-10"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {/* Content */}
                    <div className="p-6 pt-5">
                        {/* Icon + Header */}
                        <div className="flex items-start gap-4 mb-5">
                            <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex-shrink-0">
                                <History className="w-6 h-6 text-amber-500" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-base font-bold text-white mb-1">Previous Configuration Found</h3>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    You've configured this form before. Restore your settings for a faster setup.
                                </p>
                            </div>
                        </div>

                        {/* Saved Info Card */}
                        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 mb-5 space-y-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Form</span>
                                <span className="text-xs text-white font-semibold truncate max-w-[200px]">{config.formTitle}</span>
                            </div>
                            <div className="h-px bg-white/5" />
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500 flex items-center gap-1.5">
                                    <Clock className="w-3 h-3" />
                                    Last used
                                </span>
                                <span className="text-xs text-slate-300 font-mono">{timeAgo(config.savedAt)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500 flex items-center gap-1.5">
                                    <Target className="w-3 h-3" />
                                    Responses
                                </span>
                                <span className="text-xs text-amber-400 font-mono font-bold">{config.targetCount}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500 flex items-center gap-1.5">
                                    <Zap className="w-3 h-3" />
                                    Speed
                                </span>
                                <span className="text-xs text-slate-300 font-mono">
                                    {config.speedMode === 'auto' ? 'Auto' : `${config.delayMin}ms`}
                                </span>
                            </div>
                            {weightCount > 0 && (
                                <>
                                    <div className="h-px bg-white/5" />
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-500 flex items-center gap-1.5">
                                            <Sparkles className="w-3 h-3" />
                                            Custom Weights
                                        </span>
                                        <span className="text-xs text-emerald-400 font-mono font-bold">
                                            {config.aiApplied ? 'AI Optimized' : `${weightCount} fields`}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={onStartFresh}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200 active:scale-95 text-xs font-bold uppercase tracking-wider"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Start Fresh
                            </button>
                            <button
                                onClick={onRestore}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all duration-200 active:scale-95"
                            >
                                <History className="w-3.5 h-3.5" />
                                Restore
                            </button>
                        </div>
                        <div className="mt-3">
                            <button
                                onClick={onDelete}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all duration-200 active:scale-95 text-xs font-bold uppercase tracking-wider"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete History
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RestoreConfigModal;
