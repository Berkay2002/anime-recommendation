import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

/**
 * Vercel Cron Job: Process Embeddings Queue
 * Runs daily at 2 AM UTC (configured in vercel.json)
 * 
 * This endpoint is called by Vercel's cron scheduler to automatically
 * process pending anime embeddings from the queue.
 */
export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
  
  if (authHeader !== expectedAuth) {
    console.error('Unauthorized cron attempt');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    console.log('🚀 Starting scheduled embeddings processing...');

    // Check queue status first
    const queueStatus = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE processed_at IS NULL AND priority = 'high') as high_priority_count,
        COUNT(*) FILTER (WHERE processed_at IS NULL AND priority = 'low') as low_priority_count
      FROM jikan_sync_queue
    `;

    const { high_priority_count, low_priority_count } = queueStatus.rows[0];
    console.log(`Queue status: ${high_priority_count} high priority, ${low_priority_count} low priority`);

    // Get pending high-priority items from queue
    const pendingItems = await sql`
      SELECT anime_id, mal_id, priority
      FROM jikan_sync_queue
      WHERE processed_at IS NULL
      ORDER BY 
        CASE priority 
          WHEN 'high' THEN 1
          WHEN 'low' THEN 2
          ELSE 3
        END,
        created_at ASC
      LIMIT 10
    `;

    if (pendingItems.rows.length === 0) {
      console.log('✅ No items in queue to process');
      return NextResponse.json({
        success: true,
        processed: 0,
        message: 'Queue is empty',
        queueStatus: {
          highPriority: high_priority_count,
          lowPriority: low_priority_count,
        },
      });
    }

    console.log(`Processing ${pendingItems.rows.length} items from queue...`);

    // Process items in smaller batches to avoid timeout
    const batchSize = 2; // Process 2 at a time
    let totalProcessed = 0;
    const errors: Array<{ anime_id: number; error: string }> = [];

    for (let i = 0; i < pendingItems.rows.length; i += batchSize) {
      const batch = pendingItems.rows.slice(i, i + batchSize);
      const animeIds = batch.map((item) => item.anime_id);

      try {
        // Call the embeddings processing endpoint
        const baseUrl = process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL}`
          : 'http://localhost:3000';

        const response = await fetch(`${baseUrl}/api/embeddings/process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ animeIds }),
        });

        if (!response.ok) {
          throw new Error(`Batch processing failed: ${response.statusText}`);
        }

        const result = await response.json();
        totalProcessed += result.processed || 0;

        if (result.errors && result.errors.length > 0) {
          errors.push(...result.errors);
        }

        console.log(`Batch ${i / batchSize + 1} completed: ${result.processed} processed`);
      } catch (error) {
        console.error(`Error processing batch starting at index ${i}:`, error);
        batch.forEach((item) => {
          errors.push({
            anime_id: item.anime_id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        });
      }
    }

    console.log(`✅ Cron job completed: ${totalProcessed} items processed`);

    return NextResponse.json({
      success: true,
      processed: totalProcessed,
      attempted: pendingItems.rows.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Processed ${totalProcessed} anime embeddings`,
      queueStatus: {
        highPriority: high_priority_count,
        lowPriority: low_priority_count,
      },
    });
  } catch (error) {
    console.error('❌ Cron job error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process embeddings queue',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
