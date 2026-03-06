import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { resetPassword } from '../actions'
import { KeyRound, Mail, ArrowRight, ArrowLeft } from 'lucide-react'

export default async function ForgotPasswordPage(props: {
    searchParams: Promise<{ message?: string; error?: string }>
}) {
    const searchParams = await props.searchParams;
    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-black">
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />

            <div className="relative z-10 w-full max-w-md px-8 py-10 mx-4 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-xl shadow-2xl">
                <Link
                    href="/login"
                    className="absolute top-6 left-6 flex items-center text-sm text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Link>

                <div className="flex flex-col items-center mb-8 mt-6">
                    <div className="w-12 h-12 mb-4 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <KeyRound className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-light text-center text-white tracking-wide">
                        Reset Password
                    </h1>
                    <p className="mt-2 text-sm text-slate-400 text-center px-4">
                        Enter your email and we'll send you a link to reset your password.
                    </p>
                </div>

                <form className="flex flex-col gap-5">
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

                    <Button
                        className="w-full h-11 mt-2 text-md font-medium rounded-xl bg-white text-black hover:bg-slate-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] group"
                        formAction={resetPassword}
                    >
                        Send Reset Link
                        <ArrowRight className="w-4 h-4 ml-2 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </Button>
                </form>
            </div>
        </div>
    )
}
