"use client";

import { cn } from "@/lib/utils";
import { Thread } from "@langchain/langgraph-sdk";
import { ThreadIdCopyable } from "./thread-id";
import { InboxItemStatuses } from "./statuses";
import { format } from "date-fns";
import { useQueryParams } from "../hooks/use-query-params";
import {
  STUDIO_NOT_WORKING_TROUBLESHOOTING_URL,
  VIEW_STATE_THREAD_QUERY_PARAM,
} from "../constants";
import { FileText } from "lucide-react";
import { GenericThreadData } from "../types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useThreadsContext } from "../contexts/ThreadContext";

import { constructOpenInStudioURL } from "../utils";

interface GenericInboxItemProps<
  ThreadValues extends Record<string, any> = Record<string, any>,
> {
  threadData:
  | GenericThreadData<ThreadValues>
  | {
    thread: Thread<ThreadValues>;
    status: "interrupted";
    interrupts?: undefined;
  };
  isLast: boolean;
}

import { motion } from "framer-motion";

export function GenericInboxItem<
  ThreadValues extends Record<string, any> = Record<string, any>,
>({ threadData, isLast }: GenericInboxItemProps<ThreadValues>) {
  const { updateQueryParams } = useQueryParams();
  const { toast } = useToast();
  const { agentInboxes } = useThreadsContext();

  const selectedInbox = agentInboxes.find((i) => i.selected);

  const handleOpenInStudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedInbox) {
      toast({
        title: "Error",
        description: "No agent inbox selected.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    const studioUrl = constructOpenInStudioURL(
      selectedInbox,
      threadData.thread.thread_id
    );

    if (studioUrl === "#") {
      toast({
        title: "Error",
        description: (
          <>
            <p>
              Could not construct Studio URL. Check if inbox has necessary
              details (Project ID, Tenant ID).
            </p>
            <p>
              If the issue persists, see the{" "}
              <a
                href={STUDIO_NOT_WORKING_TROUBLESHOOTING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline"
              >
                troubleshooting section
              </a>
            </p>
          </>
        ),
        variant: "destructive",
        duration: 10000,
      });
    } else {
      window.open(studioUrl, "_blank");
    }
  };

  const updatedAtDateString = format(
    new Date(threadData.thread.updated_at),
    "MMM d, h:mm a"
  );

  return (
    <motion.div
      layout
      whileHover={{ y: -4, scale: 1.01 }}
      onClick={() =>
        updateQueryParams(
          VIEW_STATE_THREAD_QUERY_PARAM,
          threadData.thread.thread_id
        )
      }
      className={cn(
        "group relative flex flex-col sm:flex-row sm:items-center w-full p-5 sm:p-6 mb-4 cursor-pointer",
        "bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-md border border-white/5 rounded-2xl transition-all duration-300",
        "shadow-lg hover:shadow-purple-500/10 hover:border-white/10"
      )}
    >
      {/* Decorative vertical line */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/5 rounded-r-full bg-slate-700 transition-colors group-hover:bg-purple-500" />

      {/* Thread Content */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="p-2.5 rounded-xl bg-slate-800/50 border border-white/5 text-slate-400 transition-transform group-hover:scale-110">
          <FileText className="w-5 h-5" />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Thread</span>
            <ThreadIdCopyable showUUID={false} threadId={threadData.thread.thread_id} />
          </div>
          <p className="text-xs text-slate-500 mt-1 truncate max-w-xs sm:max-w-md">
            Last active {updatedAtDateString}
          </p>
        </div>
      </div>

      {/* Actions and Status */}
      <div className="flex items-center justify-between sm:justify-end gap-4 mt-4 sm:mt-0 shrink-0">
        <div className="flex items-center gap-3">
          <InboxItemStatuses status={threadData.status} />
          {selectedInbox && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-3 text-xs bg-black/40 border-white/10 hover:border-white/20"
              onClick={handleOpenInStudio}
            >
              Studio
            </Button>
          )}
        </div>
        <div className="hidden sm:block w-px h-8 bg-white/5" />
        <div className="text-right">
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-tighter mb-0.5">Updated</p>
          <p className="text-xs text-slate-300 font-medium whitespace-nowrap">
            {updatedAtDateString.split(',')[1]}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
