import { ThreadsProvider } from "@/components/agent-inbox/contexts/ThreadContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar, AppSidebarTrigger } from "@/components/app-sidebar";
import { BreadCrumb } from "@/components/agent-inbox/components/breadcrumb";
import { cn } from "@/lib/utils";
import React from "react";
import { MobileHeader } from "@/components/mobile-header";

export default function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ThreadsProvider>
            <SidebarProvider>
                <div className="relative flex flex-col w-full min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-black">
                    {/* Ambient background glows */}
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

                    <MobileHeader />
                    <div className="relative z-10 flex flex-row w-full flex-1 overflow-hidden">
                        <AppSidebar />
                        <main className="flex flex-col flex-1 min-h-full pt-4 md:pt-6 pl-0 md:pl-2 gap-4 md:gap-6 overflow-hidden">
                            <div className="flex items-center gap-4 px-4 md:px-6">
                                <AppSidebarTrigger isOutside={true} className="text-white hover:bg-white/10" />
                                <BreadCrumb className="text-slate-400" />
                            </div>

                            <div
                                className={cn(
                                    "flex-1 bg-white/5 backdrop-blur-xl border-t border-l border-white/10 rounded-tl-[32px] md:rounded-tl-[58px]",
                                    "overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent shadow-2xl"
                                )}
                            >
                                {children}
                            </div>
                        </main>
                    </div>
                </div>
            </SidebarProvider>
        </ThreadsProvider>
    );
}
