export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      agency_credits: {
        Row: {
          agency_id: string
          created_at: string
          credits_balance: number
          id: string
          updated_at: string
        }
        Insert: {
          agency_id: string
          created_at?: string
          credits_balance?: number
          id?: string
          updated_at?: string
        }
        Update: {
          agency_id?: string
          created_at?: string
          credits_balance?: number
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      archives: {
        Row: {
          address_line: string | null
          agency_contact: Json | null
          agency_fee: string | null
          agency_id: string
          amenities: Json | null
          archive_reason: string
          archived_at: string
          auto_repost: boolean | null
          availability_date: string | null
          bathrooms: number | null
          bedrooms: number | null
          bills_included: boolean | null
          city: string | null
          country: string | null
          deposit_eur: number | null
          description: string | null
          floor: string | null
          furnished: boolean | null
          id: string
          images: Json | null
          lat: number
          lease_end_date: string | null
          lng: number
          original_created_at: string | null
          original_listing_id: string
          original_published_at: string | null
          rent_monthly_eur: number | null
          size_sqm: number | null
          title: string | null
          type: string | null
          video_url: string | null
        }
        Insert: {
          address_line?: string | null
          agency_contact?: Json | null
          agency_fee?: string | null
          agency_id: string
          amenities?: Json | null
          archive_reason: string
          archived_at?: string
          auto_repost?: boolean | null
          availability_date?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          bills_included?: boolean | null
          city?: string | null
          country?: string | null
          deposit_eur?: number | null
          description?: string | null
          floor?: string | null
          furnished?: boolean | null
          id?: string
          images?: Json | null
          lat: number
          lease_end_date?: string | null
          lng: number
          original_created_at?: string | null
          original_listing_id: string
          original_published_at?: string | null
          rent_monthly_eur?: number | null
          size_sqm?: number | null
          title?: string | null
          type?: string | null
          video_url?: string | null
        }
        Update: {
          address_line?: string | null
          agency_contact?: Json | null
          agency_fee?: string | null
          agency_id?: string
          amenities?: Json | null
          archive_reason?: string
          archived_at?: string
          auto_repost?: boolean | null
          availability_date?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          bills_included?: boolean | null
          city?: string | null
          country?: string | null
          deposit_eur?: number | null
          description?: string | null
          floor?: string | null
          furnished?: boolean | null
          id?: string
          images?: Json | null
          lat?: number
          lease_end_date?: string | null
          lng?: number
          original_created_at?: string | null
          original_listing_id?: string
          original_published_at?: string | null
          rent_monthly_eur?: number | null
          size_sqm?: number | null
          title?: string | null
          type?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          check_in_date: string
          check_out_date: string
          contract_signed_at: string | null
          contract_url: string | null
          created_at: string
          id: string
          landlord_id: string
          listing_id: string
          monthly_rent: number
          security_deposit: number
          status: string
          stripe_payment_intent_id: string | null
          tenant_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          check_in_date: string
          check_out_date: string
          contract_signed_at?: string | null
          contract_url?: string | null
          created_at?: string
          id?: string
          landlord_id: string
          listing_id: string
          monthly_rent: number
          security_deposit: number
          status?: string
          stripe_payment_intent_id?: string | null
          tenant_id: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          check_in_date?: string
          check_out_date?: string
          contract_signed_at?: string | null
          contract_url?: string | null
          created_at?: string
          id?: string
          landlord_id?: string
          listing_id?: string
          monthly_rent?: number
          security_deposit?: number
          status?: string
          stripe_payment_intent_id?: string | null
          tenant_id?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          agency_id: string
          created_at: string
          credits_amount: number
          description: string | null
          id: string
          listing_id: string | null
          stripe_payment_intent_id: string | null
          transaction_type: string
        }
        Insert: {
          agency_id: string
          created_at?: string
          credits_amount: number
          description?: string | null
          id?: string
          listing_id?: string | null
          stripe_payment_intent_id?: string | null
          transaction_type: string
        }
        Update: {
          agency_id?: string
          created_at?: string
          credits_amount?: number
          description?: string | null
          id?: string
          listing_id?: string | null
          stripe_payment_intent_id?: string | null
          transaction_type?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: []
      }
      listing_availability: {
        Row: {
          created_at: string
          date: string
          id: string
          is_available: boolean
          listing_id: string
          price_override: number | null
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          is_available?: boolean
          listing_id: string
          price_override?: number | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          is_available?: boolean
          listing_id?: string
          price_override?: number | null
        }
        Relationships: []
      }
      listing_views: {
        Row: {
          created_at: string
          id: string
          ip_address: unknown | null
          listing_id: string
          session_id: string | null
          time_spent_seconds: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: unknown | null
          listing_id: string
          session_id?: string | null
          time_spent_seconds?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: unknown | null
          listing_id?: string
          session_id?: string | null
          time_spent_seconds?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      listings: {
        Row: {
          address_line: string | null
          advance_booking_days: number | null
          agency_fee: string | null
          agency_id: string
          amenities: Json | null
          auto_repost: boolean | null
          availability_date: string | null
          bathrooms: number | null
          bedrooms: number | null
          bills_included: boolean | null
          booking_enabled: boolean | null
          city: string | null
          country: string | null
          created_at: string | null
          credits_remaining: number | null
          credits_used: number | null
          deposit_eur: number | null
          description: string | null
          description_multilingual: Json | null
          expires_at: string | null
          floor: string | null
          furnished: boolean | null
          id: string
          images: Json | null
          instant_booking: boolean | null
          last_credit_deducted_at: string | null
          lat: number
          lease_end_date: string | null
          lng: number
          maximum_stay_days: number | null
          minimum_stay_days: number | null
          price_history: Json | null
          published_at: string | null
          rent_monthly_eur: number | null
          review_notes: string | null
          review_status: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          size_sqm: number | null
          status: string | null
          title: string | null
          title_multilingual: Json | null
          type: string | null
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          address_line?: string | null
          advance_booking_days?: number | null
          agency_fee?: string | null
          agency_id: string
          amenities?: Json | null
          auto_repost?: boolean | null
          availability_date?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          bills_included?: boolean | null
          booking_enabled?: boolean | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          credits_remaining?: number | null
          credits_used?: number | null
          deposit_eur?: number | null
          description?: string | null
          description_multilingual?: Json | null
          expires_at?: string | null
          floor?: string | null
          furnished?: boolean | null
          id?: string
          images?: Json | null
          instant_booking?: boolean | null
          last_credit_deducted_at?: string | null
          lat: number
          lease_end_date?: string | null
          lng: number
          maximum_stay_days?: number | null
          minimum_stay_days?: number | null
          price_history?: Json | null
          published_at?: string | null
          rent_monthly_eur?: number | null
          review_notes?: string | null
          review_status?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          size_sqm?: number | null
          status?: string | null
          title?: string | null
          title_multilingual?: Json | null
          type?: string | null
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          address_line?: string | null
          advance_booking_days?: number | null
          agency_fee?: string | null
          agency_id?: string
          amenities?: Json | null
          auto_repost?: boolean | null
          availability_date?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          bills_included?: boolean | null
          booking_enabled?: boolean | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          credits_remaining?: number | null
          credits_used?: number | null
          deposit_eur?: number | null
          description?: string | null
          description_multilingual?: Json | null
          expires_at?: string | null
          floor?: string | null
          furnished?: boolean | null
          id?: string
          images?: Json | null
          instant_booking?: boolean | null
          last_credit_deducted_at?: string | null
          lat?: number
          lease_end_date?: string | null
          lng?: number
          maximum_stay_days?: number | null
          minimum_stay_days?: number | null
          price_history?: Json | null
          published_at?: string | null
          rent_monthly_eur?: number | null
          review_notes?: string | null
          review_status?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          size_sqm?: number | null
          status?: string | null
          title?: string | null
          title_multilingual?: Json | null
          type?: string | null
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_listings_agency_id"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          agency_id: string
          conversation_id: string | null
          created_at: string
          id: string
          listing_id: string
          message: string
          read_at: string | null
          replied_at: string | null
          sender_id: string
          sender_name: string
          sender_phone: string | null
          sender_university: string | null
          updated_at: string | null
        }
        Insert: {
          agency_id: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          listing_id: string
          message: string
          read_at?: string | null
          replied_at?: string | null
          sender_id: string
          sender_name: string
          sender_phone?: string | null
          sender_university?: string | null
          updated_at?: string | null
        }
        Update: {
          agency_id?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          listing_id?: string
          message?: string
          read_at?: string | null
          replied_at?: string | null
          sender_id?: string
          sender_name?: string
          sender_phone?: string | null
          sender_university?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      page_views: {
        Row: {
          created_at: string
          id: string
          ip_address: unknown | null
          page_path: string
          referrer: string | null
          session_id: string | null
          time_spent_seconds: number | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: unknown | null
          page_path: string
          referrer?: string | null
          session_id?: string | null
          time_spent_seconds?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: unknown | null
          page_path?: string
          referrer?: string | null
          session_id?: string | null
          time_spent_seconds?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payment_schedules: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          due_date: string
          id: string
          paid_at: string | null
          payment_type: string
          status: string
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          due_date: string
          id?: string
          paid_at?: string | null
          payment_type: string
          status?: string
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          due_date?: string
          id?: string
          paid_at?: string | null
          payment_type?: string
          status?: string
          stripe_payment_intent_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          agency_name: string | null
          avatar_url: string | null
          company_size: string | null
          created_at: string
          description: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          university: string | null
          updated_at: string
          user_id: string
          user_type: string
        }
        Insert: {
          agency_name?: string | null
          avatar_url?: string | null
          company_size?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          university?: string | null
          updated_at?: string
          user_id: string
          user_type: string
        }
        Update: {
          agency_name?: string | null
          avatar_url?: string | null
          company_size?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          university?: string | null
          updated_at?: string
          user_id?: string
          user_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_agency_credits: {
        Args: {
          agency_profile_id: string
          credits_amount: number
          description_param?: string
          stripe_payment_intent_id_param?: string
        }
        Returns: undefined
      }
      admin_verify_user_email: {
        Args: { user_email: string }
        Returns: boolean
      }
      agency_has_credits: {
        Args: { agency_profile_id: string; required_credits?: number }
        Returns: boolean
      }
      agency_has_published_listings: {
        Args: { agency_profile_id: string }
        Returns: boolean
      }
      check_availability: {
        Args: { p_check_in: string; p_check_out: string; p_listing_id: string }
        Returns: boolean
      }
      deduct_agency_credits: {
        Args: {
          agency_profile_id: string
          credits_amount: number
          description_param?: string
          listing_id_param?: string
        }
        Returns: boolean
      }
      generate_conversation_id: {
        Args: { p_listing_id: string; p_student_id: string }
        Returns: string
      }
      generate_listing_availability: {
        Args: { p_end_date: string; p_listing_id: string; p_start_date: string }
        Returns: undefined
      }
      get_agency_business_info: {
        Args: { agency_id_param: string }
        Returns: {
          agency_name: string
        }[]
      }
      get_agency_contact_for_conversation: {
        Args: { agency_id_param: string }
        Returns: {
          agency_email: string
          agency_name: string
          agency_phone: string
        }[]
      }
      get_all_conversations_for_owner: {
        Args: Record<PropertyKey, never>
        Returns: {
          agency_email: string
          agency_id: string
          agency_name: string
          agency_phone: string
          last_message_content: string
          last_message_created_at: string
          last_message_id: string
          listing_address_line: string
          listing_city: string
          listing_id: string
          listing_images: Json
          listing_rent_monthly_eur: number
          listing_title: string
          message_count: number
          student_name: string
          student_sender_id: string
        }[]
      }
      get_conversation_messages_for_owner: {
        Args: { p_listing_id: string; p_student_sender_id: string }
        Returns: {
          agency_id: string
          created_at: string
          id: string
          listing_id: string
          message: string
          read_at: string
          sender_id: string
          sender_name: string
          sender_phone: string
          sender_university: string
        }[]
      }
      get_current_user_profile: {
        Args: Record<PropertyKey, never>
        Returns: {
          agency_name: string | null
          avatar_url: string | null
          company_size: string | null
          created_at: string
          description: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          university: string | null
          updated_at: string
          user_id: string
          user_type: string
        }
      }
      get_listing_text: {
        Args: { language_code?: string; multilingual_field: Json }
        Returns: string
      }
      get_listings_with_agency: {
        Args: {
          p_city?: string
          p_limit?: number
          p_listing_type?: string
          p_max_price?: number
          p_min_bedrooms?: number
          p_min_price?: number
          p_offset?: number
        }
        Returns: {
          address_line: string
          agency_name: string
          amenities: Json
          availability_date: string
          bathrooms: number
          bedrooms: number
          bills_included: boolean
          city: string
          country: string
          created_at: string
          deposit_eur: number
          description: string
          floor: string
          furnished: boolean
          id: string
          images: Json
          lat: number
          lng: number
          published_at: string
          rent_monthly_eur: number
          size_sqm: number
          status: string
          title: string
          type: string
          video_url: string
        }[]
      }
      get_listings_with_agency_multilingual: {
        Args: {
          p_city?: string
          p_language?: string
          p_limit?: number
          p_listing_type?: string
          p_max_price?: number
          p_min_bedrooms?: number
          p_min_price?: number
          p_offset?: number
        }
        Returns: {
          address_line: string
          agency_name: string
          amenities: Json
          availability_date: string
          bathrooms: number
          bedrooms: number
          bills_included: boolean
          city: string
          country: string
          created_at: string
          deposit_eur: number
          description: string
          floor: string
          furnished: boolean
          id: string
          images: Json
          lat: number
          lng: number
          published_at: string
          rent_monthly_eur: number
          size_sqm: number
          status: string
          title: string
          type: string
          video_url: string
        }[]
      }
      get_platform_analytics: {
        Args: { end_date?: string; start_date?: string }
        Returns: Json
      }
      get_user_profile_type: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      user_has_sent_messages_to_any_listing: {
        Args: Record<PropertyKey, never>
        Returns: {
          listing_id: string
        }[]
      }
      user_has_sent_messages_to_listing: {
        Args: { p_listing_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
