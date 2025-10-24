// Script to create MongoDB indexes for better sort performance
// Run with: node scripts/create-indexes.js
// Make sure to set MONGODB_URI environment variable before running

import { MongoClient } from "mongodb"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

async function createIndexes() {
  // Try to read from .env.local file
  let uri = process.env.MONGODB_URI;

  if (!uri) {
    // Try .env.local next
    try {
      const __filename = fileURLToPath(import.meta.url)
      const __dirname = path.dirname(__filename)
      const envPath = path.join(__dirname, "..", ".env.local")
      const envContent = fs.readFileSync(envPath, "utf8")
      const match = envContent.match(/MONGODB_URI=(.+)/)
      if (match) {
        uri = match[1].trim()
      }
    } catch {
      // Ignore and fall through to failure message
    }
  }

  if (!uri) {
    console.error('MONGODB_URI environment variable is not set');
    console.error('Please set it in .env.local or as an environment variable');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('animeDB');
    const collection = db.collection('anime_general');

    console.log('\nCreating indexes...');

    // Create index on Popularity field (ascending for best trending)
    const popularityIndex = await collection.createIndex(
      { Popularity: 1 },
      { name: 'idx_popularity', background: true }
    );
    console.log('Created index:', popularityIndex);

    // Create index on Rank field (ascending for best ranked)
    const rankIndex = await collection.createIndex(
      { Rank: 1 },
      { name: 'idx_rank', background: true }
    );
    console.log('Created index:', rankIndex);

    // Create index on Score field (descending for highest scores)
    const scoreIndex = await collection.createIndex(
      { Score: -1 },
      { name: 'idx_score', background: true }
    );
    console.log('Created index:', scoreIndex);

    // Create compound index for common queries
    const compoundIndex = await collection.createIndex(
      {
        Popularity: 1,
        Rank: 1,
        Score: -1,
        anime_id: 1
      },
      { name: 'idx_sorting_fields', background: true }
    );
    console.log('Created compound index:', compoundIndex);

    // List all indexes to verify
    console.log('\nAll indexes on anime_general collection:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log(`- ${index.name}:`, Object.keys(index.key).join(', '));
    });

    console.log('\nIndexes created successfully!');
    console.log('This should resolve the MongoDB sort memory limit errors.');

  } catch (error) {
    console.error('Error creating indexes:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

createIndexes();
