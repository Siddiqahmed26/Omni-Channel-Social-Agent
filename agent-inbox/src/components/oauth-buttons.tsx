'use client'

import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'

export function OAuthButtons() {
    const supabase = createClient()

    const signInWithGoogle = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })
    }

    const signInWithGithub = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })
    }

    return (
        <div className="grid grid-cols-2 gap-3">
            <Button
                type="button"
                variant="outline"
                onClick={signInWithGoogle}
                className="h-10 bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
            >
                Google
            </Button>
            <Button
                type="button"
                variant="outline"
                onClick={signInWithGithub}
                className="h-10 bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
            >
                GitHub
            </Button>
        </div>
    )
}
