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
      checkin: {
        Row: {
          id: string
          telefone: string
          data_checkin: string
          mes_ano: string
          peso: string | null
          medida: string | null
          treino: string | null
          cardio: string | null
          agua: string | null
          sono: string | null
          ref_livre: string | null
          beliscos: string | null
          oq_comeu_ref_livre: string | null
          oq_beliscou: string | null
          comeu_menos: string | null
          fome_algum_horario: string | null
          alimento_para_incluir: string | null
          melhora_visual: string | null
          quais_pontos: string | null
          objetivo: string | null
          dificuldades: string | null
          stress: string | null
          libido: string | null
          tempo: string | null
          descanso: string | null
          tempo_cardio: string | null
          foto_1: string | null
          foto_2: string | null
          foto_3: string | null
          foto_4: string | null
          telefone_checkin: string | null
          pontos_treinos: string | null
          pontos_cardios: string | null
          pontos_descanso_entre_series: string | null
          pontos_refeicao_livre: string | null
          pontos_beliscos: string | null
          pontos_agua: string | null
          pontos_sono: string | null
          pontos_qualidade_sono: string | null
          pontos_stress: string | null
          pontos_libido: string | null
          total_pontuacao: string | null
          percentual_aproveitamento: string | null
          data_preenchimento: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          telefone: string
          data_checkin?: string
          mes_ano: string
          peso?: string | null
          medida?: string | null
          treino?: string | null
          cardio?: string | null
          agua?: string | null
          sono?: string | null
          ref_livre?: string | null
          beliscos?: string | null
          oq_comeu_ref_livre?: string | null
          oq_beliscou?: string | null
          comeu_menos?: string | null
          fome_algum_horario?: string | null
          alimento_para_incluir?: string | null
          melhora_visual?: string | null
          quais_pontos?: string | null
          objetivo?: string | null
          dificuldades?: string | null
          stress?: string | null
          libido?: string | null
          tempo?: string | null
          descanso?: string | null
          tempo_cardio?: string | null
          foto_1?: string | null
          foto_2?: string | null
          foto_3?: string | null
          foto_4?: string | null
          telefone_checkin?: string | null
          pontos_treinos?: string | null
          pontos_cardios?: string | null
          pontos_descanso_entre_series?: string | null
          pontos_refeicao_livre?: string | null
          pontos_beliscos?: string | null
          pontos_agua?: string | null
          pontos_sono?: string | null
          pontos_qualidade_sono?: string | null
          pontos_stress?: string | null
          pontos_libido?: string | null
          total_pontuacao?: string | null
          percentual_aproveitamento?: string | null
          data_preenchimento?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          telefone?: string
          data_checkin?: string
          mes_ano?: string
          peso?: string | null
          medida?: string | null
          treino?: string | null
          cardio?: string | null
          agua?: string | null
          sono?: string | null
          ref_livre?: string | null
          beliscos?: string | null
          oq_comeu_ref_livre?: string | null
          oq_beliscou?: string | null
          comeu_menos?: string | null
          fome_algum_horario?: string | null
          alimento_para_incluir?: string | null
          melhora_visual?: string | null
          quais_pontos?: string | null
          objetivo?: string | null
          dificuldades?: string | null
          stress?: string | null
          libido?: string | null
          tempo?: string | null
          descanso?: string | null
          tempo_cardio?: string | null
          foto_1?: string | null
          foto_2?: string | null
          foto_3?: string | null
          foto_4?: string | null
          telefone_checkin?: string | null
          pontos_treinos?: string | null
          pontos_cardios?: string | null
          pontos_descanso_entre_series?: string | null
          pontos_refeicao_livre?: string | null
          pontos_beliscos?: string | null
          pontos_agua?: string | null
          pontos_sono?: string | null
          pontos_qualidade_sono?: string | null
          pontos_stress?: string | null
          pontos_libido?: string | null
          total_pontuacao?: string | null
          percentual_aproveitamento?: string | null
          data_preenchimento?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkin_telefone_fkey"
            columns: ["telefone"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["telefone"]
          }
        ]
      }
      patient_feedback_records: {
        Row: {
          id: string
          patient_id: string | null
          weight: number | null
          body_measurement_notes: string | null
          avg_workouts_per_week: number | null
          avg_cardio_per_week: number | null
          avg_water_intake_liters: number | null
          avg_sleep_hours: number | null
          had_cheat_meal: boolean | null
          had_snack: boolean | null
          cheat_meal_content: string | null
          snack_content: string | null
          ate_less_than_planned: boolean | null
          felt_hungry_at_any_time: boolean | null
          food_to_include: string | null
          noticed_visual_improvement: boolean | null
          visual_improvement_points: string | null
          current_main_goal: string | null
          difficulties_faced: string | null
          stress_level: number | null
          libido_level: number | null
          workout_duration_minutes: number | null
          rest_between_sets_minutes: number | null
          cardio_duration_minutes: number | null
          photo_urls: string[] | null
          diet_adjustment_notes: string | null
          progress_evolution_notes: string | null
          workout_score: number | null
          cardio_score: number | null
          rest_between_sets_score: number | null
          cheat_meal_score: number | null
          snack_score: number | null
          water_intake_score: number | null
          sleep_score: number | null
          sleep_quality_score: number | null
          stress_score: number | null
          libido_score: number | null
          overall_score: number | null
          created_at: string | null
          updated_at: string | null
          phone_number: string | null
        }
        Insert: {
          id?: string
          patient_id?: string | null
          weight?: number | null
          body_measurement_notes?: string | null
          avg_workouts_per_week?: number | null
          avg_cardio_per_week?: number | null
          avg_water_intake_liters?: number | null
          avg_sleep_hours?: number | null
          had_cheat_meal?: boolean | null
          had_snack?: boolean | null
          cheat_meal_content?: string | null
          snack_content?: string | null
          ate_less_than_planned?: boolean | null
          felt_hungry_at_any_time?: boolean | null
          food_to_include?: string | null
          noticed_visual_improvement?: boolean | null
          visual_improvement_points?: string | null
          current_main_goal?: string | null
          difficulties_faced?: string | null
          stress_level?: number | null
          libido_level?: number | null
          workout_duration_minutes?: number | null
          rest_between_sets_minutes?: number | null
          cardio_duration_minutes?: number | null
          photo_urls?: string[] | null
          diet_adjustment_notes?: string | null
          progress_evolution_notes?: string | null
          workout_score?: number | null
          cardio_score?: number | null
          rest_between_sets_score?: number | null
          cheat_meal_score?: number | null
          snack_score?: number | null
          water_intake_score?: number | null
          sleep_score?: number | null
          sleep_quality_score?: number | null
          stress_score?: number | null
          libido_score?: number | null
          overall_score?: number | null
          created_at?: string | null
          updated_at?: string | null
          phone_number?: string | null
        }
        Update: {
          id?: string
          patient_id?: string | null
          weight?: number | null
          body_measurement_notes?: string | null
          avg_workouts_per_week?: number | null
          avg_cardio_per_week?: number | null
          avg_water_intake_liters?: number | null
          avg_sleep_hours?: number | null
          had_cheat_meal?: boolean | null
          had_snack?: boolean | null
          cheat_meal_content?: string | null
          snack_content?: string | null
          ate_less_than_planned?: boolean | null
          felt_hungry_at_any_time?: boolean | null
          food_to_include?: string | null
          noticed_visual_improvement?: boolean | null
          visual_improvement_points?: string | null
          current_main_goal?: string | null
          difficulties_faced?: string | null
          stress_level?: number | null
          libido_level?: number | null
          workout_duration_minutes?: number | null
          rest_between_sets_minutes?: number | null
          cardio_duration_minutes?: number | null
          photo_urls?: string[] | null
          diet_adjustment_notes?: string | null
          progress_evolution_notes?: string | null
          workout_score?: number | null
          cardio_score?: number | null
          rest_between_sets_score?: number | null
          cheat_meal_score?: number | null
          snack_score?: number | null
          water_intake_score?: number | null
          sleep_score?: number | null
          sleep_quality_score?: number | null
          stress_score?: number | null
          libido_score?: number | null
          overall_score?: number | null
          created_at?: string | null
          updated_at?: string | null
          phone_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_feedback_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_patient_feedback_patient_id"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          id: string
          nome: string | null
          apelido: string | null
          cpf: string | null
          email: string | null
          telefone: string | null
          genero: string | null
          data_nascimento: string | null
          inicio_acompanhamento: string | null
          plano: string | null
          tempo_acompanhamento: number | null
          vencimento: string | null
          dias_para_vencer: number | null
          valor: number | null
          ticket_medio: number | null
          rescisao_30_percent: number | null
          pagamento: string | null
          observacao: string | null
          indicacoes: string | null
          lembrete: string | null
          telefone_filtro: string | null
          antes_depois: string | null
          janeiro: string | null
          fevereiro: string | null
          marco: string | null
          abril: string | null
          maio: string | null
          junho: string | null
          julho: string | null
          agosto: string | null
          setembro: string | null
          outubro: string | null
          novembro: string | null
          dezembro: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          nome?: string | null
          apelido?: string | null
          cpf?: string | null
          email?: string | null
          telefone?: string | null
          genero?: string | null
          data_nascimento?: string | null
          inicio_acompanhamento?: string | null
          plano?: string | null
          tempo_acompanhamento?: number | null
          vencimento?: string | null
          dias_para_vencer?: number | null
          valor?: number | null
          ticket_medio?: number | null
          rescisao_30_percent?: number | null
          pagamento?: string | null
          observacao?: string | null
          indicacoes?: string | null
          lembrete?: string | null
          telefone_filtro?: string | null
          antes_depois?: string | null
          janeiro?: string | null
          fevereiro?: string | null
          marco?: string | null
          abril?: string | null
          maio?: string | null
          junho?: string | null
          julho?: string | null
          agosto?: string | null
          setembro?: string | null
          outubro?: string | null
          novembro?: string | null
          dezembro?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          nome?: string | null
          apelido?: string | null
          cpf?: string | null
          email?: string | null
          telefone?: string | null
          genero?: string | null
          data_nascimento?: string | null
          inicio_acompanhamento?: string | null
          plano?: string | null
          tempo_acompanhamento?: number | null
          vencimento?: string | null
          dias_para_vencer?: number | null
          valor?: number | null
          ticket_medio?: number | null
          rescisao_30_percent?: number | null
          pagamento?: string | null
          observacao?: string | null
          indicacoes?: string | null
          lembrete?: string | null
          telefone_filtro?: string | null
          antes_depois?: string | null
          janeiro?: string | null
          fevereiro?: string | null
          marco?: string | null
          abril?: string | null
          maio?: string | null
          junho?: string | null
          julho?: string | null
          agosto?: string | null
          setembro?: string | null
          outubro?: string | null
          novembro?: string | null
          dezembro?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      plans: {
        Row: {
          id: string
          name: string
          type: string
          period: string
          category: string | null
          description: string | null
          active: boolean | null
          created_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          name: string
          type: string
          period: string
          category?: string | null
          description?: string | null
          active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          type?: string
          period?: string
          category?: string | null
          description?: string | null
          active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          user_id: string | null
          full_name: string | null
          role: string | null
          department: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          full_name?: string | null
          role?: string | null
          department?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          full_name?: string | null
          role?: string | null
          department?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          filters: Json | null
          sorting: Json | null
          visible_columns: string[] | null
          page_size: number | null
          read_notifications: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          filters?: Json | null
          sorting?: Json | null
          visible_columns?: string[] | null
          page_size?: number | null
          read_notifications?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          filters?: Json | null
          sorting?: Json | null
          visible_columns?: string[] | null
          page_size?: number | null
          read_notifications?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
        }
        Insert: {
          id?: string
        }
        Update: {
          id?: string
        }
        Relationships: []
      }
      leads_que_entraram: {
        Row: {
          id: string
          DATA: string | null
          GOOGLE: number | null
          GOOGLE_FORMS: string | null
          INSTAGRAM: number | null
          FACEBOOK: number | null
          SELLER: string | null
          INDICACAO: string | null
          OUTROS: number | null
          TOTAL: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          DATA?: string | null
          GOOGLE?: number | null
          GOOGLE_FORMS?: string | null
          INSTAGRAM?: number | null
          FACEBOOK?: number | null
          SELLER?: string | null
          INDICACAO?: string | null
          OUTROS?: number | null
          TOTAL?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          DATA?: string | null
          GOOGLE?: number | null
          GOOGLE_FORMS?: string | null
          INSTAGRAM?: number | null
          FACEBOOK?: number | null
          SELLER?: string | null
          INDICACAO?: string | null
          OUTROS?: number | null
          TOTAL?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      "Total de Leads": {
        Row: {
          id: string
          LEADS: string | null
          LEAD_GOOGLE: number | null
          LEAD_GOOGLE_FORMS: number | null
          LEAD_INSTAGRAM: number | null
          LEAD_FACEBOOK: number | null
          LEAD_SELLER: number | null
          LEAD_INDICACAO: number | null
          LEAD_OUTROS: number | null
          TOTAL_DE_LEADS: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          LEADS?: string | null
          LEAD_GOOGLE?: number | null
          LEAD_GOOGLE_FORMS?: number | null
          LEAD_INSTAGRAM?: number | null
          LEAD_FACEBOOK?: number | null
          LEAD_SELLER?: number | null
          LEAD_INDICACAO?: number | null
          LEAD_OUTROS?: number | null
          TOTAL_DE_LEADS?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          LEADS?: string | null
          LEAD_GOOGLE?: number | null
          LEAD_GOOGLE_FORMS?: number | null
          LEAD_INSTAGRAM?: number | null
          LEAD_FACEBOOK?: number | null
          LEAD_SELLER?: number | null
          LEAD_INDICACAO?: number | null
          LEAD_OUTROS?: number | null
          TOTAL_DE_LEADS?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      "Total de Calls Agendadas": {
        Row: {
          id: string
          AGENDADAS: string | null
          AGENDADOS_GOOGLE: number | null
          AGENDADOS_GOOGLE_FORMS: number | null
          AGENDADOS_INSTAGRAM: number | null
          AGENDADOS_FACEBOOK: number | null
          AGENDADOS_SELLER: number | null
          AGENDADOS_INDICACAO: number | null
          AGENDADOS_OUTROS: number | null
          TOTAL_DE_CALLS_AGENDADAS: number | null
          PERCENT_QUE_VAI_PRA_CALL: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          AGENDADAS?: string | null
          AGENDADOS_GOOGLE?: number | null
          AGENDADOS_GOOGLE_FORMS?: number | null
          AGENDADOS_INSTAGRAM?: number | null
          AGENDADOS_FACEBOOK?: number | null
          AGENDADOS_SELLER?: number | null
          AGENDADOS_INDICACAO?: number | null
          AGENDADOS_OUTROS?: number | null
          TOTAL_DE_CALLS_AGENDADAS?: number | null
          PERCENT_QUE_VAI_PRA_CALL?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          AGENDADAS?: string | null
          AGENDADOS_GOOGLE?: number | null
          AGENDADOS_GOOGLE_FORMS?: number | null
          AGENDADOS_INSTAGRAM?: number | null
          AGENDADOS_FACEBOOK?: number | null
          AGENDADOS_SELLER?: number | null
          AGENDADOS_INDICACAO?: number | null
          AGENDADOS_OUTROS?: number | null
          TOTAL_DE_CALLS_AGENDADAS?: number | null
          PERCENT_QUE_VAI_PRA_CALL?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      "Total de Leads por Funil": {
        Row: {
          id: string
          TOTAL_DE_LEADS_DOS_FUNIS: string | null
          TOTAL_GERAL_LEADS: number | null
          PERCENT_TOTAL_LEADS: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          TOTAL_DE_LEADS_DOS_FUNIS?: string | null
          TOTAL_GERAL_LEADS?: number | null
          PERCENT_TOTAL_LEADS?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          TOTAL_DE_LEADS_DOS_FUNIS?: string | null
          TOTAL_GERAL_LEADS?: number | null
          PERCENT_TOTAL_LEADS?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      "Total de Agendamentos por Funil": {
        Row: {
          id: string
          TOTAL_AGEND_DOS_FUNIS: string | null
          TOTAL_GERAL_AGEND: number | null
          PERCENT_TOTAL_AGEND: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          TOTAL_AGEND_DOS_FUNIS?: string | null
          TOTAL_GERAL_AGEND?: number | null
          PERCENT_TOTAL_AGEND?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          TOTAL_AGEND_DOS_FUNIS?: string | null
          TOTAL_GERAL_AGEND?: number | null
          PERCENT_TOTAL_AGEND?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      "Total de Vendas": {
        Row: {
          id: string
          MES: string | null
          DATA: string | null
          FUNIL: string | null
          COMPROU: string | null
          "NÃO COMPROU": string | null
          "NO SHOW": string | null
          "QUEM FEZ A CALL": string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          MES?: string | null
          DATA?: string | null
          FUNIL?: string | null
          COMPROU?: string | null
          "NÃO COMPROU"?: string | null
          "NO SHOW"?: string | null
          "QUEM FEZ A CALL"?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          MES?: string | null
          DATA?: string | null
          FUNIL?: string | null
          COMPROU?: string | null
          "NÃO COMPROU"?: string | null
          "NO SHOW"?: string | null
          "QUEM FEZ A CALL"?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      page_passwords: {
        Row: {
          id: string
          page_name: string
          password_hash: string
          is_active: boolean
          description: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          page_name: string
          password_hash: string
          is_active?: boolean
          description?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          page_name?: string
          password_hash?: string
          is_active?: boolean
          description?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
      diet_plans: {
        Row: {
          id: string
          patient_id: string
          user_id: string | null
          name: string
          status: string
          start_date: string | null
          end_date: string | null
          total_calories: number | null
          total_protein: number | null
          total_carbs: number | null
          total_fats: number | null
          notes: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
          released_at: string | null
        }
        Insert: {
          id?: string
          patient_id: string
          user_id?: string | null
          name: string
          status?: string
          start_date?: string | null
          end_date?: string | null
          total_calories?: number | null
          total_protein?: number | null
          total_carbs?: number | null
          total_fats?: number | null
          notes?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          released_at?: string | null
        }
        Update: {
          id?: string
          patient_id?: string
          user_id?: string | null
          name?: string
          status?: string
          start_date?: string | null
          end_date?: string | null
          total_calories?: number | null
          total_protein?: number | null
          total_carbs?: number | null
          total_fats?: number | null
          notes?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          released_at?: string | null
        }
        Relationships: []
      }
      diet_meals: {
        Row: {
          id: string
          diet_plan_id: string
          meal_type: string
          meal_name: string
          meal_order: number
          day_of_week: number | null
          calories: number | null
          protein: number | null
          carbs: number | null
          fats: number | null
          instructions: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          diet_plan_id: string
          meal_type: string
          meal_name: string
          meal_order?: number
          day_of_week?: number | null
          calories?: number | null
          protein?: number | null
          carbs?: number | null
          fats?: number | null
          instructions?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          diet_plan_id?: string
          meal_type?: string
          meal_name?: string
          meal_order?: number
          day_of_week?: number | null
          calories?: number | null
          protein?: number | null
          carbs?: number | null
          fats?: number | null
          instructions?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      diet_foods: {
        Row: {
          id: string
          meal_id: string
          food_name: string
          quantity: number
          unit: string
          calories: number | null
          protein: number | null
          carbs: number | null
          fats: number | null
          notes: string | null
          food_order: number
          created_at: string | null
        }
        Insert: {
          id?: string
          meal_id: string
          food_name: string
          quantity: number
          unit?: string
          calories?: number | null
          protein?: number | null
          carbs?: number | null
          fats?: number | null
          notes?: string | null
          food_order?: number
          created_at?: string | null
        }
        Update: {
          id?: string
          meal_id?: string
          food_name?: string
          quantity?: number
          unit?: string
          calories?: number | null
          protein?: number | null
          carbs?: number | null
          fats?: number | null
          notes?: string | null
          food_order?: number
          created_at?: string | null
        }
        Relationships: []
      }
      diet_guidelines: {
        Row: {
          id: string
          diet_plan_id: string
          guideline_type: string
          title: string
          content: string
          priority: number
          created_at: string | null
        }
        Insert: {
          id?: string
          diet_plan_id: string
          guideline_type: string
          title: string
          content: string
          priority?: number
          created_at?: string | null
        }
        Update: {
          id?: string
          diet_plan_id?: string
          guideline_type?: string
          title?: string
          content?: string
          priority?: number
          created_at?: string | null
        }
        Relationships: []
      }
      diet_questions: {
        Row: {
          id: string
          diet_plan_id: string
          patient_id: string
          question: string
          answer: string | null
          answered_by: string | null
          answered_at: string | null
          status: string
          created_at: string | null
        }
        Insert: {
          id?: string
          diet_plan_id: string
          patient_id: string
          question: string
          answer?: string | null
          answered_by?: string | null
          answered_at?: string | null
          status?: string
          created_at?: string | null
        }
        Update: {
          id?: string
          diet_plan_id?: string
          patient_id?: string
          question?: string
          answer?: string | null
          answered_by?: string | null
          answered_at?: string | null
          status?: string
          created_at?: string | null
        }
        Relationships: []
      }
      food_database: {
        Row: {
          id: string
          name: string
          category: string
          calories_per_100g: number
          protein_per_100g: number
          carbs_per_100g: number
          fats_per_100g: number
          common_units: Json | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          category: string
          calories_per_100g: number
          protein_per_100g?: number
          carbs_per_100g?: number
          fats_per_100g?: number
          common_units?: Json | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          category?: string
          calories_per_100g?: number
          protein_per_100g?: number
          carbs_per_100g?: number
          fats_per_100g?: number
          common_units?: Json | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_food_database: {
        Row: {
          id: string
          user_id: string
          name: string
          category: string
          calories_per_100g: number
          protein_per_100g: number
          carbs_per_100g: number
          fats_per_100g: number
          common_units: Json | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          category: string
          calories_per_100g: number
          protein_per_100g?: number
          carbs_per_100g?: number
          fats_per_100g?: number
          common_units?: Json | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          category?: string
          calories_per_100g?: number
          protein_per_100g?: number
          carbs_per_100g?: number
          fats_per_100g?: number
          common_units?: Json | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      diet_templates: {
        Row: {
          id: string
          user_id: string | null
          name: string
          description: string | null
          total_calories: number | null
          total_protein: number | null
          total_carbs: number | null
          total_fats: number | null
          template_data: Json
          is_active: boolean | null
          is_public: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          description?: string | null
          total_calories?: number | null
          total_protein?: number | null
          total_carbs?: number | null
          total_fats?: number | null
          template_data: Json
          is_active?: boolean | null
          is_public?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          description?: string | null
          total_calories?: number | null
          total_protein?: number | null
          total_carbs?: number | null
          total_fats?: number | null
          template_data?: Json
          is_active?: boolean | null
          is_public?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      diet_ai_generations: {
        Row: {
          id: string
          patient_id: string
          user_id: string | null
          anamnesis_data: Json
          ai_response: Json
          diet_plan_id: string | null
          status: string
          created_at: string | null
        }
        Insert: {
          id?: string
          patient_id: string
          user_id?: string | null
          anamnesis_data: Json
          ai_response: Json
          diet_plan_id?: string | null
          status?: string
          created_at?: string | null
        }
        Update: {
          id?: string
          patient_id?: string
          user_id?: string | null
          anamnesis_data?: Json
          ai_response?: Json
          diet_plan_id?: string | null
          status?: string
          created_at?: string | null
        }
        Relationships: []
      }
      retention_exclusions: {
        Row: {
          id: string
          user_id: string
          patient_id: string
          excluded_at: string
          reason: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          patient_id: string
          excluded_at?: string
          reason?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          patient_id?: string
          excluded_at?: string
          reason?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "retention_exclusions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retention_exclusions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
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
