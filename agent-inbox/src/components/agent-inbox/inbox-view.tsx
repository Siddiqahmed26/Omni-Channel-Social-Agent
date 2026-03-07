"use client";

import { useThreadsContext } from "@/components/agent-inbox/contexts/ThreadContext";
import { InboxItem } from "./components/inbox-item";
import React from "react";
import { useQueryParams } from "./hooks/use-query-params";
import { INBOX_PARAM, LIMIT_PARAM, OFFSET_PARAM } from "./constants";
import { ThreadStatusWithAll } from "./types";
import { Pagination } from "./components/pagination";
import { Inbox as InboxIcon, LoaderCircle } from "lucide-react";
import { InboxButtons } from "./components/inbox-buttons";
import { BackfillBanner } from "./components/backfill-banner";
import { forceInboxBackfill } from "./utils/backfill";
import { logger } from "./utils/logger";
import { motion, AnimatePresence } from "framer-motion";

interface AgentInboxViewProps<
  _ThreadValues extends Record<string, any> = Record<string, any>,
> {
  saveScrollPosition: (element?: HTMLElement | null) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function AgentInboxView<
  ThreadValues extends Record<string, any> = Record<string, any>,
>({ saveScrollPosition, containerRef }: AgentInboxViewProps<ThreadValues>) {
  const { searchParams, updateQueryParams, getSearchParam } = useQueryParams();
  const { loading, threadData, agentInboxes, clearThreadData } =
    useThreadsContext<ThreadValues>();
  const selectedInbox = (getSearchParam(INBOX_PARAM) ||
    "interrupted") as ThreadStatusWithAll;
  const scrollableContentRef = React.useRef<HTMLDivElement>(null);
  const [hasAttemptedRefresh, setHasAttemptedRefresh] = React.useState(false);

  // Check if we've already attempted a refresh for this session
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const sessionId = new Date().toDateString();
      const hasRefreshed = localStorage.getItem(`inbox-refreshed-${sessionId}`);
      setHasAttemptedRefresh(hasRefreshed === "true");
    }
  }, []);

  // Auto-refresh inbox IDs once when no threads are found
  React.useEffect(() => {
    const autoRefreshInboxes = async () => {
      if (typeof window === "undefined" || loading || threadData.length > 0 || agentInboxes.length === 0 || hasAttemptedRefresh) return;

      const sessionId = new Date().toDateString();
      const hasRefreshed = localStorage.getItem(`inbox-refreshed-${sessionId}`);

      if (hasRefreshed === "true") {
        setHasAttemptedRefresh(true);
        return;
      }

      localStorage.setItem(`inbox-refreshed-${sessionId}`, "true");
      setHasAttemptedRefresh(true);

      logger.log("Automatically refreshing inbox IDs...");
      await forceInboxBackfill();

      // Small delay before reload to ensure storage is flushed
      setTimeout(() => {
        window.location.reload();
      }, 500);
    };

    autoRefreshInboxes();
  }, [loading, threadData.length, agentInboxes.length, hasAttemptedRefresh]);

  const changeInbox = async (inbox: ThreadStatusWithAll) => {
    clearThreadData();
    updateQueryParams(
      [INBOX_PARAM, OFFSET_PARAM, LIMIT_PARAM],
      [inbox, "0", "10"]
    );
  };

  const threadDataToRender = React.useMemo(
    () =>
      threadData.filter((t: any) => {
        if (selectedInbox === "all") return true;
        return t.status === selectedInbox;
      }),
    [selectedInbox, threadData]
  );
  const noThreadsFound = !threadDataToRender.length;

  const handleThreadClick = () => {
    if (
      scrollableContentRef.current &&
      scrollableContentRef.current.scrollTop > 0
    ) {
      saveScrollPosition(scrollableContentRef.current);
    } else if (containerRef.current && containerRef.current.scrollTop > 0) {
      saveScrollPosition(containerRef.current);
    } else if (window.scrollY > 0) {
      saveScrollPosition();
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full overflow-y-auto bg-transparent flex flex-col">
      <div className="px-6 pt-6 pb-2">
        <BackfillBanner />
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Agent Inboxes</h1>
            <p className="text-slate-500 text-sm mt-1 font-medium italic">Manage and respond to cross-platform messages in real-time.</p>
          </div>
        </div>
        <InboxButtons changeInbox={changeInbox} />
      </div>

      <div
        ref={scrollableContentRef}
        className="flex-1 flex flex-col items-start w-full px-6 py-4 overflow-y-auto no-scrollbar scroll-smooth"
      >
        <AnimatePresence mode="wait">
          {!loading && !noThreadsFound ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="w-full"
            >
              {threadDataToRender.map((thread: any, idx) => (
                <motion.div key={thread.thread.thread_id} variants={itemVariants}>
                  <InboxItem<ThreadValues>
                    threadData={thread}
                    isLast={idx === threadDataToRender.length - 1}
                    onThreadClick={handleThreadClick}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : noThreadsFound && !loading ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full flex-1 flex flex-col items-center justify-center p-12 min-h-[400px]"
            >
              <div className="relative group">
                <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full group-hover:bg-purple-500/20 transition-colors" />
                <div className="relative p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-2xl">
                  <InboxIcon className="w-16 h-16 text-slate-700 opacity-50 mb-4 mx-auto group-hover:text-blue-400 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500" />
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-white mb-2">Inbox is clear!</h3>
                    <p className="text-slate-500 max-w-[240px] text-sm leading-relaxed px-2">
                      No threads found in <span className="text-blue-400 font-bold capitalize">{selectedInbox}</span>.
                      Time to relax or switch filters.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-12 min-h-[400px]">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <LoaderCircle className="w-12 h-12 animate-spin text-blue-500" />
                  <div className="absolute inset-0 bg-blue-500/10 blur-xl animate-pulse" />
                </div>
                <p className="text-slate-400 font-bold tracking-widest uppercase text-[10px] animate-pulse">Syncing Threads...</p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex justify-start w-full px-6 py-8 border-t border-white/5 bg-black/10 backdrop-blur-sm">
        <Pagination />
      </div>
    </div>
  );
}
