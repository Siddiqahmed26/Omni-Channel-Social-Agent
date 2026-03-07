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

export function GenericInboxItem<
  ThreadValues extends Record<string, any> = Record<string, any>,
>({ threadData, isLast }: GenericInboxItemProps<ThreadValues>) {
  const { updateQueryParams } = useQueryParams();
  const { toast } = useToast();
  const { agentInboxes } = useThreadsContext();

  const selectedInbox = agentInboxes.find((i) => i.selected);

  const handleOpenInStudio = () => {
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
    "MM/dd h:mm a"
  );

  return (
    <div
      onClick={() =>
        updateQueryParams(
          VIEW_STATE_THREAD_QUERY_PARAM,
          threadData.thread.thread_id
        )
      }
      className={cn(
        "flex flex-col sm:flex-row sm:items-center w-full p-3 sm:p-4 gap-2 sm:gap-0 cursor-pointer hover:bg-white/5 transition-all ease-in-out group",
        !isLast && "border-b border-white/5"
      )}
    >
      {/* Thread ID */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-medium text-slate-400 group-hover:text-slate-300 shrink-0">Thread:</p>
        <ThreadIdCopyable showUUID threadId={threadData.thread.thread_id} />
      </div>

      {/* Bottom row on mobile: studio button + status + date */}
      <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4 shrink-0">
        {selectedInbox && (
          <Button
            size="sm"
            variant="outline"
            className="flex items-center gap-1 bg-white/5 border-white/10 text-xs text-slate-300 hover:bg-white/10 hover:text-white h-7 px-2"
            onClick={handleOpenInStudio}
          >
            Studio
          </Button>
        )}
        <InboxItemStatuses status={threadData.status} />
        <p className="text-right text-xs text-slate-500 font-light italic whitespace-nowrap">
          {updatedAtDateString}
        </p>
      </div>
    </div>
  );
}
