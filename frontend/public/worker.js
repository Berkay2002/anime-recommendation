// Web Worker for computing anime recommendations using cosine similarity

/**
 * Compute cosine similarity between two vectors
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  
  if (denominator === 0) {
    return 0;
  }

  return dotProduct / denominator;
}

/**
 * Combine multiple embeddings with weights
 */
function combineEmbeddings(embeddings, weights) {
  const result = [];
  const embeddingKeys = Object.keys(weights);
  
  // Get the length of the first valid embedding
  let embeddingLength = 0;
  for (const key of embeddingKeys) {
    if (embeddings[key] && Array.isArray(embeddings[key]) && embeddings[key].length > 0) {
      embeddingLength = embeddings[key].length;
      break;
    }
  }
  
  if (embeddingLength === 0) {
    return [];
  }
  
  // Initialize result array
  for (let i = 0; i < embeddingLength; i++) {
    result[i] = 0;
  }
  
  // Combine weighted embeddings
  for (const [key, weight] of Object.entries(weights)) {
    const embedding = embeddings[key];
    if (embedding && Array.isArray(embedding) && embedding.length === embeddingLength) {
      for (let i = 0; i < embeddingLength; i++) {
        result[i] += embedding[i] * weight;
      }
    }
  }
  
  return result;
}

/**
 * Main worker message handler
 */
self.onmessage = function(event) {
  try {
    const { selectedEmbeddings, allEmbeddings, selectedAnimeIds } = event.data;

    console.log('[Worker] Received data:', {
      selectedEmbeddingsCount: selectedEmbeddings?.length,
      allEmbeddingsCount: allEmbeddings?.length,
      selectedAnimeIds,
      firstSelectedEmbedding: selectedEmbeddings?.[0]
    });

    if (!selectedEmbeddings || !allEmbeddings || !Array.isArray(selectedEmbeddings) || !Array.isArray(allEmbeddings)) {
      throw new Error('Invalid input data');
    }

    // Weights for different embedding types
    const weights = {
      bert_description: 0.35,
      bert_genres: 0.25,
      bert_themes: 0.20,
      bert_demographic: 0.10,
      bert_rating: 0.10,
    };

    // Combine embeddings for selected anime
    const selectedCombinedEmbeddings = selectedEmbeddings.map(embeddings => 
      combineEmbeddings(embeddings, weights)
    ).filter(emb => emb.length > 0);

    if (selectedCombinedEmbeddings.length === 0) {
      self.postMessage([]);
      return;
    }

    // Calculate average combined embedding from selected anime
    const avgSelectedEmbedding = selectedCombinedEmbeddings[0].map((_, i) => {
      const sum = selectedCombinedEmbeddings.reduce((acc, emb) => acc + emb[i], 0);
      return sum / selectedCombinedEmbeddings.length;
    });

    // Compute similarities for all anime
    const similarities = allEmbeddings
      .map((anime) => {
        // Skip selected anime
        if (selectedAnimeIds && selectedAnimeIds.includes(anime.anime_id)) {
          return null;
        }

        const candidateEmbedding = combineEmbeddings({
          bert_description: anime.bert_description,
          bert_genres: anime.bert_genres,
          bert_themes: anime.bert_themes,
          bert_demographic: anime.bert_demographic,
          bert_rating: anime.bert_rating,
        }, weights);

        if (candidateEmbedding.length === 0) {
          return null;
        }

        const similarity = cosineSimilarity(avgSelectedEmbedding, candidateEmbedding);

        return {
          anime_id: anime.anime_id,
          similarity: similarity,
        };
      })
      .filter((item) => item !== null && item.similarity > 0);

    // Sort by similarity descending
    similarities.sort((a, b) => b.similarity - a.similarity);

    self.postMessage(similarities);
  } catch (error) {
    console.error('Worker error:', error);
    self.postMessage([]);
  }
};
