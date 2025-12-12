import { NextResponse } from 'next/server';
import { getUpcomingAnime } from '../../../services/jikanService';
import { sql } from '@vercel/postgres';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * Test inserting actual Jikan data to find the issue
 */
export async function GET() {
  try {
    console.log('Fetching upcoming anime from Jikan...');
    const jikanResults = await getUpcomingAnime(3); // Just get 3 anime
    
    console.log(`Got ${jikanResults.length} anime from Jikan`);
    
    // Try to insert the first one
    const testAnime = jikanResults[0];
    console.log('Test anime data:', JSON.stringify(testAnime, null, 2));
    
    // Delete if already exists
    await sql`DELETE FROM anime WHERE mal_id = ${testAnime.mal_id}`;
    
    // Try the exact same INSERT as in animeCacheService.ts
    console.log('Attempting INSERT...');
    const result = await sql`
      INSERT INTO anime (
        mal_id, title, english_title, japanese_title, synonyms, 
        description, image_url, score, popularity, rank, rating, 
        status, premiered, demographic, producers, 
        last_jikan_sync, sync_status, created_at, updated_at
      )
      VALUES (
        ${testAnime.mal_id}, ${testAnime.title}, ${testAnime.english_title}, ${testAnime.japanese_title}, 
        ${testAnime.synonyms}, ${testAnime.description}, ${testAnime.image_url}, ${testAnime.score}, 
        ${testAnime.popularity}, ${testAnime.rank}, ${testAnime.rating}, ${testAnime.status}, 
        ${testAnime.premiered}, ${testAnime.demographic}, ${testAnime.producers}, 
        NOW(), 'pending_embeddings', NOW(), NOW()
      )
      RETURNING anime_id, mal_id, title
    `;
    
    // Clean up
    await sql`DELETE FROM anime WHERE mal_id = ${testAnime.mal_id}`;
    
    return NextResponse.json({
      success: true,
      message: 'Successfully inserted Jikan anime!',
      testData: testAnime,
      result: result.rows[0],
      note: 'If this works, the issue is elsewhere in the flow',
    });
    
  } catch (error) {
    console.error('Test Jikan INSERT error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : undefined,
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
