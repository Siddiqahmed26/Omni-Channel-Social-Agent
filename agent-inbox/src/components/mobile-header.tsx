'use client'

import { logout } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { LogOut, User, Plus, Settings } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AppSidebarTrigger } from '@/components/app-sidebar'
import { agentInboxSvg } from '@/components/agent-inbox/components/agent-inbox-logo'
import { QuickGenerateDialog } from './agent-inbox/components/quick-generate-dialog'
import { SettingsPopover } from './agent-inbox/components/settings-popover'

export function MobileHeader() {
    return (
        <header className="flex md:hidden items-center justify-between px-6 py-4 bg-black/40 backdrop-blur-2xl border-b border-white/5 sticky top-0 z-50 shadow-2xl">
            <div className="flex items-center gap-4">
                <div className="p-1 rounded-xl bg-white/[0.03] border border-white/10 shadow-inner">
                    <AppSidebarTrigger isOutside={true} className="text-slate-300 hover:text-white transition-colors" />
                </div>
                <div className="scale-95 origin-left opacity-90 hover:opacity-100 transition-opacity">
                    {agentInboxSvg}
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 p-1 bg-white/[0.03] border border-white/10 rounded-2xl">
                    <QuickGenerateDialog iconOnly />
                    <SettingsPopover iconOnly />
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-2xl bg-white/[0.05] text-slate-400 hover:text-white border border-white/5 hover:border-white/20 transition-all shadow-lg active:scale-90">
                            <User className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 mt-2 p-2 bg-black/60 backdrop-blur-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl">
                        <DropdownMenuItem asChild className="rounded-xl hover:bg-white/5 focus:bg-white/10 transition-colors p-3 cursor-pointer group">
                            <form action={logout} className="w-full">
                                <button type="submit" className="flex items-center gap-3 w-full text-red-500 font-bold text-xs uppercase tracking-widest">
                                    <LogOut className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                                    Terminate Session
                                </button>
                            </form>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
