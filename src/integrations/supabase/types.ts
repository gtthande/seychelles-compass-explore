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
      bookings: {
        Row: {
          booking_details: Json | null
          business_id: string
          check_in_date: string | null
          check_out_date: string | null
          created_at: string
          currency: string | null
          guests: number | null
          id: string
          service_type: string
          status: string | null
          total_price: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_details?: Json | null
          business_id: string
          check_in_date?: string | null
          check_out_date?: string | null
          created_at?: string
          currency?: string | null
          guests?: number | null
          id?: string
          service_type: string
          status?: string | null
          total_price?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_details?: Json | null
          business_id?: string
          check_in_date?: string | null
          check_out_date?: string | null
          created_at?: string
          currency?: string | null
          guests?: number | null
          id?: string
          service_type?: string
          status?: string | null
          total_price?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string | null
          average_rating: number | null
          category: Database["public"]["Enums"]["business_category"]
          cover_image_url: string | null
          created_at: string
          description: string | null
          email: string | null
          facebook_url: string | null
          featured: boolean | null
          gallery_images: string[] | null
          id: string
          instagram_url: string | null
          island: string | null
          latitude: number | null
          linkedin_url: string | null
          logo_url: string | null
          longitude: number | null
          name: string
          opening_hours: Json | null
          owner_id: string
          phone: string | null
          status: Database["public"]["Enums"]["business_status"] | null
          total_reviews: number | null
          updated_at: string
          verified: boolean | null
          website: string | null
          whatsapp: string | null
          youtube_url: string | null
        }
        Insert: {
          address?: string | null
          average_rating?: number | null
          category: Database["public"]["Enums"]["business_category"]
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          facebook_url?: string | null
          featured?: boolean | null
          gallery_images?: string[] | null
          id?: string
          instagram_url?: string | null
          island?: string | null
          latitude?: number | null
          linkedin_url?: string | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          opening_hours?: Json | null
          owner_id: string
          phone?: string | null
          status?: Database["public"]["Enums"]["business_status"] | null
          total_reviews?: number | null
          updated_at?: string
          verified?: boolean | null
          website?: string | null
          whatsapp?: string | null
          youtube_url?: string | null
        }
        Update: {
          address?: string | null
          average_rating?: number | null
          category?: Database["public"]["Enums"]["business_category"]
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          facebook_url?: string | null
          featured?: boolean | null
          gallery_images?: string[] | null
          id?: string
          instagram_url?: string | null
          island?: string | null
          latitude?: number | null
          linkedin_url?: string | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          opening_hours?: Json | null
          owner_id?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["business_status"] | null
          total_reviews?: number | null
          updated_at?: string
          verified?: boolean | null
          website?: string | null
          whatsapp?: string | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          business_id: string
          category: string | null
          created_at: string
          currency: string | null
          description: string | null
          featured: boolean | null
          id: string
          images: string[] | null
          in_stock: boolean | null
          name: string
          price: number | null
          status: Database["public"]["Enums"]["listing_status"] | null
          stock_quantity: number | null
          updated_at: string
        }
        Insert: {
          business_id: string
          category?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          images?: string[] | null
          in_stock?: boolean | null
          name: string
          price?: number | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          stock_quantity?: number | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          category?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          images?: string[] | null
          in_stock?: boolean | null
          name?: string
          price?: number | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          stock_quantity?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          business_name: string | null
          created_at: string
          full_name: string | null
          id: string
          is_admin: boolean | null
          is_business_owner: boolean | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          business_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          is_business_owner?: boolean | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          business_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          is_business_owner?: boolean | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          business_id: string
          comment: string | null
          created_at: string
          helpful_count: number | null
          id: string
          rating: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          comment?: string | null
          created_at?: string
          helpful_count?: number | null
          id?: string
          rating?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          comment?: string | null
          created_at?: string
          helpful_count?: number | null
          id?: string
          rating?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      business_category:
        | "restaurants"
        | "hotels"
        | "tourism"
        | "retail"
        | "services"
        | "entertainment"
        | "health"
        | "education"
        | "finance"
        | "transport"
        | "real_estate"
        | "technology"
      business_status: "active" | "pending" | "suspended" | "closed"
      listing_status: "active" | "draft" | "pending" | "expired"
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
    Enums: {
      business_category: [
        "restaurants",
        "hotels",
        "tourism",
        "retail",
        "services",
        "entertainment",
        "health",
        "education",
        "finance",
        "transport",
        "real_estate",
        "technology",
      ],
      business_status: ["active", "pending", "suspended", "closed"],
      listing_status: ["active", "draft", "pending", "expired"],
    },
  },
} as const
