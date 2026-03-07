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
                    {/* Dynamic Parallax Background */}
                    <div className="fixed inset-0 overflow-hidden pointer-events-none">
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.2, 0.4, 0.2],
                                x: [0, 80, 0],
                                y: [0, 40, 0]
                            }}
                            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                            className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-gradient-conic from-blue-600/20 via-purple-600/10 to-transparent rounded-full blur-[140px]"
                        />
                        <motion.div
                            animate={{
                                scale: [1.3, 1, 1.3],
                                opacity: [0.15, 0.35, 0.15],
                                x: [0, -60, 0],
                                y: [0, -100, 0]
                            }}
                            transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
                            className="absolute bottom-[-30%] right-[-10%] w-[70%] h-[70%] bg-gradient-conic from-indigo-600/20 via-blue-600/10 to-transparent rounded-full blur-[150px]"
                        />
                        {/* More subtle floating glow elements */}
                        <div className="absolute top-[15%] right-[20%] w-48 h-48 bg-blue-500/5 rounded-full blur-[100px] animate-pulse" />
                        <div className="absolute bottom-[25%] left-[5%] w-64 h-64 bg-purple-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '3s' }} />
                    </div>

                    <MobileHeader />

                    <div className="relative z-10 flex flex-row w-full flex-1 overflow-hidden">
                        <AppSidebar />

                        <main className="flex flex-col flex-1 min-h-full pt-4 md:pt-8 pl-0 md:pl-4 gap-4 md:gap-8 overflow-hidden">
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center justify-between px-4 md:px-8"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="p-1.5 rounded-xl bg-white/[0.03] border border-white/10 shadow-inner group/trigger">
                                        <AppSidebarTrigger isOutside={true} className="text-slate-500 group-hover/trigger:text-white transition-colors" />
                                    </div>
                                    <BreadCrumb className="text-slate-500 font-bold" />
                                </div>
                                <div className="hidden md:flex items-center gap-3 bg-black/40 px-4 py-2 rounded-2xl border border-white/5 shadow-lg">
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
                                    "flex-1 glass-card border-none rounded-tl-[40px] md:rounded-tl-[80px] relative overflow-hidden",
                                    "shadow-[0_40px_100px_rgba(0,0,0,0.8)]"
                                )}
                            >
                                {/* Subtly animated inner glow */}
                                <motion.div
                                    animate={{ opacity: [0.03, 0.05, 0.03] }}
                                    transition={{ duration: 8, repeat: Infinity }}
                                    className="absolute inset-0 pointer-events-none bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10"
                                />
                                {/* Top edge light effect */}
                                <div className="absolute top-0 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                                <div className="relative z-10 h-full overflow-x-auto no-scrollbar">
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
