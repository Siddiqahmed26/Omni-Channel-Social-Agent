"use client";

import { useQueryParams } from "../hooks/use-query-params";
import { Layers, Loader, TriangleAlert, ZapOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { INBOX_PARAM } from "../constants";
import { ThreadStatusWithAll } from "../types";
import { motion, AnimatePresence } from "framer-motion";

const idleInboxesSVG = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="transition-transform group-hover:rotate-12 duration-300"
  >
    <path
      d="M16.5 17H21.5L16.5 22H21.5M21.9506 13C21.9833 12.6711 22 12.3375 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C12.1677 22 12.3344 21.9959 12.5 21.9877C12.6678 21.9795 12.8345 21.9671 13 21.9506M12 6V12L15.7384 13.8692"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const INBOX_ICON_MAP = {
  all: <Layers className="w-5 h-5 transition-transform group-hover:scale-110" />,
  interrupted: <ZapOff className="w-5 h-5 transition-transform group-hover:scale-110" />,
  idle: idleInboxesSVG,
  busy: <Loader className="w-5 h-5 animate-spin-slow" />,
  error: <TriangleAlert className="w-5 h-5 transition-transform group-hover:shake" />,
};

function InboxButton({
  label,
  selectedInbox,
  onClick,
}: {
  label: string;
  selectedInbox: string;
  onClick: () => void;
}) {
  const isSelected = selectedInbox === label.toLowerCase();

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative px-6 py-2.5 text-sm md:text-[15px] font-semibold transition-all duration-500 rounded-full group outline-none",
        isSelected ? "text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]" : "text-slate-500 hover:text-slate-300"
      )}
    >
      {isSelected && (
        <motion.div
          layoutId="active-pill"
          className="absolute inset-0 bg-gradient-to-r from-purple-600/80 to-blue-600/80 border border-white/20 rounded-full"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      <div className="relative z-10 flex items-center gap-2.5">
        <span className={cn(
          "transition-colors duration-300",
          isSelected ? "text-white" : "text-slate-500 group-hover:text-slate-300"
        )}>
          {INBOX_ICON_MAP[label.toLowerCase() as keyof typeof INBOX_ICON_MAP]}
        </span>
        <span className="tracking-tight">{label}</span>
      </div>
    </button>
  );
}

export function InboxButtons({
  changeInbox,
}: {
  changeInbox: (inbox: ThreadStatusWithAll) => void;
}) {
  const { searchParams } = useQueryParams();
  const selectedInbox = searchParams.get(INBOX_PARAM) || "interrupted";

  return (
    <div className="flex w-full p-1.5 gap-1 items-center justify-start overflow-x-auto no-scrollbar bg-white/[0.03] backdrop-blur-md border border-white/5 rounded-full max-w-fit shadow-inner shadow-black/20">
      <InboxButton
        label="All"
        selectedInbox={selectedInbox}
        onClick={() => changeInbox("all")}
      />
      <InboxButton
        label="Interrupted"
        selectedInbox={selectedInbox}
        onClick={() => changeInbox("interrupted")}
      />
      <InboxButton
        label="Idle"
        selectedInbox={selectedInbox}
        onClick={() => changeInbox("idle")}
      />
      <InboxButton
        label="Busy"
        selectedInbox={selectedInbox}
        onClick={() => changeInbox("busy")}
      />
      <InboxButton
        label="Error"
        selectedInbox={selectedInbox}
        onClick={() => changeInbox("error")}
      />
    </div>
  );
}
