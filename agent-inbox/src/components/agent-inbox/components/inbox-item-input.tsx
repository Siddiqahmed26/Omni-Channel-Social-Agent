"use client";

import { cn } from "@/lib/utils";
import {
  ActionRequest,
  HumanInterrupt,
  HumanResponseWithEdits,
  SubmitType,
} from "../types";
import { Textarea } from "@/components/ui/textarea";
import React from "react";
import { haveArgsChanged, prettifyText } from "../utils";
import { MarkdownText } from "@/components/ui/markdown-text";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { CircleX, LoaderCircle, Undo2, Send, CheckCircle2, Edit3, MessageSquarePlus, Sparkles, Brain } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { logger } from "../utils/logger";

function ResetButton({ handleReset }: { handleReset: () => void }) {
  return (
    <button
      onClick={handleReset}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all active:scale-95 group"
    >
      <Undo2 className="w-3 h-3 group-hover:-rotate-45 transition-transform" />
      <span>Reset Alterations</span>
    </button>
  );
}

function ArgsRenderer({ args }: { args: Record<string, any> }) {
  return (
    <div className="grid grid-cols-1 gap-4 w-full">
      {Object.entries(args).map(([k, v]) => {
        let value = "";
        if (["string", "number"].includes(typeof v)) {
          value = v as string;
        } else {
          value = JSON.stringify(v, null);
        }

        return (
          <div key={`args-${k}`} className="flex flex-col gap-2 group/arg">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover/arg:text-blue-400 transition-colors">
              {prettifyText(k)}
            </p>
            <div className="relative group/val">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-hover/val:opacity-100 transition duration-500" />
              <div className="relative text-[13px] leading-[1.6] text-slate-300 bg-white/[0.03] border border-white/5 rounded-2xl p-4 w-full backdrop-blur-sm shadow-inner overflow-hidden">
                <MarkdownText className="text-wrap break-all break-words whitespace-pre-wrap">
                  {value}
                </MarkdownText>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface InboxItemInputProps {
  interruptValue: HumanInterrupt;
  humanResponse: HumanResponseWithEdits[];
  supportsMultipleMethods: boolean;
  acceptAllowed: boolean;
  hasEdited: boolean;
  hasAddedResponse: boolean;
  initialValues: Record<string, string>;

  streaming: boolean;
  streamFinished: boolean;
  currentNode: string;

  setHumanResponse: React.Dispatch<
    React.SetStateAction<HumanResponseWithEdits[]>
  >;
  setSelectedSubmitType: React.Dispatch<
    React.SetStateAction<SubmitType | undefined>
  >;
  setHasAddedResponse: React.Dispatch<React.SetStateAction<boolean>>;
  setHasEdited: React.Dispatch<React.SetStateAction<boolean>>;

  handleSubmit: (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent> | React.KeyboardEvent
  ) => Promise<void>;
}

function ResponseComponent({
  humanResponse,
  streaming,
  showArgsInResponse,
  interruptValue,
  onResponseChange,
  handleSubmit,
}: {
  humanResponse: HumanResponseWithEdits[];
  streaming: boolean;
  showArgsInResponse: boolean;
  interruptValue: HumanInterrupt;
  onResponseChange: (change: string, response: HumanResponseWithEdits) => void;
  handleSubmit: (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent> | React.KeyboardEvent
  ) => Promise<void>;
}) {
  const res = humanResponse.find((r) => r.type === "response");
  if (!res || typeof res.args !== "string") {
    return null;
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6 p-6 sm:p-8 items-start w-full rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-2xl relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
        <MessageSquarePlus className="w-32 h-32 text-white" />
      </div>

      <div className="flex items-center justify-between w-full relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/10">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-white text-lg tracking-tight">Personality Feedback & Training</h3>
        </div>
        <ResetButton
          handleReset={() => {
            onResponseChange("", res);
          }}
        />
      </div>

      {showArgsInResponse && interruptValue?.action_request?.args && (
        <div className="w-full bg-black/20 p-6 rounded-2xl border border-white/5">
          <ArgsRenderer args={interruptValue.action_request.args} />
        </div>
      )}

      <div className="flex flex-col gap-3 items-start w-full relative z-10">
        <div className="flex items-center justify-between w-full ml-1">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Personality Training Input</label>
          <span className="text-[9px] font-bold text-blue-400/60 uppercase tracking-widest flex items-center gap-1">
            <Brain className="w-3 h-3" />
            Agent learns from this
          </span>
        </div>
        <div className="relative w-full group/input">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-2xl blur opacity-0 group-focus-within/input:opacity-100 transition duration-700" />
          <Textarea
            disabled={streaming}
            value={res.args}
            onChange={(e) => onResponseChange(e.target.value, res)}
            onKeyDown={handleKeyDown}
            rows={5}
            className="relative z-10 bg-black/40 border-white/10 rounded-2xl p-5 text-slate-200 placeholder:text-slate-600 focus:bg-black/60 transition-all font-medium text-[15px] resize-none"
            placeholder="Tell the agent how to improve (e.g. 'Use more professional tone', 'Add 2 emojis', 'Make it shorter')..."
          />
        </div>
      </div>

      <div className="flex items-center justify-end w-full gap-4 relative z-10 pt-2">
        <Button
          variant="premium"
          disabled={streaming}
          onClick={handleSubmit}
          className="h-[44px] md:h-12 px-6 md:px-8 rounded-xl shadow-[0_10px_30px_rgba(59,130,246,0.3)] hover:shadow-[0_15px_40px_rgba(59,130,246,0.4)] transition-all active:scale-95 font-bold text-xs uppercase tracking-widest"
        >
          <Brain className="w-4 h-4 mr-2" />
          Send Feedback & Train AI
        </Button>
      </div>
    </motion.div>
  );
}
const Response = React.memo(ResponseComponent);

function AcceptComponent({
  streaming,
  actionRequestArgs,
  handleSubmit,
}: {
  streaming: boolean;
  actionRequestArgs: Record<string, any>;
  handleSubmit: (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent> | React.KeyboardEvent
  ) => Promise<void>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col gap-8 items-start w-full p-6 sm:p-10 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-2xl"
    >
      <div className="flex items-center gap-4 border-b border-white/5 pb-6 w-full">
        <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-black text-white tracking-tight">Automated Validation</h3>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Ready for signature</p>
        </div>
      </div>

      {actionRequestArgs && Object.keys(actionRequestArgs).length > 0 && (
        <div className="w-full bg-black/20 p-6 rounded-2xl border border-white/5 inner-shadow">
          <ArgsRenderer args={actionRequestArgs} />
        </div>
      )}

      <Button
        variant="premium"
        disabled={streaming}
        onClick={handleSubmit}
        className="w-full h-[54px] md:h-14 rounded-2xl text-base font-bold shadow-[0_15px_35px_rgba(59,130,246,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500"
      >
        Authorize & Proceeed
      </Button>
    </motion.div>
  );
}

function EditAndOrAcceptComponent({
  humanResponse,
  streaming,
  initialValues,
  onEditChange,
  handleSubmit,
  interruptValue,
}: {
  humanResponse: HumanResponseWithEdits[];
  streaming: boolean;
  initialValues: Record<string, string>;
  interruptValue: HumanInterrupt;
  onEditChange: (
    text: string | string[],
    response: HumanResponseWithEdits,
    key: string | string[]
  ) => void;
  handleSubmit: (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent> | React.KeyboardEvent
  ) => Promise<void>;
}) {
  const defaultRows = React.useRef<Record<string, number>>({});
  const editResponse = humanResponse.find((r) => r.type === "edit");
  const acceptResponse = humanResponse.find((r) => r.type === "accept");
  if (
    !editResponse ||
    typeof editResponse.args !== "object" ||
    !editResponse.args
  ) {
    if (acceptResponse) {
      return (
        <AcceptComponent
          actionRequestArgs={interruptValue?.action_request?.args || {}}
          streaming={streaming}
          handleSubmit={handleSubmit}
        />
      );
    }
    return null;
  }
  const header = editResponse.acceptAllowed ? "Review & Adjust" : "Manual Override";
  let buttonText = "Submit Changes";
  if (editResponse.acceptAllowed && !editResponse.editsMade) {
    buttonText = "Authorize As Is";
  }

  const handleReset = () => {
    if (
      !editResponse ||
      typeof editResponse.args !== "object" ||
      !editResponse.args ||
      !editResponse.args.args
    ) {
      return;
    }
    const keysToReset: string[] = [];
    const valuesToReset: string[] = [];
    Object.entries(initialValues).forEach(([k, v]) => {
      if (k in (editResponse.args as Record<string, any>).args) {
        const value = ["string", "number"].includes(typeof v)
          ? v
          : JSON.stringify(v, null);
        keysToReset.push(k);
        valuesToReset.push(value);
      }
    });

    if (keysToReset.length > 0 && valuesToReset.length > 0) {
      onEditChange(valuesToReset, editResponse, keysToReset);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-10 items-start w-full p-6 sm:p-10 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-2xl relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
        <Edit3 className="w-40 h-40 text-white" />
      </div>

      <div className="flex items-center justify-between w-full relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-500 border border-amber-500/10">
            <Edit3 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white tracking-tight">{header}</h3>
            <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest mt-1">Direct Manipulation Protocol</p>
          </div>
        </div>
        <ResetButton handleReset={handleReset} />
      </div>

      <div className="grid grid-cols-1 gap-12 w-full relative z-10">
        {Object.entries(editResponse.args.args).map(([k, v], idx) => {
          const value = ["string", "number"].includes(typeof v)
            ? v
            : JSON.stringify(v, null);
          if (defaultRows.current[k] === undefined) {
            defaultRows.current[k] = !v.length ? 4 : Math.max(v.length / 40, 6);
          }
          const numRows = defaultRows.current[k] || 6;

          return (
            <div
              className="flex flex-col gap-4 items-start w-full group/field"
              key={`allow-edit-args--${k}-${idx}`}
            >
              <p className="text-[11px] font-black uppercase tracking-[2.5px] text-slate-500 group-hover/field:text-blue-400 transition-colors ml-1">
                {prettifyText(k)}
              </p>
              <div className="relative w-full group/input">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-2xl blur opacity-0 group-focus-within/input:opacity-100 transition duration-700" />
                <Textarea
                  disabled={streaming}
                  className="relative z-10 bg-black/40 border-white/10 rounded-2xl p-6 text-slate-200 placeholder:text-slate-600 focus:bg-black/60 transition-all font-medium text-base resize-none shadow-2xl"
                  value={value}
                  onChange={(e) => onEditChange(e.target.value, editResponse, k)}
                  onKeyDown={handleKeyDown}
                  rows={numRows}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-end w-full gap-4 relative z-10 pt-4">
        <Button
          variant="premium"
          disabled={streaming}
          onClick={handleSubmit}
          className="h-14 px-12 rounded-2xl text-base font-bold shadow-[0_20px_40px_rgba(59,130,246,0.3)] hover:scale-[1.02] active:scale-[0.98]"
        >
          {buttonText}
        </Button>
      </div>
    </motion.div>
  );
}
const EditAndOrAccept = React.memo(EditAndOrAcceptComponent);

export function InboxItemInput({
  interruptValue,
  humanResponse,
  streaming,
  streamFinished,
  currentNode,
  supportsMultipleMethods,
  acceptAllowed,
  hasEdited,
  hasAddedResponse,
  initialValues,
  setHumanResponse,
  setSelectedSubmitType,
  setHasEdited,
  setHasAddedResponse,
  handleSubmit,
}: InboxItemInputProps) {
  const { toast } = useToast();
  const isEditAllowed = interruptValue?.config?.allow_edit ?? false;
  const isResponseAllowed = interruptValue?.config?.allow_respond ?? false;
  const hasArgs =
    Object.entries(interruptValue?.action_request?.args || {}).length > 0;
  const showArgsInResponse =
    hasArgs && !isEditAllowed && !acceptAllowed && isResponseAllowed;
  const showArgsOutsideActionCards =
    hasArgs && !showArgsInResponse && !isEditAllowed && !acceptAllowed;
  const isError = currentNode === "__error__";

  const onEditChange = (
    change: string | string[],
    response: HumanResponseWithEdits,
    key: string | string[]
  ) => {
    if (
      (Array.isArray(change) && !Array.isArray(key)) ||
      (!Array.isArray(change) && Array.isArray(key))
    ) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
      return;
    }

    let valuesChanged = true;
    if (typeof response.args === "object") {
      const updatedArgs = { ...(response.args?.args || {}) };

      if (Array.isArray(change) && Array.isArray(key)) {
        // Handle array inputs by mapping corresponding values
        change.forEach((value, index) => {
          if (index < key.length) {
            updatedArgs[key[index]] = value;
          }
        });
      } else {
        // Handle single value case
        updatedArgs[key as string] = change as string;
      }

      const haveValuesChanged = haveArgsChanged(updatedArgs, initialValues);
      valuesChanged = haveValuesChanged;
    }

    if (!valuesChanged) {
      setHasEdited(false);
      if (acceptAllowed) {
        setSelectedSubmitType("accept");
      } else if (hasAddedResponse) {
        setSelectedSubmitType("response");
      }
    } else {
      setSelectedSubmitType("edit");
      setHasEdited(true);
    }

    setHumanResponse((prev) => {
      if (typeof response.args !== "object" || !response.args) {
        logger.error(
          "Mismatched response type",
          !!response.args,
          typeof response.args
        );
        return prev;
      }

      const newEdit: HumanResponseWithEdits = {
        type: response.type,
        args: {
          action: response.args.action,
          args:
            Array.isArray(change) && Array.isArray(key)
              ? {
                ...response.args.args,
                ...Object.fromEntries(key.map((k, i) => [k, change[i]])),
              }
              : {
                ...response.args.args,
                [key as string]: change as string,
              },
        },
      };
      if (
        prev.find(
          (p) =>
            p.type === response.type &&
            typeof p.args === "object" &&
            p.args?.action === (response.args as ActionRequest).action
        )
      ) {
        return prev.map((p) => {
          if (
            p.type === response.type &&
            typeof p.args === "object" &&
            p.args?.action === (response.args as ActionRequest).action
          ) {
            if (p.acceptAllowed) {
              return {
                ...newEdit,
                acceptAllowed: true,
                editsMade: valuesChanged,
              };
            }

            return newEdit;
          }
          return p;
        });
      } else {
        throw new Error("No matching response found");
      }
    });
  };

  const onResponseChange = (
    change: string,
    response: HumanResponseWithEdits
  ) => {
    if (!change) {
      setHasAddedResponse(false);
      if (hasEdited) {
        // The user has deleted their response, so we should set the submit type to
        // `edit` if they've edited, or `accept` if it's allowed and they have not edited.
        setSelectedSubmitType("edit");
      } else if (acceptAllowed) {
        setSelectedSubmitType("accept");
      }
    } else {
      setSelectedSubmitType("response");
      setHasAddedResponse(true);
    }

    setHumanResponse((prev) => {
      const newResponse: HumanResponseWithEdits = {
        type: response.type,
        args: change,
      };

      if (prev.find((p) => p.type === response.type)) {
        return prev.map((p) => {
          if (p.type === response.type) {
            if (p.acceptAllowed) {
              return {
                ...newResponse,
                acceptAllowed: true,
                editsMade: !!change,
              };
            }
            return newResponse;
          }
          return p;
        });
      } else {
        throw new Error("No human response found for string response");
      }
    });
  };

  return (
    <div
      className={cn(
        "w-full flex flex-col items-start justify-start gap-2 shadow-sm",
        ""
      )}
    >
      {showArgsOutsideActionCards && interruptValue?.action_request?.args && (
        <ArgsRenderer args={interruptValue.action_request.args} />
      )}

      <div className="flex flex-col gap-2 items-start w-full">
        <EditAndOrAccept
          humanResponse={humanResponse}
          streaming={streaming}
          initialValues={initialValues}
          interruptValue={interruptValue}
          onEditChange={onEditChange}
          handleSubmit={handleSubmit}
        />
        {supportsMultipleMethods ? (
          <div className="flex gap-4 items-center w-full px-6 py-4">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10" />
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Alternative Protocol Selection</p>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10" />
          </div>
        ) : null}
        {isResponseAllowed && (
          <Response
            humanResponse={humanResponse}
            streaming={streaming}
            showArgsInResponse={showArgsInResponse}
            interruptValue={interruptValue}
            onResponseChange={onResponseChange}
            handleSubmit={handleSubmit}
          />
        )}
        {streaming && !currentNode && (
          <p className="text-sm text-gray-600">Waiting for Graph to start...</p>
        )}
        {streaming && currentNode && !isError && (
          <div className="flex gap-2">
            <span className="text-sm text-gray-600 flex items-center justify-start gap-1">
              <p>Running</p>
              <LoaderCircle className="w-3 h-3 animate-spin" />
            </span>
            <p className="text-black text-sm font-mono">
              <span className="font-sans text-gray-700">Node: </span>
              {prettifyText(currentNode)}
            </p>
          </div>
        )}
        {streaming && currentNode && isError && (
          <div className="text-sm text-red-500 flex items-center justify-start gap-1">
            <p>Error occurred</p>
            <CircleX className="w-3 h-3 text-red-500" />
          </div>
        )}
        {streamFinished && (
          <p className="text-base text-green-600 font-medium">
            Successfully finished Graph invocation.
          </p>
        )}
      </div>
    </div>
  );
}
