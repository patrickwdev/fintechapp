/**
 * Supabase database types.
 * Generate full types with: npx supabase gen types typescript --project-id YOUR_REF > types/database.ts
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          first_name: string | null;
          last_name: string | null;
          phone: string | null;
          ssn_last_four: string | null;
          dwolla_customer_url: string | null;
          dwolla_bank_funding_source_url: string | null;
          email_local: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          ssn_last_four?: string | null;
          dwolla_customer_url?: string | null;
          dwolla_bank_funding_source_url?: string | null;
          email_local?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          ssn_last_four?: string | null;
          dwolla_customer_url?: string | null;
          dwolla_bank_funding_source_url?: string | null;
          email_local?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      wallets: {
        Row: {
          id: string;
          user_id: string;
          balance: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          balance?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          balance?: number;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      search_profiles_for_transfer: {
        Args: { p_search: string; p_limit?: number };
        Returns: {
          id: string;
          first_name: string | null;
          last_name: string | null;
          display_name: string | null;
          email_local: string | null;
        }[];
      };
    };
    Enums: Record<string, never>;
  };
}
