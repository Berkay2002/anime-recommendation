self.onmessage = function (e) {
  const { selectedEmbedding, allEmbeddings, selectedTitle, selectedAnimeIds, weights } = e.data;

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

  if (!selectedEmbedding || !Array.isArray(allEmbeddings) || !selectedTitle) {
    console.error('Worker received invalid input data.', { selectedEmbedding, allEmbeddings, selectedTitle });
    self.postMessage([]);
    return;
  }

  const selectedBaseTitle = extractBaseTitle(selectedTitle);
  const selectedWeightedEmbedding = weightedEmbedding(selectedEmbedding, finalWeights);

  const baseTitleSet = new Set();
  baseTitleSet.add(selectedBaseTitle);

  selectedAnimeIds.forEach((id) => {
    const anime = allEmbeddings.find((anime) => anime.anime_id === id);
    if (anime) {
      const baseTitle = extractBaseTitle(anime.title);
      baseTitleSet.add(baseTitle);
    }
  });

  const similarities = allEmbeddings
    .map((embedding) => {
      const combinedEmbedding = weightedEmbedding(embedding, finalWeights);

      if (selectedWeightedEmbedding.length !== combinedEmbedding.length) {
        console.warn('Skipping anime due to vector mismatch:', {
          animeId: embedding.anime_id,
          title: embedding.title,
        });
        return null;
      }

      return {
        anime_id: embedding.anime_id,
        title: embedding.title,
        similarity: cosineSimilarity(selectedWeightedEmbedding, combinedEmbedding),
      };
    })
    .filter(Boolean);

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
