import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import logger from '@/lib/logger';
import type {
  ColumnInfo,
  SequenceInfo,
  ConstraintInfo,
  TableExistsInfo,
  MaxIdInfo,
  SchemaDiagnosis,
} from '@/types/schema-diagnosis';

export const runtime = 'nodejs';

/**
 * Diagnose database schema to identify anime_id auto-increment issues
 */
export async function GET() {
  const log = logger.child({ route: '/api/diagnose-schema', method: 'GET' })

  const diagnosis: SchemaDiagnosis = {
    timestamp: new Date().toISOString(),
    issues: [],
    fixes: [],
    details: {},
  };

  try {
    // 1. Check anime table columns
    log.debug('Checking anime table columns');
    const columns = await sql<ColumnInfo>`
      SELECT 
        column_name, 
        data_type, 
        column_default, 
        is_nullable,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'anime' 
        AND column_name IN ('anime_id', 'mal_id', 'last_jikan_sync', 'sync_status')
      ORDER BY ordinal_position
    `;
    
    diagnosis.details.columns = columns.rows;
    
    // Check anime_id specifically
    const animeIdCol = columns.rows.find(c => c.column_name === 'anime_id');
    if (!animeIdCol) {
      diagnosis.issues.push('anime_id column not found');
      diagnosis.fixes.push('Need to add anime_id column as SERIAL PRIMARY KEY');
    } else if (!animeIdCol.column_default || !animeIdCol.column_default.includes('nextval')) {
      diagnosis.issues.push('anime_id is NOT auto-incrementing (missing DEFAULT nextval)');
      diagnosis.fixes.push('Need to add DEFAULT nextval() to anime_id column');
      diagnosis.details.anime_id_problem = {
        current_default: animeIdCol.column_default,
        expected: 'nextval(\'anime_anime_id_seq\'::regclass)',
      };
    }
    
    // Check mal_id
    const malIdCol = columns.rows.find(c => c.column_name === 'mal_id');
    if (!malIdCol) {
      diagnosis.issues.push('mal_id column not found');
      diagnosis.fixes.push('Need to add mal_id INTEGER UNIQUE column');
    }
    
    // 2. Check sequences
    log.debug('Checking sequences');
    const sequences = await sql<SequenceInfo>`
      SELECT 
        sequence_name,
        data_type,
        start_value,
        minimum_value,
        maximum_value,
        increment
      FROM information_schema.sequences
      WHERE sequence_name LIKE '%anime%'
    `;
    
    diagnosis.details.sequences = sequences.rows;

    // 3. Check constraints
    log.debug('Checking constraints');
    const constraints = await sql<ConstraintInfo>`
      SELECT 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        tc.constraint_type
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'anime' 
        AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE')
    `;
    
    diagnosis.details.constraints = constraints.rows;

    // 4. Check jikan_sync_queue table
    log.debug('Checking jikan_sync_queue table');
    const tableExists = await sql<TableExistsInfo>`
      SELECT 
        table_name,
        table_type
      FROM information_schema.tables
      WHERE table_name = 'jikan_sync_queue'
    `;
    
    diagnosis.details.jikan_sync_queue_exists = tableExists.rows.length > 0;
    
    if (tableExists.rows.length === 0) {
      diagnosis.issues.push('jikan_sync_queue table does not exist');
      diagnosis.fixes.push('Need to create jikan_sync_queue table');
    } else {
      const queueColumns = await sql<ColumnInfo>`
        SELECT 
          column_name, 
          data_type, 
          column_default, 
          is_nullable
        FROM information_schema.columns
        WHERE table_name = 'jikan_sync_queue'
        ORDER BY ordinal_position
      `;
      diagnosis.details.jikan_sync_queue_columns = queueColumns.rows;
    }

    // 5. Check current max anime_id
    log.debug('Checking current max anime_id');
    try {
      const maxId = await sql<MaxIdInfo>`
        SELECT MAX(anime_id) as max_id, COUNT(*) as total_count
        FROM anime
      `;
      diagnosis.details.current_max_anime_id = maxId.rows[0]?.max_id;
      diagnosis.details.total_anime_count = maxId.rows[0]?.total_count;
    } catch (error) {
      diagnosis.details.max_id_error = error instanceof Error ? error.message : 'Unknown error';
    }
    
    // Summary
    diagnosis.status = diagnosis.issues.length === 0 ? 'OK' : 'ISSUES_FOUND';
    diagnosis.critical = diagnosis.issues.some(i => i.includes('anime_id'));

    log.info({ status: diagnosis.status, issuesCount: diagnosis.issues.length }, 'Schema diagnosis completed');

    return NextResponse.json(diagnosis, {
      status: diagnosis.issues.length > 0 ? 500 : 200,
    });

  } catch (error) {
    log.error({ error }, 'Error during schema diagnosis');
    return NextResponse.json({
      error: 'Failed to diagnose schema',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
