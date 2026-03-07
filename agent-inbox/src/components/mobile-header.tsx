'use client'

import { logout } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { LogOut, User } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AppSidebarTrigger } from '@/components/app-sidebar'
import { agentInboxSvg } from '@/components/agent-inbox/components/agent-inbox-logo'

export function MobileHeader() {
    return (
        <header className="flex md:hidden items-center justify-between px-4 py-3 bg-slate-900/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
            <div className="flex items-center gap-3">
                <AppSidebarTrigger isOutside={true} className="text-white hover:bg-white/10" />
                <div className="scale-90 origin-left">
                    {agentInboxSvg}
                </div>
            </div>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full bg-slate-800 text-slate-300 hover:text-white border border-white/10">
                        <User className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 bg-slate-900/80 backdrop-blur-2xl border-white/10 shadow-2xl">
                    <DropdownMenuItem asChild className="hover:bg-white/5 focus:bg-white/5">
                        <form action={logout} className="w-full">
                            <button type="submit" className="flex items-center gap-2 w-full text-red-500 hover:text-red-400 text-sm">
                                <LogOut className="h-4 w-4" />
                                Sign Out
                            </button>
                        </form>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    )
}
