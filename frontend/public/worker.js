self.onmessage = function (e) {
  const { selectedEmbeddings, allEmbeddings, selectedTitles, selectedAnimeIds, weights } = e.data;

  const defaultWeights = {
    bert_description: 0.25,
    bert_genres: 0.25,
    bert_demographic: 0.15,
    bert_rating: 0.10,
    bert_themes: 0.25,
  };
  const finalWeights = { ...defaultWeights, ...weights };

  const defaultEmbedding = Array(768).fill(0);

  const weightedEmbedding = (embedding, weights) => {
    return [
      ...(embedding.bert_description || defaultEmbedding).map((value) => value * weights.bert_description),
      ...(embedding.bert_genres || defaultEmbedding).map((value) => value * weights.bert_genres),
      ...(embedding.bert_demographic || defaultEmbedding).map((value) => value * weights.bert_demographic),
      ...(embedding.bert_rating || defaultEmbedding).map((value) => value * weights.bert_rating),
      ...(embedding.bert_themes || defaultEmbedding).map((value) => value * weights.bert_themes),
    ];
  };

  const cosineSimilarity = (vecA, vecB) => {
    if (vecA.length !== vecB.length) {
      console.warn('Vector length mismatch detected. Skipping calculation.', {
        vecA,
        vecB,
      });
      return 0; // Return similarity as 0 for mismatched vectors
    }
    const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));

    if (magnitudeA === 0 || magnitudeB === 0) return 0;

    return dotProduct / (magnitudeA * magnitudeB);
  };

  const extractBaseTitle = (title) => {
    return title
      .toLowerCase()
      .replace(/(?:season|saison|part|:|-|\().*$/gi, '')
      .replace(/\s+\d+(st|nd|rd|th)?\s*season/gi, '')
      .replace(/\s+\d+$/, '')
      .replace(/\s+[ivxlcdm]+$/gi, '')
      .trim();
  };

  // Validate input - now expecting arrays
  if (!Array.isArray(selectedEmbeddings) || selectedEmbeddings.length === 0 ||
      !Array.isArray(allEmbeddings) || !Array.isArray(selectedTitles)) {
    console.error('Worker received invalid input data.', { selectedEmbeddings, allEmbeddings, selectedTitles });
    self.postMessage([]);
    return;
  }

  // Create weighted embeddings for ALL selected anime
  const selectedWeightedEmbeddings = selectedEmbeddings.map(embedding =>
    weightedEmbedding(embedding, finalWeights)
  );

  // Build base title set from all selected anime
  const baseTitleSet = new Set();
  selectedTitles.forEach(title => {
    const baseTitle = extractBaseTitle(title);
    baseTitleSet.add(baseTitle);
  });

  // Calculate multi-similarity with mean aggregation
  const similarities = allEmbeddings
    .map((embedding) => {
      const candidateEmbedding = weightedEmbedding(embedding, finalWeights);

      // Calculate similarity to EACH selected anime
      const similarityScores = selectedWeightedEmbeddings.map(selectedEmbedding => {
        if (selectedEmbedding.length !== candidateEmbedding.length) {
          console.warn('Vector length mismatch detected:', {
            animeId: embedding.anime_id,
            title: embedding.title,
          });
          return 0;
        }
        return cosineSimilarity(selectedEmbedding, candidateEmbedding);
      });

      // Aggregate using mean: sum of similarities / count
      const meanSimilarity = similarityScores.reduce((sum, score) => sum + score, 0) / similarityScores.length;

      return {
        anime_id: embedding.anime_id,
        title: embedding.title,
        similarity: meanSimilarity,
      };
    })
    .filter(result => result.similarity > 0);

  const filteredSimilarities = similarities.filter((sim) => {
    const baseTitle = extractBaseTitle(sim.title);
    if (baseTitleSet.has(baseTitle)) {
      return false;
    } else {
      baseTitleSet.add(baseTitle);
      return true;
    }
  });

  const topRecommendations = filteredSimilarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 30);

  self.postMessage(topRecommendations);
};
