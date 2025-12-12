/**
 * Database Schema Diagnostic Tool
 * Checks if anime_id is properly configured as auto-incrementing
 * and verifies other Jikan integration requirements
 */

import { sql } from '@vercel/postgres';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function diagnoseSchema() {
  console.log('🔍 Starting Database Schema Diagnosis...\n');
  
  try {
    // Check anime table columns
    console.log('1️⃣ Checking anime table columns (anime_id, mal_id, last_jikan_sync, sync_status)...');
    const columns = await sql`
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
    
    console.log('   Columns found:');
    for (const col of columns.rows) {
      console.log(`   - ${col.column_name}: ${col.data_type}, default: ${col.column_default || 'NONE'}, nullable: ${col.is_nullable}`);
    }
    
    // Check for anime_id column specifically
    const animeIdCol = columns.rows.find(c => c.column_name === 'anime_id');
    if (!animeIdCol) {
      console.log('   ❌ anime_id column not found!');
    } else if (!animeIdCol.column_default || !animeIdCol.column_default.includes('nextval')) {
      console.log('   ⚠️  anime_id is NOT auto-incrementing! Current default:', animeIdCol.column_default || 'NONE');
      console.log('   ❌ THIS IS THE PROBLEM - anime_id needs DEFAULT nextval()');
    } else {
      console.log('   ✅ anime_id appears to be auto-incrementing');
    }
    
    // Check for mal_id column
    const malIdCol = columns.rows.find(c => c.column_name === 'mal_id');
    if (!malIdCol) {
      console.log('   ⚠️  mal_id column not found - needs to be added');
    } else {
      console.log('   ✅ mal_id column exists');
    }
    
    console.log('\n2️⃣ Checking for anime sequences...');
    const sequences = await sql`
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
    
    if (sequences.rows.length === 0) {
      console.log('   ⚠️  No sequences found for anime table');
    } else {
      console.log('   Sequences found:');
      for (const seq of sequences.rows) {
        console.log(`   - ${seq.sequence_name}: starts at ${seq.start_value}, increment ${seq.increment}`);
      }
    }
    
    console.log('\n3️⃣ Checking primary key and unique constraints...');
    const constraints = await sql`
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
    
    console.log('   Constraints found:');
    for (const constraint of constraints.rows) {
      console.log(`   - ${constraint.constraint_name} (${constraint.constraint_type}) on ${constraint.column_name}`);
    }
    
    console.log('\n4️⃣ Checking if jikan_sync_queue table exists...');
    const tableExists = await sql`
      SELECT 
        table_name,
        table_type
      FROM information_schema.tables
      WHERE table_name = 'jikan_sync_queue'
    `;
    
    if (tableExists.rows.length === 0) {
      console.log('   ❌ jikan_sync_queue table does NOT exist - needs to be created');
    } else {
      console.log('   ✅ jikan_sync_queue table exists');
      
      // Check its columns
      const queueColumns = await sql`
        SELECT 
          column_name, 
          data_type, 
          column_default, 
          is_nullable
        FROM information_schema.columns
        WHERE table_name = 'jikan_sync_queue'
        ORDER BY ordinal_position
      `;
      
      console.log('   Columns:');
      for (const col of queueColumns.rows) {
        console.log(`   - ${col.column_name}: ${col.data_type}, default: ${col.column_default || 'NONE'}, nullable: ${col.is_nullable}`);
      }
    }
    
    console.log('\n5️⃣ Checking current max anime_id...');
    const maxId = await sql`
      SELECT MAX(anime_id) as max_id, COUNT(*) as total_count
      FROM anime
    `;
    
    console.log(`   Current max anime_id: ${maxId.rows[0].max_id}, Total anime: ${maxId.rows[0].total_count}`);
    
    console.log('\n📊 DIAGNOSIS COMPLETE\n');
    console.log('════════════════════════════════════════════════════════════');
    console.log('SUMMARY:');
    console.log('════════════════════════════════════════════════════════════');
    
    // Provide actionable summary
    const issues = [];
    const fixes = [];
    
    if (!animeIdCol) {
      issues.push('❌ anime_id column is missing');
      fixes.push('Need to add anime_id column as SERIAL PRIMARY KEY');
    } else if (!animeIdCol.column_default || !animeIdCol.column_default.includes('nextval')) {
      issues.push('❌ anime_id is NOT auto-incrementing (missing DEFAULT nextval)');
      fixes.push('Need to add DEFAULT nextval() to anime_id column');
    }
    
    if (!malIdCol) {
      issues.push('⚠️  mal_id column is missing');
      fixes.push('Need to add mal_id INTEGER UNIQUE column');
    }
    
    if (tableExists.rows.length === 0) {
      issues.push('❌ jikan_sync_queue table does not exist');
      fixes.push('Need to create jikan_sync_queue table');
    }
    
    if (issues.length === 0) {
      console.log('✅ No critical issues found!');
      console.log('   The schema appears to be correctly configured.');
    } else {
      console.log('Issues found:');
      issues.forEach(issue => console.log(`   ${issue}`));
      console.log('\nRequired fixes:');
      fixes.forEach(fix => console.log(`   - ${fix}`));
    }
    
    console.log('════════════════════════════════════════════════════════════\n');
    
    process.exit(issues.length > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
    process.exit(1);
  }
}

diagnoseSchema();
