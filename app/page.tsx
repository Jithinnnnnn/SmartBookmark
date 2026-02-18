'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Home() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [isCheckingAuth, setIsCheckingAuth] = useState(true)

    const supabase = useMemo(() => createClient(), [])

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                router.push('/dashboard')
            } else {
                setIsCheckingAuth(false)
            }
        }
        checkUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) router.push('/dashboard')
        })

        return () => subscription.unsubscribe()
    }, [router, supabase])

    const handleGoogleLogin = async () => {
        setIsLoading(true)
        const origin = window.location.origin

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${origin}/auth/callback`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        })
        if (error) {
            console.error('Error logging in:', error.message)
            setIsLoading(false)
        }
    }

    if (isCheckingAuth) return <LoadingScreen />

    return (
        <div className="min-h-screen bg-[#F9FAFB] text-[#1F2937] selection:bg-indigo-100 font-sans">
            {/* --- NAVIGATION --- */}
            <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-white/75 border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">📚</span>
                        <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent drop-shadow-sm">
                            Smart Bookmarks
                        </span>
                    </div>
                    <GoogleButton onClick={handleGoogleLogin} isLoading={isLoading} />
                </div>
            </nav>

            <main className="pt-32 pb-20 px-6">
                {/* --- HERO SECTION --- */}
                <section className="max-w-5xl mx-auto text-center mb-32">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-5xl md:text-7xl font-black text-black mb-8 tracking-tighter leading-[1.1]">
                            Your Bookmarks, Everywhere, <br />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 animate-gradient-x">
                                In Sync
                            </span>
                        </h1>
                        <p className="text-lg md:text-xl text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed">
                            Save, organize, and access your favorite links from any device.
                            Real-time sync keeps everything up-to-date across all your tabs automatically.
                        </p>

                        <div className="flex flex-col items-center gap-4">
                            <GoogleButton onClick={handleGoogleLogin} isLoading={isLoading} large />
                            <p className="text-sm text-gray-400">Free forever. No credit card required.</p>
                        </div>
                    </motion.div>
                </section>

                {/* --- FEATURES GRID --- */}
                <section className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon="🔄"
                            title="Real-Time Sync"
                            desc="Add a bookmark in one tab, see it instantly in all others. No refresh needed."
                            delay={0.2}
                        />
                        <FeatureCard
                            icon="🔒"
                            title="Secure & Private"
                            desc="Authenticated via Google OAuth. Your digital library is encrypted and for your eyes only."
                            delay={0.3}
                        />
                        <FeatureCard
                            icon="⚡"
                            title="Lightning Fast"
                            desc="Built on Next.js 14 and Supabase for industry-leading performance and low latency."
                            delay={0.4}
                        />
                    </div>
                </section>
            </main>

            {/* --- FOOTER --- */}
            <footer className="py-16 border-t border-gray-200 bg-white">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <div className="flex justify-center items-center gap-2 mb-4">
                        <span className="text-xl">📚</span>
                        <span className="font-bold text-black">Smart Bookmarks</span>
                    </div>
                    <p className="text-sm text-gray-400 mb-6">
                        Making the web more organized, one link at a time.
                    </p>
                    <div className="text-xs text-gray-300">
                        © 2026 Smart Bookmark Manager. Built with Next.js, Tailwind & Supabase.
                    </div>
                </div>
            </footer>
        </div>
    )
}

/**
 * FEATURE CARD COMPONENT
 */
function FeatureCard({ icon, title, desc, delay }: { icon: string, title: string, desc: string, delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.5 }}
            className="p-10 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:border-indigo-100 transition-all duration-300 group"
        >
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-4xl mb-6 group-hover:scale-110 group-hover:bg-indigo-50 transition-all duration-300">
                {icon}
            </div>
            <h3 className="text-2xl font-bold text-black mb-3">{title}</h3>
            <p className="text-gray-500 leading-relaxed text-lg">{desc}</p>
        </motion.div>
    )
}

/**
 * BRANDED GOOGLE BUTTON COMPONENT
 */
function GoogleButton({ onClick, isLoading, large = false }: { onClick: () => void, isLoading: boolean, large?: boolean }) {
    return (
        <button
            onClick={onClick}
            disabled={isLoading}
            className={`
                inline-flex items-center justify-center gap-3 bg-white border border-[#747775] 
                text-[#1f1f1f] font-medium rounded-full hover:bg-[#F8F9FA] hover:shadow-md
                transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                ${large ? 'px-12 py-4 shadow-lg' : 'px-6 py-2.5 shadow-sm'}
            `}
        >
            {isLoading ? (
                <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-indigo-600 rounded-full" />
            ) : (
                <>
                    <svg className={large ? "w-6 h-6" : "w-5 h-5"} viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span className={`tracking-tight ${large ? 'text-lg' : 'text-sm'}`}>
                        Continue with Google
                    </span>
                </>
            )}
        </button>
    )
}

/**
 * LOADING SCREEN COMPONENT
 */
function LoadingScreen() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
            <motion.div
                animate={{
                    scale: [1, 1.15, 1],
                    opacity: [0.5, 1, 0.5]
                }}
                transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: "easeInOut"
                }}
                className="text-6xl"
            >
                📚
            </motion.div>
        </div>
    )
}