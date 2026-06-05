export type UserRole = 'guardian' | 'admin' | 'super_admin'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: UserRole
          full_name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          role?: UserRole
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          role?: UserRole
          full_name?: string | null
          avatar_url?: string | null
        }
      }
      sponsorships: {
        Row: {
          id: string
          user_id: string
          species_id: string
          monthly_amount: number
          stripe_subscription_id: string | null
          status: 'active' | 'paused' | 'cancelled'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          species_id: string
          monthly_amount: number
          stripe_subscription_id?: string | null
          status?: 'active' | 'paused' | 'cancelled'
          created_at?: string
        }
        Update: {
          status?: 'active' | 'paused' | 'cancelled'
          stripe_subscription_id?: string | null
        }
      }
      donations: {
        Row: {
          id: string
          user_id: string | null
          amount: number
          currency: string
          stripe_payment_intent_id: string | null
          species_id: string | null
          message: string | null
          status: 'pending' | 'succeeded' | 'failed'
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          amount: number
          currency?: string
          stripe_payment_intent_id?: string | null
          species_id?: string | null
          message?: string | null
          status?: 'pending' | 'succeeded' | 'failed'
          created_at?: string
        }
        Update: {
          status?: 'pending' | 'succeeded' | 'failed'
          stripe_payment_intent_id?: string | null
        }
      }
      blog_posts: {
        Row: {
          id: string
          slug: string
          title: string
          excerpt: string | null
          content: string | null
          author_id: string | null
          image_url: string | null
          category: string | null
          read_time: number | null
          published: boolean
          published_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          excerpt?: string | null
          content?: string | null
          author_id?: string | null
          image_url?: string | null
          category?: string | null
          read_time?: number | null
          published?: boolean
          published_at?: string | null
          created_at?: string
        }
        Update: {
          slug?: string
          title?: string
          excerpt?: string | null
          content?: string | null
          image_url?: string | null
          category?: string | null
          read_time?: number | null
          published?: boolean
          published_at?: string | null
        }
      }
      field_journal: {
        Row: {
          id: string
          title: string
          description: string | null
          author_id: string | null
          zone: string | null
          species_id: string | null
          image_url: string | null
          observed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          author_id?: string | null
          zone?: string | null
          species_id?: string | null
          image_url?: string | null
          observed_at?: string
          created_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          zone?: string | null
          species_id?: string | null
          image_url?: string | null
          observed_at?: string
        }
      }
    }
  }
}
