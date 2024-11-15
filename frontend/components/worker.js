// frontend/components/worker.js

import cosineSimilarity from 'cosine-similarity';

self.onmessage = function (e) {
  const { selectedEmbedding, allEmbeddings, selectedTitle, selectedAnimeIds } = e.data;

  const weights = {
    bert_description: 0.25,
    bert_genres: 0.25,
    bert_demographic: 0.15,
    bert_rating: 0.10,
    bert_themes: 0.25,
  };

  const weightedEmbedding = (embedding, weights) => {
    return [
      ...(embedding.bert_description || []).map((value) => value * weights.bert_description),
      ...(embedding.bert_genres || []).map((value) => value * weights.bert_genres),
      ...(embedding.bert_demographic || []).map((value) => value * weights.bert_demographic),
      ...(embedding.bert_rating || []).map((value) => value * weights.bert_rating),
      ...(embedding.bert_themes || []).map((value) => value * weights.bert_themes),
    ];
  };

  const extractBaseTitle = (title) => {
    return title
      .replace(/(?:Season|Saison|Part|:|-|\().*$/, '') // Remove common separators and keywords
      .replace(/\s+\d+(st|nd|rd|th)?\s*season/i, '')   // Remove season numbers
      .replace(/\s+\d+$/, '')                          // Remove trailing numbers
      .replace(/\s+[IVXLCDM]+$/, '')                   // Remove trailing Roman numerals
      .trim()
      .toLowerCase();                                  // Convert to lowercase for consistent comparison
  };

  const selectedBaseTitle = extractBaseTitle(selectedTitle);
  const selectedWeightedEmbedding = weightedEmbedding(selectedEmbedding, weights);

  // Initialize a set to track base titles and avoid duplicates
  const baseTitleSet = new Set();
  baseTitleSet.add(selectedBaseTitle);

  // Include base titles of selected anime to exclude them from recommendations
  selectedAnimeIds.forEach((id) => {
    const anime = allEmbeddings.find((anime) => anime.anime_id === id);
    if (anime) {
      const baseTitle = extractBaseTitle(anime.title);
      baseTitleSet.add(baseTitle);
    }
  });

  const similarities = allEmbeddings.map((embedding) => {
    const combinedEmbedding = weightedEmbedding(embedding, weights);
    return {
      anime_id: embedding.anime_id,
      title: embedding.title,
      similarity: cosineSimilarity(selectedWeightedEmbedding, combinedEmbedding),
    };
  });

  // Filter out anime with duplicate base titles or already selected anime
  const filteredSimilarities = similarities.filter((sim) => {
    const baseTitle = extractBaseTitle(sim.title);
    if (baseTitleSet.has(baseTitle)) {
      return false;
    } else {
      baseTitleSet.add(baseTitle);
      return true;
    }
  });

  // Sort by similarity score in descending order
  filteredSimilarities.sort((a, b) => b.similarity - a.similarity);

  // Return top 30 recommendations
  self.postMessage(filteredSimilarities.slice(0, 30)); // Increase to 30 recommendations
};