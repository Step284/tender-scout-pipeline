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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      automation_events: {
        Row: {
          attempts: number
          created_at: string
          event_type: string
          id: string
          idempotency_key: string
          last_error: string | null
          organization_id: string
          status: Database["public"]["Enums"]["automation_status"]
          triggered_by: string | null
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          event_type: string
          id?: string
          idempotency_key: string
          last_error?: string | null
          organization_id: string
          status?: Database["public"]["Enums"]["automation_status"]
          triggered_by?: string | null
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          event_type?: string
          id?: string
          idempotency_key?: string
          last_error?: string | null
          organization_id?: string
          status?: Database["public"]["Enums"]["automation_status"]
          triggered_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      company_profiles: {
        Row: {
          capabilities: string[]
          cpv_codes: string[]
          description: string
          industry: string
          organization_id: string
          regions: string[]
          updated_at: string
          value_max: number | null
          value_min: number | null
        }
        Insert: {
          capabilities?: string[]
          cpv_codes?: string[]
          description?: string
          industry?: string
          organization_id: string
          regions?: string[]
          updated_at?: string
          value_max?: number | null
          value_min?: number | null
        }
        Update: {
          capabilities?: string[]
          cpv_codes?: string[]
          description?: string
          industry?: string
          organization_id?: string
          regions?: string[]
          updated_at?: string
          value_max?: number | null
          value_min?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "company_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cpv_suggestions: {
        Row: {
          confidence: number | null
          cpv_code: string
          created_at: string
          event_id: string | null
          id: string
          label: string | null
          organization_id: string
          status: Database["public"]["Enums"]["suggestion_status"]
        }
        Insert: {
          confidence?: number | null
          cpv_code: string
          created_at?: string
          event_id?: string | null
          id?: string
          label?: string | null
          organization_id: string
          status?: Database["public"]["Enums"]["suggestion_status"]
        }
        Update: {
          confidence?: number | null
          cpv_code?: string
          created_at?: string
          event_id?: string | null
          id?: string
          label?: string | null
          organization_id?: string
          status?: Database["public"]["Enums"]["suggestion_status"]
        }
        Relationships: [
          {
            foreignKeyName: "cpv_suggestions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "automation_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cpv_suggestions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          computed_at: string
          id: string
          method: string
          organization_id: string
          reasons: Json
          recommendation: Database["public"]["Enums"]["match_recommendation"]
          score: number
          tender_id: string
        }
        Insert: {
          computed_at?: string
          id?: string
          method?: string
          organization_id: string
          reasons?: Json
          recommendation: Database["public"]["Enums"]["match_recommendation"]
          score: number
          tender_id: string
        }
        Update: {
          computed_at?: string
          id?: string
          method?: string
          organization_id?: string
          reasons?: Json
          recommendation?: Database["public"]["Enums"]["match_recommendation"]
          score?: number
          tender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      pipeline_items: {
        Row: {
          created_at: string
          id: string
          notes: string
          organization_id: string
          owner_user_id: string | null
          stage: Database["public"]["Enums"]["pipeline_stage"]
          tender_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string
          organization_id: string
          owner_user_id?: string | null
          stage?: Database["public"]["Enums"]["pipeline_stage"]
          tender_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string
          organization_id?: string
          owner_user_id?: string | null
          stage?: Database["public"]["Enums"]["pipeline_stage"]
          tender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_items_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_user_id: string | null
          created_at: string
          done: boolean
          due_date: string | null
          id: string
          organization_id: string
          pipeline_item_id: string
          title: string
        }
        Insert: {
          assignee_user_id?: string | null
          created_at?: string
          done?: boolean
          due_date?: string | null
          id?: string
          organization_id: string
          pipeline_item_id: string
          title: string
        }
        Update: {
          assignee_user_id?: string | null
          created_at?: string
          done?: boolean
          due_date?: string | null
          id?: string
          organization_id?: string
          pipeline_item_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_pipeline_item_id_fkey"
            columns: ["pipeline_item_id"]
            isOneToOne: false
            referencedRelation: "pipeline_items"
            referencedColumns: ["id"]
          },
        ]
      }
      tenders: {
        Row: {
          contracting_authority: string
          cpv_codes: string[]
          created_at: string
          currency: string
          deadline: string | null
          description: string
          external_ref: string | null
          id: string
          is_demo: boolean
          organization_id: string | null
          procedure_type: string | null
          published_at: string
          region: string | null
          requirements: string[]
          source: string
          title: string
          url: string | null
          value_estimate: number | null
        }
        Insert: {
          contracting_authority: string
          cpv_codes?: string[]
          created_at?: string
          currency?: string
          deadline?: string | null
          description?: string
          external_ref?: string | null
          id?: string
          is_demo?: boolean
          organization_id?: string | null
          procedure_type?: string | null
          published_at?: string
          region?: string | null
          requirements?: string[]
          source?: string
          title: string
          url?: string | null
          value_estimate?: number | null
        }
        Update: {
          contracting_authority?: string
          cpv_codes?: string[]
          created_at?: string
          currency?: string
          deadline?: string | null
          description?: string
          external_ref?: string | null
          id?: string
          is_demo?: boolean
          organization_id?: string | null
          procedure_type?: string | null
          published_at?: string
          region?: string | null
          requirements?: string[]
          source?: string
          title?: string
          url?: string | null
          value_estimate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tenders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_edit_org: { Args: { _org: string }; Returns: boolean }
      create_organization: {
        Args: { _display_name?: string; _name: string }
        Returns: string
      }
      has_org_role: {
        Args: {
          _org: string
          _roles: Database["public"]["Enums"]["org_role"][]
        }
        Returns: boolean
      }
      is_org_member: { Args: { _org: string }; Returns: boolean }
    }
    Enums: {
      automation_status: "queued" | "sent" | "failed" | "processed"
      match_recommendation: "go" | "consider" | "nogo"
      org_role: "owner" | "admin" | "member" | "viewer"
      pipeline_stage:
        | "nove"
        | "k_posouzeni"
        | "pripravujeme"
        | "ke_schvaleni"
        | "podano"
        | "uzavreno"
      suggestion_status: "pending" | "accepted" | "rejected"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      automation_status: ["queued", "sent", "failed", "processed"],
      match_recommendation: ["go", "consider", "nogo"],
      org_role: ["owner", "admin", "member", "viewer"],
      pipeline_stage: [
        "nove",
        "k_posouzeni",
        "pripravujeme",
        "ke_schvaleni",
        "podano",
        "uzavreno",
      ],
      suggestion_status: ["pending", "accepted", "rejected"],
    },
  },
} as const
