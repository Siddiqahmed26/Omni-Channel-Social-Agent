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

export function MobileHeader() {
    return (
        <header className="flex md:hidden items-center justify-between px-4 py-3 bg-slate-900/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <span className="text-white text-xs font-bold">O</span>
                </div>
                <span className="font-light text-sm text-white tracking-wide">Omni Social Agent</span>
            </div>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full bg-gray-100">
                        <User className="h-4 w-4 text-gray-600" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem asChild>
                        <form action={logout} className="w-full">
                            <button type="submit" className="flex items-center gap-2 w-full text-red-600 text-sm">
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
