'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PasswordInputProps {
    id?: string
    name?: string
    placeholder?: string
    className?: string
    required?: boolean
}

export function PasswordInput({ id, name, placeholder = '........', className, required }: PasswordInputProps) {
    const [showPassword, setShowPassword] = useState(false)

    return (
        <div className="relative">
            <Input
                id={id}
                name={name}
                type={showPassword ? 'text' : 'password'}
                placeholder={placeholder}
                required={required}
                className={cn(
                    'pr-10 bg-black/20 border-white/10 text-white placeholder:text-slate-500 rounded-xl focus:border-blue-500/50 focus:ring-blue-500/20 transition-all h-11',
                    className
                )}
            />
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-1 top-1 h-9 w-9 p-0 text-slate-400 hover:text-white hover:bg-transparent"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
        </div>
    )
}
