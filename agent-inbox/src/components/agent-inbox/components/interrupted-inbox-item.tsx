import { cn } from "@/lib/utils";
import { InterruptedThreadData } from "../types";
import React from "react";
import { InboxItemStatuses } from "./statuses";
import { format } from "date-fns";
import { useQueryParams } from "../hooks/use-query-params";
import { IMPROPER_SCHEMA, VIEW_STATE_THREAD_QUERY_PARAM } from "../constants";
import { ThreadIdCopyable } from "./thread-id";

interface InterruptedInboxItem<
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
}: InterruptedInboxItem<ThreadValues>) => {
  const { updateQueryParams } = useQueryParams();
  const firstInterrupt = threadData.interrupts?.[0];

  const descriptionPreview = firstInterrupt?.description?.slice(0, 65);
  const descriptionTruncated =
    firstInterrupt?.description && firstInterrupt.description.length > 65;

  const action = firstInterrupt?.action_request?.action;
  const title = !action || action === IMPROPER_SCHEMA ? "Interrupt" : action;
  const hasNoDescription =
    !firstInterrupt ||
    (!firstInterrupt.description && !threadData.invalidSchema);

  const updatedAtDateString = format(
    new Date(threadData.thread.updated_at),
    "MM/dd h:mm a"
  );

  const handleThreadClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default click behavior

    // Call the onThreadClick callback first to save scroll position
    if (onThreadClick) {
      onThreadClick(threadData.thread.thread_id);
    }

    // Navigate immediately using the NextJS router approach
    // The scroll option is set to false in updateQueryParams to prevent auto-scrolling
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
    <div
      key={threadData.thread.thread_id}
      onClick={handleThreadClick}
      className={cn(
        "flex flex-col sm:flex-row sm:items-center w-full p-3 sm:p-4 gap-2 sm:gap-0 cursor-pointer hover:bg-white/5 transition-all ease-in-out group",
        !isLast && "border-b border-white/5"
      )}
    >
      {/* Title and Description */}
      <div className="flex-1 overflow-hidden flex flex-col justify-center">
        <div className="flex items-center gap-2">
          <div className="w-[6px] h-[6px] rounded-full bg-blue-400 shrink-0" />
          <span className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors truncate">
            {title}
          </span>
          {threadData.invalidSchema && (
            <div className="ml-1">
              <ThreadIdCopyable
                showUUID
                threadId={threadData.thread.thread_id}
              />
            </div>
          )}
        </div>
        {hasDescriptionValue && (
          <div className="text-xs sm:text-sm text-slate-400 truncate mt-0.5">
            {descriptionPreview}
            {descriptionTruncated && "..."}
            {!firstInterrupt && threadData.invalidSchema && (
              <i>Invalid interrupt data - cannot display details.</i>
            )}
            {hasNoDescription && <span>&nbsp;</span>}
          </div>
        )}
      </div>

      {/* Status + Timestamp */}
      <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4 shrink-0">
        {firstInterrupt?.config && (
          <InboxItemStatuses config={firstInterrupt.config} />
        )}
        <p className="text-xs text-slate-500 font-light italic whitespace-nowrap">
          {updatedAtDateString}
        </p>
      </div>
    </div>
  );
};
