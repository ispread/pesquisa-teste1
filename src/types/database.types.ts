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
      documents: {
        Row: {
          created_at: string;
          description: string | null;
          file_path: string;
          file_size: number;
          file_type: string;
          folder_id: string | null;
          id: string;
          last_analyzed_at: string | null;
          name: string;
          project_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          file_path: string;
          file_size: number;
          file_type: string;
          folder_id?: string | null;
          id?: string;
          last_analyzed_at?: string | null;
          name: string;
          project_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          file_path?: string;
          file_size?: number;
          file_type?: string;
          folder_id?: string | null;
          id?: string;
          last_analyzed_at?: string | null;
          name?: string;
          project_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "documents_folder_id_fkey";
            columns: ["folder_id"];
            isOneToOne: false;
            referencedRelation: "folders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      extraction_field_folders: {
        Row: {
          created_at: string;
          extraction_field_id: string;
          folder_id: string;
          id: string;
        };
        Insert: {
          created_at?: string;
          extraction_field_id: string;
          folder_id: string;
          id?: string;
        };
        Update: {
          created_at?: string;
          extraction_field_id?: string;
          folder_id?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "extraction_field_folders_extraction_field_id_fkey";
            columns: ["extraction_field_id"];
            isOneToOne: false;
            referencedRelation: "extraction_fields";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "extraction_field_folders_folder_id_fkey";
            columns: ["folder_id"];
            isOneToOne: false;
            referencedRelation: "folders";
            referencedColumns: ["id"];
          },
        ];
      };
      extraction_fields: {
        Row: {
          created_at: string;
          data_type: string;
          description: string | null;
          id: string;
          name: string;
          project_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          data_type: string;
          description?: string | null;
          id?: string;
          name: string;
          project_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          data_type?: string;
          description?: string | null;
          id?: string;
          name?: string;
          project_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "extraction_fields_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "extraction_fields_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      extraction_results: {
        Row: {
          confidence_score: number | null;
          document_id: string;
          extracted_at: string;
          extracted_value: string | null;
          extraction_field_id: string;
          id: string;
          user_id: string;
        };
        Insert: {
          confidence_score?: number | null;
          document_id: string;
          extracted_at?: string;
          extracted_value?: string | null;
          extraction_field_id: string;
          id?: string;
          user_id: string;
        };
        Update: {
          confidence_score?: number | null;
          document_id?: string;
          extracted_at?: string;
          extracted_value?: string | null;
          extraction_field_id?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "extraction_results_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "extraction_results_extraction_field_id_fkey";
            columns: ["extraction_field_id"];
            isOneToOne: false;
            referencedRelation: "extraction_fields";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "extraction_results_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      folders: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          parent_folder_id: string | null;
          project_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          parent_folder_id?: string | null;
          project_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          parent_folder_id?: string | null;
          project_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "folders_parent_folder_id_fkey";
            columns: ["parent_folder_id"];
            isOneToOne: false;
            referencedRelation: "folders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "folders_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "folders_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      subscriptions: {
        Row: {
          amount: number | null;
          cancel_at_period_end: boolean | null;
          canceled_at: number | null;
          created_at: string;
          currency: string | null;
          current_period_end: number | null;
          current_period_start: number | null;
          custom_field_data: Json | null;
          customer_cancellation_comment: string | null;
          customer_cancellation_reason: string | null;
          customer_id: string | null;
          ended_at: number | null;
          ends_at: number | null;
          id: string;
          interval: string | null;
          metadata: Json | null;
          price_id: string | null;
          started_at: number | null;
          status: string | null;
          stripe_id: string | null;
          stripe_price_id: string | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          amount?: number | null;
          cancel_at_period_end?: boolean | null;
          canceled_at?: number | null;
          created_at?: string;
          currency?: string | null;
          current_period_end?: number | null;
          current_period_start?: number | null;
          custom_field_data?: Json | null;
          customer_cancellation_comment?: string | null;
          customer_cancellation_reason?: string | null;
          customer_id?: string | null;
          ended_at?: number | null;
          ends_at?: number | null;
          id?: string;
          interval?: string | null;
          metadata?: Json | null;
          price_id?: string | null;
          started_at?: number | null;
          status?: string | null;
          stripe_id?: string | null;
          stripe_price_id?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          amount?: number | null;
          cancel_at_period_end?: boolean | null;
          canceled_at?: number | null;
          created_at?: string;
          currency?: string | null;
          current_period_end?: number | null;
          current_period_start?: number | null;
          custom_field_data?: Json | null;
          customer_cancellation_comment?: string | null;
          customer_cancellation_reason?: string | null;
          customer_id?: string | null;
          ended_at?: number | null;
          ends_at?: number | null;
          id?: string;
          interval?: string | null;
          metadata?: Json | null;
          price_id?: string | null;
          started_at?: number | null;
          status?: string | null;
          stripe_id?: string | null;
          stripe_price_id?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["user_id"];
          },
        ];
      };
      users: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          credits: string | null;
          email: string | null;
          full_name: string | null;
          id: string;
          image: string | null;
          name: string | null;
          subscription: string | null;
          token_identifier: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          credits?: string | null;
          email?: string | null;
          full_name?: string | null;
          id: string;
          image?: string | null;
          name?: string | null;
          subscription?: string | null;
          token_identifier: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          credits?: string | null;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          image?: string | null;
          name?: string | null;
          subscription?: string | null;
          token_identifier?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      webhook_events: {
        Row: {
          created_at: string;
          data: Json | null;
          event_type: string;
          id: string;
          modified_at: string;
          stripe_event_id: string | null;
          type: string;
        };
        Insert: {
          created_at?: string;
          data?: Json | null;
          event_type: string;
          id?: string;
          modified_at?: string;
          stripe_event_id?: string | null;
          type: string;
        };
        Update: {
          created_at?: string;
          data?: Json | null;
          event_type?: string;
          id?: string;
          modified_at?: string;
          stripe_event_id?: string | null;
          type?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
