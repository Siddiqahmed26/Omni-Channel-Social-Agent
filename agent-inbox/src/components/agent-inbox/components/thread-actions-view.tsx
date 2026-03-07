import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  ClockIcon,
  AlertCircle,
  Loader,
} from "lucide-react";
import { ThreadData, GenericThreadData } from "../types";
import useInterruptedActions from "../hooks/use-interrupted-actions";
import { constructOpenInStudioURL } from "../utils";
import { ThreadIdCopyable } from "./thread-id";
import { InboxItemInput } from "./inbox-item-input";
import { TooltipIconButton } from "@/components/ui/assistant-ui/tooltip-icon-button";
import { motion, AnimatePresence } from "framer-motion";
import {
  STUDIO_NOT_WORKING_TROUBLESHOOTING_URL,
  VIEW_STATE_THREAD_QUERY_PARAM,
} from "../constants";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useQueryParams } from "../hooks/use-query-params";
import { useThreadsContext } from "../contexts/ThreadContext";
import { useState } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InterruptDetailsView } from "./interrupt-details-view";

import { logger } from "../utils/logger";

interface ThreadActionsViewProps<
  ThreadValues extends Record<string, any> = Record<string, any>,
> {
  threadData: ThreadData<ThreadValues>;
  isInterrupted: boolean;
  threadTitle: string;
  showState: boolean;
  showDescription: boolean;
  handleShowSidePanel?: (showState: boolean, showDescription: boolean) => void;
  setThreadData: React.Dispatch<
    React.SetStateAction<ThreadData<ThreadValues> | undefined>
  >;
}

