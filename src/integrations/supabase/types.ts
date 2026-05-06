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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      chargers: {
        Row: {
          connector: string
          created_at: string
          id: string
          power_kw: number | null
          station_id: string
          status: string
          type: string
        }
        Insert: {
          connector?: string
          created_at?: string
          id?: string
          power_kw?: number | null
          station_id: string
          status?: string
          type?: string
        }
        Update: {
          connector?: string
          created_at?: string
          id?: string
          power_kw?: number | null
          station_id?: string
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "chargers_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          coins: number
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          preferred_connector: string | null
          updated_at: string
          vehicle_model: string | null
          vehicle_range_km: number
        }
        Insert: {
          coins?: number
          created_at?: string
          email: string
          id: string
          name?: string
          phone?: string | null
          preferred_connector?: string | null
          updated_at?: string
          vehicle_model?: string | null
          vehicle_range_km?: number
        }
        Update: {
          coins?: number
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          preferred_connector?: string | null
          updated_at?: string
          vehicle_model?: string | null
          vehicle_range_km?: number
        }
        Relationships: []
      }
      queue: {
        Row: {
          created_at: string
          eta_minutes: number
          id: string
          position: number
          station_id: string
          status: string
          user_id: string
          user_name: string
        }
        Insert: {
          created_at?: string
          eta_minutes?: number
          id?: string
          position?: number
          station_id: string
          status?: string
          user_id: string
          user_name: string
        }
        Update: {
          created_at?: string
          eta_minutes?: number
          id?: string
          position?: number
          station_id?: string
          status?: string
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "queue_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews_verification: {
        Row: {
          cable_condition: string
          created_at: string
          id: string
          image_url: string | null
          station_id: string
          status: string
          user_id: string
        }
        Insert: {
          cable_condition: string
          created_at?: string
          id?: string
          image_url?: string | null
          station_id: string
          status: string
          user_id: string
        }
        Update: {
          cable_condition?: string
          created_at?: string
          id?: string
          image_url?: string | null
          station_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_verification_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          cost: number
          end_time: string | null
          energy_used: number
          id: string
          start_time: string
          station_id: string
          status: string
          user_id: string
        }
        Insert: {
          cost?: number
          end_time?: string | null
          energy_used?: number
          id?: string
          start_time?: string
          station_id: string
          status?: string
          user_id: string
        }
        Update: {
          cost?: number
          end_time?: string | null
          energy_used?: number
          id?: string
          start_time?: string
          station_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      stations: {
        Row: {
          address: string
          amenities: string[]
          available_slots: number
          charger_type: string
          city: string
          connector_types: string[]
          created_at: string
          distance_km: number
          id: string
          image_url: string | null
          last_verified: string
          lat: number
          lng: number
          name: string
          operator: string | null
          peak_hours: string | null
          power_kw: number | null
          price_per_kwh: number
          reliability_score: number
          status: string
          total_slots: number
          wait_minutes: number
        }
        Insert: {
          address: string
          amenities?: string[]
          available_slots?: number
          charger_type: string
          city: string
          connector_types?: string[]
          created_at?: string
          distance_km?: number
          id?: string
          image_url?: string | null
          last_verified?: string
          lat: number
          lng: number
          name: string
          operator?: string | null
          peak_hours?: string | null
          power_kw?: number | null
          price_per_kwh?: number
          reliability_score?: number
          status?: string
          total_slots?: number
          wait_minutes?: number
        }
        Update: {
          address?: string
          amenities?: string[]
          available_slots?: number
          charger_type?: string
          city?: string
          connector_types?: string[]
          created_at?: string
          distance_km?: number
          id?: string
          image_url?: string | null
          last_verified?: string
          lat?: number
          lng?: number
          name?: string
          operator?: string | null
          peak_hours?: string | null
          power_kw?: number | null
          price_per_kwh?: number
          reliability_score?: number
          status?: string
          total_slots?: number
          wait_minutes?: number
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method?: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      travel_plans: {
        Row: {
          ai_summary: string | null
          created_at: string
          dest_lat: number
          dest_lng: number
          destination_label: string
          distance_km: number
          duration_min: number
          id: string
          origin_label: string
          origin_lat: number
          origin_lng: number
          station_ids: string[]
          user_id: string
        }
        Insert: {
          ai_summary?: string | null
          created_at?: string
          dest_lat: number
          dest_lng: number
          destination_label: string
          distance_km?: number
          duration_min?: number
          id?: string
          origin_label: string
          origin_lat: number
          origin_lng: number
          station_ids?: string[]
          user_id: string
        }
        Update: {
          ai_summary?: string | null
          created_at?: string
          dest_lat?: number
          dest_lng?: number
          destination_label?: string
          distance_km?: number
          duration_min?: number
          id?: string
          origin_label?: string
          origin_lat?: number
          origin_lng?: number
          station_ids?: string[]
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "operator" | "user" | "super_admin"
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
      app_role: ["admin", "operator", "user", "super_admin"],
    },
  },
} as const
