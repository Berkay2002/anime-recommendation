-- Diagnose anime table schema
-- Check column definitions for anime_id and mal_id
SELECT 
  column_name, 
  data_type, 
  column_default, 
  is_nullable,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'anime' 
  AND column_name IN ('anime_id', 'mal_id', 'last_jikan_sync', 'sync_status')
ORDER BY ordinal_position;

-- Check if sequence exists for anime_id
SELECT 
  sequence_name,
  data_type,
  start_value,
  minimum_value,
  maximum_value,
  increment
FROM information_schema.sequences
WHERE sequence_name LIKE '%anime%';

-- Check primary key constraint
SELECT 
  tc.constraint_name, 
  tc.table_name, 
  kcu.column_name, 
  tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'anime' 
  AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE');

-- Check if jikan_sync_queue table exists
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_name = 'jikan_sync_queue';

-- If jikan_sync_queue exists, check its columns
SELECT 
  column_name, 
  data_type, 
  column_default, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'jikan_sync_queue'
ORDER BY ordinal_position;
