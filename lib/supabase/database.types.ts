export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      machines: {
        Row: {
          id: string
          user_id: string
          name: string
          photo_pathname: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          photo_pathname?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          photo_pathname?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_pets: {
        Row: {
          id: string
          user_id: string
          name: string
          species: string
          level: number
          experience: number
          is_enabled: boolean
          enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name?: string
          species?: string
          level?: number
          experience?: number
          is_enabled?: boolean
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          species?: string
          level?: number
          experience?: number
          is_enabled?: boolean
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      pets: {
        Row: {
          id: string
          user_id: string
          name: string
          species: string
          level: number
          experience: number
          is_enabled: boolean
          enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name?: string
          species?: string
          level?: number
          experience?: number
          is_enabled?: boolean
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          species?: string
          level?: number
          experience?: number
          is_enabled?: boolean
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
