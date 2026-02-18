'use client'

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, useMemo } from 'react'
import type { Database } from '@/lib/supabase/types'
import { LogOut, Loader2 } from 'lucide-react'

type Bookmark = Database['public']['Tables']['Bookmarks']['Row']

export default function DashboardPage() {
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([])

    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSigningOut, setIsSigningOut] = useState(false)
    const [user, setUser] = useState<any>(null)

    // Stable client - persists across re-renders
    const supabase = useMemo(() => createClient(), [])

    // Fetch user and bookmarks
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Get user
                const { data: { user } } = await supabase.auth.getUser()
                setUser(user)

                if (!user) return

                // Get bookmarks — explicit user_id filter for defense-in-depth
                const { data, error } = await supabase
                    .from('Bookmarks')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })

                if (error) throw error
                setBookmarks(data || [])
            } catch (error) {
                console.error('Error fetching data:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [supabase])

    // Real-time subscription - handles ALL events for cross-tab sync
    useEffect(() => {
        if (!user) return

        console.log('🔌 Setting up real-time subscription for user:', user.id)

        const channel = supabase
            .channel('realtime-dashboard')
            // Postgres changes — Single Source of Truth for all tabs
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to ALL events (INSERT, UPDATE, DELETE)
                    schema: 'public',
                    table: 'Bookmarks',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    console.log('📡 Realtime event:', payload.eventType)

                    if (payload.eventType === 'INSERT') {
                        setBookmarks((prev) => {
                            const exists = prev.some((b) => b.id === (payload.new as Bookmark).id)
                            if (exists) return prev
                            return [payload.new as Bookmark, ...prev]
                        })
                    }

                    else if (payload.eventType === 'DELETE') {
                        const deletedId = (payload.old as any).id
                        setBookmarks((prev) => prev.filter((b) => b.id !== deletedId))
                    }

                    else if (payload.eventType === 'UPDATE') {
                        setBookmarks((prev) =>
                            prev.map((b) => (b.id === (payload.new as Bookmark).id ? (payload.new as Bookmark) : b))
                        )
                    }
                }
            )
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Real-time active for user:', user.id)
                } else if (err) {
                    console.error('❌ Real-time error:', status, err)
                }
            })

        return () => { supabase.removeChannel(channel) }
    }, [user?.id, supabase])

    // Add bookmark - NO manual state update, real-time handles ALL state
    const handleAddBookmark = async (formData: FormData) => {
        if (!user) return

        const url = formData.get('url') as string
        const title = formData.get('title') as string

        if (!url || !title) {
            alert('Please fill in all fields')
            return
        }

        setIsSubmitting(true)

        try {
            // Only insert to database - real-time will update UI in ALL tabs
            const { error } = await (supabase
                .from('Bookmarks') as any)
                .insert({ url, title, user_id: user.id })

            if (error) throw error

            // Real-time subscription will update the UI in ALL tabs

            // Clear form
            const form = document.getElementById('bookmark-form') as HTMLFormElement
            form?.reset()
        } catch (error: any) {
            console.error('Error adding bookmark:', error)
            alert('Failed to add bookmark: ' + error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    // Delete bookmark - Pure real-time logic (NO manual state updates)
    const handleDeleteBookmark = async (id: string) => {
        if (!confirm('Are you sure you want to delete this bookmark?')) return

        try {
            // Explicit user_id guard — prevents cross-account deletion
            const { error } = await supabase
                .from('Bookmarks')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id)

            if (error) throw error
        } catch (error: any) {
            console.error('❌ Error deleting bookmark:', error)
            alert('Failed to delete bookmark: ' + error.message)
        }
    }

    // Sign out with loading state
    const handleSignOut = async () => {
        setIsSigningOut(true)
        try {
            await supabase.auth.signOut()
            window.location.href = '/'
        } catch (error) {
            console.error('Error signing out:', error)
            setIsSigningOut(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-black tracking-tighter flex items-center gap-2">
                        <span>📚</span>
                        <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                            Smart Bookmarks
                        </span>
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <div className="text-sm font-medium text-gray-900">
                                {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                            </div>
                            <div className="text-xs text-gray-500">
                                {user?.email}
                            </div>
                        </div>

                        {/* Professional Sign Out Button */}
                        <button
                            onClick={handleSignOut}
                            disabled={isSigningOut}
                            aria-label="Sign out of your account"
                            className="
                                group inline-flex items-center gap-2 px-4 py-2 
                                text-sm font-medium text-slate-700 
                                border border-slate-200 rounded-lg 
                                hover:text-red-600 hover:border-red-200 hover:bg-red-50
                                focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-slate-700 disabled:hover:bg-white disabled:hover:border-slate-200
                                transition-all duration-200
                            "
                        >
                            {isSigningOut ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Signing out...</span>
                                </>
                            ) : (
                                <>
                                    <LogOut className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                                    <span>Sign Out</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8">
                {/* Add Bookmark Form */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900">
                        Add New Bookmark
                    </h2>
                    <form
                        id="bookmark-form"
                        action={handleAddBookmark}
                        className="flex flex-col sm:flex-row gap-4"
                    >
                        <input
                            type="url"
                            name="url"
                            placeholder="https://example.com"
                            required
                            className="flex-1 px-4 py-3 bg-white text-black border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" disabled={isSubmitting}
                        />
                        <input
                            type="text"
                            name="title"
                            placeholder="Bookmark Title"
                            required
                            className="flex-1 px-4 py-3 bg-white text-black border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={isSubmitting}
                        />
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                            {isSubmitting ? 'Adding...' : 'Add Bookmark'}
                        </button>
                    </form>
                </div>

                {/* Bookmarks List */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        Your Bookmarks ({bookmarks.length})
                    </h2>

                    {bookmarks.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                            <div className="text-6xl mb-4">📭</div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                No bookmarks yet
                            </h3>
                            <p className="text-gray-500">
                                Add your first bookmark using the form above
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {bookmarks.map((bookmark) => (
                                <div
                                    key={bookmark.id}
                                    className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-shadow group"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-semibold text-gray-900 text-lg line-clamp-2">
                                            {bookmark.title}
                                        </h3>
                                        <button
                                            onClick={() => handleDeleteBookmark(bookmark.id)}
                                            className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                            title="Delete bookmark"
                                        >
                                            <svg
                                                className="w-5 h-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                    <a
                                        href={bookmark.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 text-sm break-all flex items-center gap-1"
                                    >
                                        <span className="line-clamp-1">{bookmark.url}</span>
                                        <svg
                                            className="w-4 h-4 flex-shrink-0"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                            />
                                        </svg>
                                    </a>
                                    <p className="text-xs text-gray-500 mt-2">
                                        {new Date(bookmark.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
