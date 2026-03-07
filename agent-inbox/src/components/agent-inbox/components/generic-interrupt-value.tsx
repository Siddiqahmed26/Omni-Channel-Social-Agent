import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ThreadIdCopyable } from "./thread-id";

// Helper to check for complex types (Array or Object)
function isComplexValue(value: any): boolean {
  return Array.isArray(value) || (typeof value === "object" && value !== null);
}

// Helper to truncate long strings
const truncateString = (str: string, maxLength: number = 100): string => {
  return str.length > maxLength ? str.substring(0, maxLength) + "..." : str;
};

// Helper to render simple values or truncated complex values for the collapsed view
const renderCollapsedValue = (
  value: any,
  isComplex: boolean
): React.ReactNode => {
  if (value === null) {
    return <span className="text-slate-500 italic font-medium">null</span>;
  }
  if (typeof value === "boolean") {
    return <span className="text-sky-400 font-bold">{String(value)}</span>;
  }
  if (typeof value === "number") {
    return <span className="text-emerald-400 font-bold">{String(value)}</span>;
  }
  if (typeof value === "string") {
    return (
      <span className="text-indigo-300 font-medium">
        &quot;{truncateString(value)}&quot;
      </span>
    );
  }
  if (isComplex) {
    try {
      let previewValue: any;
      if (Array.isArray(value)) {
        previewValue = value.slice(0, 3);
        if (value.length > 3) previewValue.push("...");
      } else {
        const keys = Object.keys(value);
        previewValue = {};
        keys.slice(0, 3).forEach((key) => {
          previewValue[key] = value[key];
        });
        if (keys.length > 3) previewValue["..."] = "...";
      }
      const strValue = JSON.stringify(previewValue, null, 2);
      return (
        <code className="rounded-xl bg-black/40 border border-white/5 px-3 py-2 font-mono text-xs text-blue-300/80 whitespace-pre-wrap block shadow-inner">
          {truncateString(strValue, 200)}
        </code>
      );
    } catch (_) {
      return <span className="text-red-400">Error creating preview</span>;
    }
  }
  return String(value);
};

const renderTableCellValue = (value: any): React.ReactNode => {
  if (isComplexValue(value)) {
    try {
      return (
        <code className="rounded-xl bg-black/30 border border-white/5 px-3 py-2 font-mono text-xs text-blue-300/80 whitespace-pre-wrap block shadow-inner">
          {JSON.stringify(value, null, 2)}
        </code>
      );
    } catch (_) {
      return <span className="text-red-400">Error stringifying</span>;
    }
  }
  return renderCollapsedValue(value, false);
};

export function GenericInterruptValue({
  interrupt,
  id,
}: {
  interrupt: unknown;
  id: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const complex = isComplexValue(interrupt);

  // Determine if the expand button should be shown (only for complex types)
  let shouldShowExpandButton = false;
  if (complex) {
    try {
      const numEntries = Array.isArray(interrupt)
        ? interrupt.length
        : typeof interrupt === "object" && interrupt !== null
          ? Object.keys(interrupt).length
          : 0; // Default to 0 if not array or object
      // Show expand if more than 3 entries (as preview shows 3) or if it's non-empty
      shouldShowExpandButton = numEntries > 3;
      // Alternative: check string length if preferred
      // const contentStr = JSON.stringify(interrupt);
      // shouldShowExpandButton = contentStr.length > 200;
    } catch (_) {
      shouldShowExpandButton = false; // Don't show button if error
    }
  }

  // Process entries for table view
  const processEntries = () => {
    if (Array.isArray(interrupt)) {
      return interrupt.map((item, index) => [index.toString(), item]);
    } else if (typeof interrupt === "object" && interrupt !== null) {
      return Object.entries(interrupt);
    }
    return [];
  };

  const displayEntries = complex ? processEntries() : [];

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] shadow-2xl backdrop-blur-md transition-all duration-500 hover:border-white/20">
      {/* Header */}
      <div className="border-b border-white/5 bg-black/20 px-5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-extrabold text-white flex flex-wrap items-center gap-2 uppercase tracking-widest">
            <span className="w-1.5 h-4 bg-blue-500 rounded-full mr-1" />
            Node Payload <ThreadIdCopyable showUUID threadId={id} />
          </h3>
          {complex && shouldShowExpandButton && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-500 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-all active:scale-95 shadow-lg border border-transparent hover:border-white/10"
              aria-label={isExpanded ? "Collapse details" : "Expand details"}
            >
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          )}
        </div>
      </div>

      {/* Body Content */}
      <motion.div
        className="bg-transparent"
        initial={false}
        animate={{ height: "auto" }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {(() => {
            const showTable = complex && (!shouldShowExpandButton || isExpanded);
            const showCollapsedPreview = complex && shouldShowExpandButton && !isExpanded;
            const showSimpleValue = !complex;

            return (
              <motion.div
                key={showTable ? "table" : "preview"}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                {showSimpleValue && (
                  <div className="px-6 py-4 text-sm font-medium">
                    {renderCollapsedValue(interrupt, false)}
                  </div>
                )}
                {showCollapsedPreview && (
                  <div className="px-6 py-4 text-sm">
                    {renderCollapsedValue(interrupt, true)}
                  </div>
                )}
                {showTable && (
                  <div
                    className="overflow-x-auto no-scrollbar"
                    style={{ maxHeight: "600px" }}
                  >
                    <table className="min-w-full divide-y divide-white/5">
                      <thead className="bg-black/40 sticky top-0 z-10">
                        <tr>
                          <th className="px-6 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                            {Array.isArray(interrupt) ? "Index" : "Property"}
                          </th>
                          <th className="px-6 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                            Value Context
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 bg-transparent">
                        {displayEntries.length === 0 && (
                          <tr>
                            <td
                              colSpan={2}
                              className="px-6 py-10 text-center text-sm text-slate-500 font-medium italic"
                            >
                              {Array.isArray(interrupt)
                                ? "Collection is empty"
                                : "No properties defined"}
                            </td>
                          </tr>
                        )}
                        {displayEntries.map(([key, value]) => (
                          <tr key={key} className="group/row hover:bg-white/[0.02] transition-colors">
                            <td className="px-6 py-4 text-xs font-bold whitespace-nowrap text-slate-400 align-top group-hover/row:text-blue-400 transition-colors">
                              {key}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-300 align-top">
                              {renderTableCellValue(value)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
