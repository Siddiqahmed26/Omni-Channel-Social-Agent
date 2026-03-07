"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Settings, RefreshCw } from "lucide-react";
import React from "react";
import { PillButton } from "@/components/ui/pill-button";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "../hooks/use-local-storage";
import { INBOX_PARAM, LANGCHAIN_API_KEY_LOCAL_STORAGE_KEY } from "../constants";
import { useThreadsContext } from "../contexts/ThreadContext";
import { useQueryParams } from "../hooks/use-query-params";
import { ThreadStatusWithAll } from "../types";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { forceInboxBackfill, isBackfillCompleted } from "../utils/backfill";
import { useToast } from "@/hooks/use-toast";
import { logger } from "../utils/logger";
import { cn } from "@/lib/utils";

export function SettingsPopover({ iconOnly = false }: { iconOnly?: boolean }) {
  const langchainApiKeyNotSet = React.useRef(true);
  const [open, setOpen] = React.useState(false);
  const [langchainApiKey, setLangchainApiKey] = React.useState("");
  const { getItem, setItem } = useLocalStorage();
  const { getSearchParam } = useQueryParams();
  const { fetchThreads } = useThreadsContext();
  const [isRunningBackfill, setIsRunningBackfill] = React.useState(false);
  const [backfillCompleted, setBackfillCompleted] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    setBackfillCompleted(isBackfillCompleted());

    try {
      if (typeof window === "undefined") {
        return;
      }
      if (langchainApiKey) return;

      const langchainApiKeyLS = getItem(LANGCHAIN_API_KEY_LOCAL_STORAGE_KEY);
      if (langchainApiKeyLS) {
        langchainApiKeyNotSet.current = false;
        setLangchainApiKey(langchainApiKeyLS);
      }
    } catch (e) {
      logger.error("Error getting/setting LangSmith API key", e);
    }
  }, [langchainApiKey]);

  const handleChangeLangChainApiKey = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setLangchainApiKey(e.target.value);
    setItem(LANGCHAIN_API_KEY_LOCAL_STORAGE_KEY, e.target.value);
  };

  const handleRunBackfill = async () => {
    setIsRunningBackfill(true);
    try {
      const result = await forceInboxBackfill();

      if (result.success) {
        toast({
          title: "Success",
          description:
            "Your inbox IDs have been updated. Please refresh the page to see your inboxes.",
          duration: 5000,
        });
        window.location.reload();
      } else {
        toast({
          title: "Error",
          description: "Failed to update inbox IDs. Please try again.",
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error) {
      logger.error("Error running backfill:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsRunningBackfill(false);
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(c) => {
        if (!c && langchainApiKey && langchainApiKeyNotSet.current) {
          langchainApiKeyNotSet.current = false;
          const inboxParam = getSearchParam(INBOX_PARAM) as
            | ThreadStatusWithAll
            | undefined;
          if (inboxParam) {
            void fetchThreads(inboxParam);
          }
        }
        setOpen(c);
      }}
    >
      <PopoverTrigger asChild>
        {iconOnly ? (
          <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-2xl bg-white/[0.05] text-slate-400 hover:text-white border border-white/5 hover:border-white/20 transition-all shadow-lg active:scale-90">
            <Settings className="w-5 h-5" />
            <span className="sr-only">Settings</span>
          </Button>
        ) : (
          <Button
            variant="ghost"
            className="flex gap-3 items-center justify-start text-slate-400 hover:text-white hover:bg-white/5 w-full h-12 rounded-2xl px-4 transition-all group"
          >
            <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
            <span className="font-bold tracking-tight">System Configuration</span>
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0 bg-black/60 backdrop-blur-3xl border border-white/10 text-white shadow-[0_40px_100px_rgba(0,0,0,0.7)] rounded-[28px] overflow-hidden mt-2">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-purple-500/10 via-transparent to-blue-500/10 opacity-50" />
        <div className="relative z-10 p-6">
          <div className="mb-6">
            <h4 className="text-lg font-black tracking-tight text-white mb-1">Configuration</h4>
            <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest leading-none">Global Agent Parameters</p>
          </div>
          <div className="flex flex-col items-start gap-4 w-full">
            <div className="flex flex-col items-start gap-3 w-full">
              <div className="flex flex-col gap-2 w-full items-start">
                <Label htmlFor="langchain-api-key" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                  LangSmith Signature <span className="text-blue-500">*</span>
                </Label>
                <div className="relative w-full group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
                  <PasswordInput
                    id="langchain-api-key"
                    placeholder="lsv2_pt_..."
                    className="relative z-10 bg-black/40 border-white/10 rounded-xl h-11 px-4 text-slate-200 placeholder:text-slate-600 focus:bg-black/60 transition-all font-medium text-sm shadow-inner"
                    required
                    value={langchainApiKey}
                    onChange={handleChangeLangChainApiKey}
                  />
                </div>
                <p className="text-[10px] text-slate-600 font-medium leading-relaxed px-1">
                  Stored securely in local storage. Never transmitted off-device except for direct LangGraph authentication.
                </p>
              </div>
            </div>
            {!backfillCompleted && (
              <div className="flex flex-col items-start gap-4 w-full border-t border-white/5 pt-6 mt-2">
                <div className="flex flex-col gap-1 w-full items-start px-1">
                  <Label className="text-xs font-bold text-slate-300">Legacy Migration</Label>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                    Upgrade your inbox indices to the modern global format for cross-device synchronization.
                  </p>
                </div>
                <Button
                  onClick={handleRunBackfill}
                  disabled={isRunningBackfill}
                  variant="premium"
                  className="w-full h-11 rounded-xl text-xs font-bold shadow-lg"
                >
                  <RefreshCw
                    className={cn(
                      "h-3.5 w-3.5 mr-2",
                      isRunningBackfill && "animate-spin"
                    )}
                  />
                  {isRunningBackfill ? "Synchronizing..." : "Migrate Identities"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
