/**
 * Database type definitions
 * 
 * These types provide TypeScript autocomplete and type safety
 * for Supabase queries across the application.
 */
export type Database = {
    public: {
        Tables: {
            bookmarks: {
                Row: {
                    id: string
                    created_at: string
                    user_id: string
                    url: string
                    title: string
                }
                Insert: {
                    id?: string
                    created_at?: string
                    user_id: string
                    url: string
                    title: string
                }
                Update: {
                    id?: string
                    created_at?: string
                    user_id?: string
                    url?: string
                    title?: string
                }
            }
        }
    }
}
