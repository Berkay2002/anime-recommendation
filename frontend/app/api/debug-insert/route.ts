import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Debug the INSERT query structure
 */
export async function GET() {
  // Column list from animeCacheService.ts line 255-259
  const columns = [
    'mal_id',           // 1
    'title',            // 2
    'english_title',    // 3
    'japanese_title',   // 4
    'synonyms',         // 5
    'description',      // 6
    'image_url',        // 7
    'score',            // 8
    'popularity',       // 9
    'rank',             // 10
    'rating',           // 11
    'status',           // 12
    'premiered',        // 13
    'demographic',      // 14
    'producers',        // 15
    'last_jikan_sync',  // 16 - NOW()
    'sync_status',      // 17 - 'pending_embeddings'
    'created_at',       // 18 - NOW()
    'updated_at',       // 19 - NOW()
  ];

  // VALUES from error message:
  const errorValues = [
    'null',                                  // 1
    'Dandadan 3rd Season',                   // 2
    'Dan Da Dan Season 3',                   // 3
    'ダンダダン 第3期',                       // 4
    'null',                                  // 5
    'Third season of Dandadan.',             // 6
    'https://cdn.myanimelist.net/images...', // 7
    'null',                                  // 8
    '2654',                                  // 9
    'null',                                  // 10
    'R - 17+ (violence & profanity)',        // 11
    'Not yet aired',                         // 12
    '(empty string)',                        // 13
    'Shounen',                               // 14
    'null',                                  // 15
    '2025-12-12 02:38:56.749196',           // 16
    '2025-12-12 02:38:56.749196',           // 17
    'null',                                  // 18
    '62516',                                 // 19
    '2025-12-12 02:38:56.749196',           // 20
    'pending_embeddings',                    // 21
  ];

  const analysis = {
    columns_count: columns.length,
    error_values_count: errorValues.length,
    mismatch: errorValues.length !== columns.length,
    columns,
    errorValues,
    note: 'If mismatch is true, there is a column/value count mismatch causing the error',
  };

  if (analysis.mismatch) {
    analysis.problem = `There are ${columns.length} columns but ${errorValues.length} values in the error message`;
    
    // The error message shows ALL columns including anime_id
    // Let's see what the actual table columns are in order
    analysis.likely_issue = 'The error message includes anime_id (the first null) even though it is not in the INSERT column list. This suggests PostgreSQL is showing ALL table columns in the error, not just the ones being inserted.';
    
    // Map error values to likely columns (including anime_id)
    const actualTableColumns = [
      'anime_id (auto-generated - should be excluded)',
      ...columns,
    ];
    
    analysis.actual_column_mapping = errorValues.map((val, idx) => ({
      position: idx + 1,
      value: val,
      likely_column: actualTableColumns[idx] || 'UNKNOWN',
    }));
  }

  return NextResponse.json(analysis);
}
