"use client";

import { ThreadsProvider } from "@/components/agent-inbox/contexts/ThreadContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar, AppSidebarTrigger } from "@/components/app-sidebar";
import { BreadCrumb } from "@/components/agent-inbox/components/breadcrumb";
import { cn } from "@/lib/utils";
import React from "react";
import { MobileHeader } from "@/components/mobile-header";
import { motion, AnimatePresence } from "framer-motion";

export default function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ThreadsProvider>
            <SidebarProvider>
                <div className="relative flex flex-col w-full min-h-screen overflow-hidden bg-[#030303] text-slate-200 selection:bg-purple-500/30">
                    {/* Dynamic Parallax Background - Toned down on mobile */}
                    <div className="fixed inset-0 overflow-hidden pointer-events-none">
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.1, 0.2, 0.1],
                                x: [0, 40, 0],
                                y: [0, 20, 0]
                            }}
                            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                            className="absolute top-[-20%] left-[-10%] w-[100%] md:w-[80%] h-[100%] md:h-[80%] bg-gradient-conic from-blue-600/20 via-purple-600/10 to-transparent rounded-full blur-[80px] md:blur-[140px]"
                        />
                        <motion.div
                            animate={{
                                scale: [1.2, 1, 1.2],
                                opacity: [0.1, 0.2, 0.1],
                                x: [0, -30, 0],
                                y: [0, -50, 0]
                            }}
                            transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
                            className="absolute bottom-[-30%] right-[-10%] w-[90%] md:w-[70%] h-[90%] md:h-[70%] bg-gradient-conic from-indigo-600/20 via-blue-600/10 to-transparent rounded-full blur-[90px] md:blur-[150px]"
                        />
                    </div>

                    <MobileHeader />

                    <div className="relative z-10 flex flex-row w-full flex-1 overflow-hidden">
                        <AppSidebar />

                        <main className="flex flex-col flex-1 min-h-0 w-full max-w-full overflow-hidden">
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center justify-between px-4 md:px-8 pt-4 md:pt-8 mb-4 md:mb-8"
                            >
                                <div className="flex items-center gap-3 md:gap-5">
                                    <div className="p-1.5 rounded-xl bg-white/[0.03] border border-white/10 shadow-inner group/trigger hidden md:block">
                                        <AppSidebarTrigger isOutside={true} className="text-slate-500 group-hover/trigger:text-white transition-colors" />
                                    </div>
                                    <BreadCrumb className="text-slate-500 font-bold truncate max-w-[200px] md:max-w-none" />
                                </div>
                                <div className="hidden sm:flex items-center gap-3 bg-black/40 px-4 py-2 rounded-2xl border border-white/5 shadow-lg">
                                    <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em]">
                                        Node Active
                                    </div>
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)] animate-pulse" />
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.98, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                                className={cn(
                                    "flex-1 glass-card border-none rounded-t-[30px] md:rounded-tl-[80px] md:rounded-tr-none relative overflow-hidden",
                                    "shadow-[0_40px_100px_rgba(0,0,0,0.8)] mx-0 md:ml-4"
                                )}
                            >
                                <motion.div
                                    animate={{ opacity: [0.03, 0.05, 0.03] }}
                                    transition={{ duration: 8, repeat: Infinity }}
                                    className="absolute inset-0 pointer-events-none bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10"
                                />
                                <div className="absolute top-0 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                                <div className="relative z-10 h-full overflow-y-auto overflow-x-hidden no-scrollbar">
                                    {children}
                                </div>
                            </motion.div>
                        </main>
                    </div>
                </div>
            </SidebarProvider>
        </ThreadsProvider>
    );
}
