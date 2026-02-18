import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

/**
 * Browser client for Supabase (SINGLETON)
 * 
 * Use this in Client Components (files with 'use client')
 * - Real-time subscriptions
 * - Client-side authentication
 * - Browser-based interactions
 * 
 * IMPORTANT: This is a singleton to ensure consistent real-time connections
 */

let client: ReturnType<typeof createBrowserClient<Database>> | undefined

export function createClient() {
    if (client) {
        return client
    }

    client = createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    console.log('🔧 Supabase browser client created (singleton)')
    return client
}
