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
  const [open, setOpen] = React.useState(false);
  const { getItem, setItem } = useLocalStorage();
  const { getSearchParam } = useQueryParams();
  const { fetchThreads } = useThreadsContext();
  const [isRunningBackfill, setIsRunningBackfill] = React.useState(false);
  const [backfillCompleted, setBackfillCompleted] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    setBackfillCompleted(isBackfillCompleted());
  }, []);


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
      onOpenChange={setOpen}
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
            <div className="flex flex-col gap-1 w-full items-start px-1">
              <h5 className="text-xs font-black text-white/90">Identity Management</h5>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                Your account is automatically provisioned with a secure neural interface. No manual configuration required.
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
      </PopoverContent>
    </Popover>
  );
}
