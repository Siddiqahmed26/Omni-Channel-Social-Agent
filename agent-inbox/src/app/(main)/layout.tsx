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
                <div className="flex flex-col w-full min-h-screen">
                    <MobileHeader />
                    <div className="flex flex-row w-full flex-1">
                        <AppSidebar />
                        <main className="flex flex-row w-full min-h-full pt-6 pl-3 md:pl-6 gap-6">
                            <AppSidebarTrigger isOutside={true} />
                            <div className="flex flex-col gap-6 w-full min-h-full">
                                <BreadCrumb className="pl-5" />
                                <div
                                    className={cn(
                                        "h-full bg-white rounded-tl-[58px]",
                                        "overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                                    )}
                                >
                                    {children}
                                </div>
                            </div>
                        </main>
                    </div>
                </div>
            </SidebarProvider>
        </ThreadsProvider>
    );
}
