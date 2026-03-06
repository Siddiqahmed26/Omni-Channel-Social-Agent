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
import { createClient } from "@/lib/client";
import { createClient as createSupabaseClient } from "@/utils/supabase/client";

export function QuickGenerateDialog() {
    const { toast } = useToast();
    const [open, setOpen] = React.useState(false);
    const [url, setUrl] = React.useState("");
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            // Use the provided Hugging Face URL for the backend
            const deploymentUrl = "https://siddiq262001-my-social-agent.hf.space";
            const graphId = "generate_post";

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
                title: "Success! ??",
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
                <Button className="w-[85%] mx-auto mt-4 mb-2 flex gap-2 border border-white/20 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all rounded-xl">
                    <PlusCircle className="w-5 h-5" />
                    Generate Post
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-slate-900/80 backdrop-blur-2xl border-white/10 text-white shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl">Generate a New Post</DialogTitle>
                    <DialogDescription asChild>
                        <div className="pt-2">
                            Paste any GitHub repository, blog post, or article link here. The Omni Social Agent will instantly read the content and draft a viral social media post for you!
                        </div>
                    </DialogDescription>
                </DialogHeader>
                <form
                    className="flex flex-col items-center justify-center gap-4 py-4 w-full"
                    onSubmit={handleSubmit}
                >
                    <div className="flex flex-col gap-2 items-start justify-start w-full">
                        <Label htmlFor="url">
                            Content Link <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="url"
                            placeholder="https://github.com/... or https://blog..."
                            className="w-full text-base py-6 px-4 rounded-xl"
                            required
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                        />
                    </div>

                    {errorMessage && (
                        <div className="text-red-500 text-sm w-full font-medium p-2 bg-red-50 rounded-md">{errorMessage}</div>
                    )}

                    <div className="grid grid-cols-2 gap-4 w-full mt-2">
                        <Button
                            className="w-full"
                            type="submit"
                            disabled={isSubmitting || !url}
                        >
                            {isSubmitting ? (
                                <>
                                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                "Start Magic ?"
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
