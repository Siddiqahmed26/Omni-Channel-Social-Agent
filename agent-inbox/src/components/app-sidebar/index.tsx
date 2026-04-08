"use client";

import NextLink from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { FileText, UploadCloud, House, Brain } from "lucide-react";
import { agentInboxSvg } from "../agent-inbox/components/agent-inbox-logo";
import { SettingsPopover } from "../agent-inbox/components/settings-popover";
import { PillButton } from "../ui/pill-button";
import React from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { TooltipIconButton } from "../ui/assistant-ui/tooltip-icon-button";
import { useThreadsContext } from "../agent-inbox/contexts/ThreadContext";
import { prettifyText, isDeployedUrl } from "../agent-inbox/utils";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  AGENT_INBOX_GITHUB_README_URL,
} from "../agent-inbox/constants";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { AddAgentInboxDialog } from "../agent-inbox/components/add-agent-inbox-dialog";
import { DropdownDialogMenu } from "../agent-inbox/components/dropdown-and-dialog";
import { QuickGenerateDialog } from "../agent-inbox/components/quick-generate-dialog";
import { logout } from "@/app/actions";
import { LogOut } from "lucide-react";

export function AppSidebar() {
  const { agentInboxes, changeAgentInbox, deleteAgentInbox } =
    useThreadsContext();


  return (
    <Sidebar className="border-r border-white/5 bg-black/20 backdrop-blur-3xl">
      <SidebarContent className="flex flex-col h-screen pb-9 pt-8 px-4">
        <div className="flex items-center justify-between px-6 mb-8 group">
          <NextLink href="/" className="flex-shrink-0 transition-transform duration-500 group-hover:scale-105">
            {agentInboxSvg}
          </NextLink>
          <AppSidebarTrigger isOutside={false} className="opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <div className="px-2 mb-6">
          <QuickGenerateDialog />
        </div>

        <SidebarGroup className="flex-1 overflow-y-auto px-2">
          <SidebarGroupContent className="h-full">
            <SidebarMenu className="flex flex-col gap-4 justify-between h-full">
              <div className="flex flex-col gap-1">
                {agentInboxes.map((item, idx) => {
                  const label = item.name || prettifyText(item.graphId);
                  const isDeployed = isDeployedUrl(item.deploymentUrl);
                  return (
                    <SidebarMenuItem
                      key={`graph-id-${item.graphId}-${idx}`}
                      className="relative group/item mb-1"
                    >
                      <AnimatePresence>
                        {item.selected && (
                          <motion.div
                            layoutId="active-nav"
                            className="absolute inset-0 bg-white/5 border border-white/10 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                      </AnimatePresence>

                      <div className="relative z-10 flex items-center w-full group/btn">
                        <TooltipProvider>
                          <Tooltip delayDuration={200}>
                            <TooltipTrigger asChild>
                              <SidebarMenuButton
                                className={cn(
                                  "w-full px-4 py-6 flex items-center gap-3 transition-all duration-300 rounded-xl",
                                  item.selected
                                    ? "text-white"
                                    : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]"
                                )}
                                onClick={() => changeAgentInbox(item.id, true)}
                              >
                                <motion.div
                                  whileHover={{ scale: 1.2, rotate: 5 }}
                                  className={cn(
                                    "p-2 rounded-lg",
                                    item.selected ? "bg-purple-500/10 text-purple-400" : "bg-white/5 text-slate-500"
                                  )}
                                >
                                  {isDeployed ? (
                                    <UploadCloud className="w-4 h-4" />
                                  ) : (
                                    <House className="w-4 h-4" />
                                  )}
                                </motion.div>
                                <span className="truncate font-medium text-sm tracking-tight">
                                  {label}
                                </span>
                              </SidebarMenuButton>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              {label} • {isDeployed ? "Cloud" : "Local"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <div className="opacity-0 group-hover/btn:opacity-100 transition-opacity pr-2">
                          <DropdownDialogMenu
                            item={item}
                            deleteAgentInbox={deleteAgentInbox}
                          />
                        </div>
                      </div>
                    </SidebarMenuItem>
                  );
                })}

                <div className="mt-4 px-2">
                  <AddAgentInboxDialog hideTrigger={false} />
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-auto pt-6 border-t border-white/5 pb-2">
                <SettingsPopover />

                <NextLink href="/brain">
                  <PillButton
                    variant="outline"
                    className="w-full flex gap-3 h-12 items-center justify-center text-slate-400 border-white/5 hover:bg-white/5 hover:text-white transition-all duration-300"
                  >
                    <Brain className="w-4 h-4" />
                    <span className="text-sm font-medium">AI Style Brain</span>
                  </PillButton>
                </NextLink>

                <NextLink
                  href={AGENT_INBOX_GITHUB_README_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/doc"
                >
                  <PillButton
                    variant="outline"
                    className="w-full flex gap-3 h-12 items-center justify-center text-slate-400 border-white/5 hover:bg-white/5 hover:text-white transition-all duration-300"
                  >
                    <FileText className="w-4 h-4 group-hover/doc:rotate-3 transition-transform" />
                    <span className="text-sm font-medium">Docs</span>
                  </PillButton>
                </NextLink>

                <form action={logout}>
                  <PillButton
                    variant="outline"
                    className="w-full flex gap-3 h-12 items-center justify-center border-red-500/10 text-red-500/60 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all duration-300"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">Exit</span>
                  </PillButton>
                </form>
              </div>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

const sidebarTriggerSVG = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6 2V14M5.2 2H10.8C11.9201 2 12.4802 2 12.908 2.21799C13.2843 2.40973 13.5903 2.71569 13.782 3.09202C14 3.51984 14 4.0799 14 5.2V10.8C14 11.9201 14 12.4802 13.782 12.908C13.5903 13.2843 13.2843 13.5903 12.908 13.782C12.4802 14 11.9201 14 10.8 14H5.2C4.07989 14 3.51984 14 3.09202 13.782C2.71569 13.5903 2.40973 13.2843 2.21799 12.908C2 12.4802 2 11.9201 2 10.8V5.2C2 4.07989 2 3.51984 2.21799 3.09202C2.40973 2.71569 2.71569 2.40973 3.09202 2.21799C3.51984 2 4.0799 2 5.2 2Z"
      stroke="var(--foreground)"
      strokeWidth="1.66667"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function AppSidebarTrigger({
  isOutside,
  className,
}: {
  isOutside: boolean;
  className?: string;
}) {
  const { toggleSidebar, open } = useSidebar();

  if (isOutside && open) {
    // If this component is being rendered outside the sidebar view, then do not render if open.
    // This way we can render the trigger inside the main view when open.
    return null;
  }

  return (
    <TooltipIconButton
      tooltip="Toggle Sidebar"
      onClick={toggleSidebar}
      className={className}
    >
      {sidebarTriggerSVG}
    </TooltipIconButton>
  );
}
