"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useThreadsContext } from "./contexts/ThreadContext";
import { createClient } from "@/lib/client";
import { useLocalStorage } from "./hooks/use-local-storage";
import { LANGCHAIN_API_KEY_LOCAL_STORAGE_KEY } from "./constants";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Save, Trash2, Loader2, Sparkles, BrainCircuit } from "lucide-react";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import { logger } from "./utils/logger";

export function MemoryView() {
    const { agentInboxes } = useThreadsContext();
    const { getItem } = useLocalStorage();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [reflections, setReflections] = useState("");
    const [hasChanges, setHasChanges] = useState(false);

    const selectedInbox = agentInboxes.find(inbox => inbox.selected) || agentInboxes[0];

    useEffect(() => {
        let isMounted = true;

        const performFetch = async () => {
            if (!selectedInbox?.deploymentUrl) return;

            setLoading(true);
            try {
                // The master key is now handled internally by createClient
                const client = createClient({
                    deploymentUrl: selectedInbox.deploymentUrl,
                    langchainApiKey: undefined
                });

                // Fetch from store: ["reflection_rules"], key "rules"
                const result = await (client.store as any).getItem(["reflection_rules"], "rules");

                if (!isMounted) return;

                if (result && result.value && result.value.prompt) {
                    setReflections(result.value.prompt as string);
                } else {
                    setReflections("");
                }
            } catch (error: any) {
                if (!isMounted) return;
                logger.error("Error fetching reflections", error);
                toast({
                    title: "Connection Issue",
                    description: "Could not reach the AI Brain. Ensure your backend is running and the URL is correct.",
                    variant: "destructive",
                });
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        performFetch();

        return () => {
            isMounted = false;
        };
    }, [selectedInbox?.id, selectedInbox?.deploymentUrl, toast]);

    const handleSave = async () => {
        if (!selectedInbox) return;

        setSaving(true);
        try {
            const client = createClient({
                deploymentUrl: selectedInbox.deploymentUrl,
                langchainApiKey: undefined
            });

            await (client.store as any).putItem(["reflection_rules"], "rules", {
                prompt: reflections
            });

            setHasChanges(false);
            toast({
                title: "Memories Updated ✨",
                description: "The AI agent has successfully synchronized the new rules.",
                duration: 3000,
            });
        } catch (error) {
            logger.error("Error saving reflections", error);
            toast({
                title: "Save Failed",
                description: "Could not update the AI memory. Please try again.",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleClear = () => {
        if (window.confirm("Are you sure you want to clear all learned memories? This cannot be undone.")) {
            setReflections("");
            setHasChanges(true);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.8, ease: "easeOut" }
        }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="p-6 md:p-12 max-w-6xl mx-auto w-full h-full flex flex-col"
        >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                            <BrainCircuit className="w-8 h-8" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">AI Style Brain</h1>
                    </div>
                    <div className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl max-w-2xl">
                        <p className="text-slate-300 text-sm font-medium leading-relaxed">
                            <Sparkles className="w-4 h-4 inline-block mr-2 text-blue-400 mb-1" />
                            This is your agent's **Long Term Memory**. As you give feedback on generated posts, the agent learns your preferences (e.g. tone, emojis, length) and writes them as "Rules" below. The agent reads these rules every time it generates a new post to ensure it sounds exactly like you.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        onClick={handleClear}
                        className="h-12 px-6 rounded-2xl text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all font-bold"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Reset Knowledge
                    </Button>
                    <Button
                        variant="premium"
                        onClick={handleSave}
                        disabled={saving || !hasChanges}
                        className="h-12 px-8 rounded-2xl font-bold shadow-[0_10px_30px_rgba(59,130,246,0.2)]"
                    >
                        {saving ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Save className="w-5 h-5 mr-2" />
                                Synchronize
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="relative group/memory-container flex-1 min-h-[400px]">
                {/* Decorative background glow */}
                <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent rounded-[40px] blur-3xl opacity-50 group-focus-within/memory-container:opacity-100 transition-opacity duration-1000" />

                <div className="relative h-full bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[32px] overflow-hidden flex flex-col shadow-2xl">
                    <div className="px-8 py-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-blue-400" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Learned Rule Engine</span>
                        </div>
                        {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-500" />}
                    </div>

                    <textarea
                        value={reflections}
                        onChange={(e) => {
                            setReflections(e.target.value);
                            setHasChanges(true);
                        }}
                        placeholder={loading ? "Tuning into neural frequencies..." : "No reflections learned yet. The agent will populate this automatically as you give it feedback on social media posts."}
                        className="flex-1 w-full p-8 bg-transparent text-slate-200 placeholder:text-slate-700 resize-none focus:outline-none font-mono text-sm leading-relaxed"
                        disabled={loading}
                    />

                    <div className="px-8 py-4 bg-black/40 border-t border-white/5 text-[10px] text-slate-600 font-bold uppercase tracking-widest flex justify-between items-center">
                        <span>Namespace: reflection_rules / rules</span>
                        <span>{selectedInbox?.name}</span>
                    </div>
                </div>
            </div>

            {/* Visual Indicator of changes */}
            <AnimatePresence>
                {hasChanges && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-6 flex items-center justify-center gap-2 text-blue-400 text-xs font-black uppercase tracking-[0.3em]"
                    >
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        Unsaved Neural Adjustments Detected
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
