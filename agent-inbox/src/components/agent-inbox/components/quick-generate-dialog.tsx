"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React from "react";
import { useToast } from "@/hooks/use-toast";
import { LoaderCircle, PlusCircle } from "lucide-react";
import { logger } from "../utils/logger";
import { useThreadsContext } from "../contexts/ThreadContext";
import { createClient } from "@/lib/client";
import { createClient as createSupabaseClient } from "@/utils/supabase/client";

export function QuickGenerateDialog({ iconOnly = false }: { iconOnly?: boolean }) {
    const { toast } = useToast();
    const { agentInboxes } = useThreadsContext();
    const [open, setOpen] = React.useState(false);
    const [url, setUrl] = React.useState("");
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            // Use the selected inbox's deployment URL or fallback
            const currentInbox = agentInboxes.find(i => i.selected) || agentInboxes[0];
            const deploymentUrl = currentInbox?.deploymentUrl || "https://siddiq262001-my-social-agent.hf.space";
            const graphId = currentInbox?.graphId || "generate_post";

            // Initialize the client
            const client = createClient({ deploymentUrl, langchainApiKey: undefined });

            // Get current user for metadata
            const supabase = createSupabaseClient();
            const { data: { user } } = await supabase.auth.getUser();

            // Create a brand new thread with user_id metadata
            const thread = await client.threads.create({
                metadata: { user_id: user?.id }
            });

            // Start the agent run on this new thread
            await client.runs.create(thread.thread_id, graphId, {
                input: { links: [url] },
            });

            toast({
                title: "Success! 🚀",
                description: "Agent has started generating your post. It should appear in the 'Omni Post Generator' inbox shortly.",
                duration: 5000,
            });

            setUrl("");
            setOpen(false);

            // Reload to show the new run
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (error) {
            logger.error("Error generating post:", error);
            setErrorMessage(
                `Failed to start generation: ${error instanceof Error ? error.message : String(error)}. Please try again.`
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {iconOnly ? (
                    <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-2xl bg-white/[0.05] text-slate-400 hover:text-white border border-white/5 hover:border-white/20 transition-all shadow-lg active:scale-90">
                        <PlusCircle className="w-5 h-5" />
                        <span className="sr-only">Generate Post</span>
                    </Button>
                ) : (
                    <Button variant="premium" className="w-[85%] mx-auto mt-6 mb-4 flex gap-3 h-12 rounded-2xl shadow-[0_10px_30px_rgba(59,130,246,0.2)] hover:shadow-[0_15px_40px_rgba(59,130,246,0.3)] transition-all active:scale-[0.98]">
                        <PlusCircle className="w-5 h-5" />
                        <span className="font-bold tracking-tight">Generate Post</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] bg-black/60 backdrop-blur-3xl border border-white/10 text-white shadow-[0_40px_100px_rgba(0,0,0,0.7)] rounded-[32px] overflow-hidden p-0">
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10 opacity-50" />
                <div className="relative z-10 p-8">
                    <DialogHeader className="mb-8">
                        <DialogTitle className="text-3xl font-black tracking-tighter mb-2">Generate Magic</DialogTitle>
                        <DialogDescription className="text-slate-400 text-sm leading-relaxed font-medium">
                            Paste any GitHub repository or article link. Our AI will synthesize it into a high-impact social media narrative instantly.
                        </DialogDescription>
                    </DialogHeader>
                    <form
                        className="flex flex-col items-center justify-center gap-4 py-4 w-full"
                        onSubmit={handleSubmit}
                    >
                        <div className="flex flex-col gap-3 items-start justify-start w-full">
                            <Label htmlFor="url" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                                Content Origin <span className="text-blue-500">*</span>
                            </Label>
                            <div className="relative w-full group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
                                <Input
                                    id="url"
                                    placeholder="https://github.com/..."
                                    className="relative z-10 bg-black/40 border-white/10 rounded-2xl h-14 px-5 text-slate-200 placeholder:text-slate-600 focus:bg-black/60 transition-all font-medium text-base shadow-inner"
                                    required
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                />
                            </div>
                        </div>

                        {errorMessage && (
                            <div className="text-red-400 text-xs w-full font-bold p-4 bg-red-400/10 border border-red-400/20 rounded-2xl animate-shake">{errorMessage}</div>
                        )}

                        <div className="flex flex-col sm:flex-row-reverse gap-4 w-full mt-4">
                            <Button
                                variant="premium"
                                className="flex-1 h-14 rounded-2xl text-base font-bold shadow-[0_15px_30px_rgba(59,130,246,0.3)] transition-all active:scale-95"
                                type="submit"
                                disabled={isSubmitting || !url}
                            >
                                {isSubmitting ? (
                                    <>
                                        <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
                                        Synchronizing...
                                    </>
                                ) : (
                                    "Initiate Growth"
                                )}
                            </Button>
                            <Button
                                variant="ghost"
                                type="button"
                                className="flex-1 h-14 rounded-2xl text-slate-400 font-bold hover:text-white hover:bg-white/5 transition-all"
                                onClick={() => setOpen(false)}
                            >
                                Abort
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
