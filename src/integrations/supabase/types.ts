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
      achievement_templates: {
        Row: {
          achievement_description: string | null
          achievement_name: string
          achievement_type: string
          active: boolean | null
          category: string | null
          color: string | null
          created_at: string | null
          display_order: number | null
          emoji: string | null
          icon_name: string | null
          is_secret: boolean | null
          points_earned: number | null
          rule_params: Json | null
          rule_type: string | null
          scope: string | null
          trainer_user_id: string | null
          updated_at: string | null
        }
        Insert: {
          achievement_description?: string | null
          achievement_name: string
          achievement_type: string
          active?: boolean | null
          category?: string | null
          color?: string | null
          created_at?: string | null
          display_order?: number | null
          emoji?: string | null
          icon_name?: string | null
          is_secret?: boolean | null
          points_earned?: number | null
          rule_params?: Json | null
          rule_type?: string | null
          scope?: string | null
          trainer_user_id?: string | null
          updated_at?: string | null
        }
        Update: {
          achievement_description?: string | null
          achievement_name?: string
          achievement_type?: string
          active?: boolean | null
          category?: string | null
          color?: string | null
          created_at?: string | null
          display_order?: number | null
          emoji?: string | null
          icon_name?: string | null
          is_secret?: boolean | null
          points_earned?: number | null
          rule_params?: Json | null
          rule_type?: string | null
          scope?: string | null
          trainer_user_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      action_items: {
        Row: {
          assigned_to: string
          completed_at: string | null
          created_at: string | null
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          meeting_id: string | null
          owner_id: string
          priority: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to: string
          completed_at?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          meeting_id?: string | null
          owner_id: string
          priority?: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          meeting_id?: string | null
          owner_id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "action_items_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "team_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      ai_diet_references: {
        Row: {
          created_at: string
          diet_content: Json
          external_id: string | null
          id: string
          imported_at: string
          is_active: boolean
          notes: string | null
          patient_profile: Json | null
          source: string
        }
        Insert: {
          created_at?: string
          diet_content: Json
          external_id?: string | null
          id?: string
          imported_at?: string
          is_active?: boolean
          notes?: string | null
          patient_profile?: Json | null
          source: string
        }
        Update: {
          created_at?: string
          diet_content?: Json
          external_id?: string | null
          id?: string
          imported_at?: string
          is_active?: boolean
          notes?: string | null
          patient_profile?: Json | null
          source?: string
        }
        Relationships: []
      }
      ai_insights_custom: {
        Row: {
          created_at: string | null
          description: string
          icon: string
          id: string
          is_hidden: boolean | null
          is_manual: boolean | null
          order_index: number | null
          priority: string | null
          recommendation: string | null
          section: string
          telefone: string
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          icon: string
          id?: string
          is_hidden?: boolean | null
          is_manual?: boolean | null
          order_index?: number | null
          priority?: string | null
          recommendation?: string | null
          section: string
          telefone: string
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          icon?: string
          id?: string
          is_hidden?: boolean | null
          is_manual?: boolean | null
          order_index?: number | null
          priority?: string | null
          recommendation?: string | null
          section?: string
          telefone?: string
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_insights_hidden: {
        Row: {
          ai_insight_hash: string
          created_at: string | null
          id: string
          section: string
          telefone: string
          user_id: string
        }
        Insert: {
          ai_insight_hash: string
          created_at?: string | null
          id?: string
          section: string
          telefone: string
          user_id: string
        }
        Update: {
          ai_insight_hash?: string
          created_at?: string | null
          id?: string
          section?: string
          telefone?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_hidden_telefone_fkey"
            columns: ["telefone"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["telefone"]
          },
          {
            foreignKeyName: "ai_insights_hidden_telefone_fkey"
            columns: ["telefone"]
            isOneToOne: false
            referencedRelation: "v_patient_workout_risk"
            referencedColumns: ["telefone"]
          },
        ]
      }
      ai_usage_log: {
        Row: {
          audio_seconds: number | null
          cost_usd: number
          created_at: string
          feature: string
          id: string
          input_tokens: number
          metadata: Json | null
          model: string | null
          output_tokens: number
          provider: string
          user_id: string | null
        }
        Insert: {
          audio_seconds?: number | null
          cost_usd?: number
          created_at?: string
          feature?: string
          id?: string
          input_tokens?: number
          metadata?: Json | null
          model?: string | null
          output_tokens?: number
          provider?: string
          user_id?: string | null
        }
        Update: {
          audio_seconds?: number | null
          cost_usd?: number
          created_at?: string
          feature?: string
          id?: string
          input_tokens?: number
          metadata?: Json | null
          model?: string | null
          output_tokens?: number
          provider?: string
          user_id?: string | null
        }
        Relationships: []
      }
      alertas_dashboard: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          data_referencia: string | null
          id: number
          limite: string | null
          mensagem: string | null
          prioridade: string | null
          tipo: string | null
          updated_at: string | null
          user_id: string | null
          valor: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          data_referencia?: string | null
          id?: number
          limite?: string | null
          mensagem?: string | null
          prioridade?: string | null
          tipo?: string | null
          updated_at?: string | null
          user_id?: string | null
          valor?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          data_referencia?: string | null
          id?: number
          limite?: string | null
          mensagem?: string | null
          prioridade?: string | null
          tipo?: string | null
          updated_at?: string | null
          user_id?: string | null
          valor?: string | null
        }
        Relationships: []
      }
      anamnesis_drafts: {
        Row: {
          current_step: number | null
          data: Json | null
          id: string
          nutri_user_id: string
          telefone: string
          updated_at: string | null
        }
        Insert: {
          current_step?: number | null
          data?: Json | null
          id?: string
          nutri_user_id: string
          telefone: string
          updated_at?: string | null
        }
        Update: {
          current_step?: number | null
          data?: Json | null
          id?: string
          nutri_user_id?: string
          telefone?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      anamnesis_flow_config: {
        Row: {
          contract_enabled: boolean
          contract_require_cpf: boolean
          contract_template: string | null
          contract_title: string | null
          created_at: string
          description: string | null
          final_message: Json
          flow: Json
          id: string
          is_active: boolean
          name: string
          professional_signature_url: string | null
          public_slug: string | null
          terms_text: string
          terms_url: string
          theme: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          contract_enabled?: boolean
          contract_require_cpf?: boolean
          contract_template?: string | null
          contract_title?: string | null
          created_at?: string
          description?: string | null
          final_message?: Json
          flow?: Json
          id?: string
          is_active?: boolean
          name?: string
          professional_signature_url?: string | null
          public_slug?: string | null
          terms_text?: string
          terms_url?: string
          theme?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          contract_enabled?: boolean
          contract_require_cpf?: boolean
          contract_template?: string | null
          contract_title?: string | null
          created_at?: string
          description?: string | null
          final_message?: Json
          flow?: Json
          id?: string
          is_active?: boolean
          name?: string
          professional_signature_url?: string | null
          public_slug?: string | null
          terms_text?: string
          terms_url?: string
          theme?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      anamnesis_reminder_scheduled: {
        Row: {
          attempt_count: number | null
          created_at: string | null
          error: string | null
          id: string
          lead_id: string | null
          patient_id: string
          rendered_text: string
          scheduled_at: string
          sent_at: string | null
          status: string
          target: string | null
          template_id: string | null
          user_id: string
        }
        Insert: {
          attempt_count?: number | null
          created_at?: string | null
          error?: string | null
          id?: string
          lead_id?: string | null
          patient_id: string
          rendered_text: string
          scheduled_at: string
          sent_at?: string | null
          status?: string
          target?: string | null
          template_id?: string | null
          user_id: string
        }
        Update: {
          attempt_count?: number | null
          created_at?: string | null
          error?: string | null
          id?: string
          lead_id?: string | null
          patient_id?: string
          rendered_text?: string
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          target?: string | null
          template_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "anamnesis_reminder_scheduled_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamnesis_reminder_scheduled_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamnesis_reminder_scheduled_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "anamnesis_reminder_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      anamnesis_reminder_templates: {
        Row: {
          auto_send_enabled: boolean
          created_at: string | null
          delay_hours: number
          deleted_at: string | null
          id: string
          is_active: boolean | null
          message_text: string
          step_order: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_send_enabled?: boolean
          created_at?: string | null
          delay_hours: number
          deleted_at?: string | null
          id?: string
          is_active?: boolean | null
          message_text: string
          step_order: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_send_enabled?: boolean
          created_at?: string | null
          delay_hours?: number
          deleted_at?: string | null
          id?: string
          is_active?: boolean | null
          message_text?: string
          step_order?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      anamnesis_summary_layout: {
        Row: {
          created_at: string
          layout: Json
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          layout: Json
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          layout?: Json
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      anamnesis_webhook_log: {
        Row: {
          anamnesis_id: string | null
          created_at: string
          id: string
          patient_id: string | null
          payload: Json | null
          results: Json | null
          user_id: string | null
        }
        Insert: {
          anamnesis_id?: string | null
          created_at?: string
          id?: string
          patient_id?: string | null
          payload?: Json | null
          results?: Json | null
          user_id?: string | null
        }
        Update: {
          anamnesis_id?: string | null
          created_at?: string
          id?: string
          patient_id?: string | null
          payload?: Json | null
          results?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anamnesis_webhook_log_anamnesis_id_fkey"
            columns: ["anamnesis_id"]
            isOneToOne: false
            referencedRelation: "patient_anamnesis"
            referencedColumns: ["id"]
          },
        ]
      }
      anti_ban_config: {
        Row: {
          batch_size: number
          burst_pause_max_minutes: number
          burst_pause_min_minutes: number
          burst_size: number
          burst_window_minutes: number
          default_daily_limit: number
          default_daily_limit_support: number
          default_warmup_daily_limit: number
          default_warmup_daily_limit_support: number
          default_warmup_mode: boolean
          default_window_end: string
          default_window_start: string
          id: number
          max_delay_ms: number
          min_delay_ms: number
          reschedule_max_attempts: number
          retry_backoff_minutes: number
          retry_max_attempts: number
          stale_hours_lead: number
          stale_hours_scheduled: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          batch_size?: number
          burst_pause_max_minutes?: number
          burst_pause_min_minutes?: number
          burst_size?: number
          burst_window_minutes?: number
          default_daily_limit?: number
          default_daily_limit_support?: number
          default_warmup_daily_limit?: number
          default_warmup_daily_limit_support?: number
          default_warmup_mode?: boolean
          default_window_end?: string
          default_window_start?: string
          id?: number
          max_delay_ms?: number
          min_delay_ms?: number
          reschedule_max_attempts?: number
          retry_backoff_minutes?: number
          retry_max_attempts?: number
          stale_hours_lead?: number
          stale_hours_scheduled?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          batch_size?: number
          burst_pause_max_minutes?: number
          burst_pause_min_minutes?: number
          burst_size?: number
          burst_window_minutes?: number
          default_daily_limit?: number
          default_daily_limit_support?: number
          default_warmup_daily_limit?: number
          default_warmup_daily_limit_support?: number
          default_warmup_mode?: boolean
          default_window_end?: string
          default_window_start?: string
          id?: number
          max_delay_ms?: number
          min_delay_ms?: number
          reschedule_max_attempts?: number
          retry_backoff_minutes?: number
          retry_max_attempts?: number
          stale_hours_lead?: number
          stale_hours_scheduled?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      app_config: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      atualizar: {
        Row: {
          created_at: string
          id: number
          numero: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          numero?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          numero?: number | null
        }
        Relationships: []
      }
      body_composition: {
        Row: {
          classificacao: string | null
          confianca_ia: string | null
          created_at: string | null
          data_avaliacao: string
          distribuicao_regional: Json | null
          fonte: string | null
          id: string
          imc: number | null
          massa_gorda: number | null
          massa_magra: number | null
          observacoes: string | null
          percentual_gordura: number
          peso: number | null
          telefone: string
          tmb: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          classificacao?: string | null
          confianca_ia?: string | null
          created_at?: string | null
          data_avaliacao: string
          distribuicao_regional?: Json | null
          fonte?: string | null
          id?: string
          imc?: number | null
          massa_gorda?: number | null
          massa_magra?: number | null
          observacoes?: string | null
          percentual_gordura: number
          peso?: number | null
          telefone: string
          tmb?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          classificacao?: string | null
          confianca_ia?: string | null
          created_at?: string | null
          data_avaliacao?: string
          distribuicao_regional?: Json | null
          fonte?: string | null
          id?: string
          imc?: number | null
          massa_gorda?: number | null
          massa_magra?: number | null
          observacoes?: string | null
          percentual_gordura?: number
          peso?: number | null
          telefone?: string
          tmb?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "body_composition_telefone_fkey"
            columns: ["telefone"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["telefone"]
          },
          {
            foreignKeyName: "body_composition_telefone_fkey"
            columns: ["telefone"]
            isOneToOne: false
            referencedRelation: "v_patient_workout_risk"
            referencedColumns: ["telefone"]
          },
          {
            foreignKeyName: "fk_body_composition_patient"
            columns: ["telefone"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["telefone"]
          },
          {
            foreignKeyName: "fk_body_composition_patient"
            columns: ["telefone"]
            isOneToOne: false
            referencedRelation: "v_patient_workout_risk"
            referencedColumns: ["telefone"]
          },
        ]
      }
      cardio_logs: {
        Row: {
          created_at: string
          duration_min: number
          id: string
          intensity: string | null
          modality: string | null
          notes: string | null
          patient_id: string
          performed_at: string
        }
        Insert: {
          created_at?: string
          duration_min: number
          id?: string
          intensity?: string | null
          modality?: string | null
          notes?: string | null
          patient_id: string
          performed_at?: string
        }
        Update: {
          created_at?: string
          duration_min?: number
          id?: string
          intensity?: string | null
          modality?: string | null
          notes?: string | null
          patient_id?: string
          performed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cardio_logs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversation_tags: {
        Row: {
          added_by: string | null
          conversation_id: string
          created_at: string
          id: string
          owner_id: string
          tag: string
        }
        Insert: {
          added_by?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          owner_id: string
          tag: string
        }
        Update: {
          added_by?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          owner_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversation_tags_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          assigned_to: string | null
          cleared_at_patient: string | null
          cleared_at_team: string | null
          created_at: string
          id: string
          last_message_at: string | null
          last_message_preview: string | null
          last_sender_type: string | null
          owner_id: string
          patient_id: string
          status: string
          unread_for_patient: boolean
          unread_for_team: boolean
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          cleared_at_patient?: string | null
          cleared_at_team?: string | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          last_sender_type?: string | null
          owner_id: string
          patient_id: string
          status?: string
          unread_for_patient?: boolean
          unread_for_team?: boolean
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          cleared_at_patient?: string | null
          cleared_at_team?: string | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          last_sender_type?: string | null
          owner_id?: string
          patient_id?: string
          status?: string
          unread_for_patient?: boolean
          unread_for_team?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_inactivity_rulers: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          owner_id: string
          plano: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          owner_id: string
          plano?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          owner_id?: string
          plano?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      chat_inactivity_state: {
        Row: {
          inactive_days_at_fire: number | null
          last_fired_at: string | null
          last_step_id: string | null
          patient_id: string
          ruler_id: string | null
        }
        Insert: {
          inactive_days_at_fire?: number | null
          last_fired_at?: string | null
          last_step_id?: string | null
          patient_id: string
          ruler_id?: string | null
        }
        Update: {
          inactive_days_at_fire?: number | null
          last_fired_at?: string | null
          last_step_id?: string | null
          patient_id?: string
          ruler_id?: string | null
        }
        Relationships: []
      }
      chat_inactivity_steps: {
        Row: {
          body: string | null
          channel: string
          created_at: string
          days_inactive: number
          id: string
          is_active: boolean
          message_kind: string
          position: number
          quick_reply_id: string | null
          ruler_id: string
          sequence_id: string | null
          title: string | null
        }
        Insert: {
          body?: string | null
          channel: string
          created_at?: string
          days_inactive: number
          id?: string
          is_active?: boolean
          message_kind?: string
          position?: number
          quick_reply_id?: string | null
          ruler_id: string
          sequence_id?: string | null
          title?: string | null
        }
        Update: {
          body?: string | null
          channel?: string
          created_at?: string
          days_inactive?: number
          id?: string
          is_active?: boolean
          message_kind?: string
          position?: number
          quick_reply_id?: string | null
          ruler_id?: string
          sequence_id?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_inactivity_steps_quick_reply_id_fkey"
            columns: ["quick_reply_id"]
            isOneToOne: false
            referencedRelation: "chat_quick_replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_inactivity_steps_ruler_id_fkey"
            columns: ["ruler_id"]
            isOneToOne: false
            referencedRelation: "chat_inactivity_rulers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_inactivity_steps_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_internal_notes: {
        Row: {
          body: string
          category: string
          conversation_id: string
          created_at: string
          created_by: string | null
          id: string
          owner_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          body: string
          category?: string
          conversation_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          owner_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          body?: string
          category?: string
          conversation_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          owner_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_internal_notes_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_message_reactions: {
        Row: {
          conversation_id: string
          created_at: string
          emoji: string
          id: string
          message_id: string
          reactor: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          reactor: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          reactor?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_reactions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          edited_at: string | null
          id: string
          media_mime: string | null
          media_type: string | null
          media_url: string | null
          original_body: string | null
          read_at: string | null
          reply_to_message_id: string | null
          sender_type: string
          sender_user_id: string | null
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          edited_at?: string | null
          id?: string
          media_mime?: string | null
          media_type?: string | null
          media_url?: string | null
          original_body?: string | null
          read_at?: string | null
          reply_to_message_id?: string | null
          sender_type: string
          sender_user_id?: string | null
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          edited_at?: string | null
          id?: string
          media_mime?: string | null
          media_type?: string | null
          media_url?: string | null
          original_body?: string | null
          read_at?: string | null
          reply_to_message_id?: string | null
          sender_type?: string
          sender_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_reply_to_message_id_fkey"
            columns: ["reply_to_message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_quick_replies: {
        Row: {
          category: string
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          media_url: string | null
          owner_id: string
          shortcut: string | null
          title: string
          updated_at: string
          usage_count: number
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          media_url?: string | null
          owner_id: string
          shortcut?: string | null
          title: string
          updated_at?: string
          usage_count?: number
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          media_url?: string | null
          owner_id?: string
          shortcut?: string | null
          title?: string
          updated_at?: string
          usage_count?: number
        }
        Relationships: []
      }
      chat_rollout_config: {
        Row: {
          active_planos: string[]
          owner_id: string
          require_vigente: boolean
          updated_at: string
        }
        Insert: {
          active_planos?: string[]
          owner_id: string
          require_vigente?: boolean
          updated_at?: string
        }
        Update: {
          active_planos?: string[]
          owner_id?: string
          require_vigente?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      checkin: {
        Row: {
          agua: string | null
          alimento_para_incluir: string | null
          assigned_to: string | null
          beliscos: string | null
          cardio: string | null
          comeu_menos: string | null
          created_at: string | null
          data_checkin: string
          data_preenchimento: string | null
          descanso: string | null
          dificuldades: string | null
          fome_algum_horario: string | null
          foto_1: string | null
          foto_2: string | null
          foto_3: string | null
          foto_4: string | null
          id: string
          libido: string | null
          locked_at: string | null
          locked_by: string | null
          medida: string | null
          melhora_visual: string | null
          notes_count: number | null
          objetivo: string | null
          oq_beliscou: string | null
          oq_comeu_ref_livre: string | null
          percentual_aproveitamento: string | null
          peso: string | null
          peso_data: string | null
          peso_jejum: number | null
          pontos_agua: string | null
          pontos_beliscos: string | null
          pontos_cardios: string | null
          pontos_descanso_entre_series: string | null
          pontos_libido: string | null
          pontos_qualidade_sono: string | null
          pontos_refeicao_livre: string | null
          pontos_sono: string | null
          pontos_stress: string | null
          pontos_treinos: string | null
          quais_pontos: string | null
          ref_livre: string | null
          respostas_json: Json | null
          sono: string | null
          status: string | null
          stress: string | null
          telefone: string
          tempo: string | null
          tempo_cardio: string | null
          tipo_checkin: string | null
          tipo_peso: string | null
          total_pontuacao: string | null
          treino: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          agua?: string | null
          alimento_para_incluir?: string | null
          assigned_to?: string | null
          beliscos?: string | null
          cardio?: string | null
          comeu_menos?: string | null
          created_at?: string | null
          data_checkin?: string
          data_preenchimento?: string | null
          descanso?: string | null
          dificuldades?: string | null
          fome_algum_horario?: string | null
          foto_1?: string | null
          foto_2?: string | null
          foto_3?: string | null
          foto_4?: string | null
          id?: string
          libido?: string | null
          locked_at?: string | null
          locked_by?: string | null
          medida?: string | null
          melhora_visual?: string | null
          notes_count?: number | null
          objetivo?: string | null
          oq_beliscou?: string | null
          oq_comeu_ref_livre?: string | null
          percentual_aproveitamento?: string | null
          peso?: string | null
          peso_data?: string | null
          peso_jejum?: number | null
          pontos_agua?: string | null
          pontos_beliscos?: string | null
          pontos_cardios?: string | null
          pontos_descanso_entre_series?: string | null
          pontos_libido?: string | null
          pontos_qualidade_sono?: string | null
          pontos_refeicao_livre?: string | null
          pontos_sono?: string | null
          pontos_stress?: string | null
          pontos_treinos?: string | null
          quais_pontos?: string | null
          ref_livre?: string | null
          respostas_json?: Json | null
          sono?: string | null
          status?: string | null
          stress?: string | null
          telefone: string
          tempo?: string | null
          tempo_cardio?: string | null
          tipo_checkin?: string | null
          tipo_peso?: string | null
          total_pontuacao?: string | null
          treino?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          agua?: string | null
          alimento_para_incluir?: string | null
          assigned_to?: string | null
          beliscos?: string | null
          cardio?: string | null
          comeu_menos?: string | null
          created_at?: string | null
          data_checkin?: string
          data_preenchimento?: string | null
          descanso?: string | null
          dificuldades?: string | null
          fome_algum_horario?: string | null
          foto_1?: string | null
          foto_2?: string | null
          foto_3?: string | null
          foto_4?: string | null
          id?: string
          libido?: string | null
          locked_at?: string | null
          locked_by?: string | null
          medida?: string | null
          melhora_visual?: string | null
          notes_count?: number | null
          objetivo?: string | null
          oq_beliscou?: string | null
          oq_comeu_ref_livre?: string | null
          percentual_aproveitamento?: string | null
          peso?: string | null
          peso_data?: string | null
          peso_jejum?: number | null
          pontos_agua?: string | null
          pontos_beliscos?: string | null
          pontos_cardios?: string | null
          pontos_descanso_entre_series?: string | null
          pontos_libido?: string | null
          pontos_qualidade_sono?: string | null
          pontos_refeicao_livre?: string | null
          pontos_sono?: string | null
          pontos_stress?: string | null
          pontos_treinos?: string | null
          quais_pontos?: string | null
          ref_livre?: string | null
          respostas_json?: Json | null
          sono?: string | null
          status?: string | null
          stress?: string | null
          telefone?: string
          tempo?: string | null
          tempo_cardio?: string | null
          tipo_checkin?: string | null
          tipo_peso?: string | null
          total_pontuacao?: string | null
          treino?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkin_telefone_fkey"
            columns: ["telefone"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["telefone"]
          },
          {
            foreignKeyName: "checkin_telefone_fkey"
            columns: ["telefone"]
            isOneToOne: false
            referencedRelation: "v_patient_workout_risk"
            referencedColumns: ["telefone"]
          },
        ]
      }
      checkin_feedback_analysis: {
        Row: {
          checkin_data: Json | null
          checkin_date: string
          checkin_id: string | null
          created_at: string | null
          diet_adjustments: string | null
          evolution_data: Json | null
          feedback_status: string | null
          generated_feedback: string | null
          id: string
          observed_improvements: string | null
          patient_id: string | null
          prompt_template_id: string | null
          sent_at: string | null
          sent_via: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          checkin_data?: Json | null
          checkin_date: string
          checkin_id?: string | null
          created_at?: string | null
          diet_adjustments?: string | null
          evolution_data?: Json | null
          feedback_status?: string | null
          generated_feedback?: string | null
          id?: string
          observed_improvements?: string | null
          patient_id?: string | null
          prompt_template_id?: string | null
          sent_at?: string | null
          sent_via?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          checkin_data?: Json | null
          checkin_date?: string
          checkin_id?: string | null
          created_at?: string | null
          diet_adjustments?: string | null
          evolution_data?: Json | null
          feedback_status?: string | null
          generated_feedback?: string | null
          id?: string
          observed_improvements?: string | null
          patient_id?: string | null
          prompt_template_id?: string | null
          sent_at?: string | null
          sent_via?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkin_feedback_analysis_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkin_feedback_analysis_prompt_template_id_fkey"
            columns: ["prompt_template_id"]
            isOneToOne: false
            referencedRelation: "feedback_prompt_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      checkin_flow_config: {
        Row: {
          created_at: string | null
          description: string | null
          flow: Json
          header_image_url: string | null
          id: string
          is_active: boolean | null
          name: string
          public_slug: string | null
          theme: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          flow?: Json
          header_image_url?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          public_slug?: string | null
          theme?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          flow?: Json
          header_image_url?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          public_slug?: string | null
          theme?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      checkin_followup_configs: {
        Row: {
          created_at: string
          delay_days: number
          id: string
          is_enabled: boolean
          max_followup_window_days: number
          message_text: string
          period_granularity: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delay_days?: number
          id?: string
          is_enabled?: boolean
          max_followup_window_days?: number
          message_text?: string
          period_granularity?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          delay_days?: number
          id?: string
          is_enabled?: boolean
          max_followup_window_days?: number
          message_text?: string
          period_granularity?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      checkin_followups_sent: {
        Row: {
          checkin_filled_at: string | null
          checkin_period: string
          created_at: string
          id: string
          patient_id: string | null
          recipient_phone: string
          scheduled_message_id: string | null
          user_id: string
        }
        Insert: {
          checkin_filled_at?: string | null
          checkin_period: string
          created_at?: string
          id?: string
          patient_id?: string | null
          recipient_phone: string
          scheduled_message_id?: string | null
          user_id: string
        }
        Update: {
          checkin_filled_at?: string | null
          checkin_period?: string
          created_at?: string
          id?: string
          patient_id?: string | null
          recipient_phone?: string
          scheduled_message_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkin_followups_sent_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkin_followups_sent_scheduled_message_id_fkey"
            columns: ["scheduled_message_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_scheduled_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      checkin_notes: {
        Row: {
          checkin_id: string
          created_at: string | null
          id: string
          note: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          checkin_id: string
          created_at?: string | null
          id?: string
          note: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          checkin_id?: string
          created_at?: string | null
          id?: string
          note?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkin_notes_checkin_id_fkey"
            columns: ["checkin_id"]
            isOneToOne: false
            referencedRelation: "checkin"
            referencedColumns: ["id"]
          },
        ]
      }
      client_error_logs: {
        Row: {
          component_stack: string | null
          context: Json | null
          created_at: string
          id: string
          message: string | null
          resolved: boolean
          stack: string | null
          url: string | null
          user_agent: string | null
        }
        Insert: {
          component_stack?: string | null
          context?: Json | null
          created_at?: string
          id?: string
          message?: string | null
          resolved?: boolean
          stack?: string | null
          url?: string | null
          user_agent?: string | null
        }
        Update: {
          component_stack?: string | null
          context?: Json | null
          created_at?: string
          id?: string
          message?: string | null
          resolved?: boolean
          stack?: string | null
          url?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      commission_tiers: {
        Row: {
          closer_id: string | null
          commission_pct: number
          created_at: string
          id: string
          min_monthly_revenue: number
          payment_method_group_id: string | null
          tier_order: number
          user_id: string
        }
        Insert: {
          closer_id?: string | null
          commission_pct: number
          created_at?: string
          id?: string
          min_monthly_revenue: number
          payment_method_group_id?: string | null
          tier_order: number
          user_id: string
        }
        Update: {
          closer_id?: string | null
          commission_pct?: number
          created_at?: string
          id?: string
          min_monthly_revenue?: number
          payment_method_group_id?: string | null
          tier_order?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_tiers_payment_method_group_id_fkey"
            columns: ["payment_method_group_id"]
            isOneToOne: false
            referencedRelation: "payment_method_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      community_comments: {
        Row: {
          author_patient_id: string
          content: string
          created_at: string
          id: string
          is_hidden: boolean
          parent_comment_id: string | null
          post_id: string
        }
        Insert: {
          author_patient_id: string
          content: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          parent_comment_id?: string | null
          post_id: string
        }
        Update: {
          author_patient_id?: string
          content?: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          parent_comment_id?: string | null
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_author_patient_id_fkey"
            columns: ["author_patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          author_patient_id: string
          category: string
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_hidden: boolean
          trainer_user_id: string
        }
        Insert: {
          author_patient_id: string
          category?: string
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_hidden?: boolean
          trainer_user_id: string
        }
        Update: {
          author_patient_id?: string
          category?: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_hidden?: boolean
          trainer_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_author_patient_id_fkey"
            columns: ["author_patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      community_reactions: {
        Row: {
          created_at: string
          id: string
          patient_id: string
          post_id: string
          reaction_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          patient_id: string
          post_id: string
          reaction_type: string
        }
        Update: {
          created_at?: string
          id?: string
          patient_id?: string
          post_id?: string
          reaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_reactions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_reports: {
        Row: {
          created_at: string
          id: string
          reason: string | null
          reporter_patient_id: string
          resolved: boolean
          target_id: string
          target_type: string
          trainer_user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason?: string | null
          reporter_patient_id: string
          resolved?: boolean
          target_id: string
          target_type: string
          trainer_user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string | null
          reporter_patient_id?: string
          resolved?: boolean
          target_id?: string
          target_type?: string
          trainer_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_reports_reporter_patient_id_fkey"
            columns: ["reporter_patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_records: {
        Row: {
          audio_url: string | null
          created_at: string | null
          date: string
          duration_minutes: number | null
          feedback_nutricionista: string | null
          id: string
          metas_json: Json | null
          patient_id: string
          prontuario: string | null
          resumo_paciente: string | null
          transcript: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          created_at?: string | null
          date?: string
          duration_minutes?: number | null
          feedback_nutricionista?: string | null
          id?: string
          metas_json?: Json | null
          patient_id: string
          prontuario?: string | null
          resumo_paciente?: string | null
          transcript?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          audio_url?: string | null
          created_at?: string | null
          date?: string
          duration_minutes?: number | null
          feedback_nutricionista?: string | null
          id?: string
          metas_json?: Json | null
          patient_id?: string
          prontuario?: string | null
          resumo_paciente?: string | null
          transcript?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultation_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_history: {
        Row: {
          contact_date: string
          contact_type: string | null
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          patient_name: string | null
          telefone: string
          user_id: string | null
        }
        Insert: {
          contact_date?: string
          contact_type?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          patient_name?: string | null
          telefone: string
          user_id?: string | null
        }
        Update: {
          contact_date?: string
          contact_type?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          patient_name?: string | null
          telefone?: string
          user_id?: string | null
        }
        Relationships: []
      }
      daily_challenges: {
        Row: {
          challenge_description: string
          challenge_key: string
          challenge_name: string
          created_at: string | null
          display_order: number | null
          emoji: string | null
          icon_name: string | null
          id: string
          is_active: boolean | null
          points_earned: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          challenge_description: string
          challenge_key: string
          challenge_name: string
          created_at?: string | null
          display_order?: number | null
          emoji?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          points_earned?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          challenge_description?: string
          challenge_key?: string
          challenge_name?: string
          created_at?: string | null
          display_order?: number | null
          emoji?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          points_earned?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      daily_reports: {
        Row: {
          blockers: string | null
          created_at: string | null
          id: string
          member_id: string
          mood: string | null
          observations: string | null
          owner_id: string
          report_date: string
          tasks_completed: string
          tasks_planned: string
          updated_at: string | null
        }
        Insert: {
          blockers?: string | null
          created_at?: string | null
          id?: string
          member_id: string
          mood?: string | null
          observations?: string | null
          owner_id: string
          report_date: string
          tasks_completed: string
          tasks_planned: string
          updated_at?: string | null
        }
        Update: {
          blockers?: string | null
          created_at?: string | null
          id?: string
          member_id?: string
          mood?: string | null
          observations?: string | null
          owner_id?: string
          report_date?: string
          tasks_completed?: string
          tasks_planned?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      dashboard_cac: {
        Row: {
          churn_mensal: number | null
          duracao_media: number
          google_extra: number | null
          google_spend: number
          indicacoes: number | null
          indicacoes_valor: number | null
          mes: string
          meta_extra: number | null
          meta_spend: number
          outros_spend: number
          renovacoes: number | null
          renovacoes_valor: number | null
          total_vendas: number | null
          updated_at: string
        }
        Insert: {
          churn_mensal?: number | null
          duracao_media?: number
          google_extra?: number | null
          google_spend?: number
          indicacoes?: number | null
          indicacoes_valor?: number | null
          mes: string
          meta_extra?: number | null
          meta_spend?: number
          outros_spend?: number
          renovacoes?: number | null
          renovacoes_valor?: number | null
          total_vendas?: number | null
          updated_at?: string
        }
        Update: {
          churn_mensal?: number | null
          duracao_media?: number
          google_extra?: number | null
          google_spend?: number
          indicacoes?: number | null
          indicacoes_valor?: number | null
          mes?: string
          meta_extra?: number | null
          meta_spend?: number
          outros_spend?: number
          renovacoes?: number | null
          renovacoes_valor?: number | null
          total_vendas?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      dashboard_dados: {
        Row: {
          ano: string | null
          ativos_total_inicio_mes: string | null
          churn_max: string | null
          congelamento: string | null
          created_at: string | null
          data_referencia: string | null
          desistencia: string | null
          entraram: string | null
          id: number
          mes: string | null
          mes_numero: string | null
          nao_renovou: string | null
          percentual_churn: string | null
          percentual_renovacao: string | null
          sairam: string | null
          saldo_entrada_saida: string | null
          updated_at: string | null
          user_id: string | null
          vencimentos: string | null
        }
        Insert: {
          ano?: string | null
          ativos_total_inicio_mes?: string | null
          churn_max?: string | null
          congelamento?: string | null
          created_at?: string | null
          data_referencia?: string | null
          desistencia?: string | null
          entraram?: string | null
          id?: number
          mes?: string | null
          mes_numero?: string | null
          nao_renovou?: string | null
          percentual_churn?: string | null
          percentual_renovacao?: string | null
          sairam?: string | null
          saldo_entrada_saida?: string | null
          updated_at?: string | null
          user_id?: string | null
          vencimentos?: string | null
        }
        Update: {
          ano?: string | null
          ativos_total_inicio_mes?: string | null
          churn_max?: string | null
          congelamento?: string | null
          created_at?: string | null
          data_referencia?: string | null
          desistencia?: string | null
          entraram?: string | null
          id?: number
          mes?: string | null
          mes_numero?: string | null
          nao_renovou?: string | null
          percentual_churn?: string | null
          percentual_renovacao?: string | null
          sairam?: string | null
          saldo_entrada_saida?: string | null
          updated_at?: string | null
          user_id?: string | null
          vencimentos?: string | null
        }
        Relationships: []
      }
      dashboard_financeiro: {
        Row: {
          alunos_ativos: number | null
          alunos_cancelados: number | null
          created_at: string | null
          despesa_desenvolvimento: number | null
          despesa_equipe: number | null
          despesa_estrutura: number | null
          despesa_ferramentas: number | null
          despesa_gestao: number | null
          despesa_taxas: number | null
          despesa_trafego: number | null
          distribuicao: number | null
          faturamento: number
          id: string
          mes: string
          notas: string | null
          novos_alunos: number | null
          recebido: number
          receita_appmax: number | null
          receita_asaas: number | null
          receita_celcash: number | null
          receita_dom: number | null
          receita_outros: number | null
          receita_pagarme: number | null
          renovacoes: number | null
          updated_at: string | null
        }
        Insert: {
          alunos_ativos?: number | null
          alunos_cancelados?: number | null
          created_at?: string | null
          despesa_desenvolvimento?: number | null
          despesa_equipe?: number | null
          despesa_estrutura?: number | null
          despesa_ferramentas?: number | null
          despesa_gestao?: number | null
          despesa_taxas?: number | null
          despesa_trafego?: number | null
          distribuicao?: number | null
          faturamento?: number
          id?: string
          mes: string
          notas?: string | null
          novos_alunos?: number | null
          recebido?: number
          receita_appmax?: number | null
          receita_asaas?: number | null
          receita_celcash?: number | null
          receita_dom?: number | null
          receita_outros?: number | null
          receita_pagarme?: number | null
          renovacoes?: number | null
          updated_at?: string | null
        }
        Update: {
          alunos_ativos?: number | null
          alunos_cancelados?: number | null
          created_at?: string | null
          despesa_desenvolvimento?: number | null
          despesa_equipe?: number | null
          despesa_estrutura?: number | null
          despesa_ferramentas?: number | null
          despesa_gestao?: number | null
          despesa_taxas?: number | null
          despesa_trafego?: number | null
          distribuicao?: number | null
          faturamento?: number
          id?: string
          mes?: string
          notas?: string | null
          novos_alunos?: number | null
          recebido?: number
          receita_appmax?: number | null
          receita_asaas?: number | null
          receita_celcash?: number | null
          receita_dom?: number | null
          receita_outros?: number | null
          receita_pagarme?: number | null
          renovacoes?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      diet_adjustment_prompt_templates: {
        Row: {
          ai_model: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          max_tokens: number | null
          name: string
          prompt_template: string
          temperature: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ai_model?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          max_tokens?: number | null
          name: string
          prompt_template: string
          temperature?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ai_model?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          max_tokens?: number | null
          name?: string
          prompt_template?: string
          temperature?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      diet_ai_adjustments: {
        Row: {
          adjustment_summary: string | null
          ai_model: string | null
          checkin_id: string
          created_at: string | null
          custom_instructions: string | null
          feedback_text: string | null
          id: string
          notes: string | null
          original_plan_id: string | null
          patient_id: string
          prompt_template_id: string | null
          raw_ai_response: Json | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          suggested_plan_id: string | null
        }
        Insert: {
          adjustment_summary?: string | null
          ai_model?: string | null
          checkin_id: string
          created_at?: string | null
          custom_instructions?: string | null
          feedback_text?: string | null
          id?: string
          notes?: string | null
          original_plan_id?: string | null
          patient_id: string
          prompt_template_id?: string | null
          raw_ai_response?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          suggested_plan_id?: string | null
        }
        Update: {
          adjustment_summary?: string | null
          ai_model?: string | null
          checkin_id?: string
          created_at?: string | null
          custom_instructions?: string | null
          feedback_text?: string | null
          id?: string
          notes?: string | null
          original_plan_id?: string | null
          patient_id?: string
          prompt_template_id?: string | null
          raw_ai_response?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          suggested_plan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diet_ai_adjustments_original_plan_id_fkey"
            columns: ["original_plan_id"]
            isOneToOne: false
            referencedRelation: "diet_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diet_ai_adjustments_suggested_plan_id_fkey"
            columns: ["suggested_plan_id"]
            isOneToOne: false
            referencedRelation: "diet_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_ai_generations: {
        Row: {
          ai_response: Json
          anamnesis_data: Json
          created_at: string | null
          diet_plan_id: string | null
          duration_ms: number | null
          edit_diff: Json | null
          id: string
          input_metrics: Json | null
          input_tokens: number | null
          model: string | null
          output_tokens: number | null
          patient_id: string
          prompt_version: string | null
          reference_plan_ids: string[] | null
          regenerated_meal_ids: string[] | null
          scope: string | null
          status: string
          user_id: string | null
          validation_warnings: Json | null
          was_edited_before_release: boolean
        }
        Insert: {
          ai_response: Json
          anamnesis_data: Json
          created_at?: string | null
          diet_plan_id?: string | null
          duration_ms?: number | null
          edit_diff?: Json | null
          id?: string
          input_metrics?: Json | null
          input_tokens?: number | null
          model?: string | null
          output_tokens?: number | null
          patient_id: string
          prompt_version?: string | null
          reference_plan_ids?: string[] | null
          regenerated_meal_ids?: string[] | null
          scope?: string | null
          status?: string
          user_id?: string | null
          validation_warnings?: Json | null
          was_edited_before_release?: boolean
        }
        Update: {
          ai_response?: Json
          anamnesis_data?: Json
          created_at?: string | null
          diet_plan_id?: string | null
          duration_ms?: number | null
          edit_diff?: Json | null
          id?: string
          input_metrics?: Json | null
          input_tokens?: number | null
          model?: string | null
          output_tokens?: number | null
          patient_id?: string
          prompt_version?: string | null
          reference_plan_ids?: string[] | null
          regenerated_meal_ids?: string[] | null
          scope?: string | null
          status?: string
          user_id?: string | null
          validation_warnings?: Json | null
          was_edited_before_release?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "diet_ai_generations_diet_plan_id_fkey"
            columns: ["diet_plan_id"]
            isOneToOne: false
            referencedRelation: "diet_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diet_ai_generations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_daily_consumption: {
        Row: {
          completion_percentage: number | null
          consumed_foods: Json
          consumed_meals: Json | null
          consumption_date: string
          created_at: string | null
          diet_plan_id: string | null
          id: string
          patient_id: string | null
          target_calories: number | null
          target_carbs: number | null
          target_fats: number | null
          target_protein: number | null
          total_calories_consumed: number | null
          total_carbs_consumed: number | null
          total_fats_consumed: number | null
          total_protein_consumed: number | null
          updated_at: string | null
        }
        Insert: {
          completion_percentage?: number | null
          consumed_foods?: Json
          consumed_meals?: Json | null
          consumption_date?: string
          created_at?: string | null
          diet_plan_id?: string | null
          id?: string
          patient_id?: string | null
          target_calories?: number | null
          target_carbs?: number | null
          target_fats?: number | null
          target_protein?: number | null
          total_calories_consumed?: number | null
          total_carbs_consumed?: number | null
          total_fats_consumed?: number | null
          total_protein_consumed?: number | null
          updated_at?: string | null
        }
        Update: {
          completion_percentage?: number | null
          consumed_foods?: Json
          consumed_meals?: Json | null
          consumption_date?: string
          created_at?: string | null
          diet_plan_id?: string | null
          id?: string
          patient_id?: string | null
          target_calories?: number | null
          target_carbs?: number | null
          target_fats?: number | null
          target_protein?: number | null
          total_calories_consumed?: number | null
          total_carbs_consumed?: number | null
          total_fats_consumed?: number | null
          total_protein_consumed?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diet_daily_consumption_diet_plan_id_fkey"
            columns: ["diet_plan_id"]
            isOneToOne: false
            referencedRelation: "diet_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diet_daily_consumption_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_foods: {
        Row: {
          calories: number | null
          carbs: number | null
          created_at: string | null
          custom_unit_grams: number | null
          custom_unit_name: string | null
          fats: number | null
          food_id: string | null
          food_name: string
          food_order: number
          id: string
          meal_id: string
          notes: string | null
          protein: number | null
          quantity: number
          substitutions: Json
          unit: string
        }
        Insert: {
          calories?: number | null
          carbs?: number | null
          created_at?: string | null
          custom_unit_grams?: number | null
          custom_unit_name?: string | null
          fats?: number | null
          food_id?: string | null
          food_name: string
          food_order?: number
          id?: string
          meal_id: string
          notes?: string | null
          protein?: number | null
          quantity: number
          substitutions?: Json
          unit?: string
        }
        Update: {
          calories?: number | null
          carbs?: number | null
          created_at?: string | null
          custom_unit_grams?: number | null
          custom_unit_name?: string | null
          fats?: number | null
          food_id?: string | null
          food_name?: string
          food_order?: number
          id?: string
          meal_id?: string
          notes?: string | null
          protein?: number | null
          quantity?: number
          substitutions?: Json
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "diet_foods_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "food_database"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diet_foods_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "diet_meals"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_generation_prompt_templates: {
        Row: {
          ai_model: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_default: boolean
          max_tokens: number
          name: string
          prompt_template: string
          temperature: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ai_model?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          max_tokens?: number
          name: string
          prompt_template: string
          temperature?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ai_model?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          max_tokens?: number
          name?: string
          prompt_template?: string
          temperature?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      diet_guideline_history_hidden: {
        Row: {
          content_key: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          content_key: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          content_key?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      diet_guidelines: {
        Row: {
          content: string
          created_at: string | null
          diet_plan_id: string | null
          guideline_type: string
          id: string
          is_active: boolean | null
          is_archived: boolean
          is_template: boolean | null
          priority: number
          title: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          diet_plan_id?: string | null
          guideline_type: string
          id?: string
          is_active?: boolean | null
          is_archived?: boolean
          is_template?: boolean | null
          priority?: number
          title: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          diet_plan_id?: string | null
          guideline_type?: string
          id?: string
          is_active?: boolean | null
          is_archived?: boolean
          is_template?: boolean | null
          priority?: number
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diet_guidelines_diet_plan_id_fkey"
            columns: ["diet_plan_id"]
            isOneToOne: false
            referencedRelation: "diet_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_meals: {
        Row: {
          calories: number | null
          carbs: number | null
          created_at: string | null
          day_of_week: number | null
          diet_plan_id: string
          end_time: string | null
          exclude_from_macros: boolean | null
          fats: number | null
          favorite: boolean | null
          id: string
          instructions: string | null
          meal_name: string
          meal_order: number
          meal_type: string
          parent_meal_id: string | null
          protein: number | null
          start_time: string | null
          suggested_time: string | null
        }
        Insert: {
          calories?: number | null
          carbs?: number | null
          created_at?: string | null
          day_of_week?: number | null
          diet_plan_id: string
          end_time?: string | null
          exclude_from_macros?: boolean | null
          fats?: number | null
          favorite?: boolean | null
          id?: string
          instructions?: string | null
          meal_name: string
          meal_order?: number
          meal_type: string
          parent_meal_id?: string | null
          protein?: number | null
          start_time?: string | null
          suggested_time?: string | null
        }
        Update: {
          calories?: number | null
          carbs?: number | null
          created_at?: string | null
          day_of_week?: number | null
          diet_plan_id?: string
          end_time?: string | null
          exclude_from_macros?: boolean | null
          fats?: number | null
          favorite?: boolean | null
          id?: string
          instructions?: string | null
          meal_name?: string
          meal_order?: number
          meal_type?: string
          parent_meal_id?: string | null
          protein?: number | null
          start_time?: string | null
          suggested_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diet_meals_diet_plan_id_fkey"
            columns: ["diet_plan_id"]
            isOneToOne: false
            referencedRelation: "diet_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diet_meals_parent_meal_id_fkey"
            columns: ["parent_meal_id"]
            isOneToOne: false
            referencedRelation: "diet_meals"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_plan_templates: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_favorite: boolean | null
          is_public: boolean | null
          name: string
          total_calories: number | null
          total_carbs: number | null
          total_fats: number | null
          total_protein: number | null
          updated_at: string | null
          usage_count: number | null
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_favorite?: boolean | null
          is_public?: boolean | null
          name: string
          total_calories?: number | null
          total_carbs?: number | null
          total_fats?: number | null
          total_protein?: number | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_favorite?: boolean | null
          is_public?: boolean | null
          name?: string
          total_calories?: number | null
          total_carbs?: number | null
          total_fats?: number | null
          total_protein?: number | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      diet_plan_version_foods: {
        Row: {
          calories: number | null
          carbs: number | null
          custom_unit_grams: number | null
          custom_unit_name: string | null
          fats: number | null
          food_id: string | null
          food_name: string
          food_order: number
          id: string
          notes: string | null
          protein: number | null
          quantity: number
          substitutions: Json | null
          unit: string
          version_meal_id: string | null
        }
        Insert: {
          calories?: number | null
          carbs?: number | null
          custom_unit_grams?: number | null
          custom_unit_name?: string | null
          fats?: number | null
          food_id?: string | null
          food_name: string
          food_order: number
          id?: string
          notes?: string | null
          protein?: number | null
          quantity: number
          substitutions?: Json | null
          unit: string
          version_meal_id?: string | null
        }
        Update: {
          calories?: number | null
          carbs?: number | null
          custom_unit_grams?: number | null
          custom_unit_name?: string | null
          fats?: number | null
          food_id?: string | null
          food_name?: string
          food_order?: number
          id?: string
          notes?: string | null
          protein?: number | null
          quantity?: number
          substitutions?: Json | null
          unit?: string
          version_meal_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diet_plan_version_foods_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "food_database"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diet_plan_version_foods_version_meal_id_fkey"
            columns: ["version_meal_id"]
            isOneToOne: false
            referencedRelation: "diet_plan_version_meals"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_plan_version_meals: {
        Row: {
          calories: number | null
          carbs: number | null
          day_of_week: number | null
          end_time: string | null
          exclude_from_macros: boolean
          fats: number | null
          id: string
          instructions: string | null
          meal_name: string
          meal_order: number
          meal_type: string
          parent_meal_id: string | null
          protein: number | null
          start_time: string | null
          suggested_time: string | null
          version_id: string | null
        }
        Insert: {
          calories?: number | null
          carbs?: number | null
          day_of_week?: number | null
          end_time?: string | null
          exclude_from_macros?: boolean
          fats?: number | null
          id?: string
          instructions?: string | null
          meal_name: string
          meal_order: number
          meal_type: string
          parent_meal_id?: string | null
          protein?: number | null
          start_time?: string | null
          suggested_time?: string | null
          version_id?: string | null
        }
        Update: {
          calories?: number | null
          carbs?: number | null
          day_of_week?: number | null
          end_time?: string | null
          exclude_from_macros?: boolean
          fats?: number | null
          id?: string
          instructions?: string | null
          meal_name?: string
          meal_order?: number
          meal_type?: string
          parent_meal_id?: string | null
          protein?: number | null
          start_time?: string | null
          suggested_time?: string | null
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diet_plan_version_meals_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "diet_plan_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_plan_versions: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          notes: string | null
          plan_id: string | null
          total_calories: number | null
          total_carbs: number | null
          total_fats: number | null
          total_protein: number | null
          version_number: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          notes?: string | null
          plan_id?: string | null
          total_calories?: number | null
          total_carbs?: number | null
          total_fats?: number | null
          total_protein?: number | null
          version_number: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          notes?: string | null
          plan_id?: string | null
          total_calories?: number | null
          total_carbs?: number | null
          total_fats?: number | null
          total_protein?: number | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "diet_plan_versions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "diet_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_plans: {
        Row: {
          active: boolean | null
          ai_generation_id: string | null
          created_at: string | null
          created_by: string | null
          end_date: string | null
          favorite: boolean | null
          generated_by: string | null
          id: string
          is_released: boolean | null
          is_weekly: boolean | null
          name: string
          notes: string | null
          parent_plan_id: string | null
          patient_id: string
          ready: boolean | null
          released_at: string | null
          start_date: string | null
          status: string
          target_calories: number | null
          target_carbs: number | null
          target_fats: number | null
          target_protein: number | null
          template_id: string | null
          template_is_public: boolean
          total_calories: number | null
          total_carbs: number | null
          total_fats: number | null
          total_protein: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          active?: boolean | null
          ai_generation_id?: string | null
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          favorite?: boolean | null
          generated_by?: string | null
          id?: string
          is_released?: boolean | null
          is_weekly?: boolean | null
          name: string
          notes?: string | null
          parent_plan_id?: string | null
          patient_id: string
          ready?: boolean | null
          released_at?: string | null
          start_date?: string | null
          status?: string
          target_calories?: number | null
          target_carbs?: number | null
          target_fats?: number | null
          target_protein?: number | null
          template_id?: string | null
          template_is_public?: boolean
          total_calories?: number | null
          total_carbs?: number | null
          total_fats?: number | null
          total_protein?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          active?: boolean | null
          ai_generation_id?: string | null
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          favorite?: boolean | null
          generated_by?: string | null
          id?: string
          is_released?: boolean | null
          is_weekly?: boolean | null
          name?: string
          notes?: string | null
          parent_plan_id?: string | null
          patient_id?: string
          ready?: boolean | null
          released_at?: string | null
          start_date?: string | null
          status?: string
          target_calories?: number | null
          target_carbs?: number | null
          target_fats?: number | null
          target_protein?: number | null
          template_id?: string | null
          template_is_public?: boolean
          total_calories?: number | null
          total_carbs?: number | null
          total_fats?: number | null
          total_protein?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diet_plans_ai_generation_id_fkey"
            columns: ["ai_generation_id"]
            isOneToOne: false
            referencedRelation: "diet_ai_generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diet_plans_parent_plan_id_fkey"
            columns: ["parent_plan_id"]
            isOneToOne: false
            referencedRelation: "diet_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diet_plans_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diet_plans_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "diet_plan_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_questions: {
        Row: {
          answer: string | null
          answered_at: string | null
          answered_by: string | null
          created_at: string | null
          diet_plan_id: string
          id: string
          patient_id: string
          question: string
          status: string
        }
        Insert: {
          answer?: string | null
          answered_at?: string | null
          answered_by?: string | null
          created_at?: string | null
          diet_plan_id: string
          id?: string
          patient_id: string
          question: string
          status?: string
        }
        Update: {
          answer?: string | null
          answered_at?: string | null
          answered_by?: string | null
          created_at?: string | null
          diet_plan_id?: string
          id?: string
          patient_id?: string
          question?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "diet_questions_diet_plan_id_fkey"
            columns: ["diet_plan_id"]
            isOneToOne: false
            referencedRelation: "diet_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diet_questions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_template_foods: {
        Row: {
          calories: number | null
          carbs: number | null
          created_at: string | null
          fats: number | null
          food_id: string | null
          food_name: string
          food_order: number
          id: string
          notes: string | null
          protein: number | null
          quantity: number
          template_meal_id: string | null
          unit: string
        }
        Insert: {
          calories?: number | null
          carbs?: number | null
          created_at?: string | null
          fats?: number | null
          food_id?: string | null
          food_name: string
          food_order: number
          id?: string
          notes?: string | null
          protein?: number | null
          quantity: number
          template_meal_id?: string | null
          unit: string
        }
        Update: {
          calories?: number | null
          carbs?: number | null
          created_at?: string | null
          fats?: number | null
          food_id?: string | null
          food_name?: string
          food_order?: number
          id?: string
          notes?: string | null
          protein?: number | null
          quantity?: number
          template_meal_id?: string | null
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "diet_template_foods_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "food_database"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diet_template_foods_template_meal_id_fkey"
            columns: ["template_meal_id"]
            isOneToOne: false
            referencedRelation: "diet_template_meals"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_template_guidelines: {
        Row: {
          content: string
          created_at: string | null
          guideline_type: string
          id: string
          priority: number
          template_id: string
          title: string
        }
        Insert: {
          content: string
          created_at?: string | null
          guideline_type: string
          id?: string
          priority?: number
          template_id: string
          title: string
        }
        Update: {
          content?: string
          created_at?: string | null
          guideline_type?: string
          id?: string
          priority?: number
          template_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "diet_template_guidelines_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "diet_plan_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_template_meals: {
        Row: {
          calories: number | null
          carbs: number | null
          created_at: string | null
          end_time: string | null
          exclude_from_macros: boolean
          fats: number | null
          id: string
          instructions: string | null
          meal_name: string
          meal_order: number
          meal_type: string
          parent_template_meal_id: string | null
          protein: number | null
          start_time: string | null
          suggested_time: string | null
          template_id: string | null
        }
        Insert: {
          calories?: number | null
          carbs?: number | null
          created_at?: string | null
          end_time?: string | null
          exclude_from_macros?: boolean
          fats?: number | null
          id?: string
          instructions?: string | null
          meal_name: string
          meal_order: number
          meal_type: string
          parent_template_meal_id?: string | null
          protein?: number | null
          start_time?: string | null
          suggested_time?: string | null
          template_id?: string | null
        }
        Update: {
          calories?: number | null
          carbs?: number | null
          created_at?: string | null
          end_time?: string | null
          exclude_from_macros?: boolean
          fats?: number | null
          id?: string
          instructions?: string | null
          meal_name?: string
          meal_order?: number
          meal_type?: string
          parent_template_meal_id?: string | null
          protein?: number | null
          start_time?: string | null
          suggested_time?: string | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diet_template_meals_parent_template_meal_id_fkey"
            columns: ["parent_template_meal_id"]
            isOneToOne: false
            referencedRelation: "diet_template_meals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diet_template_meals_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "diet_plan_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_templates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_public: boolean | null
          name: string
          template_data: Json
          total_calories: number | null
          total_carbs: number | null
          total_fats: number | null
          total_protein: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          name: string
          template_data: Json
          total_calories?: number | null
          total_carbs?: number | null
          total_fats?: number | null
          total_protein?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          name?: string
          template_data?: Json
          total_calories?: number | null
          total_carbs?: number | null
          total_fats?: number | null
          total_protein?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      evolution_dossies: {
        Row: {
          ai_content: Json | null
          checkin_summary: Json | null
          created_at: string | null
          edited_content: Json | null
          expires_at: string | null
          id: string
          metrics_data: Json | null
          patient_id: string | null
          photo_current_urls: Json | null
          photo_initial_urls: Json | null
          prompt_template_id: string | null
          shared_at: string | null
          status: string
          telefone: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_content?: Json | null
          checkin_summary?: Json | null
          created_at?: string | null
          edited_content?: Json | null
          expires_at?: string | null
          id?: string
          metrics_data?: Json | null
          patient_id?: string | null
          photo_current_urls?: Json | null
          photo_initial_urls?: Json | null
          prompt_template_id?: string | null
          shared_at?: string | null
          status?: string
          telefone: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_content?: Json | null
          checkin_summary?: Json | null
          created_at?: string | null
          edited_content?: Json | null
          expires_at?: string | null
          id?: string
          metrics_data?: Json | null
          patient_id?: string | null
          photo_current_urls?: Json | null
          photo_initial_urls?: Json | null
          prompt_template_id?: string | null
          shared_at?: string | null
          status?: string
          telefone?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evolution_dossies_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_types: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      exercise_database: {
        Row: {
          category: string | null
          created_at: string | null
          difficulty: string | null
          equipment: string | null
          id: string
          instructions: string | null
          is_active: boolean
          is_unilateral: boolean
          mfit_category_id: number | null
          mfit_group_id: number | null
          mfit_id: string | null
          mfit_muscle_group_code: string | null
          mfit_source: string | null
          muscle_group: string | null
          name: string
          name_unaccent: string | null
          original_video_url: string | null
          owner_user_id: string | null
          priority: number | null
          skip_periodization: boolean
          source: string | null
          thumbnail_url: string | null
          tips: string | null
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          difficulty?: string | null
          equipment?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          is_unilateral?: boolean
          mfit_category_id?: number | null
          mfit_group_id?: number | null
          mfit_id?: string | null
          mfit_muscle_group_code?: string | null
          mfit_source?: string | null
          muscle_group?: string | null
          name: string
          name_unaccent?: string | null
          original_video_url?: string | null
          owner_user_id?: string | null
          priority?: number | null
          skip_periodization?: boolean
          source?: string | null
          thumbnail_url?: string | null
          tips?: string | null
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          difficulty?: string | null
          equipment?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          is_unilateral?: boolean
          mfit_category_id?: number | null
          mfit_group_id?: number | null
          mfit_id?: string | null
          mfit_muscle_group_code?: string | null
          mfit_source?: string | null
          muscle_group?: string | null
          name?: string
          name_unaccent?: string | null
          original_video_url?: string | null
          owner_user_id?: string | null
          priority?: number | null
          skip_periodization?: boolean
          source?: string | null
          thumbnail_url?: string | null
          tips?: string | null
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      exercise_favorites: {
        Row: {
          created_at: string
          created_by: string | null
          exercise_id: string
          id: string
          notes: string | null
          owner_user_id: string
          reps: string | null
          rest_seconds: number | null
          rest_seconds_max: number | null
          rpe: number | null
          rpe_per_set: string | null
          sets: number | null
          tempo: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          exercise_id: string
          id?: string
          notes?: string | null
          owner_user_id?: string
          reps?: string | null
          rest_seconds?: number | null
          rest_seconds_max?: number | null
          rpe?: number | null
          rpe_per_set?: string | null
          sets?: number | null
          tempo?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          exercise_id?: string
          id?: string
          notes?: string | null
          owner_user_id?: string
          reps?: string | null
          rest_seconds?: number | null
          rest_seconds_max?: number | null
          rpe?: number | null
          rpe_per_set?: string | null
          sets?: number | null
          tempo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_favorites_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercise_database"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_muscle_groups: {
        Row: {
          activation: number
          created_at: string | null
          exercise_id: string
          id: string
          is_primary: boolean | null
          muscle_group_id: string
        }
        Insert: {
          activation: number
          created_at?: string | null
          exercise_id: string
          id?: string
          is_primary?: boolean | null
          muscle_group_id: string
        }
        Update: {
          activation?: number
          created_at?: string | null
          exercise_id?: string
          id?: string
          is_primary?: boolean | null
          muscle_group_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_muscle_groups_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercise_database"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_muscle_groups_muscle_group_id_fkey"
            columns: ["muscle_group_id"]
            isOneToOne: false
            referencedRelation: "muscle_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_pinned_substitutes: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          patient_id: string
          substitute_exercise_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          patient_id: string
          substitute_exercise_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          patient_id?: string
          substitute_exercise_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_pinned_substitutes_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercise_database"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_pinned_substitutes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_pinned_substitutes_substitute_exercise_id_fkey"
            columns: ["substitute_exercise_id"]
            isOneToOne: false
            referencedRelation: "exercise_database"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_meal_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          owner_user_id: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          owner_user_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          owner_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      favorite_substitute_groups: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          items: Json
          name: string
          owner_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          items?: Json
          name: string
          owner_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          items?: Json
          name?: string
          owner_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          description: string | null
          enabled: boolean
          key: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          enabled?: boolean
          key: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          enabled?: boolean
          key?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      featured_photo_comparison: {
        Row: {
          after_photo_date: string
          after_photo_url: string
          after_position_x: number | null
          after_position_y: number | null
          after_weight: number | null
          after_zoom: number | null
          before_photo_date: string
          before_photo_url: string
          before_position_x: number | null
          before_position_y: number | null
          before_weight: number | null
          before_zoom: number | null
          created_at: string | null
          description: string | null
          id: string
          is_visible: boolean | null
          telefone: string
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          after_photo_date: string
          after_photo_url: string
          after_position_x?: number | null
          after_position_y?: number | null
          after_weight?: number | null
          after_zoom?: number | null
          before_photo_date: string
          before_photo_url: string
          before_position_x?: number | null
          before_position_y?: number | null
          before_weight?: number | null
          before_zoom?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_visible?: boolean | null
          telefone: string
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          after_photo_date?: string
          after_photo_url?: string
          after_position_x?: number | null
          after_position_y?: number | null
          after_weight?: number | null
          after_zoom?: number | null
          before_photo_date?: string
          before_photo_url?: string
          before_position_x?: number | null
          before_position_y?: number | null
          before_weight?: number | null
          before_zoom?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_visible?: boolean | null
          telefone?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      feedback_prompt_templates: {
        Row: {
          ai_model: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          max_tokens: number | null
          name: string
          prompt_template: string
          temperature: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ai_model?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          max_tokens?: number | null
          name: string
          prompt_template: string
          temperature?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ai_model?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          max_tokens?: number | null
          name?: string
          prompt_template?: string
          temperature?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      food_database: {
        Row: {
          calories_per_100g: number
          carbs_per_100g: number
          category: string
          common_units: Json | null
          created_at: string | null
          fats_per_100g: number
          fiber_per_100g: number | null
          id: string
          is_active: boolean | null
          name: string
          needs_nutrient_review: boolean
          protein_per_100g: number
          sodium_per_100g: number | null
          source: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          calories_per_100g: number
          carbs_per_100g?: number
          category: string
          common_units?: Json | null
          created_at?: string | null
          fats_per_100g?: number
          fiber_per_100g?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          needs_nutrient_review?: boolean
          protein_per_100g?: number
          sodium_per_100g?: number | null
          source?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          calories_per_100g?: number
          carbs_per_100g?: number
          category?: string
          common_units?: Json | null
          created_at?: string | null
          fats_per_100g?: number
          fiber_per_100g?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          needs_nutrient_review?: boolean
          protein_per_100g?: number
          sodium_per_100g?: number | null
          source?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      food_favorites: {
        Row: {
          created_at: string
          food_id: string | null
          food_name: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          food_id?: string | null
          food_name: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          food_id?: string | null
          food_name?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_favorites_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "food_database"
            referencedColumns: ["id"]
          },
        ]
      }
      food_group_items: {
        Row: {
          created_at: string | null
          food_id: string | null
          food_name: string
          group_id: string | null
          id: string
          item_order: number
          quantity: number
          unit: string
        }
        Insert: {
          created_at?: string | null
          food_id?: string | null
          food_name: string
          group_id?: string | null
          id?: string
          item_order: number
          quantity: number
          unit: string
        }
        Update: {
          created_at?: string | null
          food_id?: string | null
          food_name?: string
          group_id?: string | null
          id?: string
          item_order?: number
          quantity?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_group_items_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "food_database"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_group_items_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "food_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      food_groups: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_favorite: boolean | null
          name: string
          updated_at: string | null
          usage_count: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_favorite?: boolean | null
          name: string
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_favorite?: boolean | null
          name?: string
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      food_usage_stats: {
        Row: {
          created_at: string | null
          food_id: string | null
          food_name: string
          id: string
          last_used_at: string | null
          meal_type: string | null
          updated_at: string | null
          usage_count: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          food_id?: string | null
          food_name: string
          id?: string
          last_used_at?: string | null
          meal_type?: string | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          food_id?: string | null
          food_name?: string
          id?: string
          last_used_at?: string | null
          meal_type?: string | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "food_usage_stats_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "food_database"
            referencedColumns: ["id"]
          },
        ]
      }
      glossary_terms: {
        Row: {
          category: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          long_description: string | null
          short_tooltip: string
          slug: string
          term: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          long_description?: string | null
          short_tooltip: string
          slug: string
          term: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          long_description?: string | null
          short_tooltip?: string
          slug?: string
          term?: string
          updated_at?: string
        }
        Relationships: []
      }
      guideline_share_tokens: {
        Row: {
          access_count: number | null
          created_at: string | null
          guideline_id: string
          last_accessed_at: string | null
          revoked_at: string | null
          token: string
          user_id: string
        }
        Insert: {
          access_count?: number | null
          created_at?: string | null
          guideline_id: string
          last_accessed_at?: string | null
          revoked_at?: string | null
          token?: string
          user_id: string
        }
        Update: {
          access_count?: number | null
          created_at?: string | null
          guideline_id?: string
          last_accessed_at?: string | null
          revoked_at?: string | null
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guideline_share_tokens_guideline_id_fkey"
            columns: ["guideline_id"]
            isOneToOne: true
            referencedRelation: "diet_guidelines"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_progress: {
        Row: {
          done: boolean
          task_id: string
          updated_at: string
        }
        Insert: {
          done?: boolean
          task_id: string
          updated_at?: string
        }
        Update: {
          done?: boolean
          task_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      journey_model_stages: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          model_id: string
          name: string
          position: number
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          model_id: string
          name: string
          position?: number
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          model_id?: string
          name?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "journey_model_stages_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "journey_models"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_model_task_tags: {
        Row: {
          created_at: string | null
          model_task_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          model_task_id: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          model_task_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journey_model_task_tags_model_task_id_fkey"
            columns: ["model_task_id"]
            isOneToOne: false
            referencedRelation: "journey_model_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_model_task_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "journey_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_model_tasks: {
        Row: {
          created_at: string | null
          description: string | null
          estimate_relative_to: string | null
          estimate_unit: string | null
          estimate_value: number | null
          id: string
          is_protocol_reminder: boolean | null
          model_id: string
          position: number
          stage_id: string
          task_type: string
          title: string
          whatsapp_message: string | null
          whatsapp_send_time: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          estimate_relative_to?: string | null
          estimate_unit?: string | null
          estimate_value?: number | null
          id?: string
          is_protocol_reminder?: boolean | null
          model_id: string
          position?: number
          stage_id: string
          task_type?: string
          title: string
          whatsapp_message?: string | null
          whatsapp_send_time?: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          estimate_relative_to?: string | null
          estimate_unit?: string | null
          estimate_value?: number | null
          id?: string
          is_protocol_reminder?: boolean | null
          model_id?: string
          position?: number
          stage_id?: string
          task_type?: string
          title?: string
          whatsapp_message?: string | null
          whatsapp_send_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "journey_model_tasks_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "journey_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_model_tasks_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "journey_model_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_models: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          estimated_unit: string | null
          estimated_weeks: number | null
          id: string
          is_system_template: boolean | null
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          estimated_unit?: string | null
          estimated_weeks?: number | null
          id?: string
          is_system_template?: boolean | null
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          estimated_unit?: string | null
          estimated_weeks?: number | null
          id?: string
          is_system_template?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      journey_tags: {
        Row: {
          color: string
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      laboratory_exams: {
        Row: {
          completed_at: string | null
          created_at: string | null
          exam_category: string | null
          exam_name: string
          exam_type_id: string | null
          id: string
          instructions: string | null
          notes: string | null
          patient_id: string | null
          requested_at: string
          requested_by: string | null
          result_file_url: string | null
          result_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          telefone: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          exam_category?: string | null
          exam_name: string
          exam_type_id?: string | null
          id?: string
          instructions?: string | null
          notes?: string | null
          patient_id?: string | null
          requested_at?: string
          requested_by?: string | null
          result_file_url?: string | null
          result_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          telefone: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          exam_category?: string | null
          exam_name?: string
          exam_type_id?: string | null
          id?: string
          instructions?: string | null
          notes?: string | null
          patient_id?: string | null
          requested_at?: string
          requested_by?: string | null
          result_file_url?: string | null
          result_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          telefone?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "laboratory_exams_exam_type_id_fkey"
            columns: ["exam_type_id"]
            isOneToOne: false
            referencedRelation: "exam_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "laboratory_exams_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "laboratory_exams_telefone_fkey"
            columns: ["telefone"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["telefone"]
          },
          {
            foreignKeyName: "laboratory_exams_telefone_fkey"
            columns: ["telefone"]
            isOneToOne: false
            referencedRelation: "v_patient_workout_risk"
            referencedColumns: ["telefone"]
          },
        ]
      }
      lead_calls: {
        Row: {
          closer_id: string | null
          created_at: string
          deleted_at: string | null
          id: string
          lead_id: string
          outcome_notes: string | null
          parse_warnings: Json | null
          prev_stage_id: string | null
          raw_message: string | null
          scheduled_at: string
          source: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          closer_id?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          lead_id: string
          outcome_notes?: string | null
          parse_warnings?: Json | null
          prev_stage_id?: string | null
          raw_message?: string | null
          scheduled_at: string
          source?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          closer_id?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          lead_id?: string
          outcome_notes?: string | null
          parse_warnings?: Json | null
          prev_stage_id?: string | null
          raw_message?: string | null
          scheduled_at?: string
          source?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_calls_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_funnel_messages: {
        Row: {
          created_at: string
          delay_after_previous: string
          funnel_id: string
          id: string
          is_active: boolean
          kanban_stage: string
          message_by_objetivo: Json
          step_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delay_after_previous?: string
          funnel_id: string
          id?: string
          is_active?: boolean
          kanban_stage: string
          message_by_objetivo?: Json
          step_order: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          delay_after_previous?: string
          funnel_id?: string
          id?: string
          is_active?: boolean
          kanban_stage?: string
          message_by_objetivo?: Json
          step_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_funnel_messages_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "lead_funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_funnel_stages: {
        Row: {
          audio_variants: Json | null
          color: string | null
          created_at: string
          funnel_id: string
          id: string
          is_active: boolean
          is_paused: boolean
          is_terminal: boolean
          message_by_objetivo: Json
          name: string
          send_delay: string
          send_mode: string
          step_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_variants?: Json | null
          color?: string | null
          created_at?: string
          funnel_id: string
          id?: string
          is_active?: boolean
          is_paused?: boolean
          is_terminal?: boolean
          message_by_objetivo?: Json
          name: string
          send_delay?: string
          send_mode?: string
          step_order: number
          updated_at?: string
          user_id: string
        }
        Update: {
          audio_variants?: Json | null
          color?: string | null
          created_at?: string
          funnel_id?: string
          id?: string
          is_active?: boolean
          is_paused?: boolean
          is_terminal?: boolean
          message_by_objetivo?: Json
          name?: string
          send_delay?: string
          send_mode?: string
          step_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_funnel_stages_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "lead_funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_funnels: {
        Row: {
          ai_prompt_extra: string | null
          created_at: string | null
          delivery_mode: string
          description: string | null
          exclude_from_overview: boolean
          id: string
          identity_json: Json | null
          is_default_funnel: boolean
          leads_count: number | null
          microcopy_json: Json | null
          questions_json: Json | null
          slug: string
          status: string
          title: string
          trigger_phrases: Json
          updated_at: string | null
          user_id: string
          waiting_message: string | null
          whatsapp_number: string | null
        }
        Insert: {
          ai_prompt_extra?: string | null
          created_at?: string | null
          delivery_mode?: string
          description?: string | null
          exclude_from_overview?: boolean
          id?: string
          identity_json?: Json | null
          is_default_funnel?: boolean
          leads_count?: number | null
          microcopy_json?: Json | null
          questions_json?: Json | null
          slug: string
          status?: string
          title: string
          trigger_phrases?: Json
          updated_at?: string | null
          user_id: string
          waiting_message?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          ai_prompt_extra?: string | null
          created_at?: string | null
          delivery_mode?: string
          description?: string | null
          exclude_from_overview?: boolean
          id?: string
          identity_json?: Json | null
          is_default_funnel?: boolean
          leads_count?: number | null
          microcopy_json?: Json | null
          questions_json?: Json | null
          slug?: string
          status?: string
          title?: string
          trigger_phrases?: Json
          updated_at?: string | null
          user_id?: string
          waiting_message?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      lead_interactions: {
        Row: {
          conteudo: string
          created_at: string | null
          id: string
          lead_id: string
          tipo: string
          user_id: string
        }
        Insert: {
          conteudo: string
          created_at?: string | null
          id?: string
          lead_id: string
          tipo?: string
          user_id: string
        }
        Update: {
          conteudo?: string
          created_at?: string | null
          id?: string
          lead_id?: string
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_manual_touches: {
        Row: {
          created_at: string
          id: string
          lead_id: string
          note: string | null
          touched_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id: string
          note?: string | null
          touched_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string
          note?: string | null
          touched_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_manual_touches_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_objetivos: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          key: string
          label: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          key: string
          label: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          key?: string
          label?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lead_origin_rules: {
        Row: {
          action: string
          additional_suffix: string | null
          case_sensitive: boolean
          created_at: string
          description: string | null
          direction: string
          id: string
          is_active: boolean
          origem: string
          pattern: string
          pattern_type: string
          priority: number
          updated_at: string
          user_id: string
        }
        Insert: {
          action?: string
          additional_suffix?: string | null
          case_sensitive?: boolean
          created_at?: string
          description?: string | null
          direction?: string
          id?: string
          is_active?: boolean
          origem: string
          pattern: string
          pattern_type?: string
          priority?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          action?: string
          additional_suffix?: string | null
          case_sensitive?: boolean
          created_at?: string
          description?: string | null
          direction?: string
          id?: string
          is_active?: boolean
          origem?: string
          pattern?: string
          pattern_type?: string
          priority?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lead_origins: {
        Row: {
          color: string
          created_at: string
          id: string
          is_active: boolean
          key: string
          label: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          is_active?: boolean
          key: string
          label: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          is_active?: boolean
          key?: string
          label?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lead_plans: {
        Row: {
          color: string
          created_at: string
          default_value: number | null
          deleted_at: string | null
          display_order: number
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          default_value?: number | null
          deleted_at?: string | null
          display_order?: number
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          default_value?: number | null
          deleted_at?: string | null
          display_order?: number
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lead_reports: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          lead_id: string | null
          report_data: Json
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          lead_id?: string | null
          report_data?: Json
          token?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          lead_id?: string | null
          report_data?: Json
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_reports_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_sales: {
        Row: {
          call_id: string | null
          closer_id: string | null
          commission_pct: number | null
          commission_value: number | null
          created_at: string
          deleted_at: string | null
          gross_value: number
          id: string
          lead_id: string
          net_value: number | null
          notes: string | null
          patient_id: string | null
          payment_method: string
          payment_method_group_id: string | null
          plano: string
          platform_fee_pct: number
          refund_amount: number | null
          refund_reason: string | null
          refunded_at: string | null
          sold_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          call_id?: string | null
          closer_id?: string | null
          commission_pct?: number | null
          commission_value?: number | null
          created_at?: string
          deleted_at?: string | null
          gross_value?: number
          id?: string
          lead_id: string
          net_value?: number | null
          notes?: string | null
          patient_id?: string | null
          payment_method: string
          payment_method_group_id?: string | null
          plano?: string
          platform_fee_pct?: number
          refund_amount?: number | null
          refund_reason?: string | null
          refunded_at?: string | null
          sold_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          call_id?: string | null
          closer_id?: string | null
          commission_pct?: number | null
          commission_value?: number | null
          created_at?: string
          deleted_at?: string | null
          gross_value?: number
          id?: string
          lead_id?: string
          net_value?: number | null
          notes?: string | null
          patient_id?: string | null
          payment_method?: string
          payment_method_group_id?: string | null
          plano?: string
          platform_fee_pct?: number
          refund_amount?: number | null
          refund_reason?: string | null
          refunded_at?: string | null
          sold_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_sales_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "lead_calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_sales_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_sales_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_sales_payment_method_group_id_fkey"
            columns: ["payment_method_group_id"]
            isOneToOne: false
            referencedRelation: "payment_method_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_scheduled_messages: {
        Row: {
          attempt_count: number
          audio_url: string | null
          created_at: string
          error: string | null
          funnel_message_id: string | null
          got_response: boolean | null
          id: string
          kanban_stage: string
          lead_id: string
          paused_reason: string | null
          rendered_text: string
          scheduled_at: string
          sent_at: string | null
          stage_id: string | null
          status: string
          user_id: string
          variant_index: number | null
        }
        Insert: {
          attempt_count?: number
          audio_url?: string | null
          created_at?: string
          error?: string | null
          funnel_message_id?: string | null
          got_response?: boolean | null
          id?: string
          kanban_stage: string
          lead_id: string
          paused_reason?: string | null
          rendered_text: string
          scheduled_at: string
          sent_at?: string | null
          stage_id?: string | null
          status?: string
          user_id: string
          variant_index?: number | null
        }
        Update: {
          attempt_count?: number
          audio_url?: string | null
          created_at?: string
          error?: string | null
          funnel_message_id?: string | null
          got_response?: boolean | null
          id?: string
          kanban_stage?: string
          lead_id?: string
          paused_reason?: string | null
          rendered_text?: string
          scheduled_at?: string
          sent_at?: string | null
          stage_id?: string | null
          status?: string
          user_id?: string
          variant_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_scheduled_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_scheduled_messages_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "lead_funnel_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          converted_at: string | null
          converted_patient_id: string | null
          created_at: string | null
          current_stage_id: string | null
          diagnostico_editado_json: Json | null
          diagnostico_ia: string | null
          diagnostico_json: Json | null
          email: string | null
          funnel_id: string | null
          genero: string | null
          has_anamnesis: boolean
          id: string
          idade: number | null
          inbound_count: number | null
          kanban_status: string
          last_message_sent_at: string | null
          last_response_at: string | null
          nome: string
          notas: string | null
          objetivo: string | null
          objetivo_source: string | null
          opted_out_at: string | null
          opted_out_reason: string | null
          origem: string | null
          origem_source: string | null
          perfil: string | null
          plano_entregue_at: string | null
          respostas_json: Json | null
          resultado_enviado: boolean
          resultado_enviado_at: string | null
          score: number | null
          tags: string[] | null
          telefone: string | null
          temperatura: string | null
          temperatura_source: string | null
          temperature_score: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          converted_at?: string | null
          converted_patient_id?: string | null
          created_at?: string | null
          current_stage_id?: string | null
          diagnostico_editado_json?: Json | null
          diagnostico_ia?: string | null
          diagnostico_json?: Json | null
          email?: string | null
          funnel_id?: string | null
          genero?: string | null
          has_anamnesis?: boolean
          id?: string
          idade?: number | null
          inbound_count?: number | null
          kanban_status?: string
          last_message_sent_at?: string | null
          last_response_at?: string | null
          nome: string
          notas?: string | null
          objetivo?: string | null
          objetivo_source?: string | null
          opted_out_at?: string | null
          opted_out_reason?: string | null
          origem?: string | null
          origem_source?: string | null
          perfil?: string | null
          plano_entregue_at?: string | null
          respostas_json?: Json | null
          resultado_enviado?: boolean
          resultado_enviado_at?: string | null
          score?: number | null
          tags?: string[] | null
          telefone?: string | null
          temperatura?: string | null
          temperatura_source?: string | null
          temperature_score?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          converted_at?: string | null
          converted_patient_id?: string | null
          created_at?: string | null
          current_stage_id?: string | null
          diagnostico_editado_json?: Json | null
          diagnostico_ia?: string | null
          diagnostico_json?: Json | null
          email?: string | null
          funnel_id?: string | null
          genero?: string | null
          has_anamnesis?: boolean
          id?: string
          idade?: number | null
          inbound_count?: number | null
          kanban_status?: string
          last_message_sent_at?: string | null
          last_response_at?: string | null
          nome?: string
          notas?: string | null
          objetivo?: string | null
          objetivo_source?: string | null
          opted_out_at?: string | null
          opted_out_reason?: string | null
          origem?: string | null
          origem_source?: string | null
          perfil?: string | null
          plano_entregue_at?: string | null
          respostas_json?: Json | null
          resultado_enviado?: boolean
          resultado_enviado_at?: string | null
          score?: number | null
          tags?: string[] | null
          telefone?: string | null
          temperatura?: string | null
          temperatura_source?: string | null
          temperature_score?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_converted_patient_id_fkey"
            columns: ["converted_patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_current_stage_id_fkey"
            columns: ["current_stage_id"]
            isOneToOne: false
            referencedRelation: "lead_funnel_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "lead_funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      leads_historico_manual: {
        Row: {
          canal: string
          created_at: string
          data: string
          id: string
          observacao: string | null
          quantidade: number
          updated_at: string
          user_id: string
        }
        Insert: {
          canal: string
          created_at?: string
          data: string
          id?: string
          observacao?: string | null
          quantidade: number
          updated_at?: string
          user_id: string
        }
        Update: {
          canal?: string
          created_at?: string
          data?: string
          id?: string
          observacao?: string | null
          quantidade?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      leads_que_entraram: {
        Row: {
          created_at: string
          DATA: string | null
          FACEBOOK: string | null
          GOOGLE: string | null
          GOOGLE_FORMS: string | null
          id: number
          INDICACAO: string | null
          INSTAGRAM: string | null
          OUTROS: string | null
          SELLER: string | null
          TOTAL: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          DATA?: string | null
          FACEBOOK?: string | null
          GOOGLE?: string | null
          GOOGLE_FORMS?: string | null
          id?: number
          INDICACAO?: string | null
          INSTAGRAM?: string | null
          OUTROS?: string | null
          SELLER?: string | null
          TOTAL?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          DATA?: string | null
          FACEBOOK?: string | null
          GOOGLE?: string | null
          GOOGLE_FORMS?: string | null
          id?: number
          INDICACAO?: string | null
          INSTAGRAM?: string | null
          OUTROS?: string | null
          SELLER?: string | null
          TOTAL?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      muscle_groups: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          name: string
          owner_user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          name: string
          owner_user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          name?: string
          owner_user_id?: string | null
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          community_enabled: boolean
          diet_enabled: boolean
          inactive_days: number
          inactive_enabled: boolean
          inactive_patient_body: string
          inactive_patient_title: string
          notify_trainer_on_inactive: boolean
          reminders: Json
          reminders_enabled: boolean
          timezone: string
          trainer_user_id: string
          updated_at: string
        }
        Insert: {
          community_enabled?: boolean
          diet_enabled?: boolean
          inactive_days?: number
          inactive_enabled?: boolean
          inactive_patient_body?: string
          inactive_patient_title?: string
          notify_trainer_on_inactive?: boolean
          reminders?: Json
          reminders_enabled?: boolean
          timezone?: string
          trainer_user_id: string
          updated_at?: string
        }
        Update: {
          community_enabled?: boolean
          diet_enabled?: boolean
          inactive_days?: number
          inactive_enabled?: boolean
          inactive_patient_body?: string
          inactive_patient_title?: string
          notify_trainer_on_inactive?: boolean
          reminders?: Json
          reminders_enabled?: boolean
          timezone?: string
          trainer_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json | null
          id: string
          patient_id: string | null
          read: boolean
          subscriber_type: string
          title: string
          trainer_user_id: string | null
          type: string
          url: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          patient_id?: string | null
          read?: boolean
          subscriber_type?: string
          title: string
          trainer_user_id?: string | null
          type?: string
          url?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          patient_id?: string | null
          read?: boolean
          subscriber_type?: string
          title?: string
          trainer_user_id?: string | null
          type?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      page_passwords: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          page_name: string
          password_hash: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          page_name: string
          password_hash: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          page_name?: string
          password_hash?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      patient_achievements: {
        Row: {
          achievement_description: string | null
          achievement_name: string
          achievement_type: string
          created_at: string | null
          id: string
          patient_id: string | null
          period_key: string
          points_earned: number | null
          unlocked_at: string | null
        }
        Insert: {
          achievement_description?: string | null
          achievement_name: string
          achievement_type: string
          created_at?: string | null
          id?: string
          patient_id?: string | null
          period_key?: string
          points_earned?: number | null
          unlocked_at?: string | null
        }
        Update: {
          achievement_description?: string | null
          achievement_name?: string
          achievement_type?: string
          created_at?: string | null
          id?: string
          patient_id?: string | null
          period_key?: string
          points_earned?: number | null
          unlocked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_achievements_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_anamnesis: {
        Row: {
          contract_hash: string | null
          contract_hash_pdf: string | null
          contract_pdf_url: string | null
          contract_template_snapshot: string | null
          created_at: string | null
          data: Json
          id: string
          patient_id: string
          telefone: string
          terms_accepted_at: string | null
          terms_ip: string | null
          terms_text_snapshot: string | null
          terms_user_agent: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          contract_hash?: string | null
          contract_hash_pdf?: string | null
          contract_pdf_url?: string | null
          contract_template_snapshot?: string | null
          created_at?: string | null
          data?: Json
          id?: string
          patient_id: string
          telefone: string
          terms_accepted_at?: string | null
          terms_ip?: string | null
          terms_text_snapshot?: string | null
          terms_user_agent?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          contract_hash?: string | null
          contract_hash_pdf?: string | null
          contract_pdf_url?: string | null
          contract_template_snapshot?: string | null
          created_at?: string | null
          data?: Json
          id?: string
          patient_id?: string
          telefone?: string
          terms_accepted_at?: string | null
          terms_ip?: string | null
          terms_text_snapshot?: string | null
          terms_user_agent?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_anamnesis_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_daily_challenges: {
        Row: {
          challenge_key: string
          completed_at: string | null
          completion_date: string
          id: string
          notes: string | null
          patient_id: string | null
        }
        Insert: {
          challenge_key: string
          completed_at?: string | null
          completion_date?: string
          id?: string
          notes?: string | null
          patient_id?: string | null
        }
        Update: {
          challenge_key?: string
          completed_at?: string | null
          completion_date?: string
          id?: string
          notes?: string | null
          patient_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_daily_challenges_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_dob_first_set_audit: {
        Row: {
          dob_set: string
          id: number
          patient_id: string
          set_at: string
          telefone: string
        }
        Insert: {
          dob_set: string
          id?: number
          patient_id: string
          set_at?: string
          telefone: string
        }
        Update: {
          dob_set?: string
          id?: number
          patient_id?: string
          set_at?: string
          telefone?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_dob_first_set_audit_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_field_options: {
        Row: {
          created_at: string
          field: string
          id: string
          label: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          field: string
          id?: string
          label: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          field?: string
          id?: string
          label?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      patient_journal_entries: {
        Row: {
          created_at: string
          energy: number | null
          entry_date: string
          id: string
          mood: number | null
          notes: string | null
          pain_area: string | null
          pain_intensity: number | null
          patient_id: string
          sleep_hours: number | null
        }
        Insert: {
          created_at?: string
          energy?: number | null
          entry_date?: string
          id?: string
          mood?: number | null
          notes?: string | null
          pain_area?: string | null
          pain_intensity?: number | null
          patient_id: string
          sleep_hours?: number | null
        }
        Update: {
          created_at?: string
          energy?: number | null
          entry_date?: string
          id?: string
          mood?: number | null
          notes?: string | null
          pain_area?: string | null
          pain_intensity?: number | null
          patient_id?: string
          sleep_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_journal_entries_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_journey_events: {
        Row: {
          actor_name: string | null
          created_at: string
          event_type: string
          id: string
          journey_id: string
          payload: Json | null
          user_id: string
        }
        Insert: {
          actor_name?: string | null
          created_at?: string
          event_type: string
          id?: string
          journey_id: string
          payload?: Json | null
          user_id: string
        }
        Update: {
          actor_name?: string | null
          created_at?: string
          event_type?: string
          id?: string
          journey_id?: string
          payload?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_journey_events_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "patient_journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_journey_stages: {
        Row: {
          color: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          is_completed: boolean | null
          journey_id: string
          model_stage_id: string | null
          name: string
          position: number
        }
        Insert: {
          color?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          journey_id: string
          model_stage_id?: string | null
          name: string
          position?: number
        }
        Update: {
          color?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          journey_id?: string
          model_stage_id?: string | null
          name?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "patient_journey_stages_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "patient_journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_journey_stages_model_stage_id_fkey"
            columns: ["model_stage_id"]
            isOneToOne: false
            referencedRelation: "journey_model_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_journeys: {
        Row: {
          archived_at: string | null
          assigned_to_id: string | null
          completed_at: string | null
          created_at: string | null
          current_stage_id: string | null
          engagement_temperature: string | null
          id: string
          model_id: string | null
          model_name: string
          notes: string | null
          nps_score: number | null
          patient_id: string
          patient_name: string
          patient_phone: string | null
          started_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          assigned_to_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_stage_id?: string | null
          engagement_temperature?: string | null
          id?: string
          model_id?: string | null
          model_name: string
          notes?: string | null
          nps_score?: number | null
          patient_id: string
          patient_name: string
          patient_phone?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          archived_at?: string | null
          assigned_to_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_stage_id?: string | null
          engagement_temperature?: string | null
          id?: string
          model_id?: string | null
          model_name?: string
          notes?: string | null
          nps_score?: number | null
          patient_id?: string
          patient_name?: string
          patient_phone?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_journeys_assigned_to_id_fkey"
            columns: ["assigned_to_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_journeys_assigned_to_id_fkey"
            columns: ["assigned_to_id"]
            isOneToOne: false
            referencedRelation: "team_members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_journeys_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "journey_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_journeys_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_levels: {
        Row: {
          active: boolean | null
          color: string | null
          created_at: string | null
          description: string | null
          emoji: string | null
          id: string
          level_order: number
          min_points: number
          name: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          level_order: number
          min_points: number
          name: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          level_order?: number
          min_points?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      patient_notification_prefs: {
        Row: {
          muted_categories: string[]
          patient_id: string
          updated_at: string
        }
        Insert: {
          muted_categories?: string[]
          patient_id: string
          updated_at?: string
        }
        Update: {
          muted_categories?: string[]
          patient_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_notification_prefs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          meta: Json | null
          patient_id: string
          read_at: string | null
          title: string
          type: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          meta?: Json | null
          patient_id: string
          read_at?: string | null
          title: string
          type: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          meta?: Json | null
          patient_id?: string
          read_at?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_notifications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_points: {
        Row: {
          created_at: string | null
          current_level: number | null
          current_streak: number | null
          id: string
          longest_streak: number | null
          patient_id: string | null
          points_achievements: number | null
          points_consistency: number | null
          points_diet: number | null
          total_days_tracked: number | null
          total_points: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_level?: number | null
          current_streak?: number | null
          id?: string
          longest_streak?: number | null
          patient_id?: string | null
          points_achievements?: number | null
          points_consistency?: number | null
          points_diet?: number | null
          total_days_tracked?: number | null
          total_points?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_level?: number | null
          current_streak?: number | null
          id?: string
          longest_streak?: number | null
          patient_id?: string | null
          points_achievements?: number | null
          points_consistency?: number | null
          points_diet?: number | null
          total_days_tracked?: number | null
          total_points?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_points_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_points_history: {
        Row: {
          action_date: string
          action_description: string | null
          action_type: string
          created_at: string | null
          id: string
          patient_id: string | null
          points_earned: number
          points_id: string | null
        }
        Insert: {
          action_date?: string
          action_description?: string | null
          action_type: string
          created_at?: string | null
          id?: string
          patient_id?: string | null
          points_earned: number
          points_id?: string | null
        }
        Update: {
          action_date?: string
          action_description?: string | null
          action_type?: string
          created_at?: string | null
          id?: string
          patient_id?: string | null
          points_earned?: number
          points_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_points_history_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_points_history_points_id_fkey"
            columns: ["points_id"]
            isOneToOne: false
            referencedRelation: "patient_points"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_portal_tokens: {
        Row: {
          access_count: number | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          last_accessed_at: string | null
          telefone: string
          token: string
          user_id: string | null
        }
        Insert: {
          access_count?: number | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_accessed_at?: string | null
          telefone: string
          token: string
          user_id?: string | null
        }
        Update: {
          access_count?: number | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_accessed_at?: string | null
          telefone?: string
          token?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_patient_portal_tokens_patient"
            columns: ["telefone"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["telefone"]
          },
          {
            foreignKeyName: "fk_patient_portal_tokens_patient"
            columns: ["telefone"]
            isOneToOne: false
            referencedRelation: "v_patient_workout_risk"
            referencedColumns: ["telefone"]
          },
        ]
      }
      patient_task_notes: {
        Row: {
          author_name: string | null
          content: string
          created_at: string
          id: string
          task_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          author_name?: string | null
          content: string
          created_at?: string
          id?: string
          task_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          author_name?: string | null
          content?: string
          created_at?: string
          id?: string
          task_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_task_notes_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "patient_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_task_tags: {
        Row: {
          created_at: string | null
          tag_id: string
          task_id: string
        }
        Insert: {
          created_at?: string | null
          tag_id: string
          task_id: string
        }
        Update: {
          created_at?: string | null
          tag_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_task_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "journey_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_task_tags_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "patient_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_tasks: {
        Row: {
          assigned_to_id: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          estimate_unit: string | null
          estimate_value: number | null
          id: string
          is_completed: boolean | null
          is_protocol_reminder: boolean | null
          journey_id: string
          model_task_id: string | null
          position: number
          stage_id: string
          start_date: string | null
          task_type: string
          title: string
          updated_at: string | null
          user_id: string
          whatsapp_message: string | null
          whatsapp_scheduled_message_id: string | null
          whatsapp_send_time: string
        }
        Insert: {
          assigned_to_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          estimate_unit?: string | null
          estimate_value?: number | null
          id?: string
          is_completed?: boolean | null
          is_protocol_reminder?: boolean | null
          journey_id: string
          model_task_id?: string | null
          position?: number
          stage_id: string
          start_date?: string | null
          task_type?: string
          title: string
          updated_at?: string | null
          user_id: string
          whatsapp_message?: string | null
          whatsapp_scheduled_message_id?: string | null
          whatsapp_send_time?: string
        }
        Update: {
          assigned_to_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          estimate_unit?: string | null
          estimate_value?: number | null
          id?: string
          is_completed?: boolean | null
          is_protocol_reminder?: boolean | null
          journey_id?: string
          model_task_id?: string | null
          position?: number
          stage_id?: string
          start_date?: string | null
          task_type?: string
          title?: string
          updated_at?: string | null
          user_id?: string
          whatsapp_message?: string | null
          whatsapp_scheduled_message_id?: string | null
          whatsapp_send_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_tasks_assigned_to_id_fkey"
            columns: ["assigned_to_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_tasks_assigned_to_id_fkey"
            columns: ["assigned_to_id"]
            isOneToOne: false
            referencedRelation: "team_members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_tasks_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "patient_journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_tasks_model_task_id_fkey"
            columns: ["model_task_id"]
            isOneToOne: false
            referencedRelation: "journey_model_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_tasks_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "patient_journey_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_tasks_whatsapp_scheduled_message_id_fkey"
            columns: ["whatsapp_scheduled_message_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_scheduled_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_views: {
        Row: {
          column_order: Json | null
          created_at: string
          filters: Json
          id: string
          name: string
          position: number
          sorting: Json | null
          updated_at: string
          user_id: string
          visible_columns: Json | null
        }
        Insert: {
          column_order?: Json | null
          created_at?: string
          filters?: Json
          id?: string
          name: string
          position?: number
          sorting?: Json | null
          updated_at?: string
          user_id: string
          visible_columns?: Json | null
        }
        Update: {
          column_order?: Json | null
          created_at?: string
          filters?: Json
          id?: string
          name?: string
          position?: number
          sorting?: Json | null
          updated_at?: string
          user_id?: string
          visible_columns?: Json | null
        }
        Relationships: []
      }
      patient_weight_logs: {
        Row: {
          body_fat_pct: number | null
          id: string
          measured_at: string
          muscle_mass_kg: number | null
          notes: string | null
          patient_id: string
          source: string | null
          weight_kg: number
        }
        Insert: {
          body_fat_pct?: number | null
          id?: string
          measured_at?: string
          muscle_mass_kg?: number | null
          notes?: string | null
          patient_id: string
          source?: string | null
          weight_kg: number
        }
        Update: {
          body_fat_pct?: number | null
          id?: string
          measured_at?: string
          muscle_mass_kg?: number | null
          notes?: string | null
          patient_id?: string
          source?: string | null
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "patient_weight_logs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          abril: string | null
          agosto: string | null
          altura_atual: number | null
          altura_inicial: number | null
          antes_depois: string | null
          apelido: string | null
          consultas_realizadas: number | null
          consultas_total: number | null
          cpf: string | null
          created_at: string | null
          data_cancelamento: string | null
          data_cancelamento_at: string | null
          data_congelamento: string | null
          data_congelamento_at: string | null
          data_descongelamento: string | null
          data_fotos_atuais: string | null
          data_fotos_iniciais: string | null
          data_nascimento: string | null
          dezembro: string | null
          dias_para_vencer: number | null
          duracao_plano_meses: number | null
          email: string | null
          fase_atual: string | null
          fevereiro: string | null
          foto_atual_costas: string | null
          foto_atual_frente: string | null
          foto_atual_lado: string | null
          foto_atual_lado_2: string | null
          foto_inicial_costas: string | null
          foto_inicial_frente: string | null
          foto_inicial_lado: string | null
          foto_inicial_lado_2: string | null
          foto_perfil: string | null
          genero: string | null
          id: string
          indicacoes: string | null
          inicio_acompanhamento: string | null
          is_template_holder: boolean
          janeiro: string | null
          julho: string | null
          junho: string | null
          last_seen_at: string | null
          lembrete: string | null
          ltv: number | null
          maio: string | null
          marco: string | null
          medida_cintura_atual: number | null
          medida_cintura_inicial: number | null
          medida_quadril_atual: number | null
          medida_quadril_inicial: number | null
          mfit_client_id: string | null
          motivo_cancelamento: string | null
          motivo_congelamento: string | null
          multa_rescisao: number | null
          nome: string
          novembro: string | null
          numero_contrato: string | null
          observacao: string | null
          outubro: string | null
          pagamento: string | null
          peso_atual: number | null
          peso_inicial: number | null
          plano: string | null
          proxima_consulta: string | null
          renovacoes: number
          rescisao_30_percent: number | null
          setembro: string | null
          telefone: string | null
          telefone_filtro: string | null
          tempo_acompanhamento: number | null
          ticket_medio: number | null
          ultima_consulta: string | null
          ultimo_contato: string | null
          ultimo_contato_nutricionista: string | null
          updated_at: string | null
          user_id: string | null
          valor: number | null
          vencimento: string | null
          whatsapp_group_jid: string | null
          whatsapp_group_skipped: boolean
        }
        Insert: {
          abril?: string | null
          agosto?: string | null
          altura_atual?: number | null
          altura_inicial?: number | null
          antes_depois?: string | null
          apelido?: string | null
          consultas_realizadas?: number | null
          consultas_total?: number | null
          cpf?: string | null
          created_at?: string | null
          data_cancelamento?: string | null
          data_cancelamento_at?: string | null
          data_congelamento?: string | null
          data_congelamento_at?: string | null
          data_descongelamento?: string | null
          data_fotos_atuais?: string | null
          data_fotos_iniciais?: string | null
          data_nascimento?: string | null
          dezembro?: string | null
          dias_para_vencer?: number | null
          duracao_plano_meses?: number | null
          email?: string | null
          fase_atual?: string | null
          fevereiro?: string | null
          foto_atual_costas?: string | null
          foto_atual_frente?: string | null
          foto_atual_lado?: string | null
          foto_atual_lado_2?: string | null
          foto_inicial_costas?: string | null
          foto_inicial_frente?: string | null
          foto_inicial_lado?: string | null
          foto_inicial_lado_2?: string | null
          foto_perfil?: string | null
          genero?: string | null
          id?: string
          indicacoes?: string | null
          inicio_acompanhamento?: string | null
          is_template_holder?: boolean
          janeiro?: string | null
          julho?: string | null
          junho?: string | null
          last_seen_at?: string | null
          lembrete?: string | null
          ltv?: number | null
          maio?: string | null
          marco?: string | null
          medida_cintura_atual?: number | null
          medida_cintura_inicial?: number | null
          medida_quadril_atual?: number | null
          medida_quadril_inicial?: number | null
          mfit_client_id?: string | null
          motivo_cancelamento?: string | null
          motivo_congelamento?: string | null
          multa_rescisao?: number | null
          nome: string
          novembro?: string | null
          numero_contrato?: string | null
          observacao?: string | null
          outubro?: string | null
          pagamento?: string | null
          peso_atual?: number | null
          peso_inicial?: number | null
          plano?: string | null
          proxima_consulta?: string | null
          renovacoes?: number
          rescisao_30_percent?: number | null
          setembro?: string | null
          telefone?: string | null
          telefone_filtro?: string | null
          tempo_acompanhamento?: number | null
          ticket_medio?: number | null
          ultima_consulta?: string | null
          ultimo_contato?: string | null
          ultimo_contato_nutricionista?: string | null
          updated_at?: string | null
          user_id?: string | null
          valor?: number | null
          vencimento?: string | null
          whatsapp_group_jid?: string | null
          whatsapp_group_skipped?: boolean
        }
        Update: {
          abril?: string | null
          agosto?: string | null
          altura_atual?: number | null
          altura_inicial?: number | null
          antes_depois?: string | null
          apelido?: string | null
          consultas_realizadas?: number | null
          consultas_total?: number | null
          cpf?: string | null
          created_at?: string | null
          data_cancelamento?: string | null
          data_cancelamento_at?: string | null
          data_congelamento?: string | null
          data_congelamento_at?: string | null
          data_descongelamento?: string | null
          data_fotos_atuais?: string | null
          data_fotos_iniciais?: string | null
          data_nascimento?: string | null
          dezembro?: string | null
          dias_para_vencer?: number | null
          duracao_plano_meses?: number | null
          email?: string | null
          fase_atual?: string | null
          fevereiro?: string | null
          foto_atual_costas?: string | null
          foto_atual_frente?: string | null
          foto_atual_lado?: string | null
          foto_atual_lado_2?: string | null
          foto_inicial_costas?: string | null
          foto_inicial_frente?: string | null
          foto_inicial_lado?: string | null
          foto_inicial_lado_2?: string | null
          foto_perfil?: string | null
          genero?: string | null
          id?: string
          indicacoes?: string | null
          inicio_acompanhamento?: string | null
          is_template_holder?: boolean
          janeiro?: string | null
          julho?: string | null
          junho?: string | null
          last_seen_at?: string | null
          lembrete?: string | null
          ltv?: number | null
          maio?: string | null
          marco?: string | null
          medida_cintura_atual?: number | null
          medida_cintura_inicial?: number | null
          medida_quadril_atual?: number | null
          medida_quadril_inicial?: number | null
          mfit_client_id?: string | null
          motivo_cancelamento?: string | null
          motivo_congelamento?: string | null
          multa_rescisao?: number | null
          nome?: string
          novembro?: string | null
          numero_contrato?: string | null
          observacao?: string | null
          outubro?: string | null
          pagamento?: string | null
          peso_atual?: number | null
          peso_inicial?: number | null
          plano?: string | null
          proxima_consulta?: string | null
          renovacoes?: number
          rescisao_30_percent?: number | null
          setembro?: string | null
          telefone?: string | null
          telefone_filtro?: string | null
          tempo_acompanhamento?: number | null
          ticket_medio?: number | null
          ultima_consulta?: string | null
          ultimo_contato?: string | null
          ultimo_contato_nutricionista?: string | null
          updated_at?: string | null
          user_id?: string | null
          valor?: number | null
          vencimento?: string | null
          whatsapp_group_jid?: string | null
          whatsapp_group_skipped?: boolean
        }
        Relationships: []
      }
      payment_method_groups: {
        Row: {
          created_at: string
          deleted_at: string | null
          display_order: number
          id: string
          is_default: boolean
          name: string
          platform_fee_pct: number
          platform_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          display_order?: number
          id?: string
          is_default?: boolean
          name: string
          platform_fee_pct?: number
          platform_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          display_order?: number
          id?: string
          is_default?: boolean
          name?: string
          platform_fee_pct?: number
          platform_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_webhooks: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_type: string
          id: string
          payload: Json
          processed: boolean | null
          processed_at: string | null
          provider: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          payload: Json
          processed?: boolean | null
          processed_at?: string | null
          provider: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed?: boolean | null
          processed_at?: string | null
          provider?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          due_date: string | null
          id: string
          metadata: Json | null
          paid_at: string | null
          payment_method: string | null
          payment_provider: string
          payment_provider_transaction_id: string
          status: string
          subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          payment_method?: string | null
          payment_provider: string
          payment_provider_transaction_id: string
          status: string
          subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          payment_method?: string | null
          payment_provider?: string
          payment_provider_transaction_id?: string
          status?: string
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      periodization_advance_log: {
        Row: {
          adherence_pct: number | null
          from_phase_index: number | null
          from_phase_label: string | null
          id: string
          notes: string | null
          patient_id: string
          ran_at: string
          sessions_done: number | null
          sessions_expected: number | null
          status: string
          to_phase_index: number | null
          to_phase_label: string | null
          weeks_in_phase: number | null
          workout_plan_id: string
        }
        Insert: {
          adherence_pct?: number | null
          from_phase_index?: number | null
          from_phase_label?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          ran_at?: string
          sessions_done?: number | null
          sessions_expected?: number | null
          status: string
          to_phase_index?: number | null
          to_phase_label?: string | null
          weeks_in_phase?: number | null
          workout_plan_id: string
        }
        Update: {
          adherence_pct?: number | null
          from_phase_index?: number | null
          from_phase_label?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          ran_at?: string
          sessions_done?: number | null
          sessions_expected?: number | null
          status?: string
          to_phase_index?: number | null
          to_phase_label?: string | null
          weeks_in_phase?: number | null
          workout_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "periodization_advance_log_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "periodization_advance_log_workout_plan_id_fkey"
            columns: ["workout_plan_id"]
            isOneToOne: false
            referencedRelation: "v_patient_workout_risk"
            referencedColumns: ["plan_id"]
          },
          {
            foreignKeyName: "periodization_advance_log_workout_plan_id_fkey"
            columns: ["workout_plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      periodization_phase_presets: {
        Row: {
          color: string | null
          created_at: string | null
          duration_sessions: number | null
          duration_weeks: number | null
          id: string
          label: string
          load_pct_change: number | null
          notes: string | null
          owner_user_id: string
          preset: string | null
          reps_override: string | null
          rpe_per_set_override: string | null
          sets_override: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          duration_sessions?: number | null
          duration_weeks?: number | null
          id?: string
          label: string
          load_pct_change?: number | null
          notes?: string | null
          owner_user_id: string
          preset?: string | null
          reps_override?: string | null
          rpe_per_set_override?: string | null
          sets_override?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          duration_sessions?: number | null
          duration_weeks?: number | null
          id?: string
          label?: string
          load_pct_change?: number | null
          notes?: string | null
          owner_user_id?: string
          preset?: string | null
          reps_override?: string | null
          rpe_per_set_override?: string | null
          sets_override?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      periodization_phases: {
        Row: {
          base_use_phase_values: boolean
          color: string | null
          created_at: string
          duration_sessions: number | null
          duration_weeks: number | null
          id: string
          label: string
          load_pct_change: number | null
          notes: string | null
          order_index: number
          preset: string | null
          reps_override: string | null
          rpe_per_set_override: string | null
          sets_override: number | null
          template_id: string
        }
        Insert: {
          base_use_phase_values?: boolean
          color?: string | null
          created_at?: string
          duration_sessions?: number | null
          duration_weeks?: number | null
          id?: string
          label: string
          load_pct_change?: number | null
          notes?: string | null
          order_index?: number
          preset?: string | null
          reps_override?: string | null
          rpe_per_set_override?: string | null
          sets_override?: number | null
          template_id: string
        }
        Update: {
          base_use_phase_values?: boolean
          color?: string | null
          created_at?: string
          duration_sessions?: number | null
          duration_weeks?: number | null
          id?: string
          label?: string
          load_pct_change?: number | null
          notes?: string | null
          order_index?: number
          preset?: string | null
          reps_override?: string | null
          rpe_per_set_override?: string | null
          sets_override?: number | null
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "periodization_phases_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "periodization_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      periodization_templates: {
        Row: {
          created_at: string
          description: string | null
          general_notes: string | null
          id: string
          is_private: boolean
          is_public: boolean
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          general_notes?: string | null
          id?: string
          is_private?: boolean
          is_public?: boolean
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          general_notes?: string | null
          id?: string
          is_private?: boolean
          is_public?: boolean
          name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      photo_visibility_settings: {
        Row: {
          created_at: string | null
          id: string
          patient_telefone: string
          photo_id: string
          position_x: number | null
          position_y: number | null
          updated_at: string | null
          user_id: string | null
          visible: boolean | null
          zoom_level: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          patient_telefone: string
          photo_id: string
          position_x?: number | null
          position_y?: number | null
          updated_at?: string | null
          user_id?: string | null
          visible?: boolean | null
          zoom_level?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          patient_telefone?: string
          photo_id?: string
          position_x?: number | null
          position_y?: number | null
          updated_at?: string | null
          user_id?: string | null
          visible?: boolean | null
          zoom_level?: number | null
        }
        Relationships: []
      }
      plans: {
        Row: {
          active: boolean | null
          category: string | null
          consultas_periodicidade: string | null
          consultas_total: number | null
          created_at: string | null
          description: string | null
          duration_months: number | null
          id: string
          name: string
          period: string
          price: number | null
          system_status: string
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          active?: boolean | null
          category?: string | null
          consultas_periodicidade?: string | null
          consultas_total?: number | null
          created_at?: string | null
          description?: string | null
          duration_months?: number | null
          id?: string
          name: string
          period: string
          price?: number | null
          system_status?: string
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          active?: boolean | null
          category?: string | null
          consultas_periodicidade?: string | null
          consultas_total?: number | null
          created_at?: string | null
          description?: string | null
          duration_months?: number | null
          id?: string
          name?: string
          period?: string
          price?: number | null
          system_status?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      points_reset_audit: {
        Row: {
          history_rows_deleted: number
          id: number
          level_reset: boolean
          patient_id: string | null
          patients_affected: number
          reset_at: string
          top3: Json
          trainer_user_id: string
        }
        Insert: {
          history_rows_deleted?: number
          id?: number
          level_reset?: boolean
          patient_id?: string | null
          patients_affected?: number
          reset_at?: string
          top3?: Json
          trainer_user_id: string
        }
        Update: {
          history_rows_deleted?: number
          id?: number
          level_reset?: boolean
          patient_id?: string | null
          patients_affected?: number
          reset_at?: string
          top3?: Json
          trainer_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_reset_audit_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      pop_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      pop_sessions: {
        Row: {
          checked_item_ids: Json
          completed_step_ids: Json
          created_at: string
          id: string
          intern_general_notes: string | null
          intern_id: string
          intern_questions: string | null
          patient_case: Json
          score: number | null
          status: string
          step_notes: Json
          supervisor_adjustments: string | null
          supervisor_feedback: string | null
          supervisor_id: string | null
          updated_at: string
          version_id: string
        }
        Insert: {
          checked_item_ids?: Json
          completed_step_ids?: Json
          created_at?: string
          id?: string
          intern_general_notes?: string | null
          intern_id: string
          intern_questions?: string | null
          patient_case?: Json
          score?: number | null
          status?: string
          step_notes?: Json
          supervisor_adjustments?: string | null
          supervisor_feedback?: string | null
          supervisor_id?: string | null
          updated_at?: string
          version_id: string
        }
        Update: {
          checked_item_ids?: Json
          completed_step_ids?: Json
          created_at?: string
          id?: string
          intern_general_notes?: string | null
          intern_id?: string
          intern_questions?: string | null
          patient_case?: Json
          score?: number | null
          status?: string
          step_notes?: Json
          supervisor_adjustments?: string | null
          supervisor_feedback?: string | null
          supervisor_id?: string | null
          updated_at?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pop_sessions_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "pop_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      pop_versions: {
        Row: {
          author_id: string | null
          changelog: string | null
          checklist_categories: Json
          checklist_items: Json
          common_errors: Json
          id: string
          is_active: boolean | null
          pop_type: string
          published_at: string
          steps: Json
          version: string
        }
        Insert: {
          author_id?: string | null
          changelog?: string | null
          checklist_categories?: Json
          checklist_items?: Json
          common_errors?: Json
          id?: string
          is_active?: boolean | null
          pop_type?: string
          published_at?: string
          steps?: Json
          version: string
        }
        Update: {
          author_id?: string | null
          changelog?: string | null
          checklist_categories?: Json
          checklist_items?: Json
          common_errors?: Json
          id?: string
          is_active?: boolean | null
          pop_type?: string
          published_at?: string
          steps?: Json
          version?: string
        }
        Relationships: []
      }
      portal_card_visibility: {
        Row: {
          card_key: string
          created_at: string | null
          id: string
          patient_telefone: string
          updated_at: string | null
          visible: boolean
        }
        Insert: {
          card_key: string
          created_at?: string | null
          id?: string
          patient_telefone: string
          updated_at?: string | null
          visible?: boolean
        }
        Update: {
          card_key?: string
          created_at?: string | null
          id?: string
          patient_telefone?: string
          updated_at?: string | null
          visible?: boolean
        }
        Relationships: []
      }
      portal_settings: {
        Row: {
          created_at: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      professional_letterhead: {
        Row: {
          accent_color: string | null
          cnpj: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          endereco: string | null
          header_lines: string[] | null
          instagram: string | null
          logo_url: string | null
          professional_title: string | null
          registry: string | null
          signature_url: string | null
          updated_at: string | null
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          accent_color?: string | null
          cnpj?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          endereco?: string | null
          header_lines?: string[] | null
          instagram?: string | null
          logo_url?: string | null
          professional_title?: string | null
          registry?: string | null
          signature_url?: string | null
          updated_at?: string | null
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          accent_color?: string | null
          cnpj?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          endereco?: string | null
          header_lines?: string[] | null
          instagram?: string | null
          logo_url?: string | null
          professional_title?: string | null
          registry?: string | null
          signature_url?: string | null
          updated_at?: string | null
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          allow_team_members_delete_patients: boolean
          avatar_url: string | null
          brand_accent_color: string | null
          brand_logo_url: string | null
          brand_primary_color: string | null
          brand_tagline: string | null
          checkin_slug: string | null
          created_at: string | null
          department: string | null
          full_name: string | null
          id: string
          role: string | null
          updated_at: string | null
          whatsapp_number: string | null
        }
        Insert: {
          allow_team_members_delete_patients?: boolean
          avatar_url?: string | null
          brand_accent_color?: string | null
          brand_logo_url?: string | null
          brand_primary_color?: string | null
          brand_tagline?: string | null
          checkin_slug?: string | null
          created_at?: string | null
          department?: string | null
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          allow_team_members_delete_patients?: boolean
          avatar_url?: string | null
          brand_accent_color?: string | null
          brand_logo_url?: string | null
          brand_primary_color?: string | null
          brand_tagline?: string | null
          checkin_slug?: string | null
          created_at?: string | null
          department?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      protocol_notes: {
        Row: {
          author_id: string
          author_name: string
          content: string
          created_at: string
          id: string
          telefone: string
          updated_at: string
        }
        Insert: {
          author_id?: string
          author_name: string
          content: string
          created_at?: string
          id?: string
          telefone: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          telefone?: string
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          last_seen_at: string
          p256dh: string
          patient_id: string | null
          subscriber_type: string
          trainer_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          last_seen_at?: string
          p256dh: string
          patient_id?: string | null
          subscriber_type?: string
          trainer_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_seen_at?: string
          p256dh?: string
          patient_id?: string | null
          subscriber_type?: string
          trainer_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      ranking_history: {
        Row: {
          frozen_at: string
          id: string
          patient_id: string
          patient_name: string | null
          period: string
          period_key: string
          photo_url: string | null
          points: number
          rank: number
          trainer_user_id: string
        }
        Insert: {
          frozen_at?: string
          id?: string
          patient_id: string
          patient_name?: string | null
          period: string
          period_key: string
          photo_url?: string | null
          points?: number
          rank: number
          trainer_user_id: string
        }
        Update: {
          frozen_at?: string
          id?: string
          patient_id?: string
          patient_name?: string | null
          period?: string
          period_key?: string
          photo_url?: string | null
          points?: number
          rank?: number
          trainer_user_id?: string
        }
        Relationships: []
      }
      reeng_library: {
        Row: {
          created_at: string | null
          id: string
          label: string
          text: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          label: string
          text: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          label?: string
          text?: string
          user_id?: string
        }
        Relationships: []
      }
      renewal_ai_prompts: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_base: boolean
          name: string
          prompt_template: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_base?: boolean
          name: string
          prompt_template: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_base?: boolean
          name?: string
          prompt_template?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      renewal_checklist: {
        Row: {
          auto_created: boolean
          created_at: string | null
          custom_message: string | null
          custom_message_0d: string | null
          custom_message_10d: string | null
          custom_message_5d: string | null
          custom_message_updated_at: string | null
          cycle: string
          dismissed: boolean
          engagement_classified_at: string | null
          engagement_track: string | null
          id: string
          last_checkin_at: string | null
          last_classified_engagement_track: string | null
          message_sent: boolean
          message_sent_0d: boolean
          message_sent_10d: boolean
          message_sent_5d: boolean
          message_sent_at: string | null
          message_sent_by: string | null
          patient_telefone: string
          report_approved: boolean
          report_approved_at: string | null
          report_approved_by: string | null
          report_failsafe_triggered: boolean
          report_ready: boolean
          report_ready_at: string | null
          report_ready_by: string | null
          reviewed: boolean
          scheduled_message_id: string | null
          scheduled_message_id_0d: string | null
          scheduled_message_id_10d: string | null
          scheduled_message_id_5d: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_created?: boolean
          created_at?: string | null
          custom_message?: string | null
          custom_message_0d?: string | null
          custom_message_10d?: string | null
          custom_message_5d?: string | null
          custom_message_updated_at?: string | null
          cycle: string
          dismissed?: boolean
          engagement_classified_at?: string | null
          engagement_track?: string | null
          id?: string
          last_checkin_at?: string | null
          last_classified_engagement_track?: string | null
          message_sent?: boolean
          message_sent_0d?: boolean
          message_sent_10d?: boolean
          message_sent_5d?: boolean
          message_sent_at?: string | null
          message_sent_by?: string | null
          patient_telefone: string
          report_approved?: boolean
          report_approved_at?: string | null
          report_approved_by?: string | null
          report_failsafe_triggered?: boolean
          report_ready?: boolean
          report_ready_at?: string | null
          report_ready_by?: string | null
          reviewed?: boolean
          scheduled_message_id?: string | null
          scheduled_message_id_0d?: string | null
          scheduled_message_id_10d?: string | null
          scheduled_message_id_5d?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_created?: boolean
          created_at?: string | null
          custom_message?: string | null
          custom_message_0d?: string | null
          custom_message_10d?: string | null
          custom_message_5d?: string | null
          custom_message_updated_at?: string | null
          cycle?: string
          dismissed?: boolean
          engagement_classified_at?: string | null
          engagement_track?: string | null
          id?: string
          last_checkin_at?: string | null
          last_classified_engagement_track?: string | null
          message_sent?: boolean
          message_sent_0d?: boolean
          message_sent_10d?: boolean
          message_sent_5d?: boolean
          message_sent_at?: string | null
          message_sent_by?: string | null
          patient_telefone?: string
          report_approved?: boolean
          report_approved_at?: string | null
          report_approved_by?: string | null
          report_failsafe_triggered?: boolean
          report_ready?: boolean
          report_ready_at?: string | null
          report_ready_by?: string | null
          reviewed?: boolean
          scheduled_message_id?: string | null
          scheduled_message_id_0d?: string | null
          scheduled_message_id_10d?: string | null
          scheduled_message_id_5d?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "renewal_checklist_scheduled_message_id_fkey"
            columns: ["scheduled_message_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_scheduled_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      renewal_custom_content: {
        Row: {
          achievements_content: string | null
          created_at: string | null
          highlights_content: string | null
          id: string
          improvement_areas_content: string | null
          next_cycle_goals_content: string | null
          patient_telefone: string
          summary_content: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          achievements_content?: string | null
          created_at?: string | null
          highlights_content?: string | null
          id?: string
          improvement_areas_content?: string | null
          next_cycle_goals_content?: string | null
          patient_telefone: string
          summary_content?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          achievements_content?: string | null
          created_at?: string | null
          highlights_content?: string | null
          id?: string
          improvement_areas_content?: string | null
          next_cycle_goals_content?: string | null
          patient_telefone?: string
          summary_content?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      renewal_pop_config: {
        Row: {
          auto_enabled: boolean
          auto_engagement_window_days: number
          auto_failsafe_hours_before: number
          auto_report_enabled: boolean | null
          auto_send_hour_engajado_0d: number
          auto_send_hour_engajado_10d: number
          auto_send_hour_engajado_5d: number
          auto_send_hour_frio_0d: number
          auto_send_hour_frio_10d: number
          auto_send_minute_engajado_0d: number
          auto_send_minute_engajado_10d: number
          auto_send_minute_engajado_5d: number
          auto_send_minute_frio_0d: number
          auto_send_minute_frio_10d: number
          id: string
          offset_5d: number
          template_0d: Json | null
          template_10d: Json | null
          template_5d: Json | null
          template_frio_0d: Json | null
          template_frio_10d: Json | null
          template_frio_5d: Json | null
          template_library: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_enabled?: boolean
          auto_engagement_window_days?: number
          auto_failsafe_hours_before?: number
          auto_report_enabled?: boolean | null
          auto_send_hour_engajado_0d?: number
          auto_send_hour_engajado_10d?: number
          auto_send_hour_engajado_5d?: number
          auto_send_hour_frio_0d?: number
          auto_send_hour_frio_10d?: number
          auto_send_minute_engajado_0d?: number
          auto_send_minute_engajado_10d?: number
          auto_send_minute_engajado_5d?: number
          auto_send_minute_frio_0d?: number
          auto_send_minute_frio_10d?: number
          id?: string
          offset_5d?: number
          template_0d?: Json | null
          template_10d?: Json | null
          template_5d?: Json | null
          template_frio_0d?: Json | null
          template_frio_10d?: Json | null
          template_frio_5d?: Json | null
          template_library?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_enabled?: boolean
          auto_engagement_window_days?: number
          auto_failsafe_hours_before?: number
          auto_report_enabled?: boolean | null
          auto_send_hour_engajado_0d?: number
          auto_send_hour_engajado_10d?: number
          auto_send_hour_engajado_5d?: number
          auto_send_hour_frio_0d?: number
          auto_send_hour_frio_10d?: number
          auto_send_minute_engajado_0d?: number
          auto_send_minute_engajado_10d?: number
          auto_send_minute_engajado_5d?: number
          auto_send_minute_frio_0d?: number
          auto_send_minute_frio_10d?: number
          id?: string
          offset_5d?: number
          template_0d?: Json | null
          template_10d?: Json | null
          template_5d?: Json | null
          template_frio_0d?: Json | null
          template_frio_10d?: Json | null
          template_frio_5d?: Json | null
          template_library?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      respondechat_session: {
        Row: {
          expires_at: string
          id: number
          refresh_token: string | null
          token: string
          updated_at: string
        }
        Insert: {
          expires_at: string
          id?: number
          refresh_token?: string | null
          token: string
          updated_at?: string
        }
        Update: {
          expires_at?: string
          id?: number
          refresh_token?: string | null
          token?: string
          updated_at?: string
        }
        Relationships: []
      }
      retention_exclusions: {
        Row: {
          created_at: string | null
          excluded_at: string | null
          id: string
          patient_id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          excluded_at?: string | null
          id?: string
          patient_id: string
          reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          excluded_at?: string | null
          id?: string
          patient_id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "retention_exclusions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          display_name: string
          features: Json | null
          id: string
          max_checkins_per_month: number | null
          max_patients: number | null
          max_storage_gb: number | null
          name: string
          price_monthly: number
          price_yearly: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          display_name: string
          features?: Json | null
          id?: string
          max_checkins_per_month?: number | null
          max_patients?: number | null
          max_storage_gb?: number | null
          name: string
          price_monthly: number
          price_yearly?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          features?: Json | null
          id?: string
          max_checkins_per_month?: number | null
          max_patients?: number | null
          max_storage_gb?: number | null
          name?: string
          price_monthly?: number
          price_yearly?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          created_at: string | null
          details: Json | null
          id: string
          status: string
          sync_type: string | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          id?: string
          status: string
          sync_type?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          id?: string
          status?: string
          sync_type?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      system_config: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      task_reminders: {
        Row: {
          created_at: string | null
          dismissed_at: string | null
          id: string
          is_dismissed: boolean | null
          is_sent: boolean | null
          journey_id: string
          message: string | null
          patient_id: string
          patient_name: string
          remind_at: string
          reminder_type: string
          sent_in_checkin: boolean | null
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dismissed_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_sent?: boolean | null
          journey_id: string
          message?: string | null
          patient_id: string
          patient_name: string
          remind_at: string
          reminder_type: string
          sent_in_checkin?: boolean | null
          task_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          dismissed_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_sent?: boolean | null
          journey_id?: string
          message?: string | null
          patient_id?: string
          patient_name?: string
          remind_at?: string
          reminder_type?: string
          sent_in_checkin?: boolean | null
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_reminders_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "patient_journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_reminders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_reminders_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "patient_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      team_access_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          resource: string | null
          team_member_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource?: string | null
          team_member_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource?: string | null
          team_member_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_access_logs_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_access_logs_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      team_meetings: {
        Row: {
          action_items: Json | null
          created_at: string | null
          created_by: string
          decisions: string[] | null
          description: string | null
          id: string
          meeting_date: string
          meeting_type: string
          notes: string | null
          owner_id: string
          participants: string[] | null
          title: string
          topics: string[] | null
          updated_at: string | null
        }
        Insert: {
          action_items?: Json | null
          created_at?: string | null
          created_by: string
          decisions?: string[] | null
          description?: string | null
          id?: string
          meeting_date: string
          meeting_type: string
          notes?: string | null
          owner_id: string
          participants?: string[] | null
          title: string
          topics?: string[] | null
          updated_at?: string | null
        }
        Update: {
          action_items?: Json | null
          created_at?: string | null
          created_by?: string
          decisions?: string[] | null
          description?: string | null
          id?: string
          meeting_date?: string
          meeting_type?: string
          notes?: string | null
          owner_id?: string
          participants?: string[] | null
          title?: string
          topics?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          id: string
          invited_at: string | null
          is_active: boolean | null
          last_access: string | null
          name: string
          owner_id: string
          permissions: Json | null
          role: string | null
          role_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          id?: string
          invited_at?: string | null
          is_active?: boolean | null
          last_access?: string | null
          name: string
          owner_id: string
          permissions?: Json | null
          role?: string | null
          role_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          id?: string
          invited_at?: string | null
          is_active?: boolean | null
          last_access?: string | null
          name?: string
          owner_id?: string
          permissions?: Json | null
          role?: string | null
          role_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "team_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_system_role: boolean | null
          name: string
          permissions: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_system_role?: boolean | null
          name: string
          permissions?: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_system_role?: boolean | null
          name?: string
          permissions?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      text_snippets: {
        Row: {
          content: string
          created_at: string | null
          id: string
          kind: string
          owner_user_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          kind: string
          owner_user_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          kind?: string
          owner_user_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      "Total de Agendamentos por Funil": {
        Row: {
          created_at: string
          id: number
          PERCENT_TOTAL_AGEND: string | null
          TOTAL_AGEND_DOS_FUNIS: string | null
          TOTAL_GERAL_AGEND: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          PERCENT_TOTAL_AGEND?: string | null
          TOTAL_AGEND_DOS_FUNIS?: string | null
          TOTAL_GERAL_AGEND?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          PERCENT_TOTAL_AGEND?: string | null
          TOTAL_AGEND_DOS_FUNIS?: string | null
          TOTAL_GERAL_AGEND?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      "Total de Calls Agendadas": {
        Row: {
          AGENDADAS: string | null
          AGENDADOS_FACEBOOK: string | null
          AGENDADOS_GOOGLE: string | null
          AGENDADOS_GOOGLE_FORMS: string | null
          AGENDADOS_INDICACAO: string | null
          AGENDADOS_INSTAGRAM: string | null
          AGENDADOS_OUTROS: string | null
          AGENDADOS_SELLER: string | null
          created_at: string
          id: number
          PERCENT_QUE_VAI_PRA_CALL: string | null
          TOTAL_DE_CALLS_AGENDADAS: string | null
          user_id: string | null
        }
        Insert: {
          AGENDADAS?: string | null
          AGENDADOS_FACEBOOK?: string | null
          AGENDADOS_GOOGLE?: string | null
          AGENDADOS_GOOGLE_FORMS?: string | null
          AGENDADOS_INDICACAO?: string | null
          AGENDADOS_INSTAGRAM?: string | null
          AGENDADOS_OUTROS?: string | null
          AGENDADOS_SELLER?: string | null
          created_at?: string
          id?: number
          PERCENT_QUE_VAI_PRA_CALL?: string | null
          TOTAL_DE_CALLS_AGENDADAS?: string | null
          user_id?: string | null
        }
        Update: {
          AGENDADAS?: string | null
          AGENDADOS_FACEBOOK?: string | null
          AGENDADOS_GOOGLE?: string | null
          AGENDADOS_GOOGLE_FORMS?: string | null
          AGENDADOS_INDICACAO?: string | null
          AGENDADOS_INSTAGRAM?: string | null
          AGENDADOS_OUTROS?: string | null
          AGENDADOS_SELLER?: string | null
          created_at?: string
          id?: number
          PERCENT_QUE_VAI_PRA_CALL?: string | null
          TOTAL_DE_CALLS_AGENDADAS?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      "Total de Leads": {
        Row: {
          created_at: string
          id: number
          LEAD_FACEBOOK: string | null
          LEAD_GOOGLE: string | null
          LEAD_GOOGLE_FORMS: string | null
          LEAD_INDICACAO: string | null
          LEAD_INSTAGRAM: string | null
          LEAD_OUTROS: string | null
          LEAD_SELLER: string | null
          LEADS: string | null
          TOTAL_DE_LEADS: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          LEAD_FACEBOOK?: string | null
          LEAD_GOOGLE?: string | null
          LEAD_GOOGLE_FORMS?: string | null
          LEAD_INDICACAO?: string | null
          LEAD_INSTAGRAM?: string | null
          LEAD_OUTROS?: string | null
          LEAD_SELLER?: string | null
          LEADS?: string | null
          TOTAL_DE_LEADS?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          LEAD_FACEBOOK?: string | null
          LEAD_GOOGLE?: string | null
          LEAD_GOOGLE_FORMS?: string | null
          LEAD_INDICACAO?: string | null
          LEAD_INSTAGRAM?: string | null
          LEAD_OUTROS?: string | null
          LEAD_SELLER?: string | null
          LEADS?: string | null
          TOTAL_DE_LEADS?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      "Total de Leads por Funil": {
        Row: {
          created_at: string
          id: number
          PERCENT_TOTAL_LEADS: string | null
          TOTAL_DE_LEADS_DOS_FUNIS: string | null
          TOTAL_GERAL_LEADS: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          PERCENT_TOTAL_LEADS?: string | null
          TOTAL_DE_LEADS_DOS_FUNIS?: string | null
          TOTAL_GERAL_LEADS?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          PERCENT_TOTAL_LEADS?: string | null
          TOTAL_DE_LEADS_DOS_FUNIS?: string | null
          TOTAL_GERAL_LEADS?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      "Total de Vendas": {
        Row: {
          COMPROU: string | null
          created_at: string
          DATA: string | null
          DESMARCOU: string | null
          FUNIL: string | null
          id: number
          ID: string | null
          MÊS: string | null
          "NÃO COMPROU": string | null
          "NO SHOW": string | null
          PIX_COMPROMISSO: string | null
          "QUEM FEZ A CALL": string | null
          user_id: string | null
        }
        Insert: {
          COMPROU?: string | null
          created_at?: string
          DATA?: string | null
          DESMARCOU?: string | null
          FUNIL?: string | null
          id?: number
          ID?: string | null
          MÊS?: string | null
          "NÃO COMPROU"?: string | null
          "NO SHOW"?: string | null
          PIX_COMPROMISSO?: string | null
          "QUEM FEZ A CALL"?: string | null
          user_id?: string | null
        }
        Update: {
          COMPROU?: string | null
          created_at?: string
          DATA?: string | null
          DESMARCOU?: string | null
          FUNIL?: string | null
          id?: number
          ID?: string | null
          MÊS?: string | null
          "NÃO COMPROU"?: string | null
          "NO SHOW"?: string | null
          PIX_COMPROMISSO?: string | null
          "QUEM FEZ A CALL"?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      "Total de Vendas 2026": {
        Row: {
          COMPROU: string | null
          created_at: string
          DATA: string | null
          DESMARCOU: string | null
          FUNIL: string | null
          id: number
          ID: string | null
          MÊS: string | null
          "NÃO COMPROU": string | null
          "NO SHOW": string | null
          PIX_COMPROMISSO: string | null
          "QUEM FEZ A CALL": string | null
          user_id: string | null
        }
        Insert: {
          COMPROU?: string | null
          created_at?: string
          DATA?: string | null
          DESMARCOU?: string | null
          FUNIL?: string | null
          id?: number
          ID?: string | null
          MÊS?: string | null
          "NÃO COMPROU"?: string | null
          "NO SHOW"?: string | null
          PIX_COMPROMISSO?: string | null
          "QUEM FEZ A CALL"?: string | null
          user_id?: string | null
        }
        Update: {
          COMPROU?: string | null
          created_at?: string
          DATA?: string | null
          DESMARCOU?: string | null
          FUNIL?: string | null
          id?: number
          ID?: string | null
          MÊS?: string | null
          "NÃO COMPROU"?: string | null
          "NO SHOW"?: string | null
          PIX_COMPROMISSO?: string | null
          "QUEM FEZ A CALL"?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_access_control: {
        Row: {
          created_at: string | null
          id: string
          route_commercial_metrics: boolean | null
          route_metrics: boolean | null
          route_plans: boolean | null
          route_reports: boolean | null
          updated_at: string | null
          updated_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          route_commercial_metrics?: boolean | null
          route_metrics?: boolean | null
          route_plans?: boolean | null
          route_reports?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          route_commercial_metrics?: boolean | null
          route_metrics?: boolean | null
          route_plans?: boolean | null
          route_reports?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_api_keys: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          key_hash: string
          last_used: string | null
          name: string
          permissions: string[] | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          key_hash: string
          last_used?: string | null
          name: string
          permissions?: string[] | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          key_hash?: string
          last_used?: string | null
          name?: string
          permissions?: string[] | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_favorite_foods: {
        Row: {
          created_at: string | null
          food_id: string | null
          food_name: string
          id: string
          last_used_at: string | null
          usage_count: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          food_id?: string | null
          food_name: string
          id?: string
          last_used_at?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          food_id?: string | null
          food_name?: string
          id?: string
          last_used_at?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_favorite_foods_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "food_database"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorite_meals: {
        Row: {
          calories: number | null
          carbs: number | null
          created_at: string | null
          end_time: string | null
          fats: number | null
          foods: Json
          id: string
          instructions: string | null
          meal_name: string
          protein: number | null
          start_time: string | null
          suggested_time: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          calories?: number | null
          carbs?: number | null
          created_at?: string | null
          end_time?: string | null
          fats?: number | null
          foods?: Json
          id?: string
          instructions?: string | null
          meal_name: string
          protein?: number | null
          start_time?: string | null
          suggested_time?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          calories?: number | null
          carbs?: number | null
          created_at?: string | null
          end_time?: string | null
          fats?: number | null
          foods?: Json
          id?: string
          instructions?: string | null
          meal_name?: string
          protein?: number | null
          start_time?: string | null
          suggested_time?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_food_database: {
        Row: {
          calories_per_100g: number
          carbs_per_100g: number
          category: string
          common_units: Json | null
          created_at: string | null
          fats_per_100g: number
          id: string
          is_active: boolean | null
          name: string
          protein_per_100g: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          calories_per_100g: number
          carbs_per_100g?: number
          category: string
          common_units?: Json | null
          created_at?: string | null
          fats_per_100g?: number
          id?: string
          is_active?: boolean | null
          name: string
          protein_per_100g?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          calories_per_100g?: number
          carbs_per_100g?: number
          category?: string
          common_units?: Json | null
          created_at?: string | null
          fats_per_100g?: number
          id?: string
          is_active?: boolean | null
          name?: string
          protein_per_100g?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_food_measures: {
        Row: {
          calories: number | null
          carbs: number | null
          created_at: string
          fats: number | null
          food_id: string | null
          food_name: string
          gram_weight: number
          id: string
          owner_id: string
          protein: number | null
          unit_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          calories?: number | null
          carbs?: number | null
          created_at?: string
          fats?: number | null
          food_id?: string | null
          food_name: string
          gram_weight: number
          id?: string
          owner_id: string
          protein?: number | null
          unit_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          calories?: number | null
          carbs?: number | null
          created_at?: string
          fats?: number | null
          food_id?: string | null
          food_name?: string
          gram_weight?: number
          id?: string
          owner_id?: string
          protein?: number | null
          unit_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_food_measures_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "food_database"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          column_order: Json | null
          column_widths: Json | null
          commercial_whatsapp: Json | null
          created_at: string | null
          filters: Json | null
          id: string
          page_size: number | null
          sorting: Json | null
          updated_at: string | null
          user_id: string
          visible_columns: string[] | null
        }
        Insert: {
          column_order?: Json | null
          column_widths?: Json | null
          commercial_whatsapp?: Json | null
          created_at?: string | null
          filters?: Json | null
          id?: string
          page_size?: number | null
          sorting?: Json | null
          updated_at?: string | null
          user_id: string
          visible_columns?: string[] | null
        }
        Update: {
          column_order?: Json | null
          column_widths?: Json | null
          commercial_whatsapp?: Json | null
          created_at?: string | null
          filters?: Json | null
          id?: string
          page_size?: number | null
          sorting?: Json | null
          updated_at?: string | null
          user_id?: string
          visible_columns?: string[] | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          bio: string | null
          clinic: string | null
          created_at: string | null
          crm: string | null
          email: string
          id: string
          name: string
          phone: string | null
          share_brand_color: string | null
          share_brand_name: string | null
          share_logo_url: string | null
          specialty: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          clinic?: string | null
          created_at?: string | null
          crm?: string | null
          email: string
          id: string
          name: string
          phone?: string | null
          share_brand_color?: string | null
          share_brand_name?: string | null
          share_logo_url?: string | null
          specialty?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          clinic?: string | null
          created_at?: string | null
          crm?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          share_brand_color?: string | null
          share_brand_name?: string | null
          share_logo_url?: string | null
          specialty?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          payment_provider: string | null
          payment_provider_subscription_id: string | null
          status: string
          subscription_plan_id: string | null
          trial_end: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          payment_provider?: string | null
          payment_provider_subscription_id?: string | null
          status: string
          subscription_plan_id?: string | null
          trial_end?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          payment_provider?: string | null
          payment_provider_subscription_id?: string | null
          status?: string
          subscription_plan_id?: string | null
          trial_end?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_subscription_plan_id_fkey"
            columns: ["subscription_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_webhook_configs: {
        Row: {
          config: Json | null
          created_at: string | null
          enabled: boolean | null
          id: string
          updated_at: string | null
          user_id: string
          webhook_type: string
          webhook_url: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          updated_at?: string | null
          user_id: string
          webhook_type: string
          webhook_url?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          updated_at?: string | null
          user_id?: string
          webhook_type?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      vendas_mes: {
        Row: {
          created_at: string
          data: string
          id: string
          mes: string
          nome: string
          updated_at: string
          valor: number
        }
        Insert: {
          created_at?: string
          data: string
          id?: string
          mes: string
          nome: string
          updated_at?: string
          valor?: number
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          mes?: string
          nome?: string
          updated_at?: string
          valor?: number
        }
        Relationships: []
      }
      webdiet_session: {
        Row: {
          cookie: string
          expires_at: string
          id: number
          n: string | null
          t: string | null
          updated_at: string
        }
        Insert: {
          cookie: string
          expires_at: string
          id?: number
          n?: string | null
          t?: string | null
          updated_at?: string
        }
        Update: {
          cookie?: string
          expires_at?: string
          id?: number
          n?: string | null
          t?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      weekly_challenge_completions: {
        Row: {
          challenge_id: string
          completed_at: string
          id: string
          patient_id: string
          points_earned: number
        }
        Insert: {
          challenge_id: string
          completed_at?: string
          id?: string
          patient_id: string
          points_earned: number
        }
        Update: {
          challenge_id?: string
          completed_at?: string
          id?: string
          patient_id?: string
          points_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "weekly_challenge_completions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "weekly_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_challenges: {
        Row: {
          active: boolean | null
          color: string | null
          created_at: string | null
          description: string | null
          emoji: string | null
          id: string
          points: number
          rule_params: Json | null
          rule_type: string
          title: string
          trainer_user_id: string
          updated_at: string | null
          week_key: string
        }
        Insert: {
          active?: boolean | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          points?: number
          rule_params?: Json | null
          rule_type: string
          title: string
          trainer_user_id: string
          updated_at?: string | null
          week_key: string
        }
        Update: {
          active?: boolean | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          points?: number
          rule_params?: Json | null
          rule_type?: string
          title?: string
          trainer_user_id?: string
          updated_at?: string | null
          week_key?: string
        }
        Relationships: []
      }
      weight_tracking: {
        Row: {
          created_at: string | null
          data_pesagem: string
          id: string
          observacoes: string | null
          peso_dia: number | null
          peso_jejum: number | null
          telefone: string
          tipo: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data_pesagem?: string
          id?: string
          observacoes?: string | null
          peso_dia?: number | null
          peso_jejum?: number | null
          telefone: string
          tipo: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data_pesagem?: string
          id?: string
          observacoes?: string | null
          peso_dia?: number | null
          peso_jejum?: number | null
          telefone?: string
          tipo?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "weight_tracking_telefone_fkey"
            columns: ["telefone"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["telefone"]
          },
          {
            foreignKeyName: "weight_tracking_telefone_fkey"
            columns: ["telefone"]
            isOneToOne: false
            referencedRelation: "v_patient_workout_risk"
            referencedColumns: ["telefone"]
          },
        ]
      }
      whatsapp_instances: {
        Row: {
          burst_pause_until: string | null
          created_at: string
          display_name: string | null
          error_message: string | null
          forward_to_n8n: boolean
          id: string
          instance_name: string
          last_connected_at: string | null
          last_disconnected_at: string | null
          phone_number: string | null
          provider: string
          qr_code: string | null
          role: string
          sends_paused: boolean
          sends_paused_at: string | null
          sends_paused_by: string | null
          sends_paused_reason: string | null
          sends_paused_until: string | null
          status: string
          updated_at: string
          user_id: string
          webhook_url: string | null
        }
        Insert: {
          burst_pause_until?: string | null
          created_at?: string
          display_name?: string | null
          error_message?: string | null
          forward_to_n8n?: boolean
          id?: string
          instance_name: string
          last_connected_at?: string | null
          last_disconnected_at?: string | null
          phone_number?: string | null
          provider?: string
          qr_code?: string | null
          role?: string
          sends_paused?: boolean
          sends_paused_at?: string | null
          sends_paused_by?: string | null
          sends_paused_reason?: string | null
          sends_paused_until?: string | null
          status?: string
          updated_at?: string
          user_id: string
          webhook_url?: string | null
        }
        Update: {
          burst_pause_until?: string | null
          created_at?: string
          display_name?: string | null
          error_message?: string | null
          forward_to_n8n?: boolean
          id?: string
          instance_name?: string
          last_connected_at?: string | null
          last_disconnected_at?: string | null
          phone_number?: string | null
          provider?: string
          qr_code?: string | null
          role?: string
          sends_paused?: boolean
          sends_paused_at?: string | null
          sends_paused_by?: string | null
          sends_paused_reason?: string | null
          sends_paused_until?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      whatsapp_last_contact: {
        Row: {
          id: string
          last_any_contact_at: string
          last_incoming_at: string | null
          last_outgoing_at: string | null
          patient_id: string
          patient_phone: string
          total_messages_received: number | null
          total_messages_sent: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          last_any_contact_at?: string
          last_incoming_at?: string | null
          last_outgoing_at?: string | null
          patient_id: string
          patient_phone: string
          total_messages_received?: number | null
          total_messages_sent?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          last_any_contact_at?: string
          last_incoming_at?: string | null
          last_outgoing_at?: string | null
          patient_id?: string
          patient_phone?: string
          total_messages_received?: number | null
          total_messages_sent?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_last_contact_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages_log: {
        Row: {
          content: string | null
          created_at: string
          direction: string
          error_message: string | null
          id: string
          instance_name: string
          media_mimetype: string | null
          media_url: string | null
          message_type: string
          metadata: Json | null
          patient_id: string | null
          recipient_phone: string
          remote_message_id: string | null
          sender_phone: string | null
          status: string
          trigger_type: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          direction?: string
          error_message?: string | null
          id?: string
          instance_name: string
          media_mimetype?: string | null
          media_url?: string | null
          message_type?: string
          metadata?: Json | null
          patient_id?: string | null
          recipient_phone: string
          remote_message_id?: string | null
          sender_phone?: string | null
          status?: string
          trigger_type?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          direction?: string
          error_message?: string | null
          id?: string
          instance_name?: string
          media_mimetype?: string | null
          media_url?: string | null
          message_type?: string
          metadata?: Json | null
          patient_id?: string | null
          recipient_phone?: string
          remote_message_id?: string | null
          sender_phone?: string | null
          status?: string
          trigger_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_log_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_scheduled_messages: {
        Row: {
          attempt_count: number
          created_at: string
          day_of_month: number | null
          day_of_week: number | null
          error_message: string | null
          id: string
          is_checkin_message: boolean
          is_journey_task: boolean
          is_renewal_message: boolean
          last_sent_at: string | null
          manually_edited: boolean | null
          max_sends: number | null
          media_url: string | null
          message_content: string
          message_type: string
          next_send_at: string | null
          patient_id: string
          patient_task_id: string | null
          recipient_phone: string
          recurring_interval_days: number | null
          recurring_interval_weeks: number | null
          schedule_type: string
          scheduled_at: string
          send_count: number | null
          sequence_enrollment_id: string | null
          sequence_step_id: string | null
          status: string
          target: string | null
          target_channel: string
          template_id: string | null
          updated_at: string
          user_id: string
          variant_index: number | null
          weekend_handling: string | null
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          day_of_month?: number | null
          day_of_week?: number | null
          error_message?: string | null
          id?: string
          is_checkin_message?: boolean
          is_journey_task?: boolean
          is_renewal_message?: boolean
          last_sent_at?: string | null
          manually_edited?: boolean | null
          max_sends?: number | null
          media_url?: string | null
          message_content: string
          message_type?: string
          next_send_at?: string | null
          patient_id: string
          patient_task_id?: string | null
          recipient_phone: string
          recurring_interval_days?: number | null
          recurring_interval_weeks?: number | null
          schedule_type?: string
          scheduled_at: string
          send_count?: number | null
          sequence_enrollment_id?: string | null
          sequence_step_id?: string | null
          status?: string
          target?: string | null
          target_channel?: string
          template_id?: string | null
          updated_at?: string
          user_id: string
          variant_index?: number | null
          weekend_handling?: string | null
        }
        Update: {
          attempt_count?: number
          created_at?: string
          day_of_month?: number | null
          day_of_week?: number | null
          error_message?: string | null
          id?: string
          is_checkin_message?: boolean
          is_journey_task?: boolean
          is_renewal_message?: boolean
          last_sent_at?: string | null
          manually_edited?: boolean | null
          max_sends?: number | null
          media_url?: string | null
          message_content?: string
          message_type?: string
          next_send_at?: string | null
          patient_id?: string
          patient_task_id?: string | null
          recipient_phone?: string
          recurring_interval_days?: number | null
          recurring_interval_weeks?: number | null
          schedule_type?: string
          scheduled_at?: string
          send_count?: number | null
          sequence_enrollment_id?: string | null
          sequence_step_id?: string | null
          status?: string
          target?: string | null
          target_channel?: string
          template_id?: string | null
          updated_at?: string
          user_id?: string
          variant_index?: number | null
          weekend_handling?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_scheduled_messages_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_scheduled_messages_patient_task_id_fkey"
            columns: ["patient_task_id"]
            isOneToOne: false
            referencedRelation: "patient_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_scheduled_messages_sequence_enrollment_id_fkey"
            columns: ["sequence_enrollment_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_sequence_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_scheduled_messages_sequence_step_id_fkey"
            columns: ["sequence_step_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_sequence_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_sequence_enrollments: {
        Row: {
          created_at: string
          id: string
          last_step_day: number | null
          messages_generated: number | null
          messages_sent: number | null
          patient_id: string
          sequence_id: string
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_step_day?: number | null
          messages_generated?: number | null
          messages_sent?: number | null
          patient_id: string
          sequence_id: string
          start_date: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_step_day?: number | null
          messages_generated?: number | null
          messages_sent?: number | null
          patient_id?: string
          sequence_id?: string
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_sequence_enrollments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_sequence_enrollments_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_sequence_steps: {
        Row: {
          created_at: string
          day_offset: number
          id: string
          is_active: boolean | null
          is_checkin_message: boolean
          message_type: string
          message_variants: Json
          sequence_id: string
          step_order: number
        }
        Insert: {
          created_at?: string
          day_offset: number
          id?: string
          is_active?: boolean | null
          is_checkin_message?: boolean
          message_type?: string
          message_variants?: Json
          sequence_id: string
          step_order?: number
        }
        Update: {
          created_at?: string
          day_offset?: number
          id?: string
          is_active?: boolean | null
          is_checkin_message?: boolean
          message_type?: string
          message_variants?: Json
          sequence_id?: string
          step_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_sequence_steps_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_sequences: {
        Row: {
          auto_enroll_new_patients: boolean | null
          created_at: string
          daily_limit: number
          delay_max_seconds: number
          delay_min_seconds: number
          description: string | null
          id: string
          is_active: boolean | null
          monitor_checkin: boolean
          name: string
          send_days: string[]
          send_time: string
          target_channel: string
          timezone: string
          trigger_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_enroll_new_patients?: boolean | null
          created_at?: string
          daily_limit?: number
          delay_max_seconds?: number
          delay_min_seconds?: number
          description?: string | null
          id?: string
          is_active?: boolean | null
          monitor_checkin?: boolean
          name: string
          send_days?: string[]
          send_time?: string
          target_channel?: string
          timezone?: string
          trigger_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_enroll_new_patients?: boolean | null
          created_at?: string
          daily_limit?: number
          delay_max_seconds?: number
          delay_min_seconds?: number
          description?: string | null
          id?: string
          is_active?: boolean | null
          monitor_checkin?: boolean
          name?: string
          send_days?: string[]
          send_time?: string
          target_channel?: string
          timezone?: string
          trigger_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_templates: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          media_url: string | null
          name: string
          updated_at: string
          usage_count: number | null
          user_id: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          media_url?: string | null
          name: string
          updated_at?: string
          usage_count?: number | null
          user_id: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          media_url?: string | null
          name?: string
          updated_at?: string
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      workout_exercise_patient_notes: {
        Row: {
          exercise_key: string
          note: string | null
          patient_id: string
          updated_at: string
        }
        Insert: {
          exercise_key: string
          note?: string | null
          patient_id: string
          updated_at?: string
        }
        Update: {
          exercise_key?: string
          note?: string | null
          patient_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      workout_exercise_techniques: {
        Row: {
          applies_to: string
          created_at: string | null
          id: string
          notes: string | null
          technique_id: string
          workout_exercise_id: string | null
        }
        Insert: {
          applies_to?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          technique_id: string
          workout_exercise_id?: string | null
        }
        Update: {
          applies_to?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          technique_id?: string
          workout_exercise_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercise_techniques_technique_id_fkey"
            columns: ["technique_id"]
            isOneToOne: false
            referencedRelation: "workout_techniques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercise_techniques_workout_exercise_id_fkey"
            columns: ["workout_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_exercises: {
        Row: {
          created_at: string | null
          exercise_id: string | null
          exercise_name: string
          exercise_order: number
          id: string
          internal_notes: string | null
          load_kg: number | null
          load_kg_per_set: string | null
          notes: string | null
          reps: string | null
          rest_seconds: number | null
          rest_seconds_max: number | null
          rpe: number | null
          rpe_per_set: string | null
          session_id: string
          sets: number | null
          skip_periodization: boolean | null
          superset_group: string | null
          tempo: string | null
          warmup_reps: string | null
          warmup_rpe: number | null
          warmup_sets: number | null
        }
        Insert: {
          created_at?: string | null
          exercise_id?: string | null
          exercise_name: string
          exercise_order?: number
          id?: string
          internal_notes?: string | null
          load_kg?: number | null
          load_kg_per_set?: string | null
          notes?: string | null
          reps?: string | null
          rest_seconds?: number | null
          rest_seconds_max?: number | null
          rpe?: number | null
          rpe_per_set?: string | null
          session_id: string
          sets?: number | null
          skip_periodization?: boolean | null
          superset_group?: string | null
          tempo?: string | null
          warmup_reps?: string | null
          warmup_rpe?: number | null
          warmup_sets?: number | null
        }
        Update: {
          created_at?: string | null
          exercise_id?: string | null
          exercise_name?: string
          exercise_order?: number
          id?: string
          internal_notes?: string | null
          load_kg?: number | null
          load_kg_per_set?: string | null
          notes?: string | null
          reps?: string | null
          rest_seconds?: number | null
          rest_seconds_max?: number | null
          rpe?: number | null
          rpe_per_set?: string | null
          session_id?: string
          sets?: number | null
          skip_periodization?: boolean | null
          superset_group?: string | null
          tempo?: string | null
          warmup_reps?: string | null
          warmup_rpe?: number | null
          warmup_sets?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercise_database"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_personal_records: {
        Row: {
          achieved_at: string | null
          estimated_1rm: number | null
          exercise_id: string
          id: string
          max_reps: number | null
          max_volume_kg: number | null
          max_weight_kg: number | null
          patient_id: string
          set_log_id: string | null
          updated_at: string
        }
        Insert: {
          achieved_at?: string | null
          estimated_1rm?: number | null
          exercise_id: string
          id?: string
          max_reps?: number | null
          max_volume_kg?: number | null
          max_weight_kg?: number | null
          patient_id: string
          set_log_id?: string | null
          updated_at?: string
        }
        Update: {
          achieved_at?: string | null
          estimated_1rm?: number | null
          exercise_id?: string
          id?: string
          max_reps?: number | null
          max_volume_kg?: number | null
          max_weight_kg?: number | null
          patient_id?: string
          set_log_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_personal_records_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercise_database"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_personal_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_personal_records_set_log_id_fkey"
            columns: ["set_log_id"]
            isOneToOne: false
            referencedRelation: "workout_set_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_phase_snapshots: {
        Row: {
          exercises_data: Json
          id: string
          notes: string | null
          phase_label: string
          plan_id: string
          taken_at: string
          techniques_data: Json | null
        }
        Insert: {
          exercises_data: Json
          id?: string
          notes?: string | null
          phase_label: string
          plan_id: string
          taken_at?: string
          techniques_data?: Json | null
        }
        Update: {
          exercises_data?: Json
          id?: string
          notes?: string | null
          phase_label?: string
          plan_id?: string
          taken_at?: string
          techniques_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_phase_snapshots_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "v_patient_workout_risk"
            referencedColumns: ["plan_id"]
          },
          {
            foreignKeyName: "workout_phase_snapshots_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_plan_cardio: {
        Row: {
          created_at: string | null
          dias_semana: number[] | null
          frequencia: string | null
          id: string
          intensidade: string | null
          is_active: boolean
          modalidade: string | null
          modo: string | null
          observacoes: string | null
          opcoes: Json | null
          tempo_padrao: number | null
          tempo_padrao_max: number | null
          tempo_por_dia: Json | null
          unidade: string | null
          updated_at: string | null
          vezes_semana: number | null
          vezes_semana_max: number | null
          workout_plan_id: string | null
        }
        Insert: {
          created_at?: string | null
          dias_semana?: number[] | null
          frequencia?: string | null
          id?: string
          intensidade?: string | null
          is_active?: boolean
          modalidade?: string | null
          modo?: string | null
          observacoes?: string | null
          opcoes?: Json | null
          tempo_padrao?: number | null
          tempo_padrao_max?: number | null
          tempo_por_dia?: Json | null
          unidade?: string | null
          updated_at?: string | null
          vezes_semana?: number | null
          vezes_semana_max?: number | null
          workout_plan_id?: string | null
        }
        Update: {
          created_at?: string | null
          dias_semana?: number[] | null
          frequencia?: string | null
          id?: string
          intensidade?: string | null
          is_active?: boolean
          modalidade?: string | null
          modo?: string | null
          observacoes?: string | null
          opcoes?: Json | null
          tempo_padrao?: number | null
          tempo_padrao_max?: number | null
          tempo_por_dia?: Json | null
          unidade?: string | null
          updated_at?: string | null
          vezes_semana?: number | null
          vezes_semana_max?: number | null
          workout_plan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_plan_cardio_workout_plan_id_fkey"
            columns: ["workout_plan_id"]
            isOneToOne: false
            referencedRelation: "v_patient_workout_risk"
            referencedColumns: ["plan_id"]
          },
          {
            foreignKeyName: "workout_plan_cardio_workout_plan_id_fkey"
            columns: ["workout_plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_plans: {
        Row: {
          auto_archive_others_on_activate: boolean
          created_at: string | null
          created_by: string | null
          current_phase_index: number
          current_phase_label: string | null
          end_date: string | null
          folder_id: string | null
          frequency_per_week: number | null
          frequency_per_week_max: number | null
          goal: string | null
          id: string
          internal_notes: string | null
          mfit_workout_id: string | null
          name: string
          notes: string | null
          patient_id: string
          periodization_anchor_at: string | null
          periodization_template_id: string | null
          phase_silent_advance: boolean
          phase_started_at: string | null
          released_at: string | null
          session_naming_style: string
          source: string | null
          source_template_id: string | null
          start_date: string | null
          status: string
          tags: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          auto_archive_others_on_activate?: boolean
          created_at?: string | null
          created_by?: string | null
          current_phase_index?: number
          current_phase_label?: string | null
          end_date?: string | null
          folder_id?: string | null
          frequency_per_week?: number | null
          frequency_per_week_max?: number | null
          goal?: string | null
          id?: string
          internal_notes?: string | null
          mfit_workout_id?: string | null
          name: string
          notes?: string | null
          patient_id: string
          periodization_anchor_at?: string | null
          periodization_template_id?: string | null
          phase_silent_advance?: boolean
          phase_started_at?: string | null
          released_at?: string | null
          session_naming_style?: string
          source?: string | null
          source_template_id?: string | null
          start_date?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          auto_archive_others_on_activate?: boolean
          created_at?: string | null
          created_by?: string | null
          current_phase_index?: number
          current_phase_label?: string | null
          end_date?: string | null
          folder_id?: string | null
          frequency_per_week?: number | null
          frequency_per_week_max?: number | null
          goal?: string | null
          id?: string
          internal_notes?: string | null
          mfit_workout_id?: string | null
          name?: string
          notes?: string | null
          patient_id?: string
          periodization_anchor_at?: string | null
          periodization_template_id?: string | null
          phase_silent_advance?: boolean
          phase_started_at?: string | null
          released_at?: string | null
          session_naming_style?: string
          source?: string | null
          source_template_id?: string | null
          start_date?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_plans_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "workout_template_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_plans_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_plans_periodization_template_id_fkey"
            columns: ["periodization_template_id"]
            isOneToOne: false
            referencedRelation: "periodization_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_plans_source_template_id_fkey"
            columns: ["source_template_id"]
            isOneToOne: false
            referencedRelation: "v_patient_workout_risk"
            referencedColumns: ["plan_id"]
          },
          {
            foreignKeyName: "workout_plans_source_template_id_fkey"
            columns: ["source_template_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_session_logs: {
        Row: {
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          notes: string | null
          patient_id: string
          rating: number | null
          session_id: string | null
          started_at: string
          total_sets: number | null
          total_volume_kg: number | null
          workout_plan_id: string | null
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          rating?: number | null
          session_id?: string | null
          started_at?: string
          total_sets?: number | null
          total_volume_kg?: number | null
          workout_plan_id?: string | null
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          rating?: number | null
          session_id?: string | null
          started_at?: string
          total_sets?: number | null
          total_volume_kg?: number | null
          workout_plan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_session_logs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_session_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_session_logs_workout_plan_id_fkey"
            columns: ["workout_plan_id"]
            isOneToOne: false
            referencedRelation: "v_patient_workout_risk"
            referencedColumns: ["plan_id"]
          },
          {
            foreignKeyName: "workout_session_logs_workout_plan_id_fkey"
            columns: ["workout_plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          created_at: string | null
          day_of_week: number | null
          focus: string | null
          id: string
          internal_notes: string | null
          is_active: boolean
          name: string
          notes: string | null
          session_order: number
          session_type: string
          user_id: string | null
          workout_plan_id: string
        }
        Insert: {
          created_at?: string | null
          day_of_week?: number | null
          focus?: string | null
          id?: string
          internal_notes?: string | null
          is_active?: boolean
          name: string
          notes?: string | null
          session_order?: number
          session_type?: string
          user_id?: string | null
          workout_plan_id: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number | null
          focus?: string | null
          id?: string
          internal_notes?: string | null
          is_active?: boolean
          name?: string
          notes?: string | null
          session_order?: number
          session_type?: string
          user_id?: string | null
          workout_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_workout_plan_id_fkey"
            columns: ["workout_plan_id"]
            isOneToOne: false
            referencedRelation: "v_patient_workout_risk"
            referencedColumns: ["plan_id"]
          },
          {
            foreignKeyName: "workout_sessions_workout_plan_id_fkey"
            columns: ["workout_plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_set_logs: {
        Row: {
          completed: boolean
          exercise_id: string | null
          exercise_name: string
          id: string
          is_warmup: boolean
          logged_at: string
          notes: string | null
          patient_id: string
          planned_exercise_id: string | null
          reps: number | null
          rpe: number | null
          session_log_id: string
          set_index: number
          weight_kg: number | null
        }
        Insert: {
          completed?: boolean
          exercise_id?: string | null
          exercise_name: string
          id?: string
          is_warmup?: boolean
          logged_at?: string
          notes?: string | null
          patient_id: string
          planned_exercise_id?: string | null
          reps?: number | null
          rpe?: number | null
          session_log_id: string
          set_index: number
          weight_kg?: number | null
        }
        Update: {
          completed?: boolean
          exercise_id?: string | null
          exercise_name?: string
          id?: string
          is_warmup?: boolean
          logged_at?: string
          notes?: string | null
          patient_id?: string
          planned_exercise_id?: string | null
          reps?: number | null
          rpe?: number | null
          session_log_id?: string
          set_index?: number
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_set_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercise_database"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_set_logs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_set_logs_planned_exercise_id_fkey"
            columns: ["planned_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_set_logs_session_log_id_fkey"
            columns: ["session_log_id"]
            isOneToOne: false
            referencedRelation: "workout_session_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_techniques: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          emoji: string | null
          id: string
          is_active: boolean | null
          name: string
          owner_user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          owner_user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          owner_user_id?: string | null
        }
        Relationships: []
      }
      workout_template_folders: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          mfit_folder_id: string | null
          name: string
          owner_user_id: string
          parent_id: string | null
          sort_order: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          mfit_folder_id?: string | null
          name: string
          owner_user_id: string
          parent_id?: string | null
          sort_order?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          mfit_folder_id?: string | null
          name?: string
          owner_user_id?: string
          parent_id?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_template_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "workout_template_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts_hub_settings: {
        Row: {
          card_key: string
          created_at: string
          description_override: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_hidden: boolean
          title_override: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          card_key: string
          created_at?: string
          description_override?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_hidden?: boolean
          title_override?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          card_key?: string
          created_at?: string
          description_override?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_hidden?: boolean
          title_override?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workspace_people: {
        Row: {
          color: string
          created_at: string
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          color: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      workspace_schedules: {
        Row: {
          created_at: string
          created_by: string | null
          day_of_week: number
          hour: number
          id: string
          person_id: string | null
          person_name: string | null
          task_description: string | null
          updated_at: string
          week_start_date: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          day_of_week: number
          hour: number
          id?: string
          person_id?: string | null
          person_name?: string | null
          task_description?: string | null
          updated_at?: string
          week_start_date: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          day_of_week?: number
          hour?: number
          id?: string
          person_id?: string | null
          person_name?: string | null
          task_description?: string | null
          updated_at?: string
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_schedules_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "workspace_people"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      dashboard_metricas: {
        Row: {
          ano: string | null
          ativos_total_inicio_mes: number | null
          churn_max: number | null
          congelamento: number | null
          created_at: string | null
          data_referencia: string | null
          desistencia: number | null
          entraram: number | null
          id: number | null
          mes: string | null
          mes_numero: string | null
          nao_renovou: number | null
          percentual_churn: number | null
          percentual_renovacao: number | null
          sairam: number | null
          saldo_entrada_saida: number | null
          status_saude: string | null
          taxa_churn_calculada: number | null
          taxa_crescimento: number | null
          updated_at: string | null
          user_id: string | null
          vencimentos: number | null
        }
        Insert: {
          ano?: string | null
          ativos_total_inicio_mes?: never
          churn_max?: never
          congelamento?: never
          created_at?: string | null
          data_referencia?: string | null
          desistencia?: never
          entraram?: never
          id?: number | null
          mes?: string | null
          mes_numero?: string | null
          nao_renovou?: never
          percentual_churn?: never
          percentual_renovacao?: never
          sairam?: never
          saldo_entrada_saida?: never
          status_saude?: never
          taxa_churn_calculada?: never
          taxa_crescimento?: never
          updated_at?: string | null
          user_id?: string | null
          vencimentos?: never
        }
        Update: {
          ano?: string | null
          ativos_total_inicio_mes?: never
          churn_max?: never
          congelamento?: never
          created_at?: string | null
          data_referencia?: string | null
          desistencia?: never
          entraram?: never
          id?: number | null
          mes?: string | null
          mes_numero?: string | null
          nao_renovou?: never
          percentual_churn?: never
          percentual_renovacao?: never
          sairam?: never
          saldo_entrada_saida?: never
          status_saude?: never
          taxa_churn_calculada?: never
          taxa_crescimento?: never
          updated_at?: string | null
          user_id?: string | null
          vencimentos?: never
        }
        Relationships: []
      }
      team_members_public: {
        Row: {
          email: string | null
          id: string | null
          is_active: boolean | null
          name: string | null
          owner_id: string | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          email?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          owner_id?: string | null
          role?: string | null
          user_id?: string | null
        }
        Update: {
          email?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          owner_id?: string | null
          role?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ultimos_6_meses: {
        Row: {
          ano: string | null
          ativos_total_inicio_mes: number | null
          churn_max: number | null
          congelamento: number | null
          created_at: string | null
          data_referencia: string | null
          desistencia: number | null
          entraram: number | null
          id: number | null
          mes: string | null
          mes_numero: string | null
          nao_renovou: number | null
          percentual_churn: number | null
          percentual_renovacao: number | null
          sairam: number | null
          saldo_entrada_saida: number | null
          status_saude: string | null
          taxa_churn_calculada: number | null
          taxa_crescimento: number | null
          updated_at: string | null
          user_id: string | null
          vencimentos: number | null
        }
        Relationships: []
      }
      v_patient_workout_risk: {
        Row: {
          adherence_pct: number | null
          days_since_last: number | null
          expected_14d: number | null
          frequency_per_week: number | null
          last_session_at: string | null
          patient_id: string | null
          patient_name: string | null
          plan_id: string | null
          plan_name: string | null
          risk_status: string | null
          sessions_14d: number | null
          telefone: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_plans_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _achievement_metric_for_patient: {
        Args: { p_patient_id: string; p_rule_type: string }
        Returns: number
      }
      _apply_phase_change_core: {
        Args: {
          p_plan_id: string
          p_progress_increment_pct?: number
          p_target_phase_index: number
        }
        Returns: Json
      }
      _community_norm_category: { Args: { p_cat: string }; Returns: string }
      _community_valid_reaction: { Args: { p_type: string }; Returns: boolean }
      _is_admin_master_dob: { Args: { p_dob: string }; Returns: boolean }
      _period_range: {
        Args: { p_period: string; p_period_key: string }
        Returns: {
          end_date: string
          start_date: string
        }[]
      }
      _weekly_metric_for_patient: {
        Args: { p_patient_id: string; p_rule_type: string; p_week_key: string }
        Returns: number
      }
      _workout_patient_from_token: {
        Args: { p_token: string }
        Returns: string
      }
      acquire_checkin_lock: {
        Args: { checkin_uuid: string; user_uuid: string }
        Returns: boolean
      }
      activate_scheduled_workout_plans: {
        Args: never
        Returns: {
          archived_others: number
          patient_id: string
          plan_id: string
        }[]
      }
      admin_anti_ban_metrics: { Args: never; Returns: Json }
      admin_assign_trial: {
        Args: { p_plan_id: string; p_user_id: string }
        Returns: Json
      }
      admin_change_user_plan: {
        Args: { new_plan_id: string; target_user_id: string }
        Returns: undefined
      }
      admin_delete_auth_user: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      admin_delete_user: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      admin_delete_user_data: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      admin_extend_user_access: {
        Args: { months: number; target_user_id: string }
        Returns: undefined
      }
      admin_list_client_errors: {
        Args: {
          p_limit?: number
          p_only_open?: boolean
          p_trainer_user_id: string
        }
        Returns: {
          component_stack: string | null
          context: Json | null
          created_at: string
          id: string
          message: string | null
          resolved: boolean
          stack: string | null
          url: string | null
          user_agent: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "client_error_logs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_resolve_client_error: {
        Args: {
          p_error_id: string
          p_resolved?: boolean
          p_trainer_user_id: string
        }
        Returns: undefined
      }
      advance_lead_to_next_stage: {
        Args: { p_lead_id: string }
        Returns: string
      }
      apply_commission_tier: {
        Args: { p_closer_id: string; p_month_start: string; p_user_id: string }
        Returns: undefined
      }
      apply_phase_change: {
        Args: {
          p_plan_id: string
          p_progress_increment_pct?: number
          p_target_phase_index: number
        }
        Returns: Json
      }
      apply_phase_change_by_token: {
        Args: {
          p_plan_id: string
          p_progress_increment_pct?: number
          p_target_phase_index: number
          p_token: string
        }
        Returns: Json
      }
      apply_template_phase_change: {
        Args: {
          p_progress_increment_pct?: number
          p_target_phase_index: number
          p_template_id: string
        }
        Returns: Json
      }
      auto_advance_periodization_phases: { Args: never; Returns: Json }
      auto_advance_plan_phase_by_token: {
        Args: { p_confirm_forca?: boolean; p_plan_id: string; p_token: string }
        Returns: Json
      }
      backfill_stage_for_funnel: {
        Args: { p_funnel_id: string }
        Returns: number
      }
      bulk_swap_workout_exercises: { Args: { p_swaps: Json }; Returns: number }
      cancel_sequence_enrollment: {
        Args: { p_enrollment_id: string }
        Returns: undefined
      }
      cancel_workout_session_by_token: {
        Args: { p_session_log_id: string; p_token: string }
        Returns: undefined
      }
      chat_adoption_dashboard: {
        Args: { p_owner: string }
        Returns: {
          com_app: number
          com_chat: number
          com_push: number
          engajaveis: number
          plano: string
        }[]
      }
      chat_adoption_patients: {
        Args: { p_owner: string }
        Returns: {
          has_push: boolean
          last_seen_at: string
          nome: string
          patient_id: string
          plano: string
          used_chat: boolean
        }[]
      }
      chat_apply_vars: {
        Args: { p_content: string; p_patient_id: string }
        Returns: string
      }
      chat_inactivity_dashboard: {
        Args: { p_min_days?: number; p_owner: string }
        Returns: {
          apelido: string
          dias_inativo: number
          last_activity: string
          last_fired_at: string
          last_step_id: string
          nome: string
          patient_id: string
          plano: string
          responded: boolean
          ruler_id: string
        }[]
      }
      chat_inactivity_run: { Args: never; Returns: number }
      chat_is_team_of: { Args: { p_owner: string }; Returns: boolean }
      chat_patient_delete_message: {
        Args: { p_message_id: string; p_patient_id: string }
        Returns: undefined
      }
      chat_patient_edit_message: {
        Args: { p_body: string; p_message_id: string; p_patient_id: string }
        Returns: undefined
      }
      chat_patient_get_messages: {
        Args: { p_before?: string; p_limit?: number; p_patient_id: string }
        Returns: {
          body: string
          created_at: string
          deleted: boolean
          edited: boolean
          id: string
          is_mine: boolean
          media_type: string
          media_url: string
          reactions: Json
          read_at: string
          reply_to_message_id: string
          sender_type: string
        }[]
      }
      chat_patient_get_or_create_conversation: {
        Args: { p_patient_id: string }
        Returns: string
      }
      chat_patient_react: {
        Args: { p_emoji: string; p_message_id: string; p_patient_id: string }
        Returns: undefined
      }
      chat_patient_send_message: {
        Args: {
          p_body: string
          p_media_mime?: string
          p_media_type?: string
          p_media_url?: string
          p_patient_id: string
          p_reply_to?: string
        }
        Returns: string
      }
      chat_patient_unread_count: {
        Args: { p_patient_id: string }
        Returns: number
      }
      chat_qr_increment_use: { Args: { p_id: string }; Returns: undefined }
      chat_rollout_get_config: {
        Args: { p_owner: string }
        Returns: {
          active_planos: string[]
          require_vigente: boolean
        }[]
      }
      chat_rollout_get_support: { Args: { p_owner: string }; Returns: Json }
      chat_rollout_plan_counts: {
        Args: { p_owner: string }
        Returns: {
          ativos_canonico: number
          plano: string
          total: number
        }[]
      }
      chat_rollout_set_config: {
        Args: {
          p_active_planos: string[]
          p_owner: string
          p_require_vigente: boolean
        }
        Returns: undefined
      }
      chat_rollout_set_support: {
        Args: { p_owner: string; p_support: Json }
        Returns: undefined
      }
      chat_support_hash100: { Args: { p_id: string }; Returns: number }
      chat_system_send_to_patient: {
        Args: {
          p_body: string
          p_media_mime?: string
          p_media_type?: string
          p_media_url?: string
          p_patient_id: string
        }
        Returns: string
      }
      chat_team_add_note: {
        Args: { p_body: string; p_category?: string; p_conversation_id: string }
        Returns: string
      }
      chat_team_add_tag: {
        Args: { p_conversation_id: string; p_tag: string }
        Returns: undefined
      }
      chat_team_delete_message: {
        Args: { p_message_id: string }
        Returns: undefined
      }
      chat_team_edit_message: {
        Args: { p_body: string; p_message_id: string }
        Returns: undefined
      }
      chat_team_get_or_create_conversation: {
        Args: { p_patient_id: string }
        Returns: string
      }
      chat_team_mark_read: {
        Args: { p_conversation_id: string }
        Returns: undefined
      }
      chat_team_react: {
        Args: { p_emoji: string; p_message_id: string }
        Returns: undefined
      }
      chat_team_remove_tag: {
        Args: { p_conversation_id: string; p_tag: string }
        Returns: undefined
      }
      chat_team_send_message: {
        Args: {
          p_body: string
          p_conversation_id: string
          p_media_mime?: string
          p_media_type?: string
          p_media_url?: string
          p_reply_to?: string
        }
        Returns: string
      }
      chat_team_set_cleared: {
        Args: { p_clear: boolean; p_conversation_id: string; p_side: string }
        Returns: undefined
      }
      chat_team_set_note_status: {
        Args: { p_note_id: string; p_status: string }
        Returns: undefined
      }
      check_patient_exists: {
        Args: { phone_search: string }
        Returns: {
          found: boolean
          requires_dob: boolean
        }[]
      }
      check_patient_exists_v2: {
        Args: { phone_search: string; tenant_slug?: string }
        Returns: {
          found: boolean
          requires_dob: boolean
          trainer_count: number
          trainer_slug: string
        }[]
      }
      check_patient_login: {
        Args: { phone_search: string }
        Returns: {
          nome: string
          telefone: string
        }[]
      }
      check_patient_login_with_dob: {
        Args: { dob_check?: string; phone_search: string }
        Returns: {
          nome: string
          telefone: string
        }[]
      }
      check_patient_login_with_dob_v2: {
        Args: { dob_check?: string; phone_search: string; tenant_slug?: string }
        Returns: {
          nome: string
          telefone: string
          trainer_slug: string
        }[]
      }
      check_portal_access_by_phone: {
        Args: { p_telefone: string }
        Returns: Json
      }
      cleanup_expired_locks: { Args: never; Returns: number }
      community_add_comment: {
        Args: {
          p_content: string
          p_parent_comment_id?: string
          p_patient_id: string
          p_post_id: string
        }
        Returns: string
      }
      community_create_post: {
        Args: {
          p_category?: string
          p_content: string
          p_image_url?: string
          p_patient_id: string
        }
        Returns: string
      }
      community_delete_comment: {
        Args: { p_comment_id: string; p_patient_id: string }
        Returns: boolean
      }
      community_delete_post: {
        Args: { p_patient_id: string; p_post_id: string }
        Returns: boolean
      }
      community_get_comments: {
        Args: { p_patient_id: string; p_post_id: string }
        Returns: {
          author_name: string
          author_patient_id: string
          author_photo: string
          content: string
          created_at: string
          id: string
          is_own: boolean
          parent_comment_id: string
        }[]
      }
      community_get_feed: {
        Args: {
          p_category?: string
          p_limit?: number
          p_offset?: number
          p_patient_id: string
          p_sort?: string
        }
        Returns: {
          author_name: string
          author_patient_id: string
          author_photo: string
          category: string
          comment_count: number
          content: string
          created_at: string
          id: string
          image_url: string
          is_own: boolean
          my_reactions: string[]
          reactions: Json
        }[]
      }
      community_list_reports: {
        Args: { p_only_open?: boolean; p_trainer_user_id: string }
        Returns: {
          created_at: string
          reason: string
          report_id: string
          reporter_name: string
          resolved: boolean
          target_author_name: string
          target_content: string
          target_id: string
          target_is_hidden: boolean
          target_type: string
        }[]
      }
      community_moderate_set_hidden: {
        Args: {
          p_hidden: boolean
          p_target_id: string
          p_target_type: string
          p_trainer_user_id: string
        }
        Returns: boolean
      }
      community_report: {
        Args: {
          p_patient_id: string
          p_reason?: string
          p_target_id: string
          p_target_type: string
        }
        Returns: string
      }
      community_resolve_report: {
        Args: { p_report_id: string; p_trainer_user_id: string }
        Returns: boolean
      }
      community_toggle_reaction: {
        Args: {
          p_patient_id: string
          p_post_id: string
          p_reaction_type: string
        }
        Returns: boolean
      }
      community_unread_by_category: {
        Args: { p_patient_id: string; p_since: string }
        Returns: {
          category: string
          cnt: number
        }[]
      }
      compute_default_rpe_per_set: {
        Args: { total_sets: number }
        Returns: string
      }
      compute_lead_temperature: { Args: { p_lead_id: string }; Returns: string }
      compute_plan_volume_by_group: {
        Args: { p_plan_id: string }
        Returns: Json
      }
      convert_leads_for_patient: {
        Args: { p_patient_id: string }
        Returns: number
      }
      copy_guideline_templates_to_plan: {
        Args: { p_diet_plan_id: string; p_user_id: string }
        Returns: undefined
      }
      copy_guideline_templates_to_plan_internal: {
        Args: { p_diet_plan_id: string; p_user_id: string }
        Returns: undefined
      }
      copy_public_diet_template_to_mine: {
        Args: { p_target_holder_id: string; p_template_id: string }
        Returns: string
      }
      count_pending_anamnesis_reminders: {
        Args: { p_user_id: string }
        Returns: {
          oldest_due_at: string
          pending_leads: number
          pending_messages: number
        }[]
      }
      count_sessions_in_phase_by_token: {
        Args: { p_plan_id: string; p_since: string; p_token: string }
        Returns: number
      }
      create_default_diet_plan: {
        Args: { p_patient_id: string; p_user_id?: string }
        Returns: string
      }
      create_default_stages_for_funnel: {
        Args: { p_funnel_id: string }
        Returns: number
      }
      create_rls_policies: { Args: { table_name: string }; Returns: undefined }
      create_self_trial: { Args: { p_plan_id: string }; Returns: Json }
      daily_metrics_report_default_template: { Args: never; Returns: string }
      daily_metrics_report_render: {
        Args: { p_template: string; p_user_id: string }
        Returns: string
      }
      daily_metrics_report_text: {
        Args: { p_user_id: string }
        Returns: string
      }
      decode_html_entities: { Args: { input: string }; Returns: string }
      delete_cardio_by_token: {
        Args: { p_id: string; p_token: string }
        Returns: undefined
      }
      evaluate_achievements_by_token: {
        Args: { p_token: string }
        Returns: {
          achievement_description: string
          achievement_name: string
          achievement_type: string
          color: string
          emoji: string
          icon_name: string
          is_new: boolean
          points_earned: number
          unlocked_at: string
        }[]
      }
      extract_youtube_id: { Args: { url: string }; Returns: string }
      finish_workout_session_by_token: {
        Args: {
          p_notes?: string
          p_rating?: number
          p_session_log_id: string
          p_token: string
        }
        Returns: number
      }
      fn_call_park_lead: { Args: { p_call_id: string }; Returns: undefined }
      fn_is_team_member_of: { Args: { p_owner: string }; Returns: boolean }
      generate_unique_token: { Args: never; Returns: string }
      gerar_alertas_dashboard: { Args: never; Returns: undefined }
      get_anti_ban_config: { Args: never; Returns: Json }
      get_available_team_members: {
        Args: never
        Returns: {
          email: string
          is_owner: boolean
          name: string
          user_id: string
        }[]
      }
      get_cardio_totals: {
        Args: { p_patient_id: string }
        Returns: {
          last_log_at: string
          month_min: number
          today_min: number
          total_min: number
          week_min: number
        }[]
      }
      get_cardio_totals_by_token: {
        Args: { p_token: string }
        Returns: {
          last_log_at: string
          month_min: number
          today_min: number
          total_min: number
          week_min: number
        }[]
      }
      get_checkin_header_stats: { Args: { p_owner_id: string }; Returns: Json }
      get_checkin_visual_improvement_rate: {
        Args: { p_owner_id: string }
        Returns: {
          taxa: number
          total_respondidos: number
          total_sim: number
        }[]
      }
      get_checkins_by_day_of_week: {
        Args: { p_owner_id: string }
        Returns: {
          day_index: number
          day_name: string
          total: number
        }[]
      }
      get_checkins_by_member_monthly: {
        Args: { p_owner_id: string }
        Returns: {
          assigned_user_id: string
          member_name: string
          mes: string
          total: number
        }[]
      }
      get_current_user_role: { Args: never; Returns: string }
      get_exercise_history: {
        Args: { p_exercise_id: string; p_limit?: number; p_patient_id: string }
        Returns: {
          estimated_1rm: number
          max_weight_kg: number
          session_date: string
          session_log_id: string
          total_sets: number
          total_volume_kg: number
        }[]
      }
      get_exercise_load_history_by_token: {
        Args: {
          p_limit?: number
          p_planned_exercise_id: string
          p_token: string
        }
        Returns: {
          logged_at: string
          top_weight: number
        }[]
      }
      get_exercise_notes_by_token: {
        Args: { p_token: string }
        Returns: {
          exercise_key: string
          note: string
        }[]
      }
      get_follow_up_manual_leads: {
        Args: { p_cooldown_days?: number; p_limit?: number }
        Returns: {
          inbound_count: number
          kanban_status: string
          last_message_sent_at: string
          last_response_at: string
          lead_id: string
          motivo: string
          nome: string
          objetivo: string
          origem: string
          prioridade: number
          resultado_enviado: boolean
          resultado_enviado_at: string
          telefone: string
          temperatura: string
          ultimo_toque_manual_at: string
        }[]
      }
      get_guideline_data_for_patient: {
        Args: { p_guideline_id: string; p_telefone: string }
        Returns: {
          guideline_content: string
          guideline_id: string
          guideline_title: string
          guideline_type: string
          letterhead_accent_color: string
          letterhead_cnpj: string
          letterhead_display_name: string
          letterhead_email: string
          letterhead_endereco: string
          letterhead_instagram: string
          letterhead_logo_url: string
          letterhead_professional_title: string
          letterhead_registry: string
          letterhead_signature_url: string
          letterhead_whatsapp: string
          patient_nome: string
        }[]
      }
      get_guideline_public: {
        Args: { p_token: string }
        Returns: {
          guideline_content: string
          guideline_id: string
          guideline_title: string
          guideline_type: string
          letterhead_accent_color: string
          letterhead_cnpj: string
          letterhead_display_name: string
          letterhead_email: string
          letterhead_endereco: string
          letterhead_instagram: string
          letterhead_logo_url: string
          letterhead_professional_title: string
          letterhead_registry: string
          letterhead_signature_url: string
          letterhead_whatsapp: string
          patient_nome: string
        }[]
      }
      get_last_loads_by_token: {
        Args: { p_plan_id: string; p_token: string }
        Returns: {
          logged_at: string
          planned_exercise_id: string
          reps: number
          rpe: number
          weight_kg: number
        }[]
      }
      get_last_loads_per_set_by_token: {
        Args: { p_plan_id: string; p_token: string }
        Returns: {
          planned_exercise_id: string
          reps: number
          rpe: number
          set_index: number
          weight_kg: number
        }[]
      }
      get_last_performance: {
        Args: { p_exercise_id: string; p_patient_id: string }
        Returns: {
          avg_reps: number
          avg_weight_kg: number
          logged_at: string
          max_weight_kg: number
          session_log_id: string
          total_sets: number
          total_volume_kg: number
        }[]
      }
      get_last_warmup_loads_by_token: {
        Args: { p_plan_id: string; p_token: string }
        Returns: {
          logged_at: string
          planned_exercise_id: string
          reps: number
          rpe: number
          weight_kg: number
        }[]
      }
      get_lead_report_by_token: { Args: { p_token: string }; Returns: Json }
      get_member_owner_id: { Args: never; Returns: string }
      get_patient_by_phone: {
        Args: { phone_variations: string[] }
        Returns: {
          id: string
          nome: string
          telefone: string
        }[]
      }
      get_patient_level_by_token: {
        Args: { p_token: string }
        Returns: {
          current_color: string
          current_emoji: string
          current_level_order: number
          current_min_points: number
          current_name: string
          next_level_order: number
          next_min_points: number
          next_name: string
          progress_pct: number
          total_points: number
        }[]
      }
      get_patient_profile: {
        Args: { phone_number: string }
        Returns: {
          abril: string | null
          agosto: string | null
          altura_atual: number | null
          altura_inicial: number | null
          antes_depois: string | null
          apelido: string | null
          consultas_realizadas: number | null
          consultas_total: number | null
          cpf: string | null
          created_at: string | null
          data_cancelamento: string | null
          data_cancelamento_at: string | null
          data_congelamento: string | null
          data_congelamento_at: string | null
          data_descongelamento: string | null
          data_fotos_atuais: string | null
          data_fotos_iniciais: string | null
          data_nascimento: string | null
          dezembro: string | null
          dias_para_vencer: number | null
          duracao_plano_meses: number | null
          email: string | null
          fase_atual: string | null
          fevereiro: string | null
          foto_atual_costas: string | null
          foto_atual_frente: string | null
          foto_atual_lado: string | null
          foto_atual_lado_2: string | null
          foto_inicial_costas: string | null
          foto_inicial_frente: string | null
          foto_inicial_lado: string | null
          foto_inicial_lado_2: string | null
          foto_perfil: string | null
          genero: string | null
          id: string
          indicacoes: string | null
          inicio_acompanhamento: string | null
          is_template_holder: boolean
          janeiro: string | null
          julho: string | null
          junho: string | null
          last_seen_at: string | null
          lembrete: string | null
          ltv: number | null
          maio: string | null
          marco: string | null
          medida_cintura_atual: number | null
          medida_cintura_inicial: number | null
          medida_quadril_atual: number | null
          medida_quadril_inicial: number | null
          mfit_client_id: string | null
          motivo_cancelamento: string | null
          motivo_congelamento: string | null
          multa_rescisao: number | null
          nome: string
          novembro: string | null
          numero_contrato: string | null
          observacao: string | null
          outubro: string | null
          pagamento: string | null
          peso_atual: number | null
          peso_inicial: number | null
          plano: string | null
          proxima_consulta: string | null
          renovacoes: number
          rescisao_30_percent: number | null
          setembro: string | null
          telefone: string | null
          telefone_filtro: string | null
          tempo_acompanhamento: number | null
          ticket_medio: number | null
          ultima_consulta: string | null
          ultimo_contato: string | null
          ultimo_contato_nutricionista: string | null
          updated_at: string | null
          user_id: string | null
          valor: number | null
          vencimento: string | null
          whatsapp_group_jid: string | null
          whatsapp_group_skipped: boolean
        }[]
        SetofOptions: {
          from: "*"
          to: "patients"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_patient_prs_by_token: {
        Args: { p_token: string }
        Returns: {
          achieved_at: string
          estimated_1rm: number
          exercise_id: string
          exercise_name: string
          max_reps: number
          max_volume_kg: number
          max_weight_kg: number
        }[]
      }
      get_periodization_general_notes_by_token: {
        Args: { p_template_id: string; p_token: string }
        Returns: string
      }
      get_personal_records_by_token: {
        Args: { p_token: string }
        Returns: {
          estimated_1rm: number
          exercise_id: string
          max_weight_kg: number
        }[]
      }
      get_phone_from_portal_token: {
        Args: { portal_token: string }
        Returns: string
      }
      get_phones_with_active_portal_tokens: { Args: never; Returns: string[] }
      get_plan_periodization: {
        Args: { p_plan_id: string }
        Returns: {
          current_phase_index: number
          phase_started_at: string
          phases: Json
          template_id: string
          template_name: string
        }[]
      }
      get_plan_periodization_by_token: {
        Args: { p_plan_id: string; p_token: string }
        Returns: {
          current_phase_index: number
          phase_started_at: string
          phases: Json
          template_id: string
          template_name: string
        }[]
      }
      get_public_lead_result: {
        Args: { p_lead_id: string }
        Returns: {
          diagnostico_editado_json: Json
          diagnostico_json: Json
          funnel_identity: Json
          funnel_slug: string
          funnel_title: string
          funnel_whatsapp: string
          id: string
          nome: string
          objetivo: string
          perfil: string
          resultado_enviado: boolean
          score: number
        }[]
      }
      get_push_public_key: { Args: never; Returns: string }
      get_ranking_history: {
        Args: {
          p_period: string
          p_period_key: string
          p_top_n?: number
          p_trainer_user_id: string
        }
        Returns: {
          frozen_at: string
          patient_id: string
          patient_name: string
          photo_url: string
          points: number
          rank: number
        }[]
      }
      get_session_volume_by_muscle_group: {
        Args: { p_session_id: string }
        Returns: {
          muscle_group: string
          sets_total: number
        }[]
      }
      get_stage_variant_stats: {
        Args: { p_funnel_id: string; p_stage_name: string }
        Returns: {
          is_audio: boolean
          response_rate: number
          total_response: number
          total_sent: number
          variant_index: number
        }[]
      }
      get_today_workout_by_token: { Args: { p_token: string }; Returns: Json }
      get_trainer_profile_by_token: {
        Args: { p_token: string }
        Returns: {
          avatar_url: string
          name: string
          share_brand_color: string
          share_brand_name: string
          share_logo_url: string
        }[]
      }
      get_user_email: { Args: { uid: string }; Returns: string }
      get_user_owner_id: { Args: never; Returns: string }
      get_weekly_adherence: {
        Args: { p_patient_id: string; p_plan_id: string; p_weeks_back?: number }
        Returns: {
          adherence_pct: number
          sessions_done: number
          sessions_planned: number
          week_start: string
        }[]
      }
      get_weekly_adherence_by_token: {
        Args: { p_plan_id: string; p_token: string; p_weeks_back?: number }
        Returns: {
          adherence_pct: number
          sessions_done: number
          sessions_planned: number
          week_start: string
        }[]
      }
      get_weekly_challenge_by_token: {
        Args: { p_token: string }
        Returns: {
          color: string
          completed: boolean
          completed_at: string
          description: string
          emoji: string
          id: string
          points: number
          progress: number
          rule_type: string
          threshold: number
          title: string
          week_key: string
        }[]
      }
      get_weekly_volume: {
        Args: { p_patient_id: string; p_start_date: string }
        Returns: {
          exercises_count: number
          muscle_group: string
          total_sets: number
          total_volume_kg: number
        }[]
      }
      get_workout_history_by_token: {
        Args: { p_limit?: number; p_offset?: number; p_token: string }
        Returns: {
          duration_seconds: number
          ended_at: string
          id: string
          notes: string
          rating: number
          session_id: string
          session_name: string
          started_at: string
          total_sets: number
          total_volume_kg: number
          workout_plan_id: string
        }[]
      }
      get_workout_hub_by_token: {
        Args: { p_plan_id?: string; p_token: string }
        Returns: Json
      }
      get_workout_plan_cardio_by_token: {
        Args: { p_plan_id?: string; p_token: string }
        Returns: Json
      }
      get_workout_streak_by_token: {
        Args: { p_token: string }
        Returns: number
      }
      get_workout_volume_by_token: { Args: { p_token: string }; Returns: Json }
      get_workouts_hub_stats: { Args: { p_user_id: string }; Returns: Json }
      immutable_unaccent: { Args: { "": string }; Returns: string }
      import_patient_from_notion: { Args: { p: Json }; Returns: Json }
      increment_enrollment_sent_count: {
        Args: { p_enrollment_id: string }
        Returns: undefined
      }
      increment_whatsapp_message_counter: {
        Args: {
          p_direction: string
          p_patient_id: string
          p_phone: string
          p_user_id: string
        }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_admin_user: { Args: never; Returns: boolean }
      is_owner_or_team_member: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      is_patient_active: { Args: { p_patient_id: string }; Returns: boolean }
      is_team_member: { Args: { owner_user_id: string }; Returns: boolean }
      list_active_workout_plans_by_token: {
        Args: { p_token: string }
        Returns: {
          created_at: string
          id: string
          name: string
          periodization_template_id: string
          released_at: string
          session_naming_style: string
        }[]
      }
      list_cardio_by_token: {
        Args: { p_from: string; p_to: string; p_token: string }
        Returns: {
          created_at: string
          duration_min: number
          id: string
          intensity: string | null
          modality: string | null
          notes: string | null
          patient_id: string
          performed_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "cardio_logs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      list_cron_jobs: {
        Args: never
        Returns: {
          active: boolean
          jobid: number
          jobname: string
          schedule: string
        }[]
      }
      list_cron_runs: {
        Args: { p_jobid: number; p_limit?: number }
        Returns: {
          jobid: number
          return_message: string
          start_time: string
          status: string
        }[]
      }
      list_patient_notifications_by_token: {
        Args: { p_limit?: number; p_token: string }
        Returns: {
          body: string
          created_at: string
          id: string
          meta: Json
          read_at: string
          title: string
          type: string
        }[]
      }
      list_protected_pages_admin: {
        Args: never
        Returns: {
          created_at: string
          description: string
          has_valid_hash: boolean
          id: string
          is_active: boolean
          page_name: string
          updated_at: string
        }[]
      }
      list_public_diet_templates: {
        Args: never
        Returns: {
          id: string
          is_mine: boolean
          meal_count: number
          name: string
          notes: string
          owner_id: string
          owner_name: string
          total_calories: number
          total_carbs: number
          total_fats: number
          total_protein: number
        }[]
      }
      list_ranking_history_periods: {
        Args: { p_trainer_user_id: string }
        Returns: {
          period: string
          period_key: string
          top_count: number
          top1_name: string
          top1_points: number
        }[]
      }
      list_recent_http_responses: {
        Args: { p_limit?: number }
        Returns: {
          content: string
          created: string
          id: number
          status_code: number
        }[]
      }
      list_session_logs_by_token: {
        Args: { p_from: string; p_to: string; p_token: string }
        Returns: {
          id: string
          notes: string
          session_id: string
          started_at: string
        }[]
      }
      list_set_logs_by_token: {
        Args: { p_from: string; p_to: string; p_token: string }
        Returns: {
          logged_at: string
          reps: number
          rpe: number
          weight_kg: number
        }[]
      }
      log_body_weight_by_token: {
        Args: {
          p_measured_at?: string
          p_notes?: string
          p_token: string
          p_weight_kg: number
        }
        Returns: string
      }
      log_cardio_by_token: {
        Args: {
          p_duration_min: number
          p_intensity?: string
          p_modality?: string
          p_notes?: string
          p_performed_at?: string
          p_token: string
        }
        Returns: {
          created_at: string
          duration_min: number
          id: string
          intensity: string | null
          modality: string | null
          notes: string | null
          patient_id: string
          performed_at: string
        }
        SetofOptions: {
          from: "*"
          to: "cardio_logs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      log_client_error: {
        Args: {
          p_component_stack?: string
          p_context?: Json
          p_message: string
          p_stack?: string
          p_url?: string
          p_user_agent?: string
        }
        Returns: undefined
      }
      log_workout_session_retroactive: {
        Args: {
          p_notes?: string
          p_patient_id: string
          p_performed_at: string
          p_plan_id: string
          p_session_id: string
        }
        Returns: string
      }
      log_workout_set_by_token: {
        Args: {
          p_is_warmup?: boolean
          p_notes?: string
          p_planned_exercise_id: string
          p_reps: number
          p_rpe: number
          p_session_log_id: string
          p_set_index: number
          p_token: string
          p_weight_kg: number
        }
        Returns: string
      }
      mark_anamnesis_filled: {
        Args: { p_patient_id: string; p_telefone?: string; p_user_id: string }
        Returns: string
      }
      mark_anamnesis_reminder_sent: {
        Args: { p_reminder_id: string; p_rendered_text?: string }
        Returns: undefined
      }
      mark_notification_read_by_token: {
        Args: { p_notification_id: string; p_token: string }
        Returns: undefined
      }
      materialize_sequence_messages: {
        Args: { p_enrollment_id: string }
        Returns: number
      }
      maybe_notify_upcoming_forca_by_token: {
        Args: { p_days?: number; p_plan_id: string; p_token: string }
        Returns: Json
      }
      next_send_slot_for_user: {
        Args: { p_send_delay?: string; p_user_id: string }
        Returns: string
      }
      notification_category: { Args: { p_type: string }; Returns: string }
      notification_prefs_get: {
        Args: { p_patient_id: string }
        Returns: string[]
      }
      notification_prefs_set: {
        Args: { p_category: string; p_muted: boolean; p_patient_id: string }
        Returns: string[]
      }
      notification_settings_get: {
        Args: { p_trainer_id: string }
        Returns: {
          community_enabled: boolean
          diet_enabled: boolean
          inactive_days: number
          inactive_enabled: boolean
          inactive_patient_body: string
          inactive_patient_title: string
          notify_trainer_on_inactive: boolean
          reminders: Json
          reminders_enabled: boolean
          timezone: string
          trainer_user_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "notification_settings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      notification_settings_update: {
        Args: { p_patch: Json; p_trainer_id: string }
        Returns: {
          community_enabled: boolean
          diet_enabled: boolean
          inactive_days: number
          inactive_enabled: boolean
          inactive_patient_body: string
          inactive_patient_title: string
          notify_trainer_on_inactive: boolean
          reminders: Json
          reminders_enabled: boolean
          timezone: string
          trainer_user_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "notification_settings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      notifications_get: {
        Args: { p_limit?: number; p_patient_id: string }
        Returns: {
          body: string | null
          created_at: string
          data: Json | null
          id: string
          patient_id: string | null
          read: boolean
          subscriber_type: string
          title: string
          trainer_user_id: string | null
          type: string
          url: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "notifications"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      notifications_get_trainer: {
        Args: { p_limit?: number; p_trainer_id: string }
        Returns: {
          body: string | null
          created_at: string
          data: Json | null
          id: string
          patient_id: string | null
          read: boolean
          subscriber_type: string
          title: string
          trainer_user_id: string | null
          type: string
          url: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "notifications"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      notifications_mark_read: {
        Args: { p_id?: string; p_patient_id: string }
        Returns: undefined
      }
      notifications_mark_read_trainer: {
        Args: { p_id?: string; p_trainer_id: string }
        Returns: undefined
      }
      notifications_unread_count: {
        Args: { p_patient_id: string }
        Returns: number
      }
      notifications_unread_count_trainer: {
        Args: { p_trainer_id: string }
        Returns: number
      }
      notify_send_push: {
        Args: {
          p_body?: string
          p_data?: Json
          p_patient_ids?: string[]
          p_save_notification?: boolean
          p_title?: string
          p_trainer_ids?: string[]
          p_type?: string
          p_url?: string
        }
        Returns: number
      }
      patient_last_activity: { Args: { p_patient_id: string }; Returns: string }
      patient_touch_last_seen: {
        Args: { p_patient_id: string }
        Returns: undefined
      }
      phase_change_has_visible_diff: {
        Args: { p_plan_id: string; p_target_phase_index: number }
        Returns: boolean
      }
      phase_change_has_visible_diff_by_token: {
        Args: {
          p_plan_id: string
          p_target_phase_index: number
          p_token: string
        }
        Returns: boolean
      }
      phone_tail: { Args: { p_len?: number; p_phone: string }; Returns: string }
      pick_funnel_message_variant: {
        Args: { p_message_by_objetivo: Json; p_objetivo: string }
        Returns: string
      }
      post_sale_pipeline_stats: {
        Args: { p_user_id: string }
        Returns: {
          avg_hours_in_stage: number
          stage: string
          total: number
        }[]
      }
      push_delete_subscription: {
        Args: { p_endpoint: string }
        Returns: undefined
      }
      push_save_subscription: {
        Args: {
          p_auth: string
          p_endpoint: string
          p_p256dh: string
          p_patient_id: string
          p_user_agent?: string
        }
        Returns: undefined
      }
      push_save_subscription_trainer: {
        Args: {
          p_auth: string
          p_endpoint: string
          p_p256dh: string
          p_trainer_id: string
          p_user_agent?: string
        }
        Returns: undefined
      }
      record_manual_touch: {
        Args: { p_lead_id: string; p_note?: string }
        Returns: string
      }
      release_checkin_lock: {
        Args: { checkin_uuid: string; user_uuid: string }
        Returns: boolean
      }
      render_lead_message: {
        Args: { lead_nome: string; lead_objetivo: string; template: string }
        Returns: string
      }
      reorder_lead_stages: {
        Args: { p_funnel_id: string; p_ids: string[]; p_orders: number[] }
        Returns: undefined
      }
      repeat_current_phase_by_token: {
        Args: { p_plan_id: string; p_token: string }
        Returns: Json
      }
      reschedule_stale_leads: {
        Args: {
          p_lead_interval_min?: number
          p_max_age_hours?: number
          p_user_id: string
        }
        Returns: {
          first_message_at: string
          lead_id: string
          lead_nome: string
          messages_rescheduled: number
        }[]
      }
      reset_one_patient_points: {
        Args: {
          also_reset_level?: boolean
          p_patient_id: string
          trainer_uid: string
        }
        Returns: undefined
      }
      reset_trainer_patient_points: {
        Args: { also_reset_level?: boolean; trainer_uid: string }
        Returns: undefined
      }
      run_daily_reminders: { Args: never; Returns: undefined }
      run_inactive_check: { Args: never; Returns: undefined }
      schedule_anamnesis_reminders: {
        Args: { p_lead_id: string }
        Returns: number
      }
      schedule_lead_messages_for_current_stage: {
        Args: { p_lead_id: string }
        Returns: number
      }
      schedule_lead_messages_for_stage: {
        Args: { p_kanban_stage: string; p_lead_id: string }
        Returns: number
      }
      sdr_pending_summary: {
        Args: { p_since: string; p_until: string; p_user_id: string }
        Returns: {
          contacts: number
          names: string[]
          total: number
        }[]
      }
      seed_default_anamnesis_templates: {
        Args: { p_user_id: string }
        Returns: number
      }
      set_default_funnel: { Args: { p_funnel_id: string }; Returns: undefined }
      set_diet_template_public: {
        Args: { p_plan_id: string; p_public: boolean }
        Returns: undefined
      }
      set_exercise_note_by_token: {
        Args: { p_exercise_key: string; p_note: string; p_token: string }
        Returns: undefined
      }
      set_page_password: {
        Args: {
          p_description?: string
          p_page_name: string
          p_password: string
        }
        Returns: boolean
      }
      set_patient_dob_and_login: {
        Args: { new_dob: string; phone_search: string }
        Returns: {
          nome: string
          telefone: string
        }[]
      }
      set_patient_dob_and_login_v2: {
        Args: { new_dob: string; phone_search: string; tenant_slug?: string }
        Returns: {
          nome: string
          telefone: string
          trainer_slug: string
        }[]
      }
      set_plan_phase_by_token: {
        Args: { p_plan_id: string; p_target_index: number; p_token: string }
        Returns: Json
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      start_workout_session_by_token: {
        Args: { p_session_id: string; p_token: string }
        Returns: string
      }
      suggest_exercise_variations: {
        Args: { p_exercise_id: string; p_limit?: number }
        Returns: {
          category: string
          id: string
          muscle_group: string
          name: string
          similarity_score: number
          thumbnail_url: string
        }[]
      }
      suggest_next_load: {
        Args: { p_exercise_id: string; p_patient_id: string }
        Returns: {
          confidence: string
          last_avg_rpe: number
          last_max_weight_kg: number
          reason: string
          sessions_analyzed: number
          suggested_reps: number
          suggested_weight_kg: number
        }[]
      }
      suggest_variations_by_token: {
        Args: { p_exercise_id: string; p_limit?: number; p_token: string }
        Returns: {
          id: string
          muscle_group: string
          name: string
          priority: number
          thumbnail_url: string
          video_url: string
        }[]
      }
      toggle_page_protection: {
        Args: { p_active: boolean; p_page_name: string }
        Returns: boolean
      }
      toggle_sequence_enrollment_pause: {
        Args: { p_enrollment_id: string }
        Returns: string
      }
      unaccent: { Args: { "": string }; Returns: string }
      update_anti_ban_config: { Args: { p_config: Json }; Returns: Json }
      update_patient_telefone: {
        Args: { p_id: string; p_new_telefone: string; p_old_telefone: string }
        Returns: undefined
      }
      update_trainer_brand: {
        Args: {
          p_logo_url: string
          p_primary_color: string
          p_tagline: string
          p_trainer_id: string
        }
        Returns: undefined
      }
      update_workout_journal_by_token: {
        Args: {
          p_energy?: number
          p_entry_date?: string
          p_mood?: number
          p_notes?: string
          p_pain_area?: string
          p_pain_intensity?: number
          p_sleep_hours?: number
          p_token: string
        }
        Returns: string
      }
      upsert_patient_by_phone: {
        Args: { p_payload: Json; p_telefone: string; p_user_id: string }
        Returns: string
      }
      verify_page_password: {
        Args: { p_page_name: string; p_password: string }
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
