import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Types for database tables
export type Skill = {
  id: string
  name: string
  description: string
  content: string
  author_id: string
  author_name: string
  download_count: number
  created_at: string
  updated_at: string
  tags: string[]
}

export type Scene = {
  id: string
  name: string
  description: string
  config: Record<string, unknown>
  author_id: string
  author_name: string
  download_count: number
  created_at: string
  updated_at: string
}

export type ForumPost = {
  id: string
  title: string
  content: string
  author_id: string
  author_name: string
  category: string
  views: number
  replies: number
  created_at: string
  updated_at: string
  is_pinned: boolean
}

export type ForumReply = {
  id: string
  post_id: string
  content: string
  author_id: string
  author_name: string
  created_at: string
}

// Create a mock client for build time
const createMockClient = (): SupabaseClient => {
  return {
    from: () => ({
      select: () => ({
        order: () => Promise.resolve({ data: [], error: null }),
      }),
      insert: () => Promise.resolve({ error: null }),
    }),
    auth: {
      signIn: () => Promise.resolve({ error: null }),
      signOut: () => Promise.resolve({ error: null }),
    },
  } as unknown as SupabaseClient
}

// Lazy initialization of Supabase client
let supabaseInstance: SupabaseClient | null = null

export const getSupabase = (): SupabaseClient => {
  if (typeof window === 'undefined') {
    // Server-side or build time - return mock
    return createMockClient()
  }

  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

    if (supabaseUrl && supabaseKey) {
      supabaseInstance = createClient(supabaseUrl, supabaseKey)
    } else {
      supabaseInstance = createMockClient()
    }
  }

  return supabaseInstance
}

// Export for backward compatibility
export const supabase = getSupabase()