function ButtonGroup({
  handleShowState,
  handleShowDescription,
  showingState,
  showingDescription,
}: {
  handleShowState: () => void;
  handleShowDescription: () => void;
  showingState: boolean;
  showingDescription: boolean;
}) {
  return (
    <div className="flex p-1.5 gap-1 bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-xl shadow-inner">
      <button
        onClick={handleShowState}
        className={cn(
          "relative px-4 py-1.5 text-xs font-bold transition-all duration-300 rounded-lg outline-none overflow-hidden group",
          showingState ? "text-white" : "text-slate-500 hover:text-slate-300"
        )}
      >
        {showingState && (
          <motion.div
            layoutId="tab-bg"
            className="absolute inset-0 bg-white/10 border border-white/10 rounded-lg"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <span className="relative z-10">State</span>
      </button>
      <button
        onClick={handleShowDescription}
        className={cn(
          "relative px-4 py-1.5 text-xs font-bold transition-all duration-300 rounded-lg outline-none overflow-hidden group",
          showingDescription ? "text-white" : "text-slate-500 hover:text-slate-300"
        )}
      >
        {showingDescription && (
          <motion.div
            layoutId="tab-bg"
            className="absolute inset-0 bg-white/10 border border-white/10 rounded-lg"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <span className="relative z-10">Description</span>
      </button>
    </div>
  );
}

// Helper type guard functions
function isIdleThread<T extends Record<string, any>>(
  threadData: ThreadData<T>
): threadData is GenericThreadData<T> & { status: "idle" } {
  return threadData.status === "idle";
}

function isBusyThread<T extends Record<string, any>>(
  threadData: ThreadData<T>
): threadData is GenericThreadData<T> & { status: "busy" } {
  return threadData.status === "busy";
}

function isErrorThread<T extends Record<string, any>>(
  threadData: ThreadData<T>
): threadData is GenericThreadData<T> & { status: "error" } {
  return threadData.status === "error";
}

export function ThreadActionsView<
  ThreadValues extends Record<string, any> = Record<string, any>,
>({
  threadData,
  isInterrupted: _propIsInterrupted,
  threadTitle,
  showDescription,
  showState,
  handleShowSidePanel,
  setThreadData,
}: ThreadActionsViewProps<ThreadValues>) {
  const { agentInboxes, fetchSingleThread } = useThreadsContext<ThreadValues>();
  const { toast } = useToast();
  const { updateQueryParams } = useQueryParams();
  const [refreshing, setRefreshing] = useState(false);

  // Get the selected inbox object
  const selectedInbox = agentInboxes.find((i) => i.selected);
  const deploymentUrl = selectedInbox?.deploymentUrl;

  // Only use interrupted actions for interrupted threads
  const isInterrupted =
    threadData.status === "interrupted" &&
    threadData.interrupts !== undefined &&
    threadData.interrupts.length > 0;

  // Initialize the hook outside of conditional to satisfy React rules of hooks
  const actions = useInterruptedActions<ThreadValues>({
    threadData: isInterrupted
      ? {
        thread: threadData.thread,
        status: "interrupted",
        interrupts: threadData.interrupts || [],
      }
      : null,
    setThreadData,
  });

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
      selectedInbox, // Pass the full inbox object
      threadData.thread.thread_id
    );

    if (studioUrl === "#") {
      // Handle case where URL construction failed (e.g., missing data)
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

  const handleRefreshThread = async () => {
    // Use selectedInbox here as well
    if (!selectedInbox) {
      toast({
        title: "Error",
        description: "No agent inbox selected.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    setRefreshing(true);
    try {
      toast({
        title: "Refreshing thread",
        description: "Checking for updates to the thread status...",
        duration: 3000,
      });

      // Fetch the latest thread data using the ThreadsContext
      await fetchSingleThread(threadData.thread.thread_id);

      toast({
        title: "Thread refreshed",
        description: "Thread information has been updated.",
        duration: 3000,
      });
    } catch (error) {
      logger.error("Error refreshing thread:", error);
      toast({
        title: "Error",
        description: "Failed to refresh thread information.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Use the passed handleShowSidePanel prop or update query params directly
  const updateSidePanel = (state: boolean, description: boolean) => {
    if (handleShowSidePanel) {
      handleShowSidePanel(state, description);
    } else {
      updateQueryParams("thread_state", String(state));
      updateQueryParams("thread_description", String(description));
    }
  };

  // Safely access config for determining allowed actions
  const firstInterrupt = threadData.interrupts?.[0];
  const config = firstInterrupt?.config;
  const ignoreAllowed = config?.allow_ignore ?? false;
  const acceptAllowed = config?.allow_accept ?? false;

  // Status Icon Logic
  const getStatusIcon = () => {
    if (isIdleThread(threadData)) {
      return <ClockIcon className="w-4 h-4 text-gray-500" />;
    } else if (isBusyThread(threadData)) {
      return <Loader className="w-4 h-4 text-blue-500 animate-spin" />;
    } else if (isErrorThread(threadData)) {
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
    return null;
  };

  // Handle Invalid  Interrupt Threads
  /////////////////////////////////////
  if (threadData.invalidSchema) {
    return (
      <div className="flex flex-col min-h-full w-full">
        <div className="p-4 sm:p-8 md:p-12 gap-4 sm:gap-6 md:gap-9 flex flex-col w-full">
          {/* Header (minimal) */}
          <div className="flex flex-wrap items-center justify-between w-full gap-3">
            <div className="flex items-center justify-start gap-2 flex-wrap">
              <TooltipIconButton
                tooltip="Back to inbox"
                variant="ghost"
                onClick={() => {
                  updateQueryParams(VIEW_STATE_THREAD_QUERY_PARAM);
                }}
              >
                <ArrowLeft className="w-5 h-5" />
              </TooltipIconButton>
              <div className="flex items-center gap-2">
                <p className="text-2xl tracking-tighter text-pretty text-white font-light">
                  {threadTitle}
                </p>
              </div>
              <ThreadIdCopyable threadId={threadData.thread.thread_id} />
            </div>
            {/* Right-side controls with ButtonGroup */}
            <div className="flex flex-row flex-wrap gap-2 items-center justify-start">
              {deploymentUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1 bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
                  onClick={handleOpenInStudio}
                >
                  Studio
                </Button>
              )}
              <ButtonGroup
                handleShowState={() => updateSidePanel(true, false)}
                handleShowDescription={() => updateSidePanel(false, true)}
                showingState={showState}
                showingDescription={showDescription}
              />
            </div>
          </div>

          {/* Interrupt details on the left for invalid interrupts */}
          <InterruptDetailsView threadData={threadData} />

          {/* Invalid schema message */}
          <div className="p-4 border border-yellow-200 bg-yellow-50 text-yellow-700 rounded-md w-full">
            This thread is interrupted, but the required action data is missing
            or invalid. Standard interrupt actions cannot be performed.
          </div>

          {/* You might still allow ignoring the thread */}
          <div className="flex flex-row gap-2 items-center justify-start w-full">
            <Button
              variant="outline"
              className="text-slate-300 border-white/20 font-normal bg-white/5 hover:bg-white/10 hover:text-white"
              onClick={actions?.handleIgnore} // Assuming ignore doesn't need config
              disabled={actions?.loading}
            >
              Ignore Thread
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Handle generic Non-Interrupted Threads
  ////////////////////////////////////////
  if (
    threadData.status !== "interrupted" ||
    !threadData.interrupts ||
    threadData.interrupts.length === 0
  ) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col min-h-full w-full p-6 sm:p-10 md:p-14 gap-8 md:gap-12"
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between w-full gap-5">
          <div className="flex items-center justify-start gap-4 flex-wrap">
            <button
              onClick={() => updateQueryParams(VIEW_STATE_THREAD_QUERY_PARAM)}
              className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/10 hover:scale-105 active:scale-95 transition-all text-slate-400 hover:text-white group shadow-lg"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <span className="p-1 rounded-md bg-slate-800 text-slate-400 border border-white/5">
                  {!isInterrupted && getStatusIcon()}
                </span>
                <p className="text-3xl md:text-4xl tracking-tighter text-white font-extrabold">
                  {threadTitle}
                </p>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <ThreadIdCopyable threadId={threadData.thread.thread_id} />
                <div className="w-1 h-1 rounded-full bg-slate-700" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">General Thread</span>
              </div>
            </div>
          </div>
          <div className="flex flex-row flex-wrap gap-3 items-center justify-start">
            {deploymentUrl && (
              <Button
                size="sm"
                variant="outline"
                className="h-9 px-4 bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/10"
                onClick={handleOpenInStudio}
              >
                Studio
              </Button>
            )}
            <ButtonGroup
              handleShowState={() => updateSidePanel(true, false)}
              handleShowDescription={() => updateSidePanel(false, true)}
              showingState={showState}
              showingDescription={showDescription}
            />
          </div>
        </div>

        {/* Non-interrupted thread actions */}
        <div className="flex flex-col gap-10">
          {/* Status-specific UI */}
          {(isIdleThread(threadData) || isBusyThread(threadData)) && (
            <div className="flex flex-row gap-3 items-center justify-start w-full">
              <Button
                variant="outline"
                className="h-10 px-6 rounded-xl text-slate-300 border-white/10 bg-white/[0.03] hover:bg-white/10 flex items-center gap-3 shadow-lg"
                onClick={handleRefreshThread}
                disabled={refreshing}
              >
                <RefreshCw
                  className={cn("w-4 h-4", refreshing && "animate-spin text-blue-400")}
                />
                <span className="font-bold text-xs uppercase tracking-widest">
                  {refreshing ? "Updating..." : "Check Status"}
                </span>
              </Button>
            </div>
          )}

          {isErrorThread(threadData) && (
            <div className="p-6 border border-red-500/20 bg-red-500/5 backdrop-blur-md rounded-2xl shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <AlertTriangle className="w-24 h-24 text-red-500" />
              </div>
              <div className="flex items-start gap-4 relative z-10">
                <div className="p-3 rounded-xl bg-red-500/20 text-red-500 shadow-inner">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-red-400 text-lg tracking-tight">Execution Error</h3>
                  <p className="text-sm text-red-300/80 mt-1 max-w-xl font-medium">
                    This thread encountered a critical error during processing. Check system logs for full stack trace or try restarting the process.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Thread information summary - Redesigned Card */}
          <div className="relative group max-w-4xl">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-800 to-slate-900 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative p-8 border border-white/10 rounded-3xl bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden">
              <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-48 h-48 bg-blue-500/5 blur-[80px] rounded-full" />

              <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 rounded-full bg-blue-500/50" />
                  <h3 className="text-xl font-bold text-white tracking-tight">System Metadata</h3>
                </div>
                <div className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Active Thread
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 text-sm">
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">State Marker</span>
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      threadData.status === "busy" ? "bg-blue-400 animate-pulse" :
                        threadData.status === "error" ? "bg-red-400" : "bg-emerald-400"
                    )} />
                    <span className="capitalize text-white font-bold text-base tracking-tight">{threadData.status}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Discovery</span>
                  <span className="text-slate-300 font-semibold text-[15px]">
                    {new Date(threadData.thread.thread_id ? threadData.thread.created_at : "").toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Sync Horizon</span>
                  <span className="text-slate-300 font-semibold text-[15px]">
                    {new Date(threadData.thread.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-3 pt-6 border-t border-white/5">
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Fingerprint</span>
                  <span className="font-mono text-xs text-blue-400/60 break-all bg-white/[0.02] p-3 rounded-xl border border-white/5 block">
                    {threadData.thread.thread_id}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm text-slate-500 font-medium italic max-w-lg">
            Insight: Access the &quot;State&quot; tab to inspect low-level variable values and historical transition data for this thread.
          </p>
        </div>
      </motion.div>
    );
  }

  // Handle Valid Interrupted Threads
  //////////////////////////////////////////////////////////
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col min-h-full w-full p-6 sm:p-10 md:p-14 gap-8 md:gap-12"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between w-full gap-5">
        <div className="flex items-center justify-start gap-4 flex-wrap">
          <button
            onClick={() => updateQueryParams(VIEW_STATE_THREAD_QUERY_PARAM)}
            className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/10 hover:scale-105 active:scale-95 transition-all text-slate-400 hover:text-white group shadow-lg"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <span className="p-1 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                <AlertCircle className="w-5 h-5" />
              </span>
              <p className="text-3xl md:text-4xl tracking-tighter text-white font-extrabold">
                {threadTitle}
              </p>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <ThreadIdCopyable threadId={threadData.thread.thread_id} />
              <div className="w-1 h-1 rounded-full bg-blue-500" />
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest animate-pulse">Suspended Action</span>
            </div>
          </div>
        </div>
        <div className="flex flex-row flex-wrap gap-3 items-center justify-start">
          {deploymentUrl && (
            <Button
              size="sm"
              variant="outline"
              className="h-9 px-4 bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/10"
              onClick={handleOpenInStudio}
            >
              Studio
            </Button>
          )}
          <ButtonGroup
            handleShowState={() => updateSidePanel(true, false)}
            handleShowDescription={() => updateSidePanel(false, true)}
            showingState={showState}
            showingDescription={showDescription}
          />
        </div>
      </div>

      {/* Interrupted thread actions */}
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-3 p-1 bg-white/[0.02] border border-white/5 rounded-2xl w-fit">
          <Button
            variant="premium"
            className="h-10 px-6 rounded-xl text-xs"
            onClick={actions?.handleResolve}
            disabled={actions?.loading}
          >
            Resolve Interrupt
          </Button>
          {ignoreAllowed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="h-10 px-6 rounded-xl text-xs bg-white/5 border-white/10"
                  onClick={actions?.handleIgnore}
                  disabled={actions?.loading}
                >
                  Discard
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-900 border-white/10 text-slate-300">
                End this process without resolution.
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Actions Input Area */}
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/[0.02] blur-[120px] pointer-events-none" />
          <InboxItemInput
            acceptAllowed={acceptAllowed}
            hasEdited={actions?.hasEdited ?? false}
            hasAddedResponse={actions?.hasAddedResponse ?? false}
            interruptValue={firstInterrupt!}
            humanResponse={actions?.humanResponse as any}
            initialValues={actions?.initialHumanInterruptEditValue.current || {}}
            setHumanResponse={actions?.setHumanResponse ?? (() => { })}
            streaming={actions?.streaming ?? false}
            streamFinished={actions?.streamFinished ?? false}
            currentNode={actions?.currentNode ?? ""}
            supportsMultipleMethods={actions?.supportsMultipleMethods ?? false}
            setSelectedSubmitType={actions?.setSelectedSubmitType ?? (() => { })}
            setHasAddedResponse={actions?.setHasAddedResponse ?? (() => { })}
            setHasEdited={actions?.setHasEdited ?? (() => { })}
            handleSubmit={actions?.handleSubmit ?? (async () => { })}
          />
        </div>
      </div>
    </motion.div>
  );
}
