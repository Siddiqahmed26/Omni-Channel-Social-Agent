"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useThreadsContext } from "./contexts/ThreadContext";
import { createClient } from "@/lib/client";
import { useLocalStorage } from "./hooks/use-local-storage";
import { LANGCHAIN_API_KEY_LOCAL_STORAGE_KEY } from "./constants";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Save, Trash2, Loader2, Sparkles, BrainCircuit, Cpu, LoaderCircle } from "lucide-react";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import { logger } from "./utils/logger";

export function MemoryView() {
    const { agentInboxes } = useThreadsContext();
    const { getItem } = useLocalStorage();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [reflections, setReflections] = useState("");
    const [hasChanges, setHasChanges] = useState(false);

    const selectedInbox = agentInboxes.find(inbox => inbox.selected) || agentInboxes[0];

    const lastFetchedRef = React.useRef<string>("");
    const fetchingRef = React.useRef<boolean>(false);

    const performFetch = useCallback(async (force = false) => {
        if (!selectedInbox?.deploymentUrl || (fetchingRef.current && !force)) return;

        const fetchKey = `${selectedInbox.id}-${selectedInbox.deploymentUrl}`;
        if (!force && fetchKey === lastFetchedRef.current) return;

        fetchingRef.current = true;
        setLoading(true);
        try {
            lastFetchedRef.current = fetchKey;
            const client = createClient({
                deploymentUrl: selectedInbox.deploymentUrl,
                langchainApiKey: undefined
            });

            const result = await (client.store as any).getItem(["reflection_rules"], "rules");

            if (result && result.value && result.value.prompt) {
                setReflections(result.value.prompt as string);
            } else {
                setReflections("");
            }
            setHasChanges(false);
        } catch (error: any) {
            lastFetchedRef.current = "";
            logger.error("Error fetching reflections", error);
            toast({
                title: "Connection Issue",
                description: "Could not reach the AI Brain. Ensure your backend is running.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
            fetchingRef.current = false;
        }
    }, [selectedInbox, toast]);

    useEffect(() => {
        performFetch();
    }, [performFetch]);

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
                description: "Could not update the AI memory.",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleResetKnowledge = async () => {
        if (!selectedInbox) return;
        if (!window.confirm("Are you sure you want to clear all learned memories? This cannot be undone.")) return;

        setResetting(true);
        try {
            const client = createClient({
                deploymentUrl: selectedInbox.deploymentUrl,
                langchainApiKey: undefined
            });

            await (client.store as any).putItem(["reflection_rules"], "rules", {
                prompt: ""
            });

            setReflections("");
            setHasChanges(false);
            toast({
                title: "Neural Reset Complete",
                description: "All learned rules have been cleared.",
            });
        } catch (error) {
            logger.error("Error resetting reflections", error);
            toast({
                title: "Reset Failed",
                variant: "destructive",
            });
        } finally {
            setResetting(false);
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
                <div className="flex flex-col gap-4">
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">AI Style Brain</h1>
                    <div className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl max-w-2xl">
                        <p className="text-slate-300 text-sm font-medium leading-relaxed">
                            <Sparkles className="w-4 h-4 inline-block mr-2 text-blue-400 mb-1" />
                            This is your agent's <strong className="text-white font-black">Long Term Memory</strong>. As you give feedback on generated posts, the agent learns your preferences (e.g. tone, emojis, length) and writes them as "Rules" below. The agent reads these rules every time it generates a new post to ensure it sounds exactly like you.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleResetKnowledge}
                        disabled={resetting || loading}
                        className="h-[44px] px-4 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all font-bold text-xs uppercase tracking-widest"
                    >
                        {resetting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                        {resetting ? "Resetting..." : "Reset Knowledge"}
                    </Button>
                    <Button
                        variant="premium"
                        onClick={() => performFetch(true)}
                        disabled={loading}
                        className="h-[44px] px-6 rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all font-bold text-xs uppercase tracking-widest"
                    >
                        {loading ? (
                            <LoaderCircle className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                            <Brain className="w-4 h-4 mr-2" />
                        )}
                        {loading ? "Syncing..." : "Synchronize"}
                    </Button>
                </div>
            </div>

            <div className="relative group/memory-container flex-1 min-h-[400px]">
                {/* Decorative background glow */}
                <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent rounded-[40px] blur-3xl opacity-50 group-focus-within/memory-container:opacity-100 transition-opacity duration-1000" />
                <div className="relative h-full glass-card border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl">
                    <div className="bg-white/[0.02] border-b border-white/5 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Cpu className="w-5 h-5 text-blue-400" />
                            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Learned Rule Engine</h2>
                        </div>
                    </div>

                    <div className="p-4 md:p-8 min-h-[400px] flex-1 flex flex-col">
                        <textarea
                            disabled
                            value={reflections}
                            placeholder="No reflections learned yet. The agent will populate this automatically as you give it feedback on social media posts."
                            className="flex-1 w-full bg-transparent border-none text-slate-400 font-mono text-sm leading-relaxed focus:ring-0 resize-none no-scrollbar placeholder:text-slate-700"
                        />
                    </div>

                    <div className="px-8 py-4 bg-black/40 border-t border-white/5 text-[10px] text-slate-600 font-bold uppercase tracking-widest flex justify-between items-center">
                        <span>Namespace: reflection_rules / rules</span>
                        <span className="truncate ml-4">{selectedInbox?.name}</span>
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
