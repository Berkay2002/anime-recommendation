export interface ColumnInfo {
  column_name: string
  data_type: string
  column_default: string | null
  is_nullable: string
  character_maximum_length: number | null
}

export interface SequenceInfo {
  sequence_name: string
  data_type: string
  start_value: number | string
  minimum_value: number | string
  maximum_value: number | string
  increment: number | string
}

export interface ConstraintInfo {
  constraint_name: string
  table_name: string
  column_name: string
  constraint_type: string
}

export interface TableExistsInfo {
  table_name: string
  table_type: string
}

export interface MaxIdInfo {
  max_id: number | null
  total_count: number | null
}

export interface SchemaDiagnosisDetails {
  columns?: ColumnInfo[]
  sequences?: SequenceInfo[]
  constraints?: ConstraintInfo[]
  jikan_sync_queue_exists?: boolean
  jikan_sync_queue_columns?: ColumnInfo[]
  current_max_anime_id?: number | null
  total_anime_count?: number | null
  anime_id_problem?: {
    current_default: string | null
    expected: string
  }
  max_id_error?: string
}

export interface SchemaDiagnosis {
  timestamp: string
  issues: string[]
  fixes: string[]
  details: SchemaDiagnosisDetails
  status?: 'OK' | 'ISSUES_FOUND'
  critical?: boolean
}
