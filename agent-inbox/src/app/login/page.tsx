import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login } from '../actions'
import { Lock, Mail, ArrowRight } from 'lucide-react'
import { OAuthButtons } from '@/components/oauth-buttons'
import { PasswordInput } from '@/components/password-input'

export default async function LoginPage(props: {
    searchParams: Promise<{ message?: string; error?: string }>
}) {
    const searchParams = await props.searchParams;
    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-black">
            {/* Soft 'Classic' ambient background glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />

            <div className="relative z-10 w-full max-w-md px-8 py-10 mx-4 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-xl shadow-2xl">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 mb-4 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Lock className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-3xl font-light text-center text-white tracking-wide">
                        Welcome Back
                    </h1>
                    <p className="mt-2 text-sm text-slate-400 text-center">
                        Sign in to access your Omni Social Agent
                    </p>
                </div>

                <form className="flex flex-col gap-5" action={login}>
                    {searchParams?.message && (
                        <div className="p-3 text-sm text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg text-center">
                            {searchParams.message}
                        </div>
                    )}
                    {searchParams?.error && (
                        <div className="p-3 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg text-center">
                            {searchParams.error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label className="text-slate-300 ml-1" htmlFor="email">Email address</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                            <Input
                                className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-slate-500 rounded-xl focus:border-blue-500/50 focus:ring-blue-500/20 transition-all h-11"
                                id="email"
                                name="email"
                                type="email"
                                placeholder="you@example.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between ml-1">
                            <Label className="text-slate-300" htmlFor="password">Password</Label>
                            <Link
                                href="/forgot-password"
                                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                tabIndex={-1}
                            >
                                Forgot password?
                            </Link>
                        </div>
                        <PasswordInput id="password" name="password" required />
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-11 mt-2 text-md font-medium rounded-xl bg-white text-black hover:bg-slate-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] group"
                    >
                        Sign in
                        <ArrowRight className="w-4 h-4 ml-2 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </Button>

                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10"></span></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-transparent px-2 text-slate-500">Or continue with</span></div>
                    </div>

                    <OAuthButtons />

                    <p className="mt-4 text-sm text-center text-slate-400">
                        Don't have an account?{' '}
                        <Link href="/signup" className="text-white hover:text-blue-300 underline underline-offset-4 transition-colors">
                            Sign up
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    )
}
