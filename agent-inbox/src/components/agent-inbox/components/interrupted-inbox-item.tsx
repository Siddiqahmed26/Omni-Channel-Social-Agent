import { cn } from "@/lib/utils";
import { InterruptedThreadData } from "../types";
import React from "react";
import { InboxItemStatuses } from "./statuses";
import { format } from "date-fns";
import { useQueryParams } from "../hooks/use-query-params";
import { IMPROPER_SCHEMA, VIEW_STATE_THREAD_QUERY_PARAM } from "../constants";
import { ThreadIdCopyable } from "./thread-id";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

interface InterruptedInboxItemProps<
  ThreadValues extends Record<string, any> = Record<string, any>,
> {
  threadData: InterruptedThreadData<ThreadValues>;
  isLast: boolean;
  onThreadClick: (id: string) => void;
}

export const InterruptedInboxItem = <ThreadValues extends Record<string, any>>({
  threadData,
  isLast,
  onThreadClick,
}: InterruptedInboxItemProps<ThreadValues>) => {
  const { updateQueryParams } = useQueryParams();
  const firstInterrupt = threadData.interrupts?.[0];

  const descriptionPreview = firstInterrupt?.description?.slice(0, 65);
  const descriptionTruncated =
    firstInterrupt?.description && firstInterrupt.description.length > 65;

  const action = firstInterrupt?.action_request?.action;
  const title = !action || action === IMPROPER_SCHEMA ? "User Interrupt" : action;
  const hasNoDescription =
    !firstInterrupt ||
    (!firstInterrupt.description && !threadData.invalidSchema);

  const updatedAtDateString = format(
    new Date(threadData.thread.updated_at),
    "MMM d, h:mm a"
  );

  const handleThreadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onThreadClick) {
      onThreadClick(threadData.thread.thread_id);
    }
    updateQueryParams(
      VIEW_STATE_THREAD_QUERY_PARAM,
      threadData.thread.thread_id
    );
  };

  const hasDescriptionValue =
    descriptionPreview ||
    descriptionTruncated ||
    (!firstInterrupt && threadData.invalidSchema);

  return (
    <motion.div
      key={threadData.thread.thread_id}
      layout
      whileHover={{ y: -4, scale: 1.01 }}
      onClick={handleThreadClick}
      className={cn(
        "group relative flex flex-col sm:flex-row sm:items-center w-full p-5 sm:p-6 mb-4 cursor-pointer",
        "bg-white/[0.04] hover:bg-white/[0.08] backdrop-blur-xl border border-white/10 rounded-2xl transition-all duration-300",
        "shadow-[0_4px_30px_rgba(0,0,0,0.1)] hover:shadow-blue-500/20 hover:border-blue-500/30"
      )}
    >
      {/* Dynamic Glow Side */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 rounded-r-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] group-hover:h-3/4 transition-all duration-500" />

      {/* Title and Description */}
      <div className="flex-1 overflow-hidden flex flex-row items-center gap-5">
        <div className="hidden sm:flex p-3 rounded-2xl bg-blue-500/10 text-blue-400 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-300 shadow-inner">
          <Zap className="w-5 h-5 fill-blue-400/20" />
        </div>
        <div className="flex-1 overflow-hidden flex flex-col justify-center">
          <div className="flex items-center gap-3">
            <span className="text-base sm:text-lg font-bold text-white group-hover:text-blue-400 transition-colors truncate tracking-tight">
              {title}
            </span>
            <div className="opacity-40 group-hover:opacity-100 transition-opacity">
              <ThreadIdCopyable
                showUUID={false}
                threadId={threadData.thread.thread_id}
              />
            </div>
          </div>
          {hasDescriptionValue && (
            <div className="text-sm sm:text-[15px] text-slate-400 truncate mt-1.5 font-medium leading-relaxed">
              {descriptionPreview}
              {descriptionTruncated && "..."}
              {!firstInterrupt && threadData.invalidSchema && (
                <span className="text-red-400/80 italic font-normal text-xs">Invalid interrupt data</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status + Timestamp */}
      <div className="flex items-center justify-between sm:justify-end gap-5 mt-5 sm:mt-0 shrink-0">
        <div className="flex flex-col items-end gap-1.5">
          {firstInterrupt?.config && (
            <InboxItemStatuses config={firstInterrupt.config} />
          )}
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider whitespace-nowrap">
              Action Required
            </p>
          </div>
        </div>
        <div className="hidden sm:block w-px h-10 bg-white/10" />
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5 opacity-50">Sent</p>
          <p className="text-[13px] text-slate-300 font-bold whitespace-nowrap">
            {updatedAtDateString.split(',')[1]}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
