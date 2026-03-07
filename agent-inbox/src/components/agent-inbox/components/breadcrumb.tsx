"use client";

import NextLink from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { useQueryParams } from "../hooks/use-query-params";
import {
  AGENT_INBOX_PARAM,
  IMPROPER_SCHEMA,
  INBOX_PARAM,
  VIEW_STATE_THREAD_QUERY_PARAM,
} from "../constants";
import { HumanInterrupt, ThreadStatusWithAll } from "../types";
import { prettifyText } from "../utils";
import { useThreadsContext } from "../contexts/ThreadContext";
import React from "react";
import { logger } from "../utils/logger";

export function BreadCrumb({ className }: { className?: string }) {
  const { searchParams } = useQueryParams();
  const { threadData, agentInboxes } = useThreadsContext();
  const [agentInboxLabel, setAgentInboxLabel] = React.useState<string>();
  const [selectedInboxLabel, setSelectedInboxLabel] = React.useState<string>();
  const [selectedThreadActionLabel, setSelectedThreadActionLabel] =
    React.useState<string>();

  React.useEffect(() => {
    try {
      const selectedAgentInbox = agentInboxes.find((a) => a.selected);
      if (selectedAgentInbox) {
        const selectedAgentInboxLabel =
          selectedAgentInbox.name || prettifyText(selectedAgentInbox.graphId);
        setAgentInboxLabel(selectedAgentInboxLabel);
      } else {
        setAgentInboxLabel(undefined);
      }

      const selectedInboxParam = searchParams.get(INBOX_PARAM) as
        | ThreadStatusWithAll
        | undefined;
      if (selectedInboxParam) {
        setSelectedInboxLabel(prettifyText(selectedInboxParam));
      } else {
        setSelectedInboxLabel(undefined);
      }

      const selectedThreadIdParam = searchParams.get(
        VIEW_STATE_THREAD_QUERY_PARAM
      );
      const selectedThread = threadData.find(
        (t) => t.thread.thread_id === selectedThreadIdParam
      );
      const selectedThreadAction = (
        selectedThread?.interrupts as HumanInterrupt[] | undefined
      )?.[0]?.action_request?.action;
      if (selectedThreadAction) {
        if (selectedThreadAction === IMPROPER_SCHEMA) {
          setSelectedThreadActionLabel("Interrupt");
        } else {
          setSelectedThreadActionLabel(prettifyText(selectedThreadAction));
        }
      } else {
        setSelectedThreadActionLabel(undefined);
      }
    } catch (e) {
      logger.error("Error while updating breadcrumb", e);
    }
  }, [searchParams, agentInboxes, threadData]);

  const constructBaseUrl = () => {
    const selectedAgentInbox = agentInboxes.find((a) => a.selected);
    if (!selectedAgentInbox) {
      return "/";
    }
    return `/?${AGENT_INBOX_PARAM}=${selectedAgentInbox.id}`;
  };

  const constructInboxLink = () => {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete(VIEW_STATE_THREAD_QUERY_PARAM);
    return `${currentUrl.pathname}${currentUrl.search}`;
  };

  if (!agentInboxLabel) {
    return (
      <div
        className={cn(
          "flex items-center justify-start gap-2 text-gray-500 text-sm h-[34px]",
          className
        )}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-start gap-1 text-slate-500",
        className
      )}
    >
      <NextLink href={constructBaseUrl()} className="group">
        <span className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 group-hover:text-white transition-colors">
          {agentInboxLabel}
        </span>
      </NextLink>

      {selectedInboxLabel && (
        <>
          <ChevronRight className="h-3 w-3 text-slate-700 mx-1" />
          <NextLink href={constructInboxLink()} className="group">
            <span className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 group-hover:text-blue-400 transition-colors">
              {selectedInboxLabel}
            </span>
          </NextLink>
        </>
      )}
      {selectedThreadActionLabel && (
        <>
          <ChevronRight className="h-4 w-4 text-blue-500/50 mx-1" />
          <NextLink href={window.location.pathname + window.location.search} className="group">
            <span className="text-sm font-extrabold tracking-tight text-white group-hover:text-blue-400 transition-colors">
              {selectedThreadActionLabel}
            </span>
          </NextLink>
        </>
      )}
    </div>
  );
}
